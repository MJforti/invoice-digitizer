import React from "react";
import { Trash2, Plus, RefreshCw, Sparkles, Building, AlertCircle, Info, FileText } from "lucide-react";
import { InvoiceData, LineItem } from "../types.js";
import { ConfidenceBadge } from "./ConfidenceBadge.tsx";

interface ReviewTableProps {
  invoices: InvoiceData[];
  onUpdateInvoiceRows: (updatedInvoices: InvoiceData[]) => void;
}

export function ReviewTable({ invoices, onUpdateInvoiceRows }: ReviewTableProps) {
  // We can track a filter to review specific invoice or "All Merged"
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string>("all");

  const activeInvoices = React.useMemo(() => {
    if (selectedInvoiceId === "all") {
      return invoices.filter(inv => inv.status === 'success');
    }
    return invoices.filter(inv => inv.id === selectedInvoiceId && inv.status === 'success');
  }, [invoices, selectedInvoiceId]);

  // Total summary statistics
  const stats = React.useMemo(() => {
    const successInvoices = invoices.filter(i => i.status === 'success');
    const totalLines = successInvoices.reduce((sum, inv) => sum + inv.lineItems.length, 0);
    const totalSum = successInvoices.reduce((sum, inv) => {
      return sum + inv.lineItems.reduce((acc, l) => acc + (l.totalAmount || 0), 0);
    }, 0);
    return {
      invoiceCount: successInvoices.length,
      lineItemsCount: totalLines,
      grandTotal: totalSum
    };
  }, [invoices]);

  const failedInvoices = React.useMemo(() => {
    return invoices.filter(i => i.status === 'error');
  }, [invoices]);

  // Edit fields inside a line item row
  const handleCellChange = (
    invoiceId: string,
    lineItemId: string,
    field: keyof LineItem,
    value: string | number
  ) => {
    const updated = invoices.map(inv => {
      if (inv.id !== invoiceId) return inv;

      const updatedLines = inv.lineItems.map(line => {
        if (line.id !== lineItemId) return line;

        const updatedLine = { ...line, [field]: value };

        // For convenience: if rate, qty or uTaxRate change, re-reconcile sums
        if (field === 'quantity' || field === 'rate' || field === 'uTaxRate') {
          const qty = field === 'quantity' ? Number(value) : line.quantity;
          const r = field === 'rate' ? Number(value) : line.rate;
          const taxStr = field === 'uTaxRate' ? String(value) : line.uTaxRate;

          const amount = parseFloat((qty * r).toFixed(2));
          const taxPercent = parseFloat(taxStr) / 100 || 0.18;
          const gstAmount = parseFloat((amount * taxPercent).toFixed(2));
          const totalAmount = parseFloat((amount + gstAmount).toFixed(2));

          updatedLine.amount = isNaN(amount) ? 0 : amount;
          updatedLine.gstAmount = isNaN(gstAmount) ? 0 : gstAmount;
          updatedLine.totalAmount = isNaN(totalAmount) ? 0 : totalAmount;
        }

        return updatedLine;
      });

      return { ...inv, lineItems: updatedLines };
    });

    onUpdateInvoiceRows(updated);
  };

  // Modify invoice-level meta details (like Supplier Name, Invoice No, Date, GSTIN or PO)
  const handleHeaderChange = (
    invoiceId: string,
    field: keyof Omit<InvoiceData, 'id' | 'lineItems' | 'confidence' | 'status'>,
    value: string
  ) => {
    const updated = invoices.map(inv => {
      if (inv.id !== invoiceId) return inv;

      // When Invoice Number updates, write down the update to row items as well
      if (field === 'invoiceNo') {
        const updatedLines = inv.lineItems.map(line => ({ ...line, invoiceNo: value }));
        return { ...inv, [field]: value, lineItems: updatedLines };
      }

      return { ...inv, [field]: value };
    });
    onUpdateInvoiceRows(updated);
  };

  // Add new blank row manually to any invoice
  const handleAddManualRow = (invoiceId: string) => {
    const targetInvoice = invoices.find(inv => inv.id === invoiceId);
    if (!targetInvoice) return;

    const newRowId = `manual-${Math.random().toString(36).substr(2, 5)}`;
    const newRow: LineItem = {
      id: newRowId,
      itemName: "NEW LINE ITEM",
      quantity: 1,
      inventoryUom: "NOS",
      uTaxRate: "18%",
      hsnCode: "",
      rate: 0,
      amount: 0,
      gstAmount: 0,
      totalAmount: 0,
      invoiceNo: targetInvoice.invoiceNo || "",
      confidenceName: 100,
      confidenceQuantity: 100,
      confidenceRate: 100,
      confidenceTotalAmount: 100
    };

    const updated = invoices.map(inv => {
      if (inv.id !== invoiceId) return inv;
      return { ...inv, lineItems: [...inv.lineItems, newRow] };
    });

    onUpdateInvoiceRows(updated);
  };

  // Delete a specific row
  const handleDeleteRow = (invoiceId: string, lineItemId: string) => {
    const updated = invoices.map(inv => {
      if (inv.id !== invoiceId) return inv;
      return { ...inv, lineItems: inv.lineItems.filter(line => line.id !== lineItemId) };
    });
    onUpdateInvoiceRows(updated);
  };

  // Detect general low-confidence elements
  const lowConfidenceCheck = (val: number) => val < 85;

  if (invoices.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-6 space-y-8 select-none">
      {/* 1. Failed Invoices & Accounts List */}
      {failedInvoices.length > 0 && (
        <div className="space-y-4 font-sans">
          <h3 className="text-sm font-black text-black uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 text-black shrink-0" />
            Failed Document Processing ({failedInvoices.length})
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {failedInvoices.map((inv) => {
              const errorMessageText = inv.errorMessage || "Unknown extraction failure";
              const isQuotaExceeded = 
                errorMessageText.toLowerCase().includes("quota") ||
                errorMessageText.toLowerCase().includes("429") ||
                errorMessageText.toLowerCase().includes("resource_exhausted") ||
                errorMessageText.toLowerCase().includes("rate limit");
              
              return (
                <div key={inv.id} className="bg-[#FFADAD] border-3 border-black p-6 rounded-3xl space-y-4 relative overflow-hidden text-left shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <div className="absolute -top-3 left-6 uphoria-tape">PARSE ERROR SUMMARY</div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                    <div className="space-y-1">
                      <span className={`text-[10px] font-black border-2 border-black px-2.5 py-0.5 uppercase tracking-wider rounded-full inline-block ${
                        isQuotaExceeded 
                          ? "bg-[#FFF275] text-black" 
                          : "bg-white text-black"
                      }`}>
                        {isQuotaExceeded ? "⚠️ LIMIT EXCEEDED" : "❌ EXTRACTION VOID"}
                      </span>
                      <h4 className="text-xs font-bold text-black mt-1">
                        Source File: <span className="font-mono text-black font-extrabold underline">{inv.fileName}</span>
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateInvoiceRows(invoices.filter(item => item.id !== inv.id))}
                      className="uphoria-btn-white text-xs px-3.5 py-1.5"
                    >
                      Dismiss Incident
                    </button>
                  </div>

                  <div className="bg-white rounded-xl p-3.5 border-2 border-black font-mono text-[11px] text-black leading-relaxed max-h-36 overflow-y-auto break-words select-all text-left font-bold">
                    {errorMessageText}
                  </div>

                  <div className="text-xs bg-white/40 border-2 border-black p-4 rounded-xl text-black space-y-2 leading-relaxed text-left">
                    <p className="font-black flex items-center gap-1.5 uppercase tracking-wider">
                      💡 Diagnostic guidelines:
                    </p>
                    {isQuotaExceeded ? (
                      <div className="space-y-1.5 font-bold">
                        <p>
                          Your Google AI Studio <strong>Free Tier</strong> has temporary request rate limits.
                        </p>
                        <p className="text-xs">
                          💡 Wait a few seconds for the rate limits of your Gemini API key to reset automatically, then click "Process Invoices" again.
                        </p>
                      </div>
                    ) : (
                      <p className="font-bold">
                        Ensure documents are unencrypted, readable PDFs or clear images. HEIC/PNG formats must be well lit without heavy glares.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Extracted Data Ledger Cards */}
      {stats.invoiceCount > 0 ? (
        <div className="w-full bg-white border-3 border-black p-6 rounded-3xl relative shadow-[6px_6px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 left-6 uphoria-tape text-xs">LEDGER JOURNAL</div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b-2 border-black/15 mt-1.5">
            <div className="text-left font-sans">
              <h2 className="text-lg font-black text-black flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-black" />
                Ledger Data Review
              </h2>
              <p className="text-xs text-stone-700 font-bold mt-0.5">
                Review verified invoice sections, tune values manually, or append rows on-the-fly.
              </p>
            </div>

            {/* Document level selection filters */}
            <div className="flex items-center gap-2.5 w-full md:w-auto font-sans font-bold">
              <label htmlFor="invoice-select" className="text-xs font-bold text-stone-850 whitespace-nowrap">Filter Desk:</label>
              <select
                id="invoice-select"
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                className="flex-1 md:flex-none text-xs bg-white hover:bg-stone-50 border-2 border-black focus:border-black rounded-xl p-2.5 font-black text-black focus:outline-none cursor-pointer transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)]"
              >
                <option value="all">Workspace Total ({stats.invoiceCount} Invoices)</option>
                {invoices.filter(i => i.status === 'success').map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    📄 {inv.supplierName.substring(0, 20)}... ({inv.invoiceNo || "N/A"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Render active group details */}
          <div className="space-y-10 mt-8">
            {activeInvoices.map((inv) => (
              <div key={inv.id} className="bg-stone-50 border-2 border-black p-5 rounded-2xl space-y-5 shadow-[2px_2px_0px_rgba(0,0,0,1)] relative">
                
                {/* Header Level Data Editor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 border-2 border-black rounded-xl shadow-inner text-black">
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest block font-sans">Vendor Name</span>
                      <ConfidenceBadge score={inv.confidence.supplierName} />
                    </div>
                    <input
                      type="text"
                      value={inv.supplierName}
                      onChange={(e) => handleHeaderChange(inv.id, "supplierName", e.target.value)}
                      className={`w-full text-xs font-bold px-3 py-2 text-black border-2 border-black focus:outline-none rounded-xl transition-all ${
                        lowConfidenceCheck(inv.confidence.supplierName) 
                          ? "bg-[#FFF9A6] focus:ring-1 focus:ring-black" 
                          : "bg-white hover:bg-stone-50 focus:bg-[#CAFFBF]/10"
                      }`}
                      placeholder="Vendor corporate identity"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest block font-sans">Invoice Number</span>
                      <ConfidenceBadge score={inv.confidence.invoiceNo} />
                    </div>
                    <input
                      type="text"
                      value={inv.invoiceNo}
                      onChange={(e) => handleHeaderChange(inv.id, "invoiceNo", e.target.value)}
                      className={`w-full text-xs font-mono font-bold px-3 py-2 text-black border-2 border-black focus:outline-none rounded-xl transition-all ${
                        lowConfidenceCheck(inv.confidence.invoiceNo) 
                          ? "bg-[#FFF9A6] focus:ring-1 focus:ring-black" 
                          : "bg-white hover:bg-stone-50 focus:bg-[#CAFFBF]/10"
                      }`}
                      placeholder="Invoice ID"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest block font-sans">Ledger Date</span>
                      <ConfidenceBadge score={inv.confidence.invoiceDate} />
                    </div>
                    <input
                      type="text"
                      value={inv.invoiceDate}
                      onChange={(e) => handleHeaderChange(inv.id, "invoiceDate", e.target.value)}
                      className={`w-full text-xs font-bold px-3 py-2 text-black border-2 border-black focus:outline-none rounded-xl transition-all ${
                        lowConfidenceCheck(inv.confidence.invoiceDate) 
                          ? "bg-[#FFF9A6] focus:ring-1 focus:ring-black" 
                          : "bg-white hover:bg-stone-50 focus:bg-[#CAFFBF]/10"
                      }`}
                      placeholder="DD-MMM-YY"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest block font-sans">GSTIN Registrant</span>
                      <ConfidenceBadge score={inv.confidence.gstin} />
                    </div>
                    <input
                      type="text"
                      value={inv.gstin}
                      onChange={(e) => handleHeaderChange(inv.id, "gstin", e.target.value)}
                      className={`w-full text-xs font-mono font-bold uppercase px-3 py-2 text-black border-2 border-black focus:outline-none rounded-xl transition-all ${
                        lowConfidenceCheck(inv.confidence.gstin) 
                          ? "bg-[#FFF9A6] focus:ring-1 focus:ring-black" 
                          : "bg-white hover:bg-stone-50 focus:bg-[#CAFFBF]/10"
                      }`}
                      placeholder="GST reference key"
                    />
                  </div>
                </div>

                {/* Line items Table review interface */}
                <div className="overflow-x-auto border-2 border-black bg-white rounded-xl shadow-inner scrollbar-thin">
                  <table className="min-w-full divide-y-2 divide-black text-left text-xs text-black">
                    <thead className="bg-[#CAFFBF]/30 text-[10px] uppercase font-black text-black border-b-2 border-black">
                      <tr>
                        <th scope="col" className="px-3 py-3.5 font-black text-left">Line Item Description Details</th>
                        <th scope="col" className="px-3 py-3.5 font-black text-center w-20">Quantity</th>
                        <th scope="col" className="px-3 py-3.5 font-black text-center w-16">UoM</th>
                        <th scope="col" className="px-3 py-3.5 font-black text-center w-24">HSN Code</th>
                        <th scope="col" className="px-3 py-3.5 font-black text-center w-20">Tax Rate</th>
                        <th scope="col" className="px-3 py-3.5 font-black text-right w-24">Rate (₹)</th>
                        <th scope="col" className="px-3 py-3.5 font-black text-right w-24">Base (₹)</th>
                        <th scope="col" className="px-3 py-3.5 font-black text-right w-24">GST (₹)</th>
                        <th scope="col" className="px-3 py-3.5 font-black text-right w-28">Total (₹)</th>
                        <th scope="col" className="py-3.5 pr-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/15 font-bold font-sans text-stone-900">
                      {inv.lineItems.map((line) => (
                        <tr key={line.id} className="hover:bg-[#FFF275]/10 transition-all">
                          {/* Item Name */}
                          <td className={`px-2 py-2 ${lowConfidenceCheck(line.confidenceName) ? "bg-[#FFF9A6]/30" : ""}`}>
                            <input
                              type="text"
                              value={line.itemName}
                              onChange={(e) => handleCellChange(inv.id, line.id, "itemName", e.target.value)}
                              className="w-full text-xs font-black px-2 py-1.5 bg-transparent hover:bg-stone-100 focus:bg-[#CAFFBF]/10 border-2 border-transparent hover:border-black/20 focus:border-black text-black transition-all rounded focus:outline-none"
                              title={`Confidence: ${line.confidenceName}%`}
                            />
                          </td>

                          {/* Quantity */}
                          <td className={`px-2 py-2 text-center ${lowConfidenceCheck(line.confidenceQuantity) ? "bg-[#FFF9A6]/30" : ""}`}>
                            <input
                              type="number"
                              step="any"
                              value={line.quantity}
                              onChange={(e) => handleCellChange(inv.id, line.id, "quantity", e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full text-xs text-center font-mono font-bold px-1 py-1.5 bg-transparent hover:bg-stone-100 focus:bg-[#CAFFBF]/10 border-2 border-transparent hover:border-black/20 focus:border-black text-black rounded focus:outline-none"
                            />
                          </td>

                          {/* UOM */}
                          <td className="px-2 py-2 text-center">
                            <input
                              type="text"
                              value={line.inventoryUom}
                              onChange={(e) => handleCellChange(inv.id, line.id, "inventoryUom", e.target.value)}
                              className="w-full text-xs text-center uppercase px-1 py-1.5 bg-transparent hover:bg-stone-100 focus:bg-[#CAFFBF]/10 border-2 border-transparent hover:border-black/20 focus:border-black text-black rounded focus:outline-none"
                            />
                          </td>

                          {/* HSN CODE */}
                          <td className="px-2 py-2 text-center">
                            <input
                              type="text"
                              value={line.hsnCode}
                              onChange={(e) => handleCellChange(inv.id, line.id, "hsnCode", e.target.value)}
                              className="w-full text-xs font-mono font-bold text-center px-1 py-1.5 bg-transparent hover:bg-stone-100 focus:bg-[#CAFFBF]/10 border-2 border-transparent hover:border-black/20 focus:border-black text-black rounded focus:outline-none"
                            />
                          </td>

                          {/* Tax Rate */}
                          <td className="px-2 py-2 text-center">
                            <select
                              value={line.uTaxRate}
                              onChange={(e) => handleCellChange(inv.id, line.id, "uTaxRate", e.target.value)}
                              className="text-xs text-center rounded bg-white py-1 px-1.5 border-2 border-black text-black font-black cursor-pointer"
                            >
                              <option value="18%">18%</option>
                              <option value="12%">12%</option>
                              <option value="28%">28%</option>
                              <option value="5%">5%</option>
                              <option value="0%">0%</option>
                            </select>
                          </td>

                          {/* Rate */}
                          <td className={`px-2 py-2 text-right ${lowConfidenceCheck(line.confidenceRate) ? "bg-[#FFF9A6]/30" : ""}`}>
                            <input
                              type="number"
                              step="any"
                              value={line.rate}
                              onChange={(e) => handleCellChange(inv.id, line.id, "rate", e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full text-xs text-right font-mono font-bold px-1 py-1.5 bg-transparent hover:bg-stone-100 focus:bg-[#CAFFBF]/10 border-2 border-transparent hover:border-black/20 focus:border-black text-black rounded focus:outline-none"
                            />
                          </td>

                          {/* Amount */}
                          <td className="px-3 py-2 text-right font-mono text-stone-750 font-bold">
                            ₹{line.amount.toFixed(2)}
                          </td>

                          {/* GST */}
                          <td className="px-3 py-2 text-right font-mono text-stone-750 font-bold">
                            ₹{line.gstAmount.toFixed(2)}
                          </td>

                          {/* Total Amount */}
                          <td className={`px-3 py-2 text-right font-mono font-black text-black ${lowConfidenceCheck(line.confidenceTotalAmount) ? "bg-[#FFF9A6]/40" : ""}`}>
                            ₹{line.totalAmount.toFixed(2)}
                          </td>

                          {/* Delete item */}
                          <td className="py-2 pr-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(inv.id, line.id)}
                              className="p-1.5 border border-black bg-white hover:bg-[#FFADAD] text-black rounded-lg transition-all cursor-pointer inline-flex items-center justify-center shadow-[1px_1px_rgba(0,0,0,1)] hover:translate-y-[-0.5px]"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Empty state representing zero lines */}
                  {inv.lineItems.length === 0 && (
                    <div className="text-center py-8 text-stone-705 italic text-sm font-bold bg-stone-100 border-t-2 border-black">
                      No line items inside this invoice. Click "Add Row" below to append manually.
                    </div>
                  )}
                </div>

                {/* Helper tools to add items manually if OCR missed something */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 font-sans font-bold">
                  <button
                    type="button"
                    onClick={() => handleAddManualRow(inv.id)}
                    className="uphoria-btn-green inline-flex items-center gap-1.5 px-4.5 py-1.5 text-xs rounded-full"
                  >
                    <Plus className="w-3.5 h-3.5 text-black" />
                    <span>Add Manual Line Row</span>
                  </button>
                  
                  <span className="text-[11px] text-stone-800 font-bold font-mono">
                    File: <span className="underline">{inv.fileName}</span>
                  </span>
                </div>

              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
