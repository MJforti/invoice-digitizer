export interface FieldConfidence {
  supplierName: number;
  invoiceNo: number;
  invoiceDate: number;
  gstin: number;
  poNumber: number;
}

export interface LineItem {
  id: string; // Unique row ID for React rendering and tracking
  itemName: string;
  quantity: number;
  inventoryUom: string;
  uTaxRate: string; // e.g., "18%"
  hsnCode: string;
  rate: number;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  invoiceNo: string;
  confidenceName: number;
  confidenceQuantity: number;
  confidenceRate: number;
  confidenceTotalAmount: number;
}

export interface InvoiceData {
  id: string;
  fileName: string;
  supplierName: string;
  invoiceNo: string;
  invoiceDate: string;
  gstin: string;
  poNumber: string;
  confidence: FieldConfidence;
  lineItems: LineItem[];
  status: 'pending' | 'success' | 'error';
  errorMessage?: string;
  fileUrl?: string;
}

export interface ExcelColumnMapping {
  supplierName: string;
  itemName: string;
  quantity: string;
  inventoryUom: string;
  uTaxRate: string;
  hsnCode: string;
  rate: string;
  amount: string;
  gstAmount: string;
  totalAmount: string;
  invoiceNo: string;
}
