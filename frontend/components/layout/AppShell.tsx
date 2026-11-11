'use client';

import React from 'react';
import Navbar from './Navbar';
import ShaderBackground from '../shader/ShaderBackground';
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
    <div className="relative min-h-screen flex flex-col text-[#F4F4F6]">
      {/* Background WebGL Shader (behind everything) */}
      <ShaderBackground />

      {/* Top Navbar */}
      <Navbar onOpenUpload={openUploadModal} />

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1f1f28] bg-[#020203]/80 backdrop-blur-sm py-6 text-center text-xs text-[#8B8D98]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GFI AI Resume Screener • Dual-Role Evaluation Engine</span>
          <span className="font-mono text-[11px] text-[#B0B3BE]">
            Deterministic Scoring • Zero-Hallucination Evidence Grounding
          </span>
        </div>
      </footer>

      {/* Global Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        onCandidateSelected={openCandidateDrawer}
        onUploadSuccess={triggerRefresh}
      />

      <CandidateDrawer
        candidateId={selectedCandidateId}
        onClose={closeCandidateDrawer}
        onRefresh={triggerRefresh}
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

