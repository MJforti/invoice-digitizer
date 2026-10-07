import React, { useState, useRef } from "react";
import { Upload, FileText, X, AlertCircle, Image as FileImage } from "lucide-react";
import { motion } from "motion/react";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  files: File[];
  onRemoveFile: (index: number) => void;
  isProcessing: boolean;
  progress: number;
}

export function UploadZone({
  onFilesSelected,
  files,
  onRemoveFile,
  isProcessing,
  progress,
}: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndAddFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    setErrorMessage(null);

    const validFiles: File[] = [];
    const MAX_SIZE = 200 * 1024 * 1024; // 200MB

    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const nameLower = file.name.toLowerCase();
      const isAllowedType = 
        file.type === "application/pdf" || 
        file.type.startsWith("image/") || 
        allowedExtensions.some(ext => nameLower.endsWith(ext));

      if (!isAllowedType) {
        setErrorMessage(`"${file.name}" is not a valid format. Please upload PDF files or images (JPG, PNG, WEBP, HEIC) only.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        setErrorMessage(`"${file.name}" exceeds the 200 MB limit. Please compress or optimize the file before uploading.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    validateAndAddFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndAddFiles(e.target.files);
  };

  const openFileDialog = () => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full bg-white p-5 rounded-3xl font-sans text-black relative">
      <input
        ref={fileInputRef}
        type="file"
        id="file-upload-input"
        className="hidden"
        multiple
        accept=".pdf,application/pdf,image/*,.heic,.heif"
        onChange={handleFileInput}
        disabled={isProcessing}
      />

      <div
        id="drop-zone-container"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`relative flex flex-col items-center justify-center border-3 border-dashed p-8 text-center cursor-pointer transition-all rounded-2xl ${
          isDragActive
            ? "border-black bg-[#CAFFBF] text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            : isProcessing
            ? "border-stone-300 bg-stone-100 text-stone-400 cursor-not-allowed"
            : "border-black hover:border-black text-stone-850 bg-stone-50 hover:bg-[#FFF275]/20 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[2px]"
        }`}
      >
        <div id="drop-zone-icon-container" className="p-3.5 bg-white border-2 border-black rounded-2xl mb-3.5 text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          <Upload className={`w-8 h-8 ${isDragActive ? "text-black animate-bounce" : "text-black"}`} />
        </div>
        <p className="font-extrabold text-sm text-black tracking-tight">
          Drag and drop invoice or receipt
        </p>
        <p className="text-stone-800 text-xs mt-1">
          or <span className="font-bold underline decoration-2 hover:text-[#00F0FF]">browse storage files</span>
        </p>
        <p className="text-stone-700 text-[10px] mt-2 font-mono font-bold">
          PDF, PNG, JPG, or HEIC up to 200MB
        </p>
      </div>

      {errorMessage && (
        <div id="upload-error-alert" className="mt-4 flex items-start gap-2.5 bg-[#FFADAD] border-2 border-black text-black p-3.5 text-xs rounded-2xl font-bold font-sans shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          <AlertCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selected file lists */}
      {files.length > 0 && (
        <div id="selected-files-summary" className="mt-6 border-t-2 border-black/10 pt-5">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="font-black text-xs tracking-wider text-black uppercase">
              Selected Files ({files.length})
            </h3>
            {!isProcessing && (
              <button
                type="button"
                id="clear-all-uploads"
                onClick={() => onRemoveFile(-1)}
                className="text-xs text-rose-600 hover:text-rose-805 font-bold uppercase tracking-wider cursor-pointer underline decoration-wavy"
              >
                Clear all
              </button>
            )}
          </div>

          <div id="files-grid-list" className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
            {files.map((file, index) => {
              const isImage = file.type.startsWith("image/") || 
                ![".pdf"].some(ext => file.name.toLowerCase().endsWith(ext));
              return (
                <div
                  key={`${file.name}-${index}`}
                  id={`file-item-${index}`}
                  className="flex items-center justify-between p-3 bg-stone-50 border-2 border-black text-stone-900 hover:bg-[#CAFFBF]/20 rounded-xl transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2 pb-0.5 animate-fade-in">
                    {isImage ? (
                      <FileImage className="w-4.5 h-4.5 text-black shrink-0" />
                    ) : (
                      <FileText className="w-4.5 h-4.5 text-black shrink-0" />
                    )}
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-bold text-black truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-stone-600 font-mono font-bold">
                        {formatSize(file.size)}
                      </p>
                    </div>
                  </div>
                  {!isProcessing && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(index);
                      }}
                      className="p-1 border border-black bg-white hover:bg-rose-100 rounded-lg transition-all cursor-pointer shadow-[1px_1px_0px_rgba(0,0,0,1)] hover:translate-y-[-0.5px]"
                    >
                      <X className="w-3.5 h-3.5 text-black" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload/Processing states */}
      {isProcessing && (
        <div id="invoice-processing-indicator" className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-black">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
              </span>
              Parsing invoice structure via Gemini AI...
            </span>
            <span className="font-mono font-black">{Math.round(progress)}%</span>
          </div>

          <div className="w-full bg-white border-3 border-black h-4.5 rounded-full overflow-hidden p-0.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut" }}
              className="bg-[#00F0FF] h-full rounded-full border-2 border-black"
            />
          </div>
          <p className="text-[10.5px] font-medium text-stone-800 text-center leading-relaxed">
            Extracting text, taxes, and amounts accurately. This will take a moment.
          </p>
        </div>
      )}
    </div>
  );
}
