# Invoice Digitizer 📄⚡📊

An enterprise-ready, AI-powered invoice digitization platform that transforms multi-page PDF invoices and receipt images into structured, verified spreadsheets (.xlsx). Built with **React 19**, **Express**, **TypeScript**, **Tailwind CSS**, and **Google Gemini Multimodal Vision API**.

---

## 🚀 Key Features

- **Multimodal AI Extraction**:
  - Leverages Google Gemini models (`gemini-2.5-flash`, `gemini-2.5-pro` / `gemini-3.5-flash`) via the official `@google/genai` SDK.
  - Automatically identifies key invoice headers: **Supplier Name**, **Invoice Number**, **Invoice Date**, **GSTIN / Tax ID**, and **Purchase Order (PO) Number**.
  - Extracts line-by-line items: **Description**, **HSN/SAC Code**, **Quantity**, **Unit of Measure (UOM)**, **Tax Rate (%)**, **Unit Rate**, **Taxable Amount**, **GST Amount**, and **Total Amount**.

- **Resilience & High Availability**:
  - **Dynamic Multi-Model Failover**: Automatically retries across backup models (`gemini-3.1-flash-lite`, `gemini-3.1-pro-preview`) if a primary model experiences transient capacity spikes (HTTP 503).
  - **Exponential Backoff with Jitter**: Robust retry policy for network or upstream service blips.
  - **Intelligent JSON Recovery**: Multi-tier sanitization using regex-based quote escaping, boundary backtracking, and `jsonrepair` to handle truncated or malformed responses.

- **📱 Mobile-to-Desktop Scanner Sync**:
  - Secure 6-digit numeric pairing room to connect mobile devices without user logins.
  - Scan physical paper invoices using your phone camera; items instantly appear in real-time on your desktop dashboard.
  - Device presence monitoring and auto-cleanup for expired sync sessions.

- **Interactive Verification Grid**:
  - Visual field-level confidence badges (High / Review / Low) to highlight uncertain values.
  - Inline editing for instant correction before saving.
  - **Duplicate Detection**: Flags matching invoice numbers across uploaded batches to prevent double billing.
  - Built-in visual attachment viewer with zoom and split-screen comparison.

- **Large Batch & Chunked Uploading**:
  - Supports large multi-page PDF documents up to 200MB using chunked file streaming to bypass cloud proxy payload limits.
  - Parallel batch worker processing for high-throughput invoice digitization.

- **One-Click Excel (.xlsx) Export**:
  - Generates audit-ready Excel spreadsheets with proper headers, number formatting, and formula-friendly column structures using SheetJS.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons
- **Backend**: Node.js, Express, TypeScript, Multer, `tsx`, `esbuild`
- **AI & Vision**: `@google/genai` (Google Gen AI SDK), `jsonrepair`
- **Spreadsheet Generation**: `xlsx` (SheetJS)

---

## 📁 Project Architecture

```
├── assets/                  # Static assets and demo samples
├── server/
│   ├── excel.ts             # Excel workbook generator & styling logic
│   └── gemini.ts            # Gemini prompt schemas, retry policies & JSON sanitizers
├── src/
│   ├── components/
│   │   ├── ConfidenceBadge.tsx   # Visual accuracy indicator
│   │   ├── DuplicateBanner.tsx   # Duplicate invoice warning banner
│   │   ├── MobileScannerView.tsx # Mobile phone camera & upload UI
│   │   ├── ReviewTable.tsx       # Spreadsheet review & inline edit grid
│   │   └── UploadZone.tsx        # Drag-and-drop & chunked file upload
│   ├── App.tsx              # Main dashboard application
│   ├── index.css            # Tailwind CSS entrypoint
│   ├── main.tsx             # React DOM root
│   └── types.ts             # Shared TypeScript schemas & interfaces
├── index.html               # Web application entry point
├── metadata.json            # AI Studio metadata & capabilities
├── package.json             # NPM dependencies and scripts
├── server.ts                # Express server and API endpoints
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite build configuration
```

---

## ⚡ Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **npm** or **bun**
- **Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/)

### 1. Installation

Clone this repository and install dependencies:

```bash
git clone <your-repository-url>
cd <repository-directory>
npm install
```

### 2. Environment Configuration

Create a `.env` file from the provided `.env.example`:

```bash
cp .env.example .env
```

Configure your environment variables:

```env
# Required: Google Gemini API Key
GEMINI_API_KEY="your_api_key_here"

# Optional: Host URL (default: http://localhost:3000)
APP_URL="http://localhost:3000"
```

### 3. Running in Development

Start the integrated full-stack server (runs both Express backend and Vite frontend on port 3000):

```bash
npm run dev
```

Open your browser at `http://localhost:3000`.

### 4. Production Build

To build the optimized client bundle and compiled server binary:

```bash
npm run build
npm start
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck and server boot status |
| `POST` | `/api/upload-and-extract` | Batch upload multiple PDFs/images for OCR digitization |
| `POST` | `/api/upload-chunk` | Multi-part chunked upload for files exceeding 32MB |
| `POST` | `/api/sync/create` | Generates a 6-digit sync room for mobile phone pairing |
| `GET` | `/api/sync/poll/:code` | Polls newly digitized invoices captured by mobile phones |
| `GET` | `/api/sync/presence/:code`| Heartbeat and active connection status check |
| `POST` | `/api/sync/upload` | Direct photo capture upload from mobile scanner view |
| `GET` | `/api/files/:fileId` | Serves original uploaded visual file for comparison |
| `POST` | `/api/export-excel` | Converts verified invoice JSON into a formatted `.xlsx` file |

---

## 🔒 Security & Privacy

- Documents and invoices uploaded during phone synchronization sessions are kept in transient memory and automatically pruned after 3 hours.
- API keys are handled strictly server-side and never exposed to the client browser.

---

## 📄 License

This project is licensed under the MIT License - feel free to adapt and integrate into your ERP/accounting pipelines.
