'use client';

import React from 'react';
import Navbar from './Navbar';
import UploadModal from '../upload/UploadModal';
import CandidateDrawer from '../candidates/CandidateDrawer';
import { ReviewerProvider, useReviewer } from './ReviewerContext';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const {
    selectedCandidateId,
    closeCandidateDrawer,
    openCandidateDrawer,
    isUploadModalOpen,
    openUploadModal,
    closeUploadModal,
    triggerRefresh,
  } = useReviewer();

  return (
    <div className="relative min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-zinc-100">
      {/* Top Navigation */}
      <Navbar onOpenUpload={openUploadModal} />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Minimal Enterprise Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/90 py-5 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">ScreenAI ATS</span>
            <span className="text-zinc-700">•</span>
            <span>Intelligent Candidate Screening & Deterministic Evaluation Platform</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-zinc-500">
            <span>Zero-Hallucination Citations</span>
            <span>•</span>
            <span>Bias-Audited Pipeline</span>
          </div>
        </div>
      </footer>

      {/* Slide-over candidate inspector & upload modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        onCandidateSelected={openCandidateDrawer}
        onUploadSuccess={triggerRefresh}
      />

      <CandidateDrawer
        candidateId={selectedCandidateId}
        onClose={closeCandidateDrawer}
      />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ReviewerProvider>
      <AppShellContent>{children}</AppShellContent>
    </ReviewerProvider>
  );
}
