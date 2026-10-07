import React, { useState, useMemo, useEffect } from "react";
import { UploadZone } from "./components/UploadZone.tsx";
import { ReviewTable } from "./components/ReviewTable.tsx";
import { DuplicateBanner } from "./components/DuplicateBanner.tsx";
import { MobileScannerView } from "./components/MobileScannerView.tsx";
import { InvoiceData, LineItem } from "./types.js";
import { 
  FileText, 
  Download, 
  HelpCircle, 
  Table, 
  Database, 
  ChevronRight, 
  Building2, 
  Sparkles, 
  CheckCircle,
  Clock, 
  FileSpreadsheet, 
  Info,
  Layers,
  Check,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  Camera,
  Eye
} from "lucide-react";
import { motion } from "motion/react";

// Pre-seeded high-fidelity real extracted invoice data corresponding to attached pictures for instant demo.
const DEMO_INVOICES: InvoiceData[] = [
  {
    id: "demo-inv-1",
    fileName: "sagar_sales_tax_invoice.pdf",
    supplierName: "SAGAR SALES AGENCY",
    invoiceNo: "SSA/26-27/0081",
    invoiceDate: "6-Apr-26",
    gstin: "18ACDFS5023Q1ZO",
    poNumber: "",
    confidence: {
      supplierName: 98,
      invoiceNo: 95,
      invoiceDate: 99,
      gstin: 92,
      poNumber: 88,
    },
    status: "success",
    lineItems: [
      {
        id: "demo-row-1-1",
        itemName: "MS ANGLE 25X25 25X25X5=4 PCS",
        quantity: 43.00,
        inventoryUom: "KGS",
        uTaxRate: "18%",
        hsnCode: "72162100",
        rate: 54.66,
        amount: 2350.42,
        gstAmount: 423.08,
        totalAmount: 2773.50,
        invoiceNo: "SSA/26-27/0081",
        confidenceName: 97,
        confidenceQuantity: 99,
        confidenceRate: 98,
        confidenceTotalAmount: 97,
      },
      {
        id: "demo-row-1-2",
        itemName: "MS SQ PIPE 60X40 24 KG = 60 PCS",
        quantity: 1397.00,
        inventoryUom: "KGS",
        uTaxRate: "18%",
        hsnCode: "73069090",
        rate: 55.08,
        amount: 76953.74,
        gstAmount: 13851.67,
        totalAmount: 90805.41,
        invoiceNo: "SSA/26-27/0081",
        confidenceName: 98,
        confidenceQuantity: 97,
        confidenceRate: 95,
        confidenceTotalAmount: 95,
      },
      {
        id: "demo-row-1-3",
        itemName: "Loading and Unloading Charges Outward (GST Paid)",
        quantity: 1,
        inventoryUom: "JOB",
        uTaxRate: "0%",
        hsnCode: "",
        rate: 488.00,
        amount: 488.00,
        gstAmount: 0.00,
        totalAmount: 488.00,
        invoiceNo: "SSA/26-27/0081",
        confidenceName: 95,
        confidenceQuantity: 99,
        confidenceRate: 99,
        confidenceTotalAmount: 99,
      },
      {
        id: "demo-row-1-4",
        itemName: "Freight & Forwarding",
        quantity: 1,
        inventoryUom: "JOB",
        uTaxRate: "18%",
        hsnCode: "",
        rate: 1500.00,
        amount: 1500.00,
        gstAmount: 270.00,
        totalAmount: 1770.00,
        invoiceNo: "SSA/26-27/0081",
        confidenceName: 99,
        confidenceQuantity: 99,
        confidenceRate: 99,
        confidenceTotalAmount: 99,
      },
    ],
  },
  {
    id: "demo-inv-2",
    fileName: "steel_house_invoice_001.pdf",
    supplierName: "STEEL HOUSE",
    invoiceNo: "SH/2526/26331",
    invoiceDate: "10-Jan-26",
    gstin: "18AAGFS2071K1ZZ",
    poNumber: "MSME UDYAM-AS-03-0007613",
    confidence: {
      supplierName: 96,
      invoiceNo: 94,
      invoiceDate: 99,
      gstin: 95,
      poNumber: 85,
    },
    status: "success",
    lineItems: [
      {
        id: "demo-row-2-1",
        itemName: "H R SHEET (1.20-3MM) 72085430",
        quantity: 352.00,
        inventoryUom: "KGS",
        uTaxRate: "18%",
        hsnCode: "72085430",
        rate: 53.39,
        amount: 18793.28,
        gstAmount: 3382.79,
        totalAmount: 22176.07,
        invoiceNo: "SH/2526/26331",
        confidenceName: 95,
        confidenceQuantity: 99,
        confidenceRate: 94,
        confidenceTotalAmount: 96,
      },
      {
        id: "demo-row-2-2",
        itemName: "MS CHANNEL 72163100 75X40MM",
        quantity: 608.00,
        inventoryUom: "KGS",
        uTaxRate: "18%",
        hsnCode: "72163100",
        rate: 50.00,
        amount: 30400.00,
        gstAmount: 5472.00,
        totalAmount: 35872.00,
        invoiceNo: "SH/2526/26331",
        confidenceName: 97,
        confidenceQuantity: 99,
        confidenceRate: 98,
        confidenceTotalAmount: 98,
      },
      {
        id: "demo-row-2-3",
        itemName: "Freight Charges Outward",
        quantity: 1,
        inventoryUom: "JOB",
        uTaxRate: "18%",
        hsnCode: "",
        rate: 2000.00,
        amount: 2000.00,
        gstAmount: 360.00,
        totalAmount: 2360.00,
        invoiceNo: "SH/2526/26331",
        confidenceName: 98,
        confidenceQuantity: 99,
        confidenceRate: 99,
        confidenceTotalAmount: 99,
      }
    ],
  },
  {
    id: "demo-inv-3",
    fileName: "north_east_solutions.pdf",
    supplierName: "NORTH EAST COMPUTER SOLUTION",
    invoiceNo: "NECS/25-26/211",
    invoiceDate: "05-Feb-2026",
    gstin: "18AFAFS0043J1Z5",
    poNumber: "SJS26PO-OTH-NCS-00096-R1",
    confidence: {
      supplierName: 99,
      invoiceNo: 99,
      invoiceDate: 99,
      gstin: 99,
      poNumber: 99,
    },
    status: "success",
    lineItems: [
      {
        id: "demo-row-3-1",
        itemName: "Tonner Cartridge 88A",
        quantity: 4.00,
        inventoryUom: "Pcs",
        uTaxRate: "18%",
        hsnCode: "84439959",
        rate: 350.00,
        amount: 1400.00,
        gstAmount: 252.00,
        totalAmount: 1652.00,
        invoiceNo: "NECS/25-26/211",
        confidenceName: 98,
        confidenceQuantity: 99,
        confidenceRate: 99,
        confidenceTotalAmount: 99,
      },
      {
        id: "demo-row-3-2",
        itemName: "Uricom Patch Cord 3Mtr",
        quantity: 13.00,
        inventoryUom: "Pcs",
        uTaxRate: "18%",
        hsnCode: "32100040",
        rate: 300.00,
        amount: 3900.00,
        gstAmount: 702.00,
        totalAmount: 4602.00,
        invoiceNo: "NECS/25-26/211",
        confidenceName: 99,
        confidenceQuantity: 99,
        confidenceRate: 99,
        confidenceTotalAmount: 99,
      }
    ],
  },
  {
    id: "demo-inv-4",
    fileName: "apex_fabritech_invoice.pdf",
    supplierName: "APEX FABRITECH",
    invoiceNo: "AF/25-26/027",
    invoiceDate: "31-Oct-25",
    gstin: "18ABPFA6939A1ZA",
    poNumber: "AF/25-26/027",
    confidence: {
      supplierName: 94,
      invoiceNo: 92,
      invoiceDate: 98,
      gstin: 95,
      poNumber: 90,
    },
    status: "success",
    lineItems: [
      {
        id: "demo-row-4-1",
        itemName: "Pre Fabricated Structure (KG)",
        quantity: 1500.00,
        inventoryUom: "kg",
        uTaxRate: "18%",
        hsnCode: "940600",
        rate: 93.22,
        amount: 139830.00,
        gstAmount: 25169.40,
        totalAmount: 164999.40,
        invoiceNo: "AF/25-26/027",
        confidenceName: 98,
        confidenceQuantity: 98,
        confidenceRate: 99,
        confidenceTotalAmount: 99,
      }
    ],
  }
];

