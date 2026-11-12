'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { CandidateSummaryItem, SystemStats } from '@/lib/types';
import { useReviewer } from '@/components/layout/ReviewerContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  IconSearch,
  IconChevronRight,
  IconUpload,
  IconBriefcase,
  IconShieldCheck,
  IconAlertCircle,
} from '@/components/ui/icons';

type DomainFilter = 'ALL' | 'QUALIFIED' | 'LCA' | 'UI_UX' | 'REVIEW';

export default function HomePage() {
  const { openCandidateDrawer, openUploadModal, openPostJobModal, jobs, refreshTrigger } = useReviewer();
  const [candidates, setCandidates] = useState<CandidateSummaryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<DomainFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SystemStats>({
    totalCandidates: 0,
    lcaQualified: 0,
    uiuxQualified: 0,
    bothQualified: 0,
    neitherCount: 0,
    completedProcessing: 0,
    manualReviewRequired: 0,
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getCandidates({ page: 1, page_size: 50 })
      .then((res) => {
        if (!isMounted) return;
        setCandidates(res.candidates);

        let lcaQ = 0;
        let uiuxQ = 0;
        let bothQ = 0;
        let neither = 0;
        let completed = 0;
        let review = 0;

        res.candidates.forEach((c) => {
          if (c.lca_score !== null && c.lca_score >= 55.0) lcaQ++;
          if (c.uiux_score !== null && c.uiux_score >= 50.0) uiuxQ++;
          if (c.classification === 'BOTH') bothQ++;
          if (c.classification === 'NEITHER_OR_UNCERTAIN') neither++;
          if (c.processing_status === 'COMPLETED') completed++;
          if (c.processing_status === 'MANUAL_REVIEW_REQUIRED') {
            review++;
          }
        });

        setStats({
          totalCandidates: res.total,
          lcaQualified: lcaQ,
          uiuxQualified: uiuxQ,
          bothQualified: bothQ,
          neitherCount: neither,
          completedProcessing: completed,
          manualReviewRequired: review,
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load candidates.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        c.candidate_code.toLowerCase().includes(q) ||
        c.original_filename.toLowerCase().includes(q) ||
        c.classification.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'QUALIFIED') {
        return (
          (c.lca_score !== null && c.lca_score >= 55.0) ||
          (c.uiux_score !== null && c.uiux_score >= 50.0)
        );
      }
      if (activeFilter === 'LCA') {
        return c.classification === 'LCA' || c.classification === 'BOTH';
      }
      if (activeFilter === 'UI_UX') {
        return c.classification === 'UI_UX' || c.classification === 'BOTH';
      }
      if (activeFilter === 'REVIEW') {
        return c.processing_status === 'MANUAL_REVIEW_REQUIRED';
      }
      return true;
    });
  }, [candidates, searchTerm, activeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Candidate Pipeline
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated resume parsing and verified evidence scoring across open positions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openPostJobModal} className="gap-1.5">
            <IconBriefcase size={13} />
            <span>Post a Job</span>
          </Button>
          <Button size="sm" onClick={openUploadModal} className="gap-1.5">
            <IconUpload size={13} />
            <span>Screen Resume</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="hover:border-foreground/20 transition-colors">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-medium text-muted-foreground">Total Applicants</span>
            <div className="text-2xl font-semibold text-foreground tabular-nums mt-0.5">
              {loading ? '—' : stats.totalCandidates}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Resumes in pool
          </CardContent>
        </Card>

        <Card className="hover:border-foreground/20 transition-colors">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">LCA Matches</span>
              <Badge variant="success">≥ 55%</Badge>
            </div>
            <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {loading ? '—' : stats.lcaQualified}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            GaBi & SimaPro specialists
          </CardContent>
        </Card>

        <Card className="hover:border-foreground/20 transition-colors">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">UI/UX Matches</span>
              <Badge variant="info">≥ 50%</Badge>
            </div>
            <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400 tabular-nums mt-0.5">
              {loading ? '—' : stats.uiuxQualified}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Figma & research designers
          </CardContent>
        </Card>

        <Card className="hover:border-foreground/20 transition-colors">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Needs Review</span>
              <Badge variant={stats.manualReviewRequired > 0 ? 'warning' : 'secondary'}>
                {stats.manualReviewRequired > 0 ? 'Action Required' : 'Clean'}
              </Badge>
            </div>
            <div className="text-2xl font-semibold text-foreground tabular-nums mt-0.5">
              {loading ? '—' : stats.manualReviewRequired}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            {stats.manualReviewRequired > 0 ? 'Empty document flag' : 'Zero unparsed files'}
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Open Positions List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Open Positions ({jobs.length})</h2>
          <Button variant="ghost" size="sm" onClick={openPostJobModal} className="h-7 text-xs text-muted-foreground">
            + Add Position
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {jobs.map((job) => {
            const isLca = job.id === 'lca-consultant';
            const isUiux = job.id === 'uiux-designer';
            const href = isLca ? '/rankings/lca' : isUiux ? '/rankings/uiux' : '#';

            return (
              <Card key={job.id} className="flex flex-col justify-between hover:border-foreground/25 transition-all">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {job.department}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{job.location}</span>
                  </div>
                  <CardTitle className="text-sm text-foreground leading-snug">{job.title}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {job.description}
                  </CardDescription>

                  <div className="flex flex-wrap gap-1 pt-2.5">
                    {job.skills.slice(0, 3).map((sk, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-mono">
                        {sk}
                      </span>
                    ))}
                    {job.skills.length > 3 && (
                      <span className="text-[10px] text-muted-foreground self-center">+{job.skills.length - 3}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 border-t flex items-center justify-between text-xs">
                  <span className="text-muted-foreground text-[11px]">
                    Min Score: <span className="font-semibold text-foreground">{job.benchmarkThreshold}%</span>
                  </span>
                  {href !== '#' ? (
                    <Link href={href}>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <span>Rankings</span>
                        <IconChevronRight size={12} />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => openUploadModal()}
                    >
                      Screen Candidates
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Candidate Pipeline Table */}
      <Card>
        <CardHeader className="p-4 pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                All Screened Candidates
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Click any row to view candidate score breakdown and quoted resume evidence.
              </CardDescription>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-60">
              <IconSearch size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search candidate or filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <Button
              variant={activeFilter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveFilter('ALL')}
            >
              All ({candidates.length})
            </Button>
            <Button
              variant={activeFilter === 'QUALIFIED' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveFilter('QUALIFIED')}
            >
              Qualified ({stats.lcaQualified + stats.uiuxQualified})
            </Button>
            <Button
              variant={activeFilter === 'LCA' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveFilter('LCA')}
            >
              LCA ({stats.lcaQualified})
            </Button>
            <Button
              variant={activeFilter === 'UI_UX' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveFilter('UI_UX')}
            >
              UI/UX ({stats.uiuxQualified})
            </Button>
            <Button
              variant={activeFilter === 'REVIEW' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveFilter('REVIEW')}
            >
              Review Needed ({stats.manualReviewRequired})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-14 text-center text-muted-foreground text-xs">
              Loading candidates...
            </div>
          ) : error ? (
            <div className="py-10 text-center text-destructive text-xs">
              {error}
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground text-xs">
              No matching candidates found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28 text-xs font-medium">Candidate</TableHead>
                  <TableHead className="text-xs font-medium">Primary Match</TableHead>
                  <TableHead className="text-xs font-medium">LCA Fit</TableHead>
                  <TableHead className="text-xs font-medium">UI/UX Fit</TableHead>
                  <TableHead className="text-xs font-medium">Status</TableHead>
                  <TableHead className="text-right text-xs font-medium">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((c) => {
                  const isLcaQualified = c.lca_score !== null && c.lca_score >= 55.0;
                  const isUiuxQualified = c.uiux_score !== null && c.uiux_score >= 50.0;
                  const isReview = c.processing_status === 'MANUAL_REVIEW_REQUIRED';

                  return (
                    <TableRow
                      key={c.id}
                      onClick={() => openCandidateDrawer(c.id)}
                      className="cursor-pointer"
                    >
                      {/* Code & Filename */}
                      <TableCell>
                        <div className="font-mono font-medium text-xs text-foreground">
                          {c.candidate_code}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[130px]" title={c.original_filename}>
                          {c.original_filename}
                        </div>
                      </TableCell>

                      {/* Primary Classification */}
                      <TableCell>
                        {c.classification === 'LCA' ? (
                          <Badge variant="success">LCA Specialist</Badge>
                        ) : c.classification === 'UI_UX' ? (
                          <Badge variant="info">UI/UX Designer</Badge>
                        ) : c.classification === 'BOTH' ? (
                          <Badge variant="default">Dual Match</Badge>
                        ) : isReview ? (
                          <Badge variant="warning">Empty File</Badge>
                        ) : (
                          <Badge variant="secondary">Below Threshold</Badge>
                        )}
                      </TableCell>

                      {/* LCA Score */}
                      <TableCell>
                        {c.lca_score === null ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          <div className="w-24 space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className={isLcaQualified ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}>
                                {c.lca_score.toFixed(0)}%
                              </span>
                              {isLcaQualified && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-sans font-semibold">PASS</span>
                              )}
                            </div>
                            <Progress
                              value={c.lca_score}
                              className="h-1.5"
                              indicatorClassName={isLcaQualified ? 'bg-emerald-500' : 'bg-muted-foreground/30'}
                            />
                          </div>
                        )}
                      </TableCell>

                      {/* UI/UX Score */}
                      <TableCell>
                        {c.uiux_score === null ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          <div className="w-24 space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className={isUiuxQualified ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-muted-foreground'}>
                                {c.uiux_score.toFixed(0)}%
                              </span>
                              {isUiuxQualified && (
                                <span className="text-[10px] text-blue-600 dark:text-blue-500 font-sans font-semibold">PASS</span>
                              )}
                            </div>
                            <Progress
                              value={c.uiux_score}
                              className="h-1.5"
                              indicatorClassName={isUiuxQualified ? 'bg-blue-500' : 'bg-muted-foreground/30'}
                            />
                          </div>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {isReview ? (
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs">
                            <IconAlertCircle size={13} />
                            <span>Manual Review</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <IconShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                            <span>Evidence Verified</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                          <span>Inspect</span>
                          <IconChevronRight size={13} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
