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
                  REQUISITION 02 • DESIGN & PRODUCT
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">Fully Remote • 0–1 Years Target Experience</span>
              </div>
              <CardTitle className="text-xl text-foreground">
                Product & UI/UX Design Specialist
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
                Requisition requirements: Figma prototyping & design component systems (30 pts), user research methodologies and cognitive psychology (25 pts), user journey mapping, and case studies.
              </CardDescription>
            </div>

            <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-lg border shrink-0">
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">Benchmark</span>
                <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400">≥ 50.0%</span>
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
          roleKey="UI_UX"
          roleTitle="Product & UI/UX Design Specialist"
          threshold={50.0}
          candidates={candidates}
          onSelectCandidate={openCandidateDrawer}
          isLoading={loading}
        />
      )}
    </div>
  );
}
