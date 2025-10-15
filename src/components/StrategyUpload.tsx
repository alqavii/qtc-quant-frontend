'use client';

import React, { useState, useRef } from "react";
import { Upload, FileCode, CheckCircle, AlertTriangle, Send, RefreshCw } from "lucide-react";

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const API_BASE_URL = "https://api.qtcq.xyz";

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------
interface SubmissionResponse {
  success: boolean;
  message: string;
  team_id?: string;
  files_uploaded?: string[];
  file_count?: number;
  path?: string;
  note?: string;
  validation?: {
    all_files_validated: boolean;
    security_checks_passed: boolean;
  };
}

interface Props {
  teamId: string;
  apiKey: string;
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
const classNames = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function StrategyUpload({ teamId, apiKey }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.py') || file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setError(null);
        setSuccess(null);
      } else {
        setError("INVALID FILE TYPE - ONLY .PY OR .ZIP ACCEPTED");
        setSelectedFile(null);
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (file.name.endsWith('.py') || file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setError(null);
        setSuccess(null);
      } else {
        setError("INVALID FILE TYPE - ONLY .PY OR .ZIP ACCEPTED");
        setSelectedFile(null);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("NO FILE SELECTED");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const isZipFile = selectedFile.name.endsWith('.zip');
      const endpoint = isZipFile 
        ? `${API_BASE_URL}/api/v1/team/${teamId}/upload-strategy-package`
        : `${API_BASE_URL}/api/v1/team/${teamId}/upload-strategy`;
      
      const formData = new FormData();
      formData.append('key', apiKey);
      
      if (isZipFile) {
        formData.append('strategy_zip', selectedFile);
      } else {
        formData.append('strategy_file', selectedFile);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        mode: 'cors',
      });

      const data: SubmissionResponse = await response.json();

      if (response.ok && data.success) {
        let successMsg = data.message || "STRATEGY UPLOADED SUCCESSFULLY";
        if (data.files_uploaded && data.files_uploaded.length > 0) {
          successMsg += ` | FILES: ${data.files_uploaded.join(', ')}`;
        }
        if (data.note) {
          successMsg += ` | ${data.note}`;
        }
        
        setSuccess(successMsg.toUpperCase());
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const errorMsg = (data as any).detail || data.message || "UPLOAD FAILED";
        setError(errorMsg.toUpperCase());
      }
    } catch (e: any) {
      setError((e?.message || "NETWORK ERROR").toUpperCase());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#000000] border border-[#333333] flex flex-col">
      {/* Header */}
      <div className="border-b border-[#333333] bg-[#0A0A0A] px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-[#00A0E8]"></div>
          <h2 className="text-xs font-bold text-[#00A0E8] uppercase tracking-wider">STRATEGY UPLOAD</h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-2">
        <div className="grid grid-cols-12 gap-2">
          
          {/* File Upload Area (8 columns) */}
          <div className="col-span-8 border border-[#333333] bg-[#0A0A0A] p-2">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={classNames(
                "relative border-2 border-dashed h-full min-h-[120px] transition-all cursor-pointer flex items-center justify-center",
                selectedFile
                  ? "border-[#00C805] bg-[#00C805]/5"
                  : "border-[#333333] bg-[#000000] hover:border-[#00A0E8] hover:bg-[#00A0E8]/5"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".py,.zip"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center text-center p-4">
                {selectedFile ? (
                  <>
                    <CheckCircle className="size-8 text-[#00C805] mb-2" />
                    <p className="text-xs font-mono text-[#CCCCCC] mb-1">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-[#808080] font-mono">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <FileCode className="size-8 text-[#808080] mb-2" />
                    <p className="text-xs font-mono text-[#CCCCCC] mb-1">
                      DROP FILE OR CLICK TO BROWSE
                    </p>
                    <p className="text-[10px] text-[#808080] font-mono">
                      .PY (SINGLE) OR .ZIP (PACKAGE)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Requirements & Submit (4 columns) */}
          <div className="col-span-4 space-y-2">
            {/* Requirements */}
            <div className="border border-[#333333] bg-[#0A0A0A] p-2">
              <div className="text-[10px] text-[#808080] uppercase tracking-wider mb-1">REQUIREMENTS</div>
              <ul className="text-[9px] text-[#CCCCCC] font-mono space-y-0.5">
                <li>• ENTRY: STRATEGY.PY</li>
                <li>• AUTO VALIDATION</li>
                <li>• NEXT CYCLE LOAD</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedFile}
              className={classNames(
                "w-full border px-3 py-2 transition-all flex items-center justify-center gap-2",
                isSubmitting || !selectedFile
                  ? "border-[#333333] bg-[#1A1A1A] text-[#808080] cursor-not-allowed"
                  : "border-[#00A0E8] bg-[#00A0E8] text-[#000000] hover:bg-[#00B8FF] font-bold"
              )}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="size-3 animate-spin" />
                  <span className="text-[10px] uppercase tracking-wider font-mono">UPLOADING...</span>
                </>
              ) : (
                <>
                  <Send className="size-3" />
                  <span className="text-[10px] uppercase tracking-wider font-mono">SUBMIT STRATEGY</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="border-t border-[#00C805] bg-[#00C805]/10 px-2 py-1">
          <div className="flex items-start gap-2">
            <CheckCircle className="size-3 shrink-0 text-[#00C805]" />
            <div className="text-[10px] text-[#00C805] uppercase tracking-wider font-mono">{success}</div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="border-t border-[#FF0000] bg-[#FF0000]/10 px-2 py-1">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-3 shrink-0 text-[#FF0000]" />
            <div className="text-[10px] text-[#FF0000] uppercase tracking-wider font-mono">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
