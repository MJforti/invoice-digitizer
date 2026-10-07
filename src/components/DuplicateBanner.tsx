import React from "react";
import { AlertTriangle, Eye } from "lucide-react";

interface DuplicateBannerProps {
  duplicatesList: {
    invoiceNo: string;
    existingId: string;
    newId: string;
    fileName: string;
    supplierName: string;
    fileUrl?: string;
  }[];
  onResolveDuplicate: (invoiceNo: string, action: 'skip' | 'overwrite' | 'keepBoth') => void;
  onViewFile?: (url: string, name: string) => void;
}

export function DuplicateBanner({ duplicatesList, onResolveDuplicate, onViewFile }: DuplicateBannerProps) {
  if (duplicatesList.length === 0) return null;

  return (
    <div className="w-full bg-[#FFF9A6] border-3 border-black p-5 mb-8 text-left font-sans rounded-3xl shadow-[4px_4px_0px_rgba(0,0,0,1)] relative">
      <div className="absolute -top-3 left-6 uphoria-tape text-xs">DUPLICATION CONFLICTS</div>
      <div className="flex items-start gap-4 mt-1.5">
        <div id="duplicate-warning-icon" className="p-2.5 bg-white border-2 border-black text-black rounded-2xl shrink-0 shadow-[2px_2px_ypx_rgba(0,0,0,1)]">
          <AlertTriangle className="w-5 h-5 text-black" />
        </div>
        <div className="space-y-1.5 min-w-0 flex-1">
          <h3 className="text-sm font-black text-black uppercase tracking-wider leading-tight">
            Duplicate Invoice Code Detected ({duplicatesList.length})
          </h3>
          <p className="text-xs text-stone-900 font-bold">
            One or more of the uploaded files contain invoice reference numbers matching documents already in this workspace. Please select a reconciliation option:
          </p>

          <div className="space-y-3.5 mt-4 max-h-40 overflow-y-auto pr-1">
            {duplicatesList.map((dup) => (
              <div 
                key={dup.invoiceNo} 
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border-2 border-black p-3.5 rounded-2xl text-xs gap-3 font-sans shadow-[2px_2px_0px_rgba(0,0,0,1)]"
              >
                <div className="min-w-0 text-left">
                  <span className="font-mono bg-[#FFF275] border-2 border-black px-2 py-0.5 rounded font-black text-black text-[10px] sm:text-xs">
                    INVOICE NO: {dup.invoiceNo}
                  </span>
                  <span className="text-black font-bold ml-2 text-[11px] truncate block sm:inline">
                    ({dup.supplierName} — <span className="font-semibold underline text-stone-700">{dup.fileName}</span>)
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto font-sans">
                  {dup.fileUrl && onViewFile && (
                    <button
                      type="button"
                      onClick={() => onViewFile(dup.fileUrl!, dup.fileName)}
                      className="px-3 py-1 bg-[#9BF6FF] border-2 border-black hover:bg-[#9BF6FF]/80 text-black font-black text-xs rounded-xl shadow-[1.5px_1.5px_rgba(0,0,0,1)] hover:translate-y-[-0.5px] cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-black shrink-0" />
                      View File
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onResolveDuplicate(dup.invoiceNo, 'skip')}
                    className="px-3 py-1 bg-white border-2 border-black hover:bg-stone-50 text-black font-bold text-xs rounded-xl shadow-[1px_1px_rgba(0,0,0,1)] hover:translate-y-[-0.5px] cursor-pointer"
                  >
                    Discard New
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolveDuplicate(dup.invoiceNo, 'overwrite')}
                    className="px-3 py-1 bg-[#CAFFBF] border-2 border-black hover:bg-[#CAFFBF]/80 text-black font-black text-xs rounded-xl shadow-[1.5px_1.5px_rgba(0,0,0,1)] hover:translate-y-[-0.5px] cursor-pointer"
                  >
                    Replace Old
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolveDuplicate(dup.invoiceNo, 'keepBoth')}
                    className="px-3 py-1 bg-white border-2 border-black hover:bg-stone-50 text-stone-800 font-bold text-xs rounded-xl shadow-[1px_1px_rgba(0,0,0,1)] hover:translate-y-[-0.5px] cursor-pointer"
                  >
                    Keep Both
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
