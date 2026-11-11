'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CandidateRankingItem } from '@/lib/types';
import RankingTable from '@/components/rankings/RankingTable';
import { useReviewer } from '@/components/layout/ReviewerContext';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
        if (!isMounted) setError(err.message || 'Failed to load LCA rankings.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const qualifiedCount = candidates.filter((c) => c.is_qualified).length;

  return (
    <div className="space-y-4">
      {/* Position Header Banner */}
      <Card>
        <CardHeader className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="secondary" className="font-mono text-[10px]">
                  REQUISITION 01 • ESG & SUSTAINABILITY
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">Onsite • 2–3 Years Target Experience</span>
              </div>
              <CardTitle className="text-xl text-foreground">
                Sustainability & Life Cycle Assessment (LCA) Specialist
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
                Requisition requirements: GaBi / SimaPro modeling expertise (35 pts), ISO 14040/14044 conformance (25 pts), professional environmental engineering experience, and Chennai onsite location.
              </CardDescription>
            </div>

            <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-lg border shrink-0">
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">Benchmark</span>
                <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">≥ 55.0%</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">Qualified</span>
                <span className="text-base font-bold font-mono text-foreground">{qualifiedCount} / {candidates.length}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Candidates Table */}
      {error ? (
        <div className="p-6 text-center text-destructive text-xs rounded-lg border bg-destructive/10">
          {error}
        </div>
      ) : (
        <RankingTable
          roleKey="LCA"
          roleTitle="Sustainability & Life Cycle Assessment (LCA) Specialist"
          threshold={55.0}
          candidates={candidates}
          onSelectCandidate={openCandidateDrawer}
          isLoading={loading}
        />
      )}
    </div>
  );
}
