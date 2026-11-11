'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { UploadResponse } from '@/lib/types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCandidateSelected?: (candidateId: string) => void;
  onUploadSuccess?: () => void;
}

export default function UploadModal({
  isOpen,
  onClose,
  onCandidateSelected,
  onUploadSuccess,
}: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [autoProcess, setAutoProcess] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      return 'Only PDF and DOCX documents are supported.';
    }
    const maxSizeBytes = 15 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return 'File size exceeds maximum 15MB limit.';
    }
    return null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
        setUploadError(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
        setUploadError(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const res = await api.uploadResume(selectedFile, autoProcess);
      setUploadResult(res);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload and process resume.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setUploadError(null);
    setUploadResult(null);
    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-xl border border-[#1f1f28] bg-[#0d0d11] p-6 shadow-2xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f1f28]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#FF5729]/15 flex items-center justify-center text-[#FF5729]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white">Upload Candidate Resume</h3>
          </div>
          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="text-[#8B8D98] hover:text-white p-1 rounded-md hover:bg-[#14141a] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {!uploadResult ? (
          <div className="mt-4 space-y-4">
            {/* Dropzone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all ${
                dragActive
                  ? 'border-[#FF5729] bg-[#FF5729]/5'
                  : selectedFile
                  ? 'border-emerald-500/50 bg-[#08120d]'
                  : 'border-[#1f1f28] hover:border-[#3d3d4e] bg-[#0a0a0e]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-white truncate max-w-xs">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-[#8B8D98]">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose different file
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#14141a] text-[#8B8D98] flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm text-white font-medium">
                    Drag and drop resume here, or <span className="text-[#FF5729]">browse</span>
                  </p>
                  <p className="text-xs text-[#8B8D98]">
                    Supported formats: PDF, DOCX (Max 15MB)
                  </p>
                </div>
              )}
            </div>

            {/* Auto-process option */}
            <div className="flex items-center gap-3 p-3 rounded-md bg-[#0a0a0e] border border-[#1f1f28]">
              <input
                id="autoProcess"
                type="checkbox"
                checked={autoProcess}
                onChange={(e) => setAutoProcess(e.target.checked)}
                className="rounded border-[#272733] bg-[#14141a] text-[#FF5729] focus:ring-[#FF5729]/20"
              />
              <label htmlFor="autoProcess" className="text-xs text-[#B0B3BE] cursor-pointer">
                <span className="font-medium text-white block">Immediate AI Processing</span>
                Automatically extract structured profile and evaluate against LCA and UI/UX roles.
              </label>
            </div>

            {/* Error Banner */}
            {uploadError && (
              <div className="p-3 rounded-md bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-start gap-2">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{uploadError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetState();
                  onClose();
                }}
                disabled={isUploading}
                className="px-4 py-2 rounded-md border border-[#1f1f28] text-sm text-[#8B8D98] hover:text-white hover:bg-[#14141a] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="px-4 py-2 rounded-md bg-[#FF5729] hover:bg-[#E0481D] disabled:opacity-50 text-white text-sm font-medium transition-all flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{autoProcess ? 'Processing Pipeline...' : 'Uploading...'}</span>
                  </>
                ) : (
                  <span>Upload & Ingest</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Result Card */
          <div className="mt-4 space-y-4">
            <div
              className={`p-4 rounded-lg border ${
                uploadResult.is_duplicate
                  ? 'border-amber-500/30 bg-amber-950/20 text-amber-200'
                  : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {uploadResult.is_duplicate ? 'Existing Candidate Found' : 'Resume Successfully Ingested'}
                </span>
              </div>
              <p className="text-xs text-[#B0B3BE] mt-1">{uploadResult.message}</p>
              <div className="mt-3 p-3 rounded bg-[#0a0a0e] border border-[#1f1f28] text-xs font-mono text-[#F4F4F6] space-y-1">
                <div>Candidate Code: <span className="text-[#FF5729] font-bold">{uploadResult.candidate_code}</span></div>
                <div>Status: <span className="text-emerald-400">{uploadResult.processing_status}</span></div>
                <div className="text-[10px] text-[#8B8D98] truncate">SHA-256: {uploadResult.sha256}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetState}
                className="px-3 py-1.5 rounded-md border border-[#1f1f28] text-xs text-[#8B8D98] hover:text-white"
              >
                Upload Another
              </button>
              {onCandidateSelected && (
                <button
                  type="button"
                  onClick={() => {
                    const cid = uploadResult.candidate_id;
                    resetState();
                    onClose();
                    onCandidateSelected(cid);
                  }}
                  className="px-4 py-2 rounded-md bg-[#FF5729] hover:bg-[#E0481D] text-white text-xs font-medium"
                >
                  Inspect Candidate Evidence →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

