'use client';

import React, { createContext, useContext, useState } from 'react';

interface ReviewerContextType {
  selectedCandidateId: string | null;
  openCandidateDrawer: (candidateId: string) => void;
  closeCandidateDrawer: () => void;
  isUploadModalOpen: boolean;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ReviewerContext = createContext<ReviewerContextType | undefined>(undefined);

export function ReviewerProvider({ children }: { children: React.ReactNode }) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const openCandidateDrawer = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
  };

  const closeCandidateDrawer = () => {
    setSelectedCandidateId(null);
  };

  const openUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <ReviewerContext.Provider
      value={{
        selectedCandidateId,
        openCandidateDrawer,
        closeCandidateDrawer,
        isUploadModalOpen,
        openUploadModal,
        closeUploadModal,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </ReviewerContext.Provider>
  );
}

export function useReviewer() {
  const context = useContext(ReviewerContext);
  if (!context) {
    throw new Error('useReviewer must be used within a ReviewerProvider');
  }
  return context;
}

