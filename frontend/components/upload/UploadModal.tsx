'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { UploadResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-2xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Screen New Candidate Resume</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Ingest PDF or DOCX file into the screening & evaluation pipeline</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
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
              className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all ${dragActive
                  ? 'border-primary bg-primary/5'
                  : selectedFile
                    ? 'border-emerald-500/80 bg-emerald-500/10'
                    : 'border-muted-foreground/30 hover:border-foreground/50 bg-muted/20'
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
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <IconCheck size={16} />
                  </div>
                  <span className="text-xs font-mono font-medium text-foreground truncate max-w-xs">
                    {selectedFile.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose different file
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                    <IconUpload size={16} />
                  </div>
                  <p className="text-xs text-foreground">
                    Drag and drop resume here, or <span className="text-primary font-semibold underline">browse file</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Supports DOCX and PDF (Max 15MB)
                  </p>
                </div>
              )}
            </div>

            {/* Auto-process Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
              <input
                id="autoProcess"
                type="checkbox"
                checked={autoProcess}
                onChange={(e) => setAutoProcess(e.target.checked)}
                className="rounded border-input text-primary focus:ring-0 cursor-pointer"
              />
              <label htmlFor="autoProcess" className="text-xs text-muted-foreground cursor-pointer">
                <span className="font-medium text-foreground block">Immediate AI Pipeline Processing</span>
                Automatically extract structured candidate claims, verify citations, and calculate benchmark match scores.
              </label>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                <IconAlertCircle size={15} className="shrink-0 mt-0.5" />
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
                  <span>Upload & Screen</span>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Result Summary */
          <div className="mt-4 space-y-4">
            <div
              className={`p-4 rounded-lg border ${uploadResult.is_duplicate
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs">
                  {uploadResult.is_duplicate ? 'Duplicate Document Detected' : 'Resume Successfully Ingested'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{uploadResult.message}</p>
              <div className="mt-3 p-3 rounded bg-muted/50 border text-xs font-mono text-foreground space-y-1">
                <div>Candidate Code: <span className="font-bold">{uploadResult.candidate_code}</span></div>
                <div>Status: <span className="text-emerald-600 dark:text-emerald-400">{uploadResult.processing_status}</span></div>
                <div className="text-[10px] text-muted-foreground truncate">SHA-256: {uploadResult.sha256}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={resetState}>
                Screen Another
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
