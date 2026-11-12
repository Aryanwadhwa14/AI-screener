'use client';

import React from 'react';
import Navbar from './Navbar';
import UploadModal from '../upload/UploadModal';
import PostJobModal from '../jobs/PostJobModal';
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
    isPostJobModalOpen,
    closePostJobModal,
    addJob,
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

      {/* Minimal Footer */}
      <footer className="border-t bg-card/40 py-5 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">RankRes </span>
            <span>•</span>
            <span>Resume Screening & Applicant Evaluation</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-mono">
            <span>Verified Citations</span>
            <span>•</span>
            <span>Deterministic Scoring</span>
          </div>
        </div>
      </footer>

      {/* Modals & Slide-over drawer */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        onCandidateSelected={openCandidateDrawer}
        onUploadSuccess={triggerRefresh}
      />

      <PostJobModal
        isOpen={isPostJobModalOpen}
        onClose={closePostJobModal}
        onJobCreated={addJob}
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
