'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CandidateRankingItem } from '@/lib/types';
import RankingTable from '@/components/rankings/RankingTable';
import { useReviewer } from '@/components/layout/ReviewerContext';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function UIUXRankingPage() {
  const { openCandidateDrawer, refreshTrigger } = useReviewer();
  const [candidates, setCandidates] = useState<CandidateRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getRankings('UI_UX')
      .then((res) => {
        if (!isMounted) return;
        setCandidates(res.rankings);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load UI/UX rankings.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  return (
    <div className="space-y-4">
      {/* Role Header Banner */}
      <Card>
        <CardHeader className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="default" className="font-mono text-[10px]">ROLE 2</Badge>
                <span className="text-xs font-mono text-zinc-400">Fully Remote • 0–1 Yrs Target Exp</span>
              </div>
              <CardTitle className="text-lg text-white">
                UI/UX Design Intern Rankings
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-1 max-w-3xl">
                Canonical JD2 Grounding: Figma interactive prototyping & design systems (30 pts), user research methodologies & cognitive psychology (25 pts), wireframing, and portfolio deliverables.
              </CardDescription>
            </div>

            <div className="flex items-center gap-4 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 shrink-0">
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">Pass Threshold</span>
                <span className="text-lg font-bold font-mono text-blue-400">≥ 50.0 / 100</span>
              </div>
              <div className="w-px h-7 bg-zinc-800" />
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">Total Evaluated</span>
                <span className="text-lg font-bold font-mono text-white">{candidates.length}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <div className="p-3 rounded-md bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Main Ranking Table */}
      <RankingTable
        roleKey="UI_UX"
        roleTitle="UI/UX Designer Intern"
        threshold={50.0}
        candidates={candidates}
        onSelectCandidate={openCandidateDrawer}
        isLoading={loading}
      />
    </div>
  );
}
