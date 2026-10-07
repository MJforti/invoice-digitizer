import "dotenv/config";
import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { extractInvoiceFromPdf } from "./server/gemini.js";
import { generateInvoiceExcelBuffer } from "./server/excel.js";
import { InvoiceData } from "./src/types.js";

const serverBootTime = new Date().toISOString();
const activeUploads = new Map<string, { chunks: Buffer[]; totalChunks: number }>();

// In-memory sync rooms map for phone-to-desktop ledger transfers
interface SyncRoom {
  code: string;
  createdAt: number;
  invoices: InvoiceData[];
  lastPolledAt?: number;
  phoneLastActiveAt?: number;
}
const inMemorySyncRooms = new Map<string, SyncRoom>();

interface StoredFile {
  buffer: Buffer;
  mimetype: string;
  name: string;
  createdAt: number;
}
const fileStore = new Map<string, StoredFile>();

// Prune rooms and files older than 3 hours every 15 minutes to save memory
setInterval(() => {
  const now = Date.now();
  const rawThreshold = now - 3 * 60 * 60 * 1000;
  for (const [code, room] of inMemorySyncRooms.entries()) {
    if (room.createdAt < rawThreshold) {
      console.log(`[Sync Pruner] Expired sync code ${code}`);
      inMemorySyncRooms.delete(code);
    }
  }
  for (const [id, file] of fileStore.entries()) {
    if (file.createdAt < rawThreshold) {
      console.log(`[File Pruner] Pruned in-memory file ${id}`);
      fileStore.delete(id);
    }
  }
}, 15 * 60 * 1000);

