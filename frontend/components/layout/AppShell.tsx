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
    <div className="relative min-h-screen flex flex-col bg-background text-foreground selection:bg-muted selection:text-foreground">
      {/* Top Navigation */}
      <Navbar onOpenUpload={openUploadModal} />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Minimal Enterprise Footer */}
      <footer className="border-t bg-card/50 py-5 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">ScreenAI ATS</span>
            <span>•</span>
            <span>Intelligent Candidate Screening & Deterministic Evaluation Platform</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
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
