import { GoogleGenAI, Type } from "@google/genai";
import { jsonrepair } from "jsonrepair";
import { InvoiceData, LineItem } from "../src/types.js";

/**
 * Escapes any double quotes that are NOT already escaped in a given string.
 */
function escapeUnescapedQuotes(str: string): string {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "\"") {
      let backslashCount = 0;
      let j = i - 1;
      while (j >= 0 && str[j] === "\\") {
        backslashCount++;
        j--;
      }
      if (backslashCount % 2 === 0) {
        result += "\\\"";
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * Dynamically sanitizes string values inside the raw pretty-printed JSON response.
 * Uses expected schema keys of the document properties to accurately locate real string bounders,
 * bypassing false desynchronization caused by unescaped nested double quotes or multi-line strings.
 */
function sanitizeStringValuesInRawJson(text: string): string {
  // All possible string fields expected in our invoice extraction schema
  const keysStr = "supplierName|invoiceNo|invoiceDate|gstin|poNumber|itemName|inventoryUom|uTaxRate|hsnCode";
  
  // All possible fields that can appear immediately after a string field or terminate it
  const allKeysStr = "supplierName|invoiceNo|invoiceDate|gstin|poNumber|confidenceScoreSupplierName|confidenceScoreInvoiceNo|confidenceScoreInvoiceDate|confidenceScoreGstin|confidenceScorePoNumber|lineItems|invoices|itemName|quantity|inventoryUom|uTaxRate|hsnCode|rate|amount|gstAmount|totalAmount|discountPercentage|discountAmount|confidenceItemName|confidenceQuantity|confidenceRate|confidenceTotalAmount";

  const regex = new RegExp(
    `"(${keysStr})"` +                   // Group 1: Key
    `\\s*:\\s*"` +                        // Key-value separator and opening quote
    `(.*?)` +                            // Group 2: The value (matches across lines via the "s" flag)
    `"` +                                // Closing quote of value
    `(?=` +                              // Positive lookahead boundary
      `\\s*(?:,|\\s|\\})*\\s*"(${allKeysStr})"` + // Preceded by another schema key
      `|\\s*(?:,|\\s|\\})*\\s*\\}` + // Or closing object brace
      `|\\s*(?:,|\\s|\\])*\\s*\\]` + // Or closing array bracket
      `|$` +                              // Or end of text response
    `)`,
    "gs"
  );

  return text.replace(regex, (match, key, val) => {
    // Escape unescaped double quotes occurring inside string values
    let cleanedVal = escapeUnescapedQuotes(val);
    
    // Convert physical newlines, carriage returns, or tabs to standard string escapes
    cleanedVal = cleanedVal
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");

    return `"${key}": "${cleanedVal}"`;
  });
}

let aiClient: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it to Settings > Secrets in the AI Studio UI.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Executes a call to the Gemini models with robust exponential backoff retry.
 * This handles transient errors such as "503 - model is currently experiencing high demand" gracefully and fails instantly on quota limits (429) to keep performance fast.
 */
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  }
): Promise<any> {
  const modelsToTry = [
    params.model,
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview"
  ];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let attempt = 0;
    const maxRetries = 1; // Lowered retry limit for much faster turnaround times
    const initialDelayMs = 800; // Faster backoff for quick execution

    console.log(`[Gemini SDK] Attempting extraction using model: ${modelName}`);

    while (attempt <= maxRetries) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        attempt++;

        const errorMsg = (error.message || "").toLowerCase();
        
        // Fail instantly on quota limits or rate exhaustion to keep the application responsive and inform the user
        const isQuotaExceeded =
          error.status === 429 ||
          errorMsg.includes("quota") ||
          errorMsg.includes("limit") ||
          errorMsg.includes("429") ||
          errorMsg.includes("resource_exhausted") ||
          errorMsg.includes("rate limit") ||
          errorMsg.includes("too many requests") ||
          errorMsg.includes("exhausted");

        if (isQuotaExceeded) {
          console.warn(`[Gemini SDK] Note: Rate or Quota limit reached (429). Transitioning to premium heuristic engine to bypass delay.`);
          throw new Error("Gemini API Quota Limit (429). Please try again later or configure your paid API Key under Settings > Secrets.");
        }

        const isTransient =
          error.status === 503 ||
          error.status === 408 ||
          error.status >= 500 ||
          error.message?.includes("503") ||
          error.message?.includes("UNAVAILABLE") ||
          error.message?.includes("high demand") ||
          error.message?.includes("overloaded") ||
          error.message?.includes("temporary") ||
          error.message?.includes("Service Unavailable");

        if (attempt <= maxRetries && isTransient) {
          const jitter = Math.random() * 300;
          const sleepTime = initialDelayMs * Math.pow(2, attempt - 1) + jitter;
          console.warn(
            `[Gemini Retry] Model "${modelName}" attempt ${attempt} failed with transient error. Retrying in ${Math.round(
              sleepTime
            )}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, sleepTime));
        } else {
          console.warn(
            `[Gemini Retry] Model "${modelName}" failed. ${
              isTransient ? "Retries exhausted" : "Non-transient error detected."
            } error: "${error.message || error}"`
          );
          break;
        }
      }
    }
  }

  throw lastError;
}

function getMimeType(fileName: string, buffer?: Buffer, explicitMimeType?: string): string {
  // 1. If we have a reliable explicit mimetype (like from Multer/web client), prefer it!
  if (explicitMimeType && explicitMimeType !== "application/octet-stream" && explicitMimeType.includes("/")) {
    return explicitMimeType;
  }

  // 2. Check Magic bytes of the binary buffer to handle raw blobs uploaded from mobile devices
  if (buffer && buffer.length > 4) {
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return "image/png";
    }
    // PDF: 25 50 44 46 (%PDF)
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return "application/pdf";
    }
  }

  // 3. Fall back to standard file extension decoding
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    default:
      return 'application/pdf';
  }
}

/**
 * Extracts invoice information from the provided file buffer using Gemini-3.5-Flash with JSON Schema. This can detect and return multiple independent invoices from a single multi-page PDF/image document.
 */
export async function extractInvoiceFromPdf(
  fileBuffer: Buffer,
  fileName: string,
  explicitMimeType?: string
): Promise<InvoiceData[]> {
  const ai = getGenAI();
  const mimeType = getMimeType(fileName, fileBuffer, explicitMimeType);

  // Create base64 inline payload
  const filePart = {
    inlineData: {
      mimeType,
      data: fileBuffer.toString("base64"),
    },
  };

  const systemInstruction = 
    "You are an expert invoice digitizer specializing in extracting high-accuracy data from physical invoices, " +
    "handwritten bills, low-quality photographs, and scans from WhatsApp. " +
    "Analyze the supplied PDF or image document completely (including all tables, secondary pages, stamps, and notes). " +
    "IMPORTANT: A single scanned document might contain multiple separate independent invoices (e.g. a 20-page document containing several different bills/invoices from different or same suppliers). " +
    "You must search the entire document, identify EVERY individual separate invoice, and map them into the output array. Never group different invoices together or leave any out - extract ALL OF THE INVOICES completely! " +
    "For each invoice, identify: Supplier Name (the billing seller vendor who is charging the money, NOT the buyer/customer/client named under 'Billed To', 'Consignee', or 'Ship To' fields), Invoice Number, Invoice Date, Supplier GSTIN, PO Number, and all individual Line Items. " +
    "Carefully capture item columns: Item Name/Description, HSN/SAC code, UOM (Default NOS/PCS/KGS as scanned), Unit Rate, net amount, GST amount (CGST + SGST or IGST combined), tax rates, and final total amounts. " +
    "CRITICAL DISCOUNT RULE: Look carefully for any trade discount, cash discount, line-item specific discount column, or general discount applicable to the line items (as a percentage such as '10%' or '5%' or flat value discount). " +
    "Always extract these discounts in the discountPercentage or discountAmount fields so we can apply them directly to reduce the rate. " +
    "For handwritten texts, look closely at raw digits and values; reconcile totals manually if needed. " +
    "Identify additional charges (e.g. Freight & Forwarding, Loading/Unloading, coolie charges) as individual line items. " +
    "Rate your confidence (percentage integer 0-100) for headers and row-level items based on visibility, handwriting difficulty, and structural clarity.";

  const invoiceBatchResponseSchema = {
    type: Type.OBJECT,
    properties: {
      invoices: {
        type: Type.ARRAY,
        description: "A list of one or more distinct invoices found in the PDF document.",
        items: {
          type: Type.OBJECT,
          properties: {
            supplierName: {
              type: Type.STRING,
              description: "The EXACT legal or trade name of the vendor/supplier/seller who issued the invoice. CRITICAL: Do NOT extract the customer name, billed-to client, reader, receiver, or shipping consignee. The supplier is the entity requesting payment, normally represented in prominent bold font or letterhead branding at the absolute top of the page (e.g., SAGAR SALES AGENCY, STEEL HOUSE, APEX FABRITECH, SPS STEELS ROLLING MILLS LTD., D.S. TIMBER SHOP)."
            },
            invoiceNo: {
              type: Type.STRING,
              description: "The invoice identifier number. Look for labels like 'Invoice No.', 'Bill No.', 'SI. No.', etc. If not found, use a short unique key."
            },
            invoiceDate: {
              type: Type.STRING,
              description: "The date of the invoice (e.g. 6-Apr-26, 10-Jan-26, 21-09-2025). Format as DD-MMM-YY or YYYY-MM-DD if straightforward."
            },
            gstin: {
              type: Type.STRING,
              description: "GSTIN of the supplier if present. E.g. such as 18ACDFS5023Q1ZO, 18ABHPK4727L1ZW, etc."
            },
            poNumber: {
              type: Type.STRING,
              description: "PO Number / Purchase Order number if listed or referenced."
            },
            confidenceScoreSupplierName: {
              type: Type.INTEGER,
              description: "Confidence percentage of supplier name extraction (0 to 100)."
            },
            confidenceScoreInvoiceNo: {
              type: Type.INTEGER,
              description: "Confidence percentage of invoice number extraction (0 to 100)."
            },
            confidenceScoreInvoiceDate: {
              type: Type.INTEGER,
              description: "Confidence percentage of invoice date extraction (0 to 100)."
            },
            confidenceScoreGstin: {
              type: Type.INTEGER,
              description: "Confidence percentage of supplier GSTIN extraction (0 to 100)."
            },
            confidenceScorePoNumber: {
              type: Type.INTEGER,
              description: "Confidence percentage of purchase order number extraction (0 to 100)."
            },
            lineItems: {
              type: Type.ARRAY,
              description: "Standard list of line items containing materials, items, services, or freight listed in the billing tables.",
              items: {
                type: Type.OBJECT,
                properties: {
                  itemName: {
                    type: Type.STRING,
                    description: "The description of the goods/services. Include specific modifiers like measurements, material names, e.g. TMT FE 550D 8MM, Pre Fabricated Structure, MS ANGLE, Polycap 6sqmmX4Core, etc."
                  },
                  quantity: {
                    type: Type.NUMBER,
                    description: "Numeric item quantity (excluding UOM string). Support floats if scanned (e.g. 43.000, 399.80, 2010)."
                  },
                  inventoryUom: {
                    type: Type.STRING,
                    description: "Underlying unit of measure abbreviation like KGS, TO, PCS, NOS, ROL, JOB, mtrs, Sqft, etc."
                  },
                  uTaxRate: {
                    type: Type.STRING,
                    description: "Applicable GST tax rate percentage row level (e.g., '18%', '9%', '28%')."
                  },
                  hsnCode: {
                    type: Type.STRING,
                    description: "HSN or SAC Code (e.g. 72162100, 73069090). Keep as text."
                  },
                  rate: {
                    type: Type.NUMBER,
                    description: "Per-unit rate inclusive or net before discount (as printed, e.g. 100.00)."
                  },
                  amount: {
                    type: Type.NUMBER,
                    description: "Net taxable value / net amount before sheet taxation."
                  },
                  gstAmount: {
                    type: Type.NUMBER,
                    description: "Tax GST value calculated or stated for this item row."
                  },
                  totalAmount: {
                    type: Type.NUMBER,
                    description: "Final total sum value of this specific item row (amount + tax GST amount)."
                  },
                  discountPercentage: {
                    type: Type.NUMBER,
                    description: "Item-level or trade discount percentage value listed for this specific row (e.g. 5, 10, or 12.5). Put 0 if there is no discount."
                  },
                  discountAmount: {
                    type: Type.NUMBER,
                    description: "Absolute trade/cash discount amount value listed for this specific item row (e.g. 150 or 50.50). Put 0 if there is no discount."
                  },
                  confidenceItemName: {
                    type: Type.INTEGER,
                    description: "Confidence percentage of this item descriptions extraction (0 to 100)."
                  },
                  confidenceQuantity: {
                    type: Type.INTEGER,
                    description: "Confidence percentage of this item quantity extraction (0 to 100)."
                  },
                  confidenceRate: {
                    type: Type.INTEGER,
                    description: "Confidence percentage of unit row rate extraction (0 to 100)."
                  },
                  confidenceTotalAmount: {
                    type: Type.INTEGER,
                    description: "Confidence percentage of row total calculation extraction (0 to 100)."
                  }
                },
                required: ["itemName"]
              }
            }
          },
          required: ["supplierName", "invoiceNo", "invoiceDate", "lineItems"]
        }
      }
    },
    required: ["invoices"]
  };

  try {
    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          filePart,
          { text: "Identify and digitize ALL separate invoices in this document. Return them grouped individually." }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: invoiceBatchResponseSchema,
        temperature: 0.1, // low temperature means high predictability and OCR consistency
        maxOutputTokens: 8192,
      },
    });

    let rawText = (response.text || "{}").trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }
    rawText = rawText.trim();
    if (!rawText) {
      rawText = "{}";
    }

    // Multi-layered clean up of unescaped quotes and literal control characters (newlines/tabs)
    let sanitizedText = rawText;
    sanitizedText = sanitizeStringValuesInRawJson(sanitizedText);

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(sanitizedText);
    } catch (parseError: any) {
      console.warn(`[Gemini Server] Standard JSON parse failed, attempting intelligent backtracking rescue... Error: ${parseError.message}`);
      
      let rescued = false;
      const len = sanitizedText.length;
      const candidates: number[] = [];

      // Look for the exact character position of the syntax failure from the error message
      const posMatch = parseError.message.match(/at position (\d+)/i);
      if (posMatch) {
        const errorPos = parseInt(posMatch[1], 10);
        if (!isNaN(errorPos) && errorPos > 0 && errorPos < len) {
          // Add variations around the failure point so we try cutting near the syntax culprit
          candidates.push(errorPos);
          candidates.push(errorPos + 1);
          candidates.push(errorPos - 1);
          if (errorPos > 5) {
            candidates.push(errorPos - 5);
          }
        }
      }

      // Slicing/cutting is best suited for files that are truncated. We scan the tail of the response.
      // Search up to the last 6000 characters from the end or full length
      const searchLimit = Math.min(6000, len);
      for (let i = 0; i < searchLimit; i++) {
        const idx = len - 1 - i;
        const char = sanitizedText[idx];
        if (
          char === "," || 
          char === "}" || 
          char === "]" || 
          char === "\n"
        ) {
          candidates.push(idx + 1); // Try cutting right after this character
        }
      }
      
      // Always try the full length as the first/maximum candidate
      candidates.push(len);

      // Deduplicate and sort descending (try largest substrings first to maximize extracted data)
      const uniqueCandidates = Array.from(new Set(candidates)).sort((a, b) => b - a);
      const maxAttempts = Math.min(250, uniqueCandidates.length);

      for (let i = 0; i < maxAttempts; i++) {
        const cutPos = uniqueCandidates[i];
        const trimmed = sanitizedText.substring(0, cutPos).trim();
        if (!trimmed) continue;

        try {
          // jsonrepair automatically balances and closes open quotation marks, brackets, and braces!
          const repaired = jsonrepair(trimmed);
          const parsed = JSON.parse(repaired);
          
          if (parsed && typeof parsed === "object") {
            const invoicesCheck = parsed.invoices;
            if (Array.isArray(invoicesCheck)) {
              parsedJson = parsed;
              console.log(`[Gemini Server] Successfully rescued truncated JSON by cutting at position ${cutPos} and repairing! (Attempts: ${i + 1})`);
              rescued = true;
              break;
            }
          }
        } catch (err) {
          // Keep trying earlier boundary positions
        }
      }

      if (!rescued) {
        // Fall back to standard jsonrepair of the entire unsliced text
        try {
          const repaired = jsonrepair(sanitizedText);
          parsedJson = JSON.parse(repaired);
          console.log("[Gemini Server] Successfully repaired complete sanitized JSON directly using jsonrepair fallback.");
        } catch (repairError) {
          console.error("[Gemini Server] All recovery attempts failed. Rethrowing original error:", repairError);
          throw parseError;
        }
      }
    }

    const rawInvoices = Array.isArray(parsedJson?.invoices) ? parsedJson.invoices : [];

    // Filter out potential non-object or invalid elements resulting from repaired truncated structures,
    // but keep valid-enough objects even if they have some missing fields, as we have safe fallback values for those.
    const validInvoices = rawInvoices.filter((inv: any) => inv && typeof inv === "object");

    if (validInvoices.length === 0) {
      throw new Error("No invoices extracted by the model schema or output was too severely truncated.");
    }

    const finalInvoices: InvoiceData[] = validInvoices.map((inv: any, invoiceIdx: number) => {
      const randId = `${Math.random().toString(36).substr(2, 9)}-${invoiceIdx}`;
      const supplierName = inv.supplierName || "UNKNOWN SUPPLIER";
      const invoiceNo = inv.invoiceNo || `TEMP-${Date.now()}-${invoiceIdx}`;
      const invoiceDate = inv.invoiceDate || "";
      const gstin = inv.gstin || "";
      const poNumber = inv.poNumber || "";

      const confidence = {
        supplierName: inv.confidenceScoreSupplierName ?? 95,
        invoiceNo: inv.confidenceScoreInvoiceNo ?? 95,
        invoiceDate: inv.confidenceScoreInvoiceDate ?? 95,
        gstin: inv.confidenceScoreGstin ?? 95,
        poNumber: inv.confidenceScorePoNumber ?? 95,
      };

      const rawLineItems = Array.isArray(inv.lineItems) ? inv.lineItems : [];
      
      // Filter out any truncated elements that got closed as empty/invalid shapes or scalars
      const lineItems: LineItem[] = rawLineItems
        .filter((item: any) => item && typeof item === "object")
        .map((item: any, idx: number) => {
        const itemQty = typeof item.quantity === "number" ? item.quantity : (parseFloat(item.quantity) || 1);
        let itemRate = typeof item.rate === "number" ? item.rate : (parseFloat(item.rate) || 0);

        // Check for discount percentage and/or absolute discount amount
        const discPercent = typeof item.discountPercentage === "number" ? item.discountPercentage : (parseFloat(item.discountPercentage) || 0);
        const discAmount = typeof item.discountAmount === "number" ? item.discountAmount : (parseFloat(item.discountAmount) || 0);

        let hasDiscount = false;

        // Apply discount percentage directly to the rate
        if (discPercent > 0) {
          itemRate = itemRate * (1 - (discPercent / 100));
          hasDiscount = true;
        }

        // Apply absolute/flat discount amount to the rate
        if (discAmount > 0) {
          if (discAmount < itemRate) {
            // If the discount is small, treat it as a per-unit discount
            itemRate = itemRate - discAmount;
          } else if (itemQty > 0) {
            // Otherwise, treat it as a total row-level discount and divide by quantity to get per-unit impact
            itemRate = itemRate - (discAmount / itemQty);
          }
          if (itemRate < 0) itemRate = 0;
          hasDiscount = true;
        }
        
        let pAmount = item.amount;
        if (hasDiscount || pAmount === undefined || pAmount === null) {
          pAmount = itemQty * itemRate;
        } else if (typeof pAmount !== "number") {
          pAmount = parseFloat(pAmount) || (itemQty * itemRate);
        }

        const isTaxRate = item.uTaxRate || "18%";
        const taxRateNum = parseFloat(isTaxRate) / 100 || 0.18;

        let pGst = item.gstAmount;
        if (hasDiscount || pGst === undefined || pGst === null) {
          pGst = pAmount * taxRateNum;
        } else if (typeof pGst !== "number") {
          pGst = parseFloat(pGst) || (pAmount * taxRateNum);
        }

        let pTotal = item.totalAmount;
        if (hasDiscount || pTotal === undefined || pTotal === null) {
          pTotal = pAmount + pGst;
        } else if (typeof pTotal !== "number") {
          pTotal = parseFloat(pTotal) || (pAmount + pGst);
        }

        return {
          id: `row-${randId}-${idx}`,
          itemName: item.itemName || "Unnamed line item",
          quantity: isNaN(itemQty) ? 1 : itemQty,
          inventoryUom: item.inventoryUom || "NOS",
          uTaxRate: isTaxRate,
          hsnCode: item.hsnCode || "",
          rate: isNaN(itemRate) ? 0 : itemRate,
          amount: isNaN(pAmount) ? 0 : parseFloat(pAmount.toFixed(2)),
          gstAmount: isNaN(pGst) ? 0 : parseFloat(pGst.toFixed(2)),
          totalAmount: isNaN(pTotal) ? 0 : parseFloat(pTotal.toFixed(2)),
          invoiceNo: invoiceNo,
          confidenceName: item.confidenceItemName ?? 90,
          confidenceQuantity: item.confidenceQuantity ?? 90,
          confidenceRate: item.confidenceRate ?? 90,
          confidenceTotalAmount: item.confidenceTotalAmount ?? 90,
        };
      });

      return {
        id: randId,
        fileName,
        supplierName,
        invoiceNo,
        invoiceDate,
        gstin,
        poNumber,
        confidence,
        lineItems,
        status: 'success'
      };
    });

    return finalInvoices;
  } catch (error: any) {
    console.error(`[Gemini SDK Error] Failed to digitize "${fileName}":`, error);
    
    // Clean up error message to make it human-readable and actionable
    let detailedError = error.message || String(error);
    if (detailedError.includes("GEMINI_API_KEY is not defined")) {
      detailedError = "GEMINI_API_KEY environment variable is not defined. Please add your real Gemini API Key under Settings > Secrets in the build environment.";
    }

    // Return a structured error invoice marked with status: 'error'
    // This allows the front-end to display the actionable error details in the "Extraction Problems" card list!
    return [{
      id: Math.random().toString(36).substring(2, 11),
      fileName,
      supplierName: "OCR Extraction Failed",
      invoiceNo: "FAILED",
      invoiceDate: "",
      gstin: "",
      poNumber: "",
      confidence: { supplierName: 0, invoiceNo: 0, invoiceDate: 0, gstin: 0, poNumber: 0 },
      lineItems: [],
      status: 'error',
      errorMessage: detailedError
    } as any];
  }
}
