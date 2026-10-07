import React, { useState, useEffect } from "react";
import { 
  Smartphone, 
  Camera, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Files, 
  Check, 
  Wifi, 
  WifiOff, 
  Clock 
} from "lucide-react";

interface MobileScannerViewProps {
  initialCode: string;
}

// Client-side image compressor utility to reduce massive megapixel phone camera snaps down to highly optimized ~350KB images.
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    // If not an image (e.g., PDF), proceed with the raw file directly
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
        const maxDimension = 1600; // Optimal 1600px width is perfect for reading text details

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

export function MobileScannerView({ initialCode }: MobileScannerViewProps) {
  const [code, setCode] = useState(initialCode);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States for interactive mobile success upload popups
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupSupplier, setPopupSupplier] = useState("");
  const [popupCount, setPopupCount] = useState(0);
  
  // Presence monitoring state
  const [presenceStatus, setPresenceStatus] = useState<"checking" | "active" | "idle" | "expired">("checking");
  
  const [scannedList, setScannedList] = useState<Array<{
    id: string;
    fileName: string;
    supplier: string;
    timestamp: string;
    isSuccess: boolean;
  }>>([]);

  // Monitor desktop user presence
  useEffect(() => {
    if (!code || code.length < 6) {
      setPresenceStatus("idle");
      return;
    }

    const checkPresence = async () => {
      try {
        const res = await fetch(`/api/sync/presence/${code}?role=phone`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "expired") {
            setPresenceStatus("expired");
          } else if (data.active) {
            setPresenceStatus("active");
          } else {
            setPresenceStatus("idle");
          }
        } else {
          setPresenceStatus("idle");
        }
      } catch (err) {
        console.warn("Could not check desktop user presence status:", err);
      }
    };

    // Check presence
    checkPresence();
    const intervalId = setInterval(checkPresence, 3000);
    return () => clearInterval(intervalId);
  }, [code]);

  // Handle selected files
  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !code) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const files = Array.from(fileList);
    let successCount = 0;
    let failCount = 0;
    let latestExtractedSupplier = "";
    let latestErrorMessage = "";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const countLabel = files.length > 1 ? ` (${i + 1} of ${files.length})` : "";
      
      try {
        if (file.type.startsWith("image/")) {
          setUploadStatus(`Minifying scans ${countLabel}...`);
          const compressedBlob = await compressImage(file);
          const uploadSizeKb = Math.round(compressedBlob.size / 1024);
          
          setUploadStatus(`Uploading scan (${uploadSizeKb} KB) ${countLabel}...`);
          
          const formData = new FormData();
          formData.append("file", compressedBlob, file.name || "mobile_snap.jpg");
          formData.append("syncCode", code);

          const res = await fetch("/api/sync/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server extraction failed for file: ${file.name}`);
          }

          const data = await res.json();
          successCount++;
          latestExtractedSupplier = data.supplier || "Scanned Invoice";

          setScannedList(prev => [
            {
              id: Math.random().toString(),
              fileName: file.name,
              supplier: data.supplier || "Detected Invoice",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSuccess: true,
            },
            ...prev
          ]);
        } else {
          setUploadStatus(`Uploading raw files ${countLabel}...`);
          const formData = new FormData();
          formData.append("file", file, file.name);
          formData.append("syncCode", code);

          const res = await fetch("/api/sync/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server OCR extraction failed for file: ${file.name}`);
          }

          const data = await res.json();
          successCount++;
          latestExtractedSupplier = data.supplier || "Scanned PDF Document";

          setScannedList(prev => [
            {
              id: Math.random().toString(),
              fileName: file.name,
              supplier: data.supplier || "Detected PDF",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSuccess: true,
            },
            ...prev
          ]);
        }
      } catch (err: any) {
        console.error(err);
        failCount++;
        latestErrorMessage = err.message || "Failed to parse files. Make sure text is clearly visible.";

        setScannedList(prev => [
          {
            id: Math.random().toString(),
            fileName: file.name,
            supplier: "OCR Failure",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSuccess: false,
          },
          ...prev
        ]);
      }
    }

    if (successCount > 0 && failCount === 0) {
      if (successCount === 1) {
        setSuccessMsg(`Success! Saved "${latestExtractedSupplier}" into desktop active board.`);
      } else {
        setSuccessMsg(`Successfully processed and streamed ${successCount} invoices!`);
      }
      setPopupSupplier(latestExtractedSupplier || "Detected Invoice");
      setPopupCount(successCount);
      setShowSuccessPopup(true);
    } else if (successCount > 0 && failCount > 0) {
      setSuccessMsg(`Processed ${successCount}, failed ${failCount}.`);
      setErrorMsg(`Error: ${latestErrorMessage}`);
      setPopupSupplier(latestExtractedSupplier || "Partially Synced file");
      setPopupCount(successCount);
      setShowSuccessPopup(true);
    } else if (failCount > 0) {
      setErrorMsg(`Extraction failed: ${latestErrorMessage}`);
    }

    setIsUploading(false);
    setUploadStatus("");
  };

  return (
    <div className="min-h-screen uphoria-bg text-black font-sans flex flex-col p-5 select-none justify-center">
      <div className="max-w-md w-full mx-auto flex flex-col justify-between py-6 space-y-6 flex-1">
        
        {/* Header Branding */}
        <div className="text-center space-y-2 relative">
          <div className="inline-flex p-3 bg-white border-2 border-black rounded-2xl shadow-[2px_2px_0px_rgba(0,0,0,1)] text-black">
            <Smartphone className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-black mt-3">MOBILE SCAN SYNC</h2>
          <p className="text-xs font-semibold text-stone-700">
            Digitize paper invoices and stream raw lines into your active desktop board.
          </p>
        </div>

        {/* Sync Connection Status Display */}
        <div className="bg-white border-3 border-black p-5 rounded-3xl space-y-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] text-left relative">
          <div className="absolute -top-3 left-6 uphoria-tape text-xs">MOBILE LINK</div>
          <div className="flex items-center justify-between mt-2 font-bold">
            <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest font-mono">Sync Channel</span>
            
            {presenceStatus === "active" && (
              <span className="flex items-center gap-1.5 text-xs text-black font-black bg-[#CAFFBF] border-2 border-black px-2.5 py-0.5 rounded-full">
                <Wifi className="w-3.5 h-3.5 animate-pulse" />
                Linked
              </span>
            )}
            
            {presenceStatus === "idle" && (
              <span className="flex items-center gap-1.5 text-xs text-black font-black bg-[#FFF275] border-2 border-black px-2.5 py-0.5 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                Standby
              </span>
            )}

            {presenceStatus === "expired" && (
              <span className="flex items-center gap-1.5 text-xs text-black font-black bg-[#FFADAD] border-2 border-black px-2.5 py-0.5 rounded-full">
                <WifiOff className="w-3.5 h-3.5" />
                Expired
              </span>
            )}

            {presenceStatus === "checking" && (
              <span className="flex items-center gap-1 text-xs text-black font-black font-mono">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Verifying...
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-left font-sans font-bold">
            <label htmlFor="sync-code-input" className="text-xs font-black text-black uppercase tracking-widest block font-mono">Active sync room code:</label>
            <input 
              id="sync-code-input"
              type="text" 
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-stone-50 border-2 border-black rounded-xl p-3 text-lg font-mono font-black text-center tracking-widest text-[#00F0FF] focus:outline-none"
              placeholder="000 000"
            />
          </div>

          {presenceStatus === "idle" && (
            <p className="text-[10px] text-amber-850 text-center leading-normal font-bold">
              ⚠️ Connection standby. Verify your laptop displays the active Sync QR.
            </p>
          )}

          {presenceStatus === "expired" && (
            <p className="text-[10px] text-rose-850 text-center leading-normal font-black">
              ❌ Sync expired. Reload your desktop browser to generate a fresh room code.
            </p>
          )}
        </div>

        {/* Dual Actions Controller */}
        <div className="space-y-3.5 text-left font-bold text-black select-none">
          <div className="grid grid-cols-1 gap-4">
            
            {/* Input 1: Single Photo Snapper */}
            <label className="relative block w-full text-left">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={(e) => handleFilesSelected(e.target.files)}
                disabled={isUploading || !code || presenceStatus === "expired"}
                className="hidden"
              />
              <div className={`w-full py-5 px-4 border-3 rounded-3xl flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer ${
                isUploading 
                  ? "bg-stone-150 border-stone-400 text-stone-500 cursor-not-allowed opacity-50" 
                  : "bg-[#CAFFBF] border-black hover:translate-y-[1px] active:translate-y-[2px] text-black shadow-[3px_3px_0px_rgba(0,0,0,1)]"
              }`}>
                {isUploading ? (
                  <>
                    <RefreshCw className="w-8 h-8 text-black animate-spin" />
                    <div className="text-center font-sans font-bold">
                      <span className="text-sm block text-black">{uploadStatus || "Processing scans..."}</span>
                      <span className="text-[10.5px] text-stone-700 mt-0.5 block">Parsing fields via Gemini OCR</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-black" />
                    <div className="text-center font-sans">
                      <span className="text-xs font-black block tracking-tight uppercase text-black">📸 Take Snap Photo</span>
                      <span className="text-[10px] text-stone-800 font-bold mt-0.5 block">Fast capture page and sync automatically</span>
                    </div>
                  </>
                )}
              </div>
            </label>

            {/* Input 2: Multiple Files Batch Uploader */}
            <label className="relative block w-full text-left">
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                multiple
                onChange={(e) => handleFilesSelected(e.target.files)}
                disabled={isUploading || !code || presenceStatus === "expired"}
                className="hidden"
              />
              <div className={`w-full py-4 px-4 border-2 rounded-2xl flex items-center justify-center gap-3 transition-all cursor-pointer ${
                isUploading 
                  ? "bg-stone-50 border-transparent text-stone-400 cursor-not-allowed opacity-50" 
                  : "bg-white hover:bg-stone-100 border-black text-black active:translate-y-[1px] shadow-[2px_2px_0px_rgba(0,0,0,1)]"
              }`}>
                {!isUploading && <Files className="w-5 h-5 text-black shrink-0" />}
                <div className="text-left font-sans font-bold">
                  <span className="text-[11px] block uppercase tracking-wide text-black">📁 Choose from file systems</span>
                  <span className="text-[9.5px] text-stone-600 block">Select pre-saved billing images or PDFs</span>
                </div>
              </div>
            </label>

          </div>

          {/* Feedback states */}
          {errorMsg && (
            <div className="bg-[#FFADAD] border-2 border-black p-3.5 text-xs text-black font-bold rounded-xl leading-relaxed text-center flex items-center justify-center gap-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] animate-fade-in">
              <AlertCircle className="w-4 h-4 text-black shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-[#CAFFBF] border-2 border-black p-3.5 text-xs text-black font-extrabold rounded-xl leading-relaxed text-center flex items-center justify-center gap-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Mobile History Pipeline */}
        <div className="flex-1 min-h-[120px] max-h-[160px] overflow-y-auto space-y-2 border-2 border-black p-4 bg-white text-left rounded-3xl shadow-[3px_3px_0px_rgba(0,0,0,1)] relative">
          <span className="text-[10px] font-black text-black uppercase tracking-wider block font-mono">Synced Despatch Log ({scannedList.length})</span>
          {scannedList.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[11px] text-stone-700 font-bold italic mt-4 font-sans">
              Linked documents will show up here.
            </div>
          ) : (
            <div className="space-y-2 pt-1.5 text-left">
              {scannedList.map(item => (
                <div key={item.id} className="bg-stone-50 p-2.5 border-2 border-black rounded-xl flex justify-between items-center text-xs shadow-[1.5px_1.5px_rgba(0,0,0,1)]">
                  <div className="truncate max-w-[210px] space-y-0.5 text-left">
                    <span className="font-extrabold block truncate text-black">
                      {item.supplier}
                    </span>
                    <span className="text-[9.5px] text-stone-500 font-mono font-bold block truncate">{item.fileName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-bold">
                    <span className="text-[10px] text-stone-605 font-mono">{item.timestamp}</span>
                    {item.isSuccess ? (
                      <Check className="w-3.5 h-3.5 text-black font-black border border-black rounded bg-[#CAFFBF] p-0.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-black font-black border border-black rounded bg-[#FFADAD] p-0.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions Footer */}
        <div className="bg-white border-2 border-black rounded-xl p-4 text-[10.5px] text-stone-800 font-bold leading-relaxed text-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          ✨ Mobile sync channel active. Scan snapshots to stream data instantly.
        </div>

      </div>

      {/* 5. Mobile Success Upload Popup Modal */}
      {showSuccessPopup && (
        <div id="mobile-success-popup-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in animate-duration-150">
          <div className="bg-[#FFF9A6] border-3 border-black max-w-xs w-full p-5 rounded-3xl shadow-[5px_5px_0px_rgba(0,0,0,1)] relative text-center space-y-4 animate-scale-in">
            <div className="absolute -top-3 left-6 uphoria-tape text-xs">TRANSMITTED</div>
            <div className="mx-auto w-12 h-12 bg-white border-2 border-black text-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <Check className="w-6 h-6 text-black" />
            </div>

            <div className="space-y-1 mt-2">
              <h3 className="font-black text-md text-black uppercase leading-tight">INVOICE STREAMED</h3>
              <p className="text-[10.5px] text-black font-bold leading-normal">
                Scan successful! The lines are live on your laptop desk.
              </p>
            </div>

            <div className="bg-white p-3 border-2 border-black text-left space-y-1 rounded-xl text-[10px] shadow-[2px_2px_0px_rgba(0,0,0,1)] font-sans">
              <div className="text-black font-black uppercase text-[8px] flex justify-between font-mono">
                <span>Verification Data</span>
                <span className="text-black underline">LIVE</span>
              </div>
              <div className="truncate text-black font-bold mt-1">
                Vendor: <span className="font-black">{popupSupplier}</span>
              </div>
              <div className="text-stone-700 font-bold font-mono">
                TRANSFERRED: {popupCount} INVOICES
              </div>
            </div>

            <button
              type="button"
              id="close-mobile-success"
              onClick={() => setShowSuccessPopup(false)}
              className="uphoria-btn-green w-full py-2.5 px-4 font-black text-xs"
            >
              Scan Another Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