// Initialize multer upload middleware (Memory-based, keeping a 2000MB limit for rich batches)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2000 * 1024 * 1024, // 2000 MB max file size
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json({ limit: "250mb" }));
  app.use(express.urlencoded({ limit: "250mb", extended: true }));

  // 1. Healthcheck / Status API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString(), bootTime: serverBootTime });
  });

  // 1.2 Phone-to-Desktop Sync: Create a session room
  app.post("/api/sync/create", (req, res) => {
    try {
      // Generate a secure 6 digit numeric code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      inMemorySyncRooms.set(code, {
        code,
        createdAt: Date.now(),
        invoices: []
      });
      console.log(`[Sync Session] Created synchronization code: ${code}`);
      return res.json({ code });
    } catch (err: any) {
      return res.status(500).json({ error: "Could not create synchronization code." });
    }
  });

  // 1.3 Phone-to-Desktop Sync: Poll for new invoices
  app.get("/api/sync/poll/:code", (req, res) => {
    try {
      const { code } = req.params;
      const room = inMemorySyncRooms.get(code);
      if (!room) {
        return res.status(404).json({ error: "Sync session not found or expired." });
      }
      
      // Update activity timestamp from desktop viewer
      room.lastPolledAt = Date.now();
      
      // Grab accumulated scanned invoices, and clear the room's transient buffer
      const invoices = [...room.invoices];
      room.invoices = [];
      
      return res.json({ invoices });
    } catch (err: any) {
      return res.status(500).json({ error: "Polling sync session failed." });
    }
  });

  // 1.35 Phone-to-Desktop Sync: Check if connected devices are active
  app.get("/api/sync/presence/:code", (req, res) => {
    try {
      const { code } = req.params;
      const { role } = req.query; // 'phone' | 'desktop'
      const room = inMemorySyncRooms.get(code);
      if (!room) {
        return res.json({ active: false, status: "expired", message: "Sync session expired. Please refresh desktop." });
      }
      
      const now = Date.now();
      if (role === "phone") {
        room.phoneLastActiveAt = now;
      } else if (role === "desktop") {
        room.lastPolledAt = now;
      }
      
      const desktopActive = !!(room.lastPolledAt && (now - room.lastPolledAt < 10000));
      const phoneActive = !!(room.phoneLastActiveAt && (now - room.phoneLastActiveAt < 10000));
      
      return res.json({ 
        active: role === "phone" ? desktopActive : phoneActive,
        desktopActive,
        phoneActive,
        status: "active"
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Sync presence check failed." });
    }
  });

  // 1.36 Serve visual attachments for preview or comparison
  app.get("/api/files/:fileId", (req, res) => {
    try {
      const file = fileStore.get(req.params.fileId);
      if (!file) {
        return res.status(404).send("File not found or session expired.");
      }
      res.setHeader("Content-Type", file.mimetype);
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.name)}"`);
      return res.send(file.buffer);
    } catch (err: any) {
      return res.status(500).send("Error rendering file attachment.");
    }
  });

  // 1.4 Phone-to-Desktop Sync: Direct Mobile Scanned Image Attachment Upload
  app.post("/api/sync/upload", upload.single("file"), async (req, res) => {
    try {
      const { syncCode } = req.body;
      const file = req.file;

      if (!syncCode || !file) {
        return res.status(400).json({ error: "Missing sync code or scanned visual file." });
      }

      const room = inMemorySyncRooms.get(syncCode.trim());
      if (!room) {
        return res.status(404).json({ error: "Your sync code session has expired or is invalid. Please refresh your desktop screen." });
      }

      // Mark the mobile phone as active in this room
      room.phoneLastActiveAt = Date.now();

      console.log(`[Mobile Sync Upload] Uploading "${file.originalname}" (${file.size} bytes) with MIME ${file.mimetype} for Room ${syncCode}.`);

      const fileId = `file-${Math.random().toString(36).substr(2, 9)}`;
      fileStore.set(fileId, {
        buffer: file.buffer,
        mimetype: file.mimetype,
        name: file.originalname,
        createdAt: Date.now()
      });

      // Invoke Gemini extraction with express/multer file.mimetype so there is NO application/pdf mismatch!
      const results = await extractInvoiceFromPdf(file.buffer, file.originalname, file.mimetype);

      // Attach fileUrl
      results.forEach(inv => {
        inv.fileUrl = `/api/files/${fileId}`;
      });

      // Append results to sync room
      room.invoices.push(...results);
      console.log(`[Mobile Sync Upload] Successfully processed scanner image, appended ${results.length} invoices to desktop room.`);

      // Propagate first failure details if the extraction yielded failed state
      if (results[0]?.status === 'error') {
        return res.status(422).json({ 
          error: results[0].errorMessage || "Gemini could not parse document structural fields in this image."
        });
      }

      return res.json({ 
        success: true, 
        count: results.length,
        supplier: results[0]?.supplierName || "Unknown Supplier"
      });
    } catch (err: any) {
      console.error("[Mobile Sync Upload Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to process photo." });
    }
  });

  // 1.5 Chunked Upload Endpoint for supporting files up to 200MB without hitting the 32MB proxy limit
  app.post("/api/upload-chunk", upload.single("chunk"), async (req, res) => {
    try {
      const { uploadId, chunkIndex, totalChunks, fileName } = req.body;
      const file = req.file;

      if (!uploadId || chunkIndex === undefined || totalChunks === undefined || !file) {
        return res.status(400).json({ error: "Missing required chunk file or metadata." });
      }

      const index = parseInt(chunkIndex);
      const total = parseInt(totalChunks);

      if (!activeUploads.has(uploadId)) {
        activeUploads.set(uploadId, {
          chunks: new Array(total),
          totalChunks: total
        });
      }

      const uploadRecord = activeUploads.get(uploadId)!;
      uploadRecord.chunks[index] = file.buffer;

      // Calculate how many chunks we've received
      let completedCount = 0;
      for (let i = 0; i < total; i++) {
        if (uploadRecord.chunks[i]) {
          completedCount++;
        }
      }

      if (completedCount === total) {
        // All parts present: merge buffers
        const finalBuffer = Buffer.concat(uploadRecord.chunks);
        activeUploads.delete(uploadId); // clean up memory

        console.log(`[Chunk Uploader] Successfully reconstructed "${fileName}" (${finalBuffer.length} bytes). Invoking Gemini Vision...`);

        // Determine mimetype
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        let mime = 'application/pdf';
        if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
        else if (ext === 'png') mime = 'image/png';
        else if (ext === 'webp') mime = 'image/webp';

        const fileId = `file-${Math.random().toString(36).substr(2, 9)}`;
        fileStore.set(fileId, {
          buffer: finalBuffer,
          mimetype: mime,
          name: fileName,
          createdAt: Date.now()
        });

        // Trigger PDF Gemini OCR Extraction
        const results = await extractInvoiceFromPdf(finalBuffer, fileName);
        
        // Inject fileUrl
        results.forEach(inv => {
          inv.fileUrl = `/api/files/${fileId}`;
        });

        return res.json({ results });
      } else {
        // Acknowledge chunk
        return res.json({ status: "uploading", chunkIndex: index, received: completedCount, totalChunks: total });
      }
    } catch (err: any) {
      console.error("[Chunk Uploader Error]:", err);
      return res.status(500).json({ error: err.message || "Could not save file package chunk." });
    }
  });

  // 2. Upload and Multi-Extract Route
  app.post("/api/upload-and-extract", (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) {
        console.error("Multer file upload error:", err);
        return res.status(400).json({ error: `File upload failed: ${err.message}` });
      }
      next();
    });
  }, async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No PDF or image files were uploaded." });
      }

      console.log(`Received batch processing request for ${files.length} invoice(s).`);

      // Process invoices. Using Promise.all so extraction runs in parallel for top speed.
      const extractionPromises = files.map(async (file) => {
        try {
          const startTime = Date.now();
          const results = await extractInvoiceFromPdf(file.buffer, file.originalname, file.mimetype);
          console.log(`Processed "${file.originalname}" in ${Date.now() - startTime}ms. Extracted ${results.length} invoice(s).`);
          return results;
        } catch (fileErr: any) {
          console.warn(`[Batch Worker] Handled single document warning for ${file.originalname}:`, fileErr.message || fileErr);
          // Return a structured fallback error invoice rather than failing the whole batch
          return [{
            id: Math.random().toString(36).substr(2, 9),
            fileName: file.originalname,
            supplierName: "OCR Extraction Failed",
            invoiceNo: "FAILED",
            invoiceDate: "",
            gstin: "",
            poNumber: "",
            confidence: { supplierName: 0, invoiceNo: 0, invoiceDate: 0, gstin: 0, poNumber: 0 },
            lineItems: [],
            status: "error" as const,
            errorMessage: fileErr.message || "Extraction timeout or rate limits."
          }];
        }
      });

      const processedResults = await Promise.all(extractionPromises);
      const flattenedResults: InvoiceData[] = processedResults.flat();
      res.json({ results: flattenedResults });
    } catch (globalErr: any) {
      console.error("Critical error in batch processing API:", globalErr);
      res.status(500).json({ error: globalErr.message || "Critical service error" });
    }
  });

  // 3. Export Excel spreadsheet
  app.post("/api/export-excel", (req, res) => {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Cannot export empty items list." });
      }

      console.log(`Compiling standard Excel export for ${items.length} row entries.`);
      const buffer = generateInvoiceExcelBuffer(items);

      // Generate pristine date string for filename: Invoice_Output_YYYYMMDD.xlsx
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const fileName = `Invoice_Output_${year}${month}${day}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.end(buffer);
    } catch (err: any) {
      console.error("Excel generation endpoint error:", err);
      res.status(500).json({ error: err.message || "Failed to generate spreadsheet" });
    }
  });

  // Global 404 handler for API routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
  });

  // Global Error handler for API routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith("/api/")) {
      console.error("Express API error:", err);
      return res.status(err.status || 500).json({
        error: err.message || "An internal server error occurred on this API route."
      });
    }
    next(err);
  });

  // Serve Vite or static compilation bundles
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production / container execution mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Invoice Processor] server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
