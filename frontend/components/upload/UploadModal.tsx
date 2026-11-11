'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { UploadResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconUpload, IconClose, IconCheck, IconAlertCircle } from '@/components/ui/icons';

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
      return 'Supported formats: PDF or DOCX only.';
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
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-[#0d0e11] p-6 shadow-2xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Upload Candidate Resume</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Ingest PDF or DOCX file into the dual-role evaluation pipeline</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="h-7 w-7 text-zinc-400 hover:text-white"
          >
            <IconClose size={15} />
          </Button>
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
              className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all ${
                dragActive
                  ? 'border-[#FF5729] bg-[#FF5729]/5'
                  : selectedFile
                  ? 'border-emerald-800/80 bg-emerald-950/20'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60'
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
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-950/60 text-emerald-400 flex items-center justify-center">
                    <IconCheck size={16} />
                  </div>
                  <span className="text-xs font-mono font-medium text-white truncate max-w-xs">
                    {selectedFile.name}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose different file
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 flex items-center justify-center">
                    <IconUpload size={16} />
                  </div>
                  <p className="text-xs text-zinc-200">
                    Drag and drop resume here, or <span className="text-[#FF5729] font-medium">browse</span>
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Supports DOCX and PDF (Max 15MB)
                  </p>
                </div>
              )}
            </div>

            {/* Auto-process Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
              <input
                id="autoProcess"
                type="checkbox"
                checked={autoProcess}
                onChange={(e) => setAutoProcess(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-[#FF5729] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="autoProcess" className="text-xs text-zinc-400 cursor-pointer">
                <span className="font-medium text-zinc-200 block">Immediate AI Qualification Evaluation</span>
                Automatically extract structured candidate claims and calculate match scores for both roles.
              </label>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="p-3 rounded-md bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-start gap-2">
                <IconAlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetState();
                  onClose();
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="gap-1.5"
              >
                {isUploading ? (
                  <span>Processing Pipeline...</span>
                ) : (
                  <span>Upload & Ingest</span>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Result Summary */
          <div className="mt-4 space-y-4">
            <div
              className={`p-4 rounded-lg border ${
                uploadResult.is_duplicate
                  ? 'border-amber-800/60 bg-amber-950/20 text-amber-200'
                  : 'border-emerald-800/60 bg-emerald-950/20 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs">
                  {uploadResult.is_duplicate ? 'Duplicate Document Detected' : 'Resume Successfully Ingested'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{uploadResult.message}</p>
              <div className="mt-3 p-3 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 space-y-1">
                <div>Candidate Code: <span className="text-[#FF5729] font-bold">{uploadResult.candidate_code}</span></div>
                <div>Status: <span className="text-emerald-400">{uploadResult.processing_status}</span></div>
                <div className="text-[10px] text-zinc-500 truncate">SHA-256: {uploadResult.sha256}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={resetState}>
                Upload Another
              </Button>
              {onCandidateSelected && (
                <Button
                  size="sm"
                  onClick={() => {
                    const cid = uploadResult.candidate_id;
                    resetState();
                    onClose();
                    onCandidateSelected(cid);
                  }}
                >
                  Inspect Candidate Dossier
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
