'use client';

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Key, FileCode, CheckCircle, AlertTriangle, Lock, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const API_BASE_URL = "https://api.qtcq.xyz";

// Registered teams
const TEAMS = [
  "epsilon",
  "gamma",
  "delta",
  "lambda",
  "theta",
  "vega",
  "charm",
  "rho",
];

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

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
const classNames = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function StrategySubmission() {
  const [apiKey, setApiKey] = useState<string>("");
  const [teamId, setTeamId] = useState<string>("");
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
        setError("Please select a Python (.py) or ZIP (.zip) file");
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
        setError("Please select a Python (.py) or ZIP (.zip) file");
        setSelectedFile(null);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleSubmit = async () => {
    // Validation
    if (!apiKey.trim()) {
      setError("Please enter your API key");
      return;
    }
    if (!teamId.trim()) {
      setError("Please enter your team ID");
      return;
    }
    if (!selectedFile) {
      setError("Please select a Python strategy file");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Determine endpoint and form field based on file type
      const isZipFile = selectedFile.name.endsWith('.zip');
      const endpoint = isZipFile 
        ? `${API_BASE_URL}/api/v1/team/${teamId}/upload-strategy-package`
        : `${API_BASE_URL}/api/v1/team/${teamId}/upload-strategy`;
      
      const formData = new FormData();
      formData.append('key', apiKey);
      
      // Use correct form field name based on file type
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
        // Build success message with details
        let successMsg = data.message || "Strategy submitted successfully!";
        if (data.files_uploaded && data.files_uploaded.length > 0) {
          successMsg += ` Files: ${data.files_uploaded.join(', ')}`;
        }
        if (data.note) {
          successMsg += ` ${data.note}`;
        }
        
        setSuccess(successMsg);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        // Handle error response - check for detail field
        const errorMsg = (data as any).detail || data.message || "Failed to submit strategy";
        setError(errorMsg);
      }
    } catch (e: any) {
      setError(e?.message || "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const bodyBg = "bg-[#0a0a14]";
  const cardBg = "border-white/10 bg-white/[0.03] backdrop-blur-sm";

  return (
    <div className={classNames("min-h-screen w-full text-white py-12", bodyBg)}>
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center justify-center rounded-xl bg-violet-500/20 p-4 ring-1 ring-violet-400/20 mb-4">
            <FileCode className="size-12 text-violet-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-3">
            Submit Your Trading Strategy
          </h1>
          <p className="text-lg text-white/60">
            Upload your Python trading algorithm to compete in the QTC Alpha competition
          </p>
        </motion.div>

        {/* API Key Authentication */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={classNames("mb-6", cardBg)}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="size-5 text-amber-400" />
                <h2 className="text-xl font-semibold text-white">Authentication</h2>
              </div>
              
              <div className="space-y-4">
                {/* Team ID Selector */}
                <div>
                  <label htmlFor="teamId" className="block text-sm font-medium text-white mb-2">
                    Team ID
                  </label>
                  <div className="relative">
                    <select
                      id="teamId"
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    >
                      <option value="" className="bg-[#0a0a14] text-white/60">
                        Select your team
                      </option>
                      {TEAMS.map((team) => (
                        <option key={team} value={team} className="bg-[#0a0a14] text-white">
                          Team {team.charAt(0).toUpperCase() + team.slice(1)}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/40">
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/50">
                    Select your registered team from the dropdown
                  </p>
                </div>

                {/* API Key Input */}
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-white mb-2">
                    API Key
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/40" />
                    <input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your team's API key"
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/50">
                    Your API key is kept secure and only used for authentication. Contact admin if you don't have your key.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* File Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={classNames("mb-6", cardBg)}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="size-5 text-violet-400" />
                <h2 className="text-xl font-semibold text-white">Upload Strategy File</h2>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={classNames(
                  "relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer",
                  selectedFile
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-white/20 bg-white/5 hover:border-violet-500/50 hover:bg-violet-500/5"
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

                <div className="flex flex-col items-center justify-center text-center">
                  {selectedFile ? (
                    <>
                      <CheckCircle className="size-16 text-emerald-400 mb-4" />
                      <p className="text-lg font-medium text-white mb-2">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-white/60 mb-4">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                      <p className="text-xs text-white/50">
                        Click to change file
                      </p>
                    </>
                  ) : (
                    <>
                      <FileCode className="size-16 text-white/40 mb-4" />
                      <p className="text-lg font-medium text-white mb-2">
                        Drop your strategy file here
                      </p>
                      <p className="text-sm text-white/60 mb-4">
                        or click to browse
                      </p>
                      <p className="text-xs text-white/50">
                        Accepts .py (single file) or .zip (multi-file package)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* File Requirements */}
              <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-2">Requirements:</h3>
                <ul className="text-xs text-white/70 space-y-1">
                  <li>• Single file: Upload strategy.py directly</li>
                  <li>• Multi-file: ZIP package must contain strategy.py as entry point</li>
                  <li>• Allowed imports: numpy, pandas, scipy, math, statistics</li>
                  <li>• Security validation will be performed automatically</li>
                  <li>• Strategy will be loaded on the next trading cycle</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-400/10 p-4 text-emerald-200"
          >
            <CheckCircle className="mt-0.5 size-5 shrink-0" />
            <div>
              <div className="font-medium">{success}</div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-400/10 p-4 text-rose-200"
          >
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div>
              <div className="font-medium">{error}</div>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !apiKey || !teamId || !selectedFile}
            className={classNames(
              "w-full py-6 px-8 rounded-xl font-bold text-xl transition-all duration-200 flex items-center justify-center gap-3",
              isSubmitting || !apiKey || !teamId || !selectedFile
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 hover:shadow-lg hover:shadow-violet-500/50 hover:-translate-y-1 active:translate-y-0"
            )}
          >
            {isSubmitting ? (
              <>
                <div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Submitting Strategy...</span>
              </>
            ) : (
              <>
                <Send className="size-6" />
                <span>Submit Strategy</span>
              </>
            )}
          </button>
        </motion.div>

      </div>
    </div>
  );
}