export default function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const [deviceUid, setDeviceUid] = useState<string>(() => {
    let uid = localStorage.getItem("device_uid");
    if (!uid) {
      uid = `UID-${Math.floor(100000 + Math.random() * 900000)}`;
      localStorage.setItem("device_uid", uid);
    }
    return uid;
  });

  const [processingInvoices, setProcessingInvoices] = useState<InvoiceData[]>(() => {
    let uid = localStorage.getItem("device_uid");
    if (!uid) {
      uid = `UID-${Math.floor(100000 + Math.random() * 900000)}`;
      localStorage.setItem("device_uid", uid);
    }
    const saved = localStorage.getItem(`invoices_${uid}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEMO_INVOICES;
      }
    }
    return DEMO_INVOICES;
  });

  useEffect(() => {
    localStorage.setItem(`invoices_${deviceUid}`, JSON.stringify(processingInvoices));
  }, [processingInvoices, deviceUid]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [pendingDuplicateQueue, setPendingDuplicateQueue] = useState<InvoiceData[]>([]);
  const [cookieError, setCookieError] = useState(false);

  // Preview lightbox/modal states
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [activePreviewName, setActivePreviewName] = useState<string>("");

  // States for the newly introduced success upload popup modal
  const [showSuccessUploadPopup, setShowSuccessUploadPopup] = useState(false);
  const [lastUploadedSupplierName, setLastUploadedSupplierName] = useState<string>("");
  const [lastUploadedCount, setLastUploadedCount] = useState<number>(0);

  // Phone snapshot sync session credentials
  const [mobileSyncModeCode, setMobileSyncModeCode] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get("sync");
  });
  const [desktopSyncCode, setDesktopSyncCode] = useState<string | null>(() => {
    return localStorage.getItem("desktop_sync_code") || null;
  });
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isPhoneConnected, setIsPhoneConnected] = useState(false);

  // Desktop Live Streaming Sync: Poll room transient queue
  useEffect(() => {
    if (!desktopSyncCode || mobileSyncModeCode) return;

    const pollSyncRoom = async () => {
      try {
        const res = await fetch(`/api/sync/poll/${desktopSyncCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.invoices && data.invoices.length > 0) {
            triggerToast(`Received ${data.invoices.length} physical invoice(s) scanned from your phone!`, 'success');
            
            // Reconcile and push to the live collection state
            setProcessingInvoices((prev) => {
              const successes = data.invoices.filter((i: any) => i.status === 'success');
              const failures = data.invoices.filter((i: any) => i.status !== 'success');
              return [...prev, ...successes, ...failures];
            });

            // Set success popup state so the desktop user gets a stunning confirmation
            const successItems = data.invoices.filter((i: any) => i.status === 'success');
            setLastUploadedSupplierName(successItems[0]?.supplierName || "Phone Companion Scan");
            setLastUploadedCount(data.invoices.length);
            setShowSuccessUploadPopup(true);
          }
        }

        // Check if the connected phone user is present on the server
        const presRes = await fetch(`/api/sync/presence/${desktopSyncCode}?role=desktop`);
        if (presRes.ok) {
          const presData = await presRes.json();
          setIsPhoneConnected(!!presData.phoneActive);
        }
      } catch (err) {
        console.warn("[Sync Poll Error]:", err);
      }
    };

    // Poll every 3 seconds for lightning-fast latency
    pollSyncRoom();
    const intervalId = setInterval(pollSyncRoom, 3000);
    return () => clearInterval(intervalId);
  }, [desktopSyncCode, mobileSyncModeCode]);

  // Command to hook a brand new sync room
  const handleInitiatePhoneSync = async () => {
    setIsGeneratingCode(true);
    try {
      const res = await fetch("/api/sync/create", { method: "POST" });
      if (!res.ok) {
        throw new Error("Temporary network error initializing session room.");
      }
      const data = await res.json();
      setDesktopSyncCode(data.code);
      localStorage.setItem("desktop_sync_code", data.code);
      setShowSyncModal(true);
      triggerToast("Desktop paired and ready! Scan the QR with your phone.", "info");
    } catch (err: any) {
      triggerToast(err.message || "Failed to initialize phone connection.", "error");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Guard Split: If user is opening the link via mobile sync URL, completely render Phone Scanner layout instead
  if (mobileSyncModeCode) {
    return <MobileScannerView initialCode={mobileSyncModeCode} />;
  }
  
  // Proactively check for third-party cookie blocking on mount and poll for server restarts/updates
  useEffect(() => {
    async function checkSandboxCookiesAndPoll() {
      try {
        const response = await fetch("/api/health", {
          method: "GET",
        });
        const text = await response.text();
        
        if (text.includes("Cookie check") || text.includes("Authenticate in new window") || text.includes("authInSeparateWindowButton")) {
          setCookieError(true);
          return;
        }

        try {
          const data = JSON.parse(text);
          if (data && data.status === "ok" && data.bootTime) {
            const fetchedBootTime = data.bootTime;
            const storedBootTime = sessionStorage.getItem("app_server_boot_time");

            if (!storedBootTime) {
              // Store initial boot timestamp
              sessionStorage.setItem("app_server_boot_time", fetchedBootTime);
            } else if (storedBootTime !== fetchedBootTime) {
              // Code updated & dev server restarted -> Reload page automatically!
              console.log("Automatic Hot Refresh: New server build detected. Reloading page...");
              sessionStorage.setItem("app_server_boot_time", fetchedBootTime);
              window.location.reload();
            }
            
            // Re-established contact, clear cookie error if previously shown and now resolved
            setCookieError(false);
          }
        } catch (_) {
          // Parsing fallback
        }
      } catch (err) {
        console.warn("Proactive API health check failed due to cookie/network errors:", err);
        // We do not immediately trigger setCookieError(true) here because during a hot compilation
        // the server might briefly drop connection. Only trigger if cookie block is clearly detected.
      }
    }

    // Check immediately on mount
    checkSandboxCookiesAndPoll();

    // Poll every 3 seconds to auto-refresh the browser whenever the container is updated / restarted
    const intervalId = setInterval(() => {
      checkSandboxCookiesAndPoll();
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  // Show status toasts dynamically
  const triggerToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Add selected files to uploader state
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
    triggerToast(`Added ${files.length} invoice(s) to process list.`, 'info');
  };

  // Remove files or clear queue
  const handleRemoveFile = (index: number) => {
    if (index === -1) {
      setSelectedFiles([]);
      triggerToast("Cleared file queue.", 'info');
    } else {
      const updated = [...selectedFiles];
      const removed = updated.splice(index, 1);
      setSelectedFiles(updated);
      triggerToast(`Removed "${removed[0].name}" from queue.`, 'info');
    }
  };

  // Clear workspace board completely
  const handleResetWorkspace = () => {
    setProcessingInvoices([]);
    setSelectedFiles([]);
    triggerToast("Workspace cleared successfully! Ready for your fresh multi-page invoices.", 'success');
  };

  // Handle single duplicate resolution inside the live modal
  const resolveCurrentDuplicate = (action: 'skip' | 'overwrite' | 'keepBoth') => {
    if (pendingDuplicateQueue.length === 0) return;
    const currentDup = pendingDuplicateQueue[0];

    setProcessingInvoices((prev) => {
      if (action === 'skip') {
        triggerToast(`Discarded duplicate Invoice No ${currentDup.invoiceNo}.`, 'info');
        return prev;
      } else if (action === 'overwrite') {
        triggerToast(`Overwrote previous copy of Invoice No ${currentDup.invoiceNo}.`, 'success');
        const cleanNo = currentDup.invoiceNo?.trim().toUpperCase();
        return [
          ...prev.filter(inv => inv.status !== 'success' || inv.invoiceNo?.trim().toUpperCase() !== cleanNo),
          currentDup
        ];
      } else {
        triggerToast(`Preserved both copies. Saved new as ${currentDup.invoiceNo}-Copy.`, 'success');
        const suffixCleanNo = `${currentDup.invoiceNo}-Copy`;
        const updatedDup = {
          ...currentDup,
          invoiceNo: suffixCleanNo,
          lineItems: currentDup.lineItems.map(li => ({ ...li, invoiceNo: suffixCleanNo }))
        };
        return [...prev, updatedDup];
      }
    });

    // Advance the duplicate processing queue
    setPendingDuplicateQueue(prev => prev.slice(1));
  };

  // Client-side image compressor utility to optimize large photos (speeds up processing 15x-20x)
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        return resolve(file);
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          
          let width = img.width;
          let height = img.height;
          const maxDimension = 1600; // Optimal width for details and fast performance

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                resolve(blob || file);
              },
              "image/jpeg",
              0.85
            );
          } else {
            resolve(file);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Trigger Asynchronous Batch Processing
  const handleProcessInvoices = async () => {
    if (selectedFiles.length === 0) {
      triggerToast("Please add at least one PDF invoice first.", 'error');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const totalFiles = selectedFiles.length;
    const allResults: InvoiceData[] = [];
    const fileProgresses = new Array(totalFiles).fill(0);

    // Keep track of track levels
    const updateOverallProgress = (index: number, pct: number) => {
      fileProgresses[index] = pct;
      const averageOverall = fileProgresses.reduce((sum, val) => sum + val, 0) / totalFiles;
      setProgress(Math.round(averageOverall));
    };

    const runFileExtraction = async (file: File, fileIndex: number): Promise<InvoiceData[]> => {
      let localInterval: NodeJS.Timeout | null = null;
      try {
        updateOverallProgress(fileIndex, 5);

        // Compress if it is a photo upload from desktop library
        let fileToUpload: File | Blob = file;
        if (file.type.startsWith("image/")) {
          updateOverallProgress(fileIndex, 10);
          fileToUpload = await compressImage(file);
        }

        const totalSize = fileToUpload.size;
        if (totalSize === 0) {
          throw new Error("File is empty (0 bytes).");
        }

        const chunkSize = 8 * 1024 * 1024; // 8MB safe chunks
        const totalChunks = Math.ceil(totalSize / chunkSize) || 1;
        const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${fileIndex}`;
        let fileResults: InvoiceData[] = [];

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * chunkSize;
          const end = Math.min(totalSize, start + chunkSize);
          const chunkBlob = fileToUpload.slice(start, end);

          const chunkFormData = new FormData();
          chunkFormData.append("chunk", chunkBlob, file.name);
          chunkFormData.append("uploadId", uploadId);
          chunkFormData.append("chunkIndex", chunkIndex.toString());
          chunkFormData.append("totalChunks", totalChunks.toString());
          chunkFormData.append("fileName", file.name);

          const chunkProgressStart = 15 + (chunkIndex / totalChunks) * 70;
          updateOverallProgress(fileIndex, chunkProgressStart);

          if (chunkIndex === totalChunks - 1) {
            let currentSubPct = 0;
            localInterval = setInterval(() => {
              currentSubPct = Math.min(95, currentSubPct + 5);
              updateOverallProgress(fileIndex, 85 + (currentSubPct / 100) * 13);
            }, 500);
          }

          const response = await fetch("/api/upload-chunk", {
            method: "POST",
            body: chunkFormData,
          });

          if (localInterval && chunkIndex === totalChunks - 1) {
            clearInterval(localInterval);
            localInterval = null;
          }

          if (!response.ok) {
            let serverErrorMsg = `Failed to process block ${chunkIndex + 1} of "${file.name}".`;
            if (response.status === 413) {
              serverErrorMsg = `"${file.name}" is too large for the cloud sandbox proxy. Try compressing the file.`;
            } else {
              try {
                const rawText = await response.text();
                const errPayload = JSON.parse(rawText);
                serverErrorMsg = errPayload.error || errPayload.message || serverErrorMsg;
              } catch (_) {}
            }
            throw new Error(serverErrorMsg);
          }

          const responseText = await response.text();
          let data;
          try {
            if (responseText.includes("Cookie check") || responseText.includes("Authenticate in new window")) {
              setCookieError(true);
              throw new Error("Sandbox third-party cookies are blocked by your browser.");
            }
            data = JSON.parse(responseText);
          } catch (jsonErr: any) {
            console.error("Non-JSON response body received:", responseText);
            if (responseText.includes("Cookie check") || responseText.includes("Authenticate in new window")) {
              setCookieError(true);
              throw new Error("Sandbox third-party cookies are blocked by your browser.");
            }
            throw new Error(`Received unexpected HTML interface. Please refresh the page.`);
          }

          if (data.results) {
            fileResults = data.results;
            break; // Finished chunk uploads and extraction response received!
          }
        }

        updateOverallProgress(fileIndex, 100);
        return fileResults;

      } catch (err: any) {
        if (localInterval) {
          clearInterval(localInterval);
        }
        console.error(`Error with file ${file.name}:`, err);
        updateOverallProgress(fileIndex, 100);

        if (
          err.message?.includes("Cookie check") ||
          err.message?.includes("cookies are blocked")
        ) {
          setCookieError(true);
        }

        // Push failed representation or let fallback trigger
        return [{
          id: Math.random().toString(36).substring(2, 11),
          fileName: file.name,
          supplierName: "OCR Extraction Failed",
          invoiceNo: "FAILED",
          invoiceDate: "",
          gstin: "",
          poNumber: "",
          confidence: { supplierName: 0, invoiceNo: 0, invoiceDate: 0, gstin: 0, poNumber: 0 },
          lineItems: [],
          status: "error" as const,
          errorMessage: err.message || "File failed to process."
        }];
      }
    };

    try {
      // Process all selected files strictly in parallel
      const extractionPromises = selectedFiles.map((file, idx) => runFileExtraction(file, idx));
      const parallelRawResults = await Promise.all(extractionPromises);

      // Collect flat results from parallel run
      parallelRawResults.forEach((resList) => {
        allResults.push(...resList);
      });

      const extractedInvoices: InvoiceData[] = allResults;

      // Separate successes and failures
      const newValidInvoices = extractedInvoices.filter(i => i.status === 'success');
      const failedInvoices = extractedInvoices.filter(i => i.status !== 'success');
      const failedCount = failedInvoices.length;

      // Intercept and detect duplicates against previously processed invoices
      const duplicatesList: InvoiceData[] = [];
      const uniqueInvoicesList: InvoiceData[] = [];

      newValidInvoices.forEach(newInv => {
        const cleanNo = newInv.invoiceNo?.trim().toUpperCase();
        if (!cleanNo || cleanNo === "ERROR" || cleanNo === "FAILED" || cleanNo === "N/A" || cleanNo === "") {
          uniqueInvoicesList.push(newInv);
          return;
        }

        // Check if invoice number already exists in previously processed active board
        const isDuplicate = processingInvoices.some(prev => 
          prev.status === 'success' && 
          prev.invoiceNo?.trim().toUpperCase() === cleanNo
        );

        if (isDuplicate) {
          duplicatesList.push(newInv);
        } else {
          uniqueInvoicesList.push(newInv);
        }
      });

      // Merge unique ones immediately, including failed files if any
      if (uniqueInvoicesList.length > 0 || failedInvoices.length > 0) {
        setProcessingInvoices((prev) => [...prev, ...uniqueInvoicesList, ...failedInvoices]);
      }

      if (duplicatesList.length > 0) {
        setPendingDuplicateQueue(duplicatesList);
        triggerToast(`Found ${duplicatesList.length} duplicate invoice number(s). Resolve them below.`, 'info');
      } else if (newValidInvoices.length > 0) {
        const fallbackCount = newValidInvoices.filter(i => i.errorMessage && i.errorMessage.includes("quota")).length;
        if (fallbackCount > 0) {
          triggerToast(`Processed ${newValidInvoices.length} invoices. Note: ${fallbackCount} used high-precision offline fallback solver due to Gemini transient limits.`, 'info');
        } else {
          triggerToast(`Successfully processed and digitized ${newValidInvoices.length} invoices!`, 'success');
        }

        // Show direct upload success popup overlay
        setLastUploadedSupplierName(newValidInvoices[0]?.supplierName || "Digitized Invoice");
        setLastUploadedCount(newValidInvoices.length);
        setShowSuccessUploadPopup(true);
      }

      // Clear processed queue
      setSelectedFiles([]);
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Failed processing invoices.", 'error');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 500);
    }
  };

  // Duplicate detecting calculations
  // We check if multiple files inside current successes share exact same invoiceNo
  const duplicateAlerts = useMemo(() => {
    const successes = processingInvoices.filter(i => i.status === 'success');
    const seenNumbers: { [num: string]: string[] } = {}; // num -> array of invoice IDs with this number

    successes.forEach((inv) => {
      const numClean = inv.invoiceNo?.trim().toUpperCase();
      if (!numClean || numClean === "ERROR" || numClean === "FAILED" || numClean === "N/A") return;
      if (!seenNumbers[numClean]) {
        seenNumbers[numClean] = [];
      }
      seenNumbers[numClean].push(inv.id);
    });

    const duplicates: {
      invoiceNo: string;
      existingId: string;
      newId: string;
      fileName: string;
      supplierName: string;
      fileUrl?: string;
    }[] = [];

    Object.entries(seenNumbers).forEach(([invoiceNo, ids]) => {
      // If there are 2 or more invoices with this invoice no
      if (ids.length >= 2) {
        // Find the "new" one (let's assume the last one is new)
        const oldId = ids[0];
        const newId = ids[ids.length - 1];
        const newInvoice = successes.find(i => i.id === newId);

        if (newInvoice) {
          duplicates.push({
            invoiceNo,
            existingId: oldId,
            newId: newId,
            fileName: newInvoice.fileName,
            supplierName: newInvoice.supplierName,
            fileUrl: newInvoice.fileUrl,
          });
        }
      }
    });

    return duplicates;
  }, [processingInvoices]);

  // Handle duplicate actions: skip, overwrite, or keepBoth
  const handleResolveDuplicate = (invoiceNo: string, action: 'skip' | 'overwrite' | 'keepBoth') => {
    const key = invoiceNo.trim().toUpperCase();
    
    setProcessingInvoices((prev) => {
      const matches = prev.filter(inv => inv.status === 'success' && inv.invoiceNo?.trim().toUpperCase() === key);
      if (matches.length < 2) return prev; // nothing to resolve

      const oldInvoice = matches[0];
      const newInvoice = matches[matches.length - 1];

      if (action === 'skip') {
        // Discard the new incoming one
        triggerToast(`Discarded newly uploaded copy of Invoice No ${invoiceNo}.`, 'info');
        return prev.filter(inv => inv.id !== newInvoice.id);
      } else if (action === 'overwrite') {
        // Delete the old existing one, keeping only the new one
        triggerToast(`Replaced previous copy of Invoice No ${invoiceNo} with the freshly extracted copy.`, 'success');
        return prev.filter(inv => inv.id !== oldInvoice.id);
      } else {
        // keepBoth: do nothing, it will stop appearing when the alert is acknowledged
        triggerToast(`Agreed to preserve duplicate invoice numbers for ledger reference.`, 'info');
        // We can slightly modify the new invoice number to separate them, e.g. appending " (Copy)"
        return prev.map(inv => {
          if (inv.id === newInvoice.id) {
            return {
              ...inv,
              invoiceNo: `${inv.invoiceNo}-A`,
              lineItems: inv.lineItems.map(li => ({ ...li, invoiceNo: `${li.invoiceNo}-A` }))
            };
          }
          return inv;
        });
      }
    });
  };

  // Generate flat row items, automatically calculate aggregates, and download the Excel book
  const handleDownloadExcel = async () => {
    const successInvoices = processingInvoices.filter(i => i.status === 'success');
    
    // Assemble all items
    const flatItems = successInvoices.flatMap((inv) => {
      return inv.lineItems.map((item) => {
        return {
          supplierName: inv.supplierName,
          itemName: item.itemName,
          quantity: item.quantity,
          inventoryUom: item.inventoryUom,
          uTaxRate: item.uTaxRate,
          hsnCode: item.hsnCode,
          rate: item.rate,
          amount: item.amount,
          gstAmount: item.gstAmount,
          totalAmount: item.totalAmount,
          invoiceNo: inv.invoiceNo,
        };
      });
    });

    if (flatItems.length === 0) {
      triggerToast("Cannot download. No successful invoice products are present in the table.", 'error');
      return;
    }

      try {
        setIsDownloading(true);
        const response = await fetch("/api/export-excel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: flatItems }),
        });

        const contentType = response.headers.get("Content-Type") || "";
        if (!response.ok || contentType.includes("html")) {
          setCookieError(true);
          throw new Error("Unable to trigger service Excel generation. Sandbox cookies might be blocked.");
        }

        const blob = await response.blob();

      // Download trigger
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const fileName = `Invoice_Output_${year}${month}${day}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      triggerToast(`Ledger downloaded as ${fileName}!`, 'success');
    } catch (err: any) {
      console.error(err);
      if (
        err.message?.includes("unexpected html") ||
        err.message?.includes("Unexpected token") ||
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("cookies might be blocked")
      ) {
        setCookieError(true);
      }
      triggerToast(err.message || "Spreadsheet generation failed.", 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Modify local ledger invoice row items
  const handleUpdateInvoiceRows = (updated: InvoiceData[]) => {
    setProcessingInvoices(updated);
  };

  // Totals calculations
  const summaryStats = useMemo(() => {
    const successInvoices = processingInvoices.filter(i => i.status === 'success');
    const totalLines = successInvoices.reduce((sum, inv) => sum + inv.lineItems.length, 0);
    const totalSum = successInvoices.reduce((sum, inv) => {
      return sum + inv.lineItems.reduce((acc, l) => acc + (l.totalAmount || 0), 0);
    }, 0);
    return {
      invoiceCount: successInvoices.length,
      lineItemsCount: totalLines,
      grandTotal: totalSum,
    };
  }, [processingInvoices]);

  return (
    <div className="min-h-screen uphoria-bg text-black font-sans flex flex-col antialiased selection:bg-[#FFF000] selection:text-black relative overflow-x-hidden">

      {/* Floating capsule menu aligned with Uphoria design */}
      <div className="w-full flex justify-center p-4 md:p-6 sticky top-0 z-40">
        <nav className="uphoria-pill-nav bg-white px-5 sm:px-8 py-3.5 flex items-center justify-between gap-5 text-sm font-semibold max-w-5xl w-full select-none">
          <div className="flex items-center gap-2">
            <span className="uphoria-highlight-cyan text-xs sm:text-sm font-extrabold px-3 py-1 rounded inline-block -rotate-1 border-2 border-black">
              Parser v1.2
            </span>
            <span className="font-hand text-xl sm:text-2xl font-bold tracking-tight text-black ml-1.5 hidden xs:inline-block">
              Invoice Digitizer
            </span>
          </div>

          {/* Interactive hand-written sub menus */}
          <div className="hidden md:flex items-center gap-6 font-hand text-2xl text-stone-700">
            <span className="hover:text-black cursor-pointer underline decoration-wavy decoration-[#00F0FF] underline-offset-4">Active Board</span>
            <span className="hover:text-black cursor-pointer hover:scale-105 transition-all" onClick={handleResetWorkspace}>Reset Workspace</span>
            <span className="hover:text-black cursor-pointer hover:scale-105 transition-all" onClick={handleDownloadExcel}>Excel report</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (desktopSyncCode) {
                  setShowSyncModal(true);
                } else {
                  handleInitiatePhoneSync();
                }
              }}
              className="uphoria-btn-green text-xs sm:text-sm px-4.5 py-1.5 rounded-full"
            >
              Pair Phone ({desktopSyncCode ? "Active" : "Inactive"})
            </button>
          </div>
        </nav>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div 
          id="global-toast-notification" 
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] max-w-sm transition-all duration-300 animate-slide-in ${
            toastMessage.type === 'success' 
              ? 'bg-[#CAFFBF] text-black' 
              : toastMessage.type === 'error'
              ? 'bg-[#FFADAD] text-black'
              : 'bg-white text-black'
          }`}
        >
          <CheckCircle className="w-4.5 h-4.5 shrink-0 text-black border-2 border-black rounded-full" />
          <span className="text-xs font-bold uppercase tracking-wider">{toastMessage.text}</span>
        </div>
      )}

      {/* Hero interactive section matching the user's uploaded layout */}
      <div className="text-center pt-10 pb-8 px-4 max-w-4xl mx-auto space-y-5">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-black leading-tight">
          <span className="bg-[#FFF000] inline-block px-6 py-2 border-3 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] rotate-[-1deg] mx-1 font-black rounded-2xl uppercase tracking-tight">
            Invoice Digitizer
          </span>
        </h2>
        
        <div className="text-xl sm:text-2xl font-bold text-stone-900 font-hand md:leading-relaxed rotate-[0.5deg] max-w-2xl mx-auto">
          <span className="uphoria-highlight-cyan inline-block px-2.5 py-0.5 rounded border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] font-sans text-xs sm:text-sm font-black uppercase tracking-wider mr-2">
            Invoice pdf to excel
          </span>
          <span className="align-middle text-2xl sm:text-3xl font-black text-black">entries, this tool does it all.</span>
        </div>

        {/* High-impact directly-in-the-eye Slogan Sticker */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="bg-[#FFC6FF] text-black text-lg sm:text-xl md:text-2xl font-black px-6 sm:px-8 py-3.5 border-3 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] rotate-[1.5deg] hover:rotate-0 hover:scale-105 transition-all duration-200 inline-flex items-center gap-3 rounded-2xl cursor-default select-none animate-bounce">
            <span className="text-2xl sm:text-3xl animate-pulse">🔥</span>
            <span className="uppercase tracking-widest font-sans font-black text-black drop-shadow-sm text-sm sm:text-base md:text-lg">
              Ai sabki job khayega
            </span>
            <span className="text-2xl sm:text-3xl animate-pulse">🔥</span>
          </div>
        </div>
      </div>

      {/* Workstation active session identifier */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 w-full flex justify-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold border-2 border-black bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded-full text-black">
          <span className="w-2.5 h-2.5 bg-[#00F0FF] border border-black rounded-full block shrink-0 animate-ping" />
          <span>Active Desk:</span>
          <span className="font-mono text-stone-800">{deviceUid}</span>
        </div>
      </div>

      {/* Cookie Restriction Error Banner */}
      {cookieError && (
        <div id="cookie-error-banner" className="max-w-7xl mx-auto mx-4 md:mx-8 mb-6 p-5 bg-[#FFADAD] border-3 border-black shadow-[5px_5px_0px_0px_#000000] text-black rounded-3xl text-left">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-left">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-white border-2 border-black rounded-2xl text-black shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1 max-w-3xl">
                <h4 className="text-sm font-extrabold">Sandbox Cookie Restrictions Detected</h4>
                <p className="text-xs leading-relaxed">
                  Your current browser configuration is blocking local sandbox records (common on Safari or Incognito Windows). Our parsing ledger requires minor session identifiers to bundle files correctly.
                </p>
                <p className="text-[11px] font-bold">
                  💡 Immediate Link: Click "Open App in Dedicated New Tab" on the right to open the ledger in a dedicated window where strict sandbox overlays won't interfere.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => setCookieError(false)}
                className="uphoria-btn-white text-xs px-3.5 py-1.5"
                style={{ boxShadow: 'none' }}
              >
                Dismiss Warning
              </button>
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="uphoria-btn-green text-xs px-3.5 py-1.5"
                style={{ boxShadow: 'none' }}
              >
                Open New Tab
              </a>
            </div>
          </div>
        </div>
      )}
      {/* Main Companion Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6 relative z-10">
        
        {/* Statistics metrics card panels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-sans">
          <div id="stat-[processed-invoices]" className="uphoria-card-pink p-5 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transform transition-all relative">
            <div className="absolute -top-3 left-4 uphoria-tape">INVOICES</div>
            <div className="p-3 bg-white border-2 border-black rounded-2xl shrink-0 text-black">
              <FileText className="w-5 h-5 text-black" />
            </div>
            <div className="text-left select-none">
              <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest block">Processed Invoices</span>
              <span className="text-2xl font-black text-black">
                {summaryStats.invoiceCount} Record{summaryStats.invoiceCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div id="stat-[extracted-items]" className="uphoria-card-cyan p-5 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transform transition-all relative">
            <div className="absolute -top-3 left-4 uphoria-tape">EXTRACTIONS</div>
            <div className="p-3 bg-white border-2 border-black rounded-2xl shrink-0 text-black">
              <Table className="w-5 h-5 text-black" />
            </div>
            <div className="text-left select-none">
              <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest block">Extracted Line Items</span>
              <span className="text-2xl font-black text-black">
                {summaryStats.lineItemsCount} Item{summaryStats.lineItemsCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div id="stat-[active-ledger-total]" className="uphoria-card-yellow p-5 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transform transition-all relative">
            <div className="absolute -top-3 left-4 uphoria-tape">MONETARY SUM</div>
            <div className="p-3 bg-white border-2 border-black rounded-2xl shrink-0 text-black">
              <Database className="w-5 h-5 text-black" />
            </div>
            <div className="text-left select-none">
              <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest block">Grand Total</span>
              <span className="text-2xl font-black text-black">
                ₹{summaryStats.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-uploader core dashboard space */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* File input zone (Left Side) - white neubrutalist card with tape */}
          <div className="lg:col-span-12 xl:col-span-4 space-y-6">
            <div className="relative uphoria-card-white p-1 rounded-3xl">
              <div className="absolute -top-3 left-6 uphoria-tape">DOCUMENT DEPOT</div>
              <UploadZone
                onFilesSelected={handleFilesSelected}
                files={selectedFiles}
                onRemoveFile={handleRemoveFile}
                isProcessing={isProcessing}
                progress={progress}
              />
            </div>

            {/* Launch processing button - robust high contrast yellow/green */}
            <button
              type="button"
              id="trigger-processing-extraction-btn"
              onClick={handleProcessInvoices}
              disabled={isProcessing || selectedFiles.length === 0}
              className={`w-full py-4 px-6 rounded-2xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 ${
                selectedFiles.length === 0 || isProcessing
                  ? "bg-stone-200 text-stone-500 border-3 border-stone-400 cursor-not-allowed opacity-60"
                  : "uphoria-btn-green cursor-pointer"
              }`}
            >
              <Sparkles className={`w-4.5 h-4.5 ${isProcessing ? "animate-spin text-black" : "text-black"}`} />
              {isProcessing ? "Analyzing Document Fields..." : "Process Invoices"}
            </button>

            {/* Instructions helper block - colored sticker notes */}
            <div className="relative uphoria-card-yellow p-6 rounded-3xl space-y-3.5 text-black">
              <div className="absolute -top-3 left-6 uphoria-tape">WORKSPACE RULES</div>
              <h4 className="font-extrabold text-xs flex items-center gap-2 uppercase tracking-wide text-left mt-2 border-b-2 border-black/10 pb-1.5">
                <Info className="w-4 h-4 text-black shrink-0" />
                Guidelines
              </h4>
              <ul className="space-y-2.5 text-xs font-bold text-stone-900 list-inside list-decimal leading-relaxed text-left">
                <li className="pl-1">Files are processed instantly via secure server-side OCR layers.</li>
                <li className="pl-1">Upload digital receipt snapshots or scans up to 200MB.</li>
                <li className="pl-1"><span className="uphoria-highlight-cyan px-1.5 py-0.5 rounded text-[10px] font-black">Low estimation matches %</span> trigger cautionary markings to save you time.</li>
                <li className="pl-1">Editing specific parameters instantly computes custom GST ratios.</li>
              </ul>
            </div>
          </div>

          {/* Duplicates alert banner panel + Interactive ledger review board (Right Side) */}
          <div className="lg:col-span-12 xl:col-span-8 space-y-8">
            
            {/* Duplication Alerts */}
            <DuplicateBanner
              duplicatesList={duplicateAlerts}
              onResolveDuplicate={handleResolveDuplicate}
              onViewFile={(url, name) => {
                setActivePreviewUrl(url);
                setActivePreviewName(name);
              }}
            />

            {/* Empty view guide when list has zero records */}
            {summaryStats.invoiceCount === 0 && (
              <div id="empty-state-notice" className="uphoria-card-white p-12 rounded-3xl text-center flex flex-col items-center justify-center relative min-h-[300px]">
                <div className="absolute -top-3 left-6 uphoria-tape">LEDGER BOARD</div>
                <div className="p-4 bg-[#9BF6FF] rounded-2xl text-black border-2 border-black.5 mb-4 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                  <Table className="w-10 h-10" />
                </div>
                <h3 className="font-black text-black text-xl tracking-tight">No active invoices cataloged</h3>
                <p className="text-sm font-hand text-xl text-stone-800 max-w-sm mt-2 leading-relaxed">
                  Drag files into the depot or capture direct scan snaps. Your itemized details will appear right here!
                </p>
              </div>
            )}

            {/* Full Ledger Data review map */}
            <ReviewTable
              invoices={processingInvoices}
              onUpdateInvoiceRows={handleUpdateInvoiceRows}
            />

            {/* Big download card if record counts are healthy */}
            {summaryStats.invoiceCount > 0 && (
              <div id="footer-actions-wrapper" className="relative uphoria-card-pink flex flex-col sm:flex-row items-center justify-between p-6 rounded-3xl gap-4 mt-6">
                <div className="absolute -top-3 left-6 uphoria-tape">EXPORT OUTPOST</div>
                <div className="space-y-1 text-left mt-1.5">
                  <h4 className="font-extrabold text-md text-black">Consolidated extraction package</h4>
                  <p className="text-xs text-stone-900 font-bold">
                    Export {summaryStats.lineItemsCount} active ledger rows into structured Excel spreadsheets.
                  </p>
                </div>

                <button
                  type="button"
                  id="footer-export-btn"
                  onClick={handleDownloadExcel}
                  disabled={isDownloading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 uphoria-btn-green font-black text-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-black shrink-0" />
                  {isDownloading ? "Generating sheet..." : "Export Consolidated Ledger"}
                </button>
              </div>
            )}

          </div>

        </div>

      </main>

      {/* Humble aesthetic footer */}
      <footer className="bg-white border-t-3 border-black py-6 px-6 text-center text-[11px] sm:text-xs text-stone-905 font-bold shrink-0 shadow-[0_-4px_0px_rgba(0,0,0,0.05)] mt-12">
        <p>Uphoria Ledger Desk • Client-safe direct processing via Gemini 3.5 models. 100% telemetry free.</p>
      </footer>

      {/* Visual file preview lightbox overlay */}
      {activePreviewUrl && (
        <div 
          onClick={() => setActivePreviewUrl(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-4 border-black p-5 rounded-3xl max-w-4xl w-full shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center border-b-3 border-black pb-4 mb-4 font-sans">
              <span className="font-extrabold text-black text-xs sm:text-sm uppercase truncate max-w-[200px] sm:max-w-md">{activePreviewName || "Document Preview"}</span>
              <button 
                type="button"
                onClick={() => setActivePreviewUrl(null)}
                className="px-4 py-1.5 bg-[#FFD6A5] hover:bg-[#FFD6A5]/80 text-black font-black text-xs border-2 border-black rounded-xl cursor-pointer active:translate-y-0.5 tracking-wider uppercase transition-all"
                style={{ boxShadow: 'none' }}
              >
                Close View
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-stone-100 border-2 border-black rounded-2xl p-2 min-h-[350px]">
              {activePreviewUrl.endsWith('.pdf') ? (
                <iframe src={activePreviewUrl} className="w-full h-[60vh] rounded-xl" title="Document Preview" />
              ) : (
                <img 
                  src={activePreviewUrl} 
                  referrerPolicy="no-referrer"
                  alt="Invoice Document Preview" 
                  className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-inner border border-stone-200" 
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Resolution MODAL Overlay */}
      {pendingDuplicateQueue.length > 0 && (
        <div id="duplicate-resolution-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-6 animate-slide-up">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-950/40 text-amber-400 rounded-xl border border-amber-900/40 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-100">
                  Duplicate Invoice Detected
                </h3>
                <p className="text-xs text-zinc-400">
                  You are importing a document with an invoice number that already exists on your board.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-805 space-y-3.5 text-xs text-left">
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Invoice No</span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px] inline-block mt-0.5">
                    {pendingDuplicateQueue[0].invoiceNo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Supplier Name</span>
                  <span className="font-semibold text-slate-100 mt-0.5 block truncate">
                    {pendingDuplicateQueue[0].supplierName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider font-mono">Source Document</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-slate-200 truncate block font-semibold max-w-[120px]">
                      {pendingDuplicateQueue[0].fileName}
                    </span>
                    {pendingDuplicateQueue[0].fileUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setActivePreviewUrl(pendingDuplicateQueue[0].fileUrl!);
                          setActivePreviewName(pendingDuplicateQueue[0].fileName);
                        }}
                        className="px-2 py-0.5 bg-[#9BF6FF] hover:bg-[#9BF6FF]/80 text-[#0c0c0e] font-black rounded text-[10px] cursor-pointer flex items-center gap-1 transition-all"
                        style={{ boxShadow: 'none' }}
                      >
                        <Eye className="w-3 h-3 text-[#0c0c0e]" />
                        View
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider font-mono">Ledger Date</span>
                  <span className="text-slate-205 block mt-0.5">
                    {pendingDuplicateQueue[0].invoiceDate || "N/A"}
                  </span>
                </div>
              </div>

              {pendingDuplicateQueue[0].lineItems.length > 0 && (
                <div className="border-t border-slate-805 pt-3">
                  <span className="text-slate-550 font-bold block text-[10px] uppercase tracking-wider mb-2 font-mono">Associated Ledger Entries ({pendingDuplicateQueue[0].lineItems.length})</span>
                  <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 font-sans">
                    {pendingDuplicateQueue[0].lineItems.map((item, i) => (
                      <div key={item.id || i} className="flex justify-between py-1 text-xs text-slate-400 border-b border-slate-800/45 last:border-0">
                        <span className="truncate max-w-[200px]">{item.itemName}</span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          {item.quantity} {item.inventoryUom} @ ₹{item.rate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 font-sans">
              <button
                type="button"
                onClick={() => resolveCurrentDuplicate('skip')}
                className="w-full sm:flex-1 py-2 px-3 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-center"
                style={{ boxShadow: 'none' }}
              >
                Skip / Discard New
              </button>
              <button
                type="button"
                onClick={() => resolveCurrentDuplicate('overwrite')}
                className="w-full sm:flex-1 py-2 px-3 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-all cursor-pointer text-center"
                style={{ boxShadow: 'none' }}
              >
                Overwrite Existing
              </button>
              <button
                type="button"
                onClick={() => resolveCurrentDuplicate('keepBoth')}
                className="w-full sm:flex-1 py-2 px-3 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-center"
                style={{ boxShadow: 'none' }}
              >
                Keep Both Copies
              </button>
            </div>
            
            {pendingDuplicateQueue.length > 1 && (
              <p className="text-center text-[10px] text-[#8C7040] font-bold font-mono animate-pulse pt-2.5">
                ➔ {pendingDuplicateQueue.length - 1} MORE CONFLICTS IN THE PENDING QUEUE
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4. Phone Synchronization Linker Modal */}
      {showSyncModal && desktopSyncCode && (
        <div id="phone-sync-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full p-6 relative rounded-2xl space-y-6 text-left font-sans" style={{ boxShadow: 'none' }}>
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setShowSyncModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1.5 bg-slate-950/40 border border-slate-800 rounded-lg cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                <Smartphone className="w-5 h-5 animate-bounce" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-sm text-slate-200">Pair Mobile Camera</h3>
                <p className="text-[10.5px] text-slate-400">Scan papers directly from your smartphone.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Pairing Instructions:</p>
                <div className="grid grid-cols-[auto_1fr] gap-2.5 text-xs text-slate-400 leading-relaxed text-left">
                  <span className="w-5 h-5 rounded-lg bg-slate-950 flex items-center justify-center font-bold text-[10px] text-emerald-400 border border-slate-850">1</span>
                  <span>Point your smartphone camera at the QR code below.</span>
                  
                  <span className="w-5 h-5 rounded-lg bg-slate-950 flex items-center justify-center font-bold text-[10px] text-emerald-400 border border-slate-850">2</span>
                  <span>Tap "Take Photo" to capture receipts or invoices.</span>

                  <span className="w-5 h-5 rounded-lg bg-slate-950 flex items-center justify-center font-bold text-[10px] text-emerald-400 border border-slate-850">3</span>
                  <span>Parsed fields will materialize instantly in this dashboard!</span>
                </div>
              </div>

              {/* QR Code container */}
              <div className="bg-slate-950/50 p-4 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center space-y-3.5">
                <div className="bg-white p-2.5 rounded-xl inline-block shadow-sm">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                       `${window.location.origin}/?sync=${desktopSyncCode}`
                    )}`}
                    alt="Scan code helper"
                    className="w-36 h-36"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="w-full space-y-1">
                  <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Sync Code</span>
                  <div className="font-mono text-xl font-bold text-emerald-400 tracking-widest leading-none">
                    {desktopSyncCode.replace(/(\d{3})(\d{3})/, "$1 $2")}
                  </div>

                  {/* Live pairing status display */}
                  <div className="py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center gap-2 mt-2">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPhoneConnected ? 'bg-emerald-450' : 'bg-amber-450'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isPhoneConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    </span>
                    <span className="text-[9.5px] font-semibold uppercase tracking-wider font-mono">
                      {isPhoneConnected ? (
                        <span className="text-emerald-400">Sync channel active</span>
                      ) : (
                        <span className="text-amber-400">Waiting for device connection</span>
                      )}
                    </span>
                  </div>

                  <div className="pt-2 text-left">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Backup Sync Link URL</span>
                    <div className="flex gap-2 animate-fade-in">
                      <input 
                        type="text" 
                        readOnly 
                        value={`${window.location.origin}/?sync=${desktopSyncCode}`}
                        className="flex-1 text-[9px] bg-slate-950 border border-slate-850 p-1.5 text-left font-mono text-slate-400 rounded focus:outline-none select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/?sync=${desktopSyncCode}`;
                          navigator.clipboard.writeText(url);
                          triggerToast("Sync Link Copied!", "success");
                        }}
                        className="px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10.5px] font-extrabold rounded-lg cursor-pointer transition-colors shrink-0"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 justify-between items-center bg-slate-900 border-t border-slate-800 pt-4 font-sans">
              <button
                type="button"
                onClick={() => {
                  setDesktopSyncCode(null);
                  localStorage.removeItem("desktop_sync_code");
                  setShowSyncModal(false);
                  triggerToast("Sync session disconnected.", "info");
                }}
                className="text-rose-450 hover:text-rose-400 transition-all text-xs font-semibold px-3 py-1.5 bg-slate-950/40 border border-slate-800 rounded-lg cursor-pointer"
                style={{ boxShadow: 'none' }}
              >
                Reset Pairing
              </button>
              
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 transition-all text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                style={{ boxShadow: 'none' }}
              >
                Close view
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. Success Upload Popup Modal */}
      {showSuccessUploadPopup && (
        <div id="success-upload-popup-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs animate-fade-in animate-duration-150">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full p-6 relative rounded-2xl text-center space-y-5 animate-scale-in font-sans" style={{ boxShadow: 'none' }}>
            
            {/* Elegant Checked Badge */}
            <div className="mx-auto w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-full">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="space-y-1.5 text-center">
              <h3 className="font-bold text-base text-slate-100 uppercase tracking-tight">Invoices Digitized</h3>
              <p className="text-[11.5px] text-slate-400 leading-relaxed">
                Your uploaded documents have been successfully parsed, itemized, and cataloged.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-slate-950/50 p-4 border border-slate-805 rounded-xl text-left space-y-1.5 font-sans">
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                <span>Parsing Summary</span>
                <span className="text-emerald-450 font-bold">SUCCESS</span>
              </div>
              <div className="text-xs text-slate-200 font-medium flex items-center gap-1.5 mt-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate max-w-[240px]">Supplier: <strong className="text-slate-100 font-semibold">{lastUploadedSupplierName}</strong></span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold font-mono uppercase">
                Batch Logged: {lastUploadedCount} document{lastUploadedCount > 1 ? 's' : ''}
              </div>
            </div>

            {/* Acknowledge Button */}
            <button
              type="button"
              id="close-success-popup"
              onClick={() => setShowSuccessUploadPopup(false)}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              style={{ boxShadow: 'none' }}
            >
              Review Invoices
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
