'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CandidateRankingItem } from '@/lib/types';
import RankingTable from '@/components/rankings/RankingTable';
import { useReviewer } from '@/components/layout/ReviewerContext';

export default function LCARankingPage() {
  const { openCandidateDrawer, refreshTrigger } = useReviewer();
  const [candidates, setCandidates] = useState<CandidateRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getRankings('LCA')
      .then((res) => {
        if (!isMounted) return;
        setCandidates(res.rankings);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load LCA rankings.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Role Header Banner */}
      <div className="p-6 rounded-xl bg-[#0d0d11] border border-[#1f1f28] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#FF5729]/15 text-[#FF5729] border border-[#FF5729]/30">
                ROLE 1
              </span>
              <span className="text-xs font-mono text-[#8B8D98]">Chennai (Onsite)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Life Cycle Assessment (LCA) Consultant
            </h1>
            <p className="text-xs sm:text-sm text-[#8B8D98] mt-1 max-w-3xl leading-relaxed">
              Canonical JD Grounding: 2–3 years baseline experience (Lines 29–30), GaBi / SimaPro software expertise, ISO 14040/14044 standard conformance, and willingness to work onsite in Chennai.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#070709] p-3 rounded-lg border border-[#1f1f28] shrink-0">
            <div>
              <span className="text-[10px] uppercase text-[#8B8D98] font-semibold block">Qualification Threshold</span>
              <span className="text-xl font-bold font-mono text-emerald-400">≥ 55.0 / 100</span>
            </div>
            <div className="w-px h-8 bg-[#1f1f28]" />
            <div>
              <span className="text-[10px] uppercase text-[#8B8D98] font-semibold block">Total Evaluated</span>
              <span className="text-xl font-bold font-mono text-white">{candidates.length}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-900/60 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Main Ranking Table */}
      <RankingTable
        roleKey="LCA"
        roleTitle="LCA Consultant"
        threshold={55.0}
        candidates={candidates}
        onSelectCandidate={openCandidateDrawer}
        isLoading={loading}
      />
    </div>
  );
}

