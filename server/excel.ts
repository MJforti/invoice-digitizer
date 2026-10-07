import * as XLSX from 'xlsx';

interface FlatLineItem {
  supplierName: string;
  itemName: string;
  quantity: number;
  inventoryUom: string;
  uTaxRate: string;
  hsnCode: string;
  rate: number;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  invoiceNo: string;
}

/**
 * Compiles a list of flat line items into a SheetJS spreadsheet buffer (.xlsx format)
 */
export function generateInvoiceExcelBuffer(items: FlatLineItem[]): Buffer {
  const wb = XLSX.utils.book_new();

  // Create row mappings
  const rawData = items.map((item) => {
    return {
      "Supplier Name": item.supplierName?.toUpperCase() || "",
      "Item Name": item.itemName || "",
      "Quantity": typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0,
      "Inventory UOM": item.inventoryUom?.toUpperCase() || "NOS",
      "U_TaxRate": item.uTaxRate || "18%",
      "HSN Code": item.hsnCode || "",
      "Rate": typeof item.rate === 'number' ? item.rate : parseFloat(item.rate) || 0,
      "Amount": typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0,
      "GST Amount": typeof item.gstAmount === 'number' ? item.gstAmount : parseFloat(item.gstAmount) || 0,
      "Total Amount": typeof item.totalAmount === 'number' ? item.totalAmount : parseFloat(item.totalAmount) || 0,
      "Invoice No": item.invoiceNo || ""
    };
  });

  // Convert to worksheet
  const ws = XLSX.utils.json_to_sheet(rawData);

  // Apply column widths for pristine viewing
  const colWidths = [
    { wch: 30 }, // Supplier Name
    { wch: 35 }, // Item Name
    { wch: 10 }, // Quantity
    { wch: 15 }, // Inventory UOM
    { wch: 10 }, // U_TaxRate
    { wch: 12 }, // HSN Code
    { wch: 12 }, // Rate
    { wch: 15 }, // Amount
    { wch: 15 }, // GST Amount
    { wch: 15 }, // Total Amount
    { wch: 20 }, // Invoice No
  ];
  ws['!cols'] = colWidths;

  // Append to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Digitized Invoices");

  // Write as native buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buf as Buffer;
}
