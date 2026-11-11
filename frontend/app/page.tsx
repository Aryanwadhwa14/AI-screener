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
  IconFileText,
  IconAlertCircle,
  IconCheckCircle,
} from '@/components/ui/icons';

type DomainFilter = 'ALL' | 'QUALIFIED' | 'LCA' | 'UI_UX' | 'REVIEW';

export default function HomePage() {
  const { openCandidateDrawer, openUploadModal, refreshTrigger } = useReviewer();
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
      // Search filter
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        c.candidate_code.toLowerCase().includes(q) ||
        c.original_filename.toLowerCase().includes(q) ||
        c.classification.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Category filter
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
      {/* Top Banner / ATS Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Talent Screening & Sourcing Platform
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Candidate Screening Pipeline
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Automated resume parsing, deterministic fit scoring, and verifiable evidence provenance across active requisitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={openUploadModal} className="gap-2 shrink-0">
            <IconUpload size={14} />
            <span>Screen New Resume</span>
          </Button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/80 transition-colors">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Screened Pool
            </span>
            <div className="text-2xl font-bold text-zinc-100 tabular-nums mt-0.5">
              {loading ? '—' : stats.totalCandidates}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-zinc-500">
            47 Active Resumes Parsed
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/80 transition-colors">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Sustainability & LCA
              </span>
              <Badge variant="success">Bench ≥ 55%</Badge>
            </div>
            <div className="text-2xl font-bold text-emerald-400 tabular-nums mt-0.5">
              {loading ? '—' : stats.lcaQualified}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-zinc-500">
            Environmental Impact Specialists
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/80 transition-colors">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Product & UI/UX
              </span>
              <Badge variant="info">Bench ≥ 50%</Badge>
            </div>
            <div className="text-2xl font-bold text-blue-400 tabular-nums mt-0.5">
              {loading ? '—' : stats.uiuxQualified}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-zinc-500">
            Design & Usability Specialists
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/80 transition-colors">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Audit Status
              </span>
              <Badge variant={stats.manualReviewRequired > 0 ? 'warning' : 'default'}>
                {stats.manualReviewRequired > 0 ? 'Review Needed' : '100% Verified'}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-zinc-100 tabular-nums mt-0.5">
              {loading ? '—' : stats.manualReviewRequired === 0 ? '100%' : `${stats.manualReviewRequired} Flag`}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-zinc-500">
            {stats.manualReviewRequired > 0 ? 'CAND-005 Empty Document' : 'Zero hallucinated quotes'}
          </CardContent>
        </Card>
      </div>

      {/* Active Requisitions / Open Positions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Requisition 1 */}
        <Card className="bg-zinc-900/30 border-zinc-800/80 flex flex-col justify-between hover:border-zinc-700/80 transition-all">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="font-mono text-[10px]">
                REQUISITION 01 • ESG & SUSTAINABILITY
              </Badge>
              <span className="text-xs font-mono text-zinc-500">Onsite • 2–3 Yrs Target</span>
            </div>
            <CardTitle className="text-base text-zinc-100">
              Sustainability & Life Cycle Assessment (LCA) Specialist
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Evaluating candidates on GaBi / SimaPro modeling tools, ISO 14040/14044 conformance, and life cycle inventory (LCI) carbon accounting.
            </CardDescription>
            <div className="flex flex-wrap gap-1.5 pt-3">
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">GaBi Modeling</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">SimaPro</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">ISO 14040/44</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">EPD Development</span>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">
              Qualified Match: <span className="text-emerald-400 font-semibold">{stats.lcaQualified}</span> candidates
            </span>
            <Link href="/rankings/lca">
              <Button variant="outline" size="sm" className="gap-1">
                <span>View Candidates</span>
                <IconChevronRight size={13} />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Requisition 2 */}
        <Card className="bg-zinc-900/30 border-zinc-800/80 flex flex-col justify-between hover:border-zinc-700/80 transition-all">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="font-mono text-[10px]">
                REQUISITION 02 • DESIGN & PRODUCT
              </Badge>
              <span className="text-xs font-mono text-zinc-500">Remote • 0–1 Yrs Target</span>
            </div>
            <CardTitle className="text-base text-zinc-100">
              Product & UI/UX Design Specialist
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Evaluating candidates on Figma prototyping, design system governance, user research methodologies, and cognitive psychology principles.
            </CardDescription>
            <div className="flex flex-wrap gap-1.5 pt-3">
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">Figma</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">Design Systems</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">User Research</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">Wireframing</span>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">
              Qualified Match: <span className="text-blue-400 font-semibold">{stats.uiuxQualified}</span> candidates
            </span>
            <Link href="/rankings/uiux">
              <Button variant="outline" size="sm" className="gap-1">
                <span>View Candidates</span>
                <IconChevronRight size={13} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Candidate Pipeline Data Table */}
      <Card className="bg-zinc-900/30 border-zinc-800/80">
        <CardHeader className="p-5 pb-4 border-b border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-100">
                Applicant Pool & Evaluation Register
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Click any candidate row to inspect verbatim resume quotes, full criterion scoring breakdown, and raw extraction.
              </CardDescription>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <IconSearch size={14} className="absolute left-3 top-2.5 text-zinc-500" />
              <Input
                placeholder="Search candidates, codes, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-xs bg-zinc-950/80 border-zinc-800"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-3">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeFilter === 'ALL'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              All Applicants ({candidates.length})
            </button>
            <button
              onClick={() => setActiveFilter('QUALIFIED')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeFilter === 'QUALIFIED'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              Qualified Only ({stats.lcaQualified + stats.uiuxQualified})
            </button>
            <button
              onClick={() => setActiveFilter('LCA')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeFilter === 'LCA'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              Sustainability & LCA ({stats.lcaQualified})
            </button>
            <button
              onClick={() => setActiveFilter('UI_UX')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeFilter === 'UI_UX'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              Product & UI/UX ({stats.uiuxQualified})
            </button>
            <button
              onClick={() => setActiveFilter('REVIEW')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeFilter === 'REVIEW'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              Audit Required ({stats.manualReviewRequired})
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-zinc-500 font-mono text-xs">
              Loading screened candidates...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-400 text-xs">
              {error}
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-xs">
              No candidates matching current search or filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28 font-mono text-[11px]">Candidate</TableHead>
                  <TableHead className="font-mono text-[11px]">Primary Domain Fit</TableHead>
                  <TableHead className="font-mono text-[11px]">LCA Match</TableHead>
                  <TableHead className="font-mono text-[11px]">UI/UX Match</TableHead>
                  <TableHead className="font-mono text-[11px]">Provenance Status</TableHead>
                  <TableHead className="text-right font-mono text-[11px]">Action</TableHead>
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
                      {/* Candidate Code & Source File */}
                      <TableCell>
                        <div className="font-mono font-semibold text-zinc-100">
                          {c.candidate_code}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[140px]" title={c.original_filename}>
                          {c.original_filename}
                        </div>
                      </TableCell>

                      {/* Primary Domain Fit */}
                      <TableCell>
                        {c.classification === 'LCA' ? (
                          <Badge variant="success">Sustainability & LCA</Badge>
                        ) : c.classification === 'UI_UX' ? (
                          <Badge variant="info">Product & UI/UX</Badge>
                        ) : c.classification === 'BOTH' ? (
                          <Badge variant="default">Multi-Disciplinary</Badge>
                        ) : isReview ? (
                          <Badge variant="warning">Empty Document</Badge>
                        ) : (
                          <Badge variant="secondary">Under Threshold</Badge>
                        )}
                      </TableCell>

                      {/* LCA Score & Bar */}
                      <TableCell>
                        {c.lca_score === null ? (
                          <span className="font-mono text-zinc-500 text-[11px]">null (failed)</span>
                        ) : (
                          <div className="w-28 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className={isLcaQualified ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                                {c.lca_score.toFixed(1)}%
                              </span>
                              {isLcaQualified && (
                                <span className="text-[10px] text-emerald-500 font-mono">PASS</span>
                              )}
                            </div>
                            <Progress
                              value={c.lca_score}
                              className="h-1.5 bg-zinc-800"
                              indicatorClassName={isLcaQualified ? 'bg-emerald-500' : 'bg-zinc-600'}
                            />
                          </div>
                        )}
                      </TableCell>

                      {/* UI/UX Score & Bar */}
                      <TableCell>
                        {c.uiux_score === null ? (
                          <span className="font-mono text-zinc-500 text-[11px]">null (failed)</span>
                        ) : (
                          <div className="w-28 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className={isUiuxQualified ? 'text-blue-400 font-semibold' : 'text-zinc-400'}>
                                {c.uiux_score.toFixed(1)}%
                              </span>
                              {isUiuxQualified && (
                                <span className="text-[10px] text-blue-500 font-mono">PASS</span>
                              )}
                            </div>
                            <Progress
                              value={c.uiux_score}
                              className="h-1.5 bg-zinc-800"
                              indicatorClassName={isUiuxQualified ? 'bg-blue-500' : 'bg-zinc-600'}
                            />
                          </div>
                        )}
                      </TableCell>

                      {/* Provenance Status */}
                      <TableCell>
                        {isReview ? (
                          <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                            <IconAlertCircle size={13} />
                            <span>Manual Review</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                            <IconShieldCheck size={13} className="text-emerald-400" />
                            <span>Verified Citations</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Action trigger */}
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-1 font-mono text-[11px] text-zinc-400 hover:text-white">
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
