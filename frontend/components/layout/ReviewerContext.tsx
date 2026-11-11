'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { JobPosting } from '../jobs/PostJobModal';

const INITIAL_JOBS: JobPosting[] = [
  {
    id: 'lca-consultant',
    title: 'Sustainability & LCA Specialist',
    department: 'Sustainability',
    location: 'Onsite • Chennai',
    experienceLevel: '2–3 years',
    skills: ['GaBi', 'SimaPro', 'ISO 14040', 'ISO 14044', 'EPD'],
    benchmarkThreshold: 55,
    description: 'Life cycle assessment modeling, carbon accounting, and ISO environmental standards compliance.',
    applicantCount: 28,
    createdAt: 'Active',
  },
  {
    id: 'uiux-designer',
    title: 'Product & UI/UX Design Specialist',
    department: 'Design',
    location: 'Remote',
    experienceLevel: '0–1 years',
    skills: ['Figma', 'User Research', 'Cognitive Psychology', 'Wireframing'],
    benchmarkThreshold: 50,
    description: 'Interface prototyping, design system components, user journey mapping, and usability testing.',
    applicantCount: 29,
    createdAt: 'Active',
  },
];

interface ReviewerContextType {
  selectedCandidateId: string | null;
  openCandidateDrawer: (candidateId: string) => void;
  closeCandidateDrawer: () => void;
  isUploadModalOpen: boolean;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  isPostJobModalOpen: boolean;
  openPostJobModal: () => void;
  closePostJobModal: () => void;
  jobs: JobPosting[];
  addJob: (job: JobPosting) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ReviewerContext = createContext<ReviewerContextType | undefined>(undefined);

export function ReviewerProvider({ children }: { children: React.ReactNode }) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [jobs, setJobs] = useState<JobPosting[]>(INITIAL_JOBS);

  // Load any saved jobs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('screenai_posted_jobs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setJobs(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const addJob = (job: JobPosting) => {
    setJobs((prev) => {
      const updated = [job, ...prev];
      try {
        localStorage.setItem('screenai_posted_jobs', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

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

  const openPostJobModal = () => {
    setIsPostJobModalOpen(true);
  };

  const closePostJobModal = () => {
    setIsPostJobModalOpen(false);
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
        isPostJobModalOpen,
        openPostJobModal,
        closePostJobModal,
        jobs,
        addJob,
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
