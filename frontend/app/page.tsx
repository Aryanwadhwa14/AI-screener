'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { CandidateSummaryItem, SystemStats } from '@/lib/types';
import { useReviewer } from '@/components/layout/ReviewerContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconSearch, IconChevronRight, IconUpload } from '@/components/ui/icons';

export default function HomePage() {
  const { openCandidateDrawer, openUploadModal, refreshTrigger } = useReviewer();
  const [candidates, setCandidates] = useState<CandidateSummaryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
          if (c.processing_status === 'COMPLETED' || c.processing_status === 'PROCESSED') completed++;
          if (c.processing_status === 'MANUAL_REVIEW_REQUIRED' || c.lca_score === null || c.uiux_score === null) {
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
        if (isMounted) setError(err.message || 'Failed to load candidates.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const filteredCandidates = useMemo(() => {
    if (!searchTerm.trim()) return candidates;
    const q = searchTerm.toLowerCase();
    return candidates.filter(
      (c) =>
        c.candidate_code.toLowerCase().includes(q) ||
        c.original_filename.toLowerCase().includes(q) ||
        c.classification.toLowerCase().includes(q)
    );
  }, [candidates, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              GFI Candidate Evaluation Portal
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Resume Screening & Dual-Role Ranking
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Automated qualification extraction, deterministic scoring, and explainable ranking for 47 candidates across LCA Consultant and UI/UX Design positions.
          </p>
        </div>

        <Button onClick={openUploadModal} className="gap-2 shrink-0">
          <IconUpload size={14} />
          <span>Upload Resume</span>
        </Button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total Applicants</span>
            <div className="text-2xl font-bold text-white tabular-nums mt-0.5">
              {loading ? '—' : stats.totalCandidates}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-zinc-500">
            47 Audited Resumes
          </CardContent>
        </Card>

        <Card className="border-emerald-900/40 bg-[#0d110f]">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">LCA Qualified</span>
              <Badge variant="success">Threshold 55.0</Badge>
            </div>
            <div className="text-2xl font-bold text-emerald-400 tabular-nums mt-0.5">
              {loading ? '—' : stats.lcaQualified}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-zinc-400">
            Chennai Onsite / GaBi / SimaPro
          </CardContent>
        </Card>

        <Card className="border-blue-900/40 bg-[#0c1017]">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400">UI/UX Qualified</span>
              <Badge variant="info">Threshold 50.0</Badge>
            </div>
            <div className="text-2xl font-bold text-blue-400 tabular-nums mt-0.5">
              {loading ? '—' : stats.uiuxQualified}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-zinc-400">
            Remote / Figma / Research
          </CardContent>
        </Card>

        <Card className="border-amber-900/40 bg-[#12100d]">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">Manual Review</span>
              <Badge variant="warning">Low Text / Null</Badge>
            </div>
            <div className="text-2xl font-bold text-amber-400 tabular-nums mt-0.5">
              {loading ? '—' : stats.manualReviewRequired}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-zinc-400">
            1 Empty Doc (CAND-005)
          </CardContent>
        </Card>
      </div>

      {/* Two Roles Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Role 1: LCA */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <Badge variant="default" className="text-[10px] font-mono">ROLE 1 • ONSITE CHENNAI</Badge>
              <span className="text-xs font-mono text-zinc-400">Baseline Exp: 2–3 Yrs</span>
            </div>
            <CardTitle className="text-base text-white">Life Cycle Assessment (LCA) Consultant</CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-1">
              Grounded in JD1. Requires GaBi or SimaPro modeling tools (35 pts), ISO 14040/14044 standard conformance (25 pts), and demonstrated life cycle inventory/impact assessment experience.
            </CardDescription>
            <div className="flex flex-wrap gap-1.5 pt-3">
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">GaBi</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">SimaPro</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">ISO 14040/44</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">Chennai Onsite</span>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">
              Qualified: <span className="text-emerald-400 font-semibold">{stats.lcaQualified}</span> / 47 candidates
            </span>
            <Link href="/rankings/lca">
              <Button variant="secondary" size="sm" className="gap-1">
                <span>View LCA Rankings</span>
                <IconChevronRight size={13} />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Role 2: UI/UX */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <Badge variant="default" className="text-[10px] font-mono">ROLE 2 • FULLY REMOTE</Badge>
              <span className="text-xs font-mono text-zinc-400">Target Exp: 0–1 Yrs</span>
            </div>
            <CardTitle className="text-base text-white">UI/UX Design Intern</CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-1">
              Grounded in JD2. Requires Figma prototyping and component systems (30 pts), user research methodologies and cognitive psychology (25 pts), and case study deliverables.
            </CardDescription>
            <div className="flex flex-wrap gap-1.5 pt-3">
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">Figma</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">User Research</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">Cognitive Psychology</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">Remote</span>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">
              Qualified: <span className="text-blue-400 font-semibold">{stats.uiuxQualified}</span> / 47 candidates
            </span>
            <Link href="/rankings/uiux">
              <Button variant="secondary" size="sm" className="gap-1">
                <span>View UI/UX Rankings</span>
                <IconChevronRight size={13} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Candidate Register Table */}
      <Card>
        <CardHeader className="p-5 pb-4 border-b border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-white">Applicant Inventory & Review Register</CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Click any row to open the candidate's verified evidence dossier, criterion scoring breakdown, and original resume.
              </CardDescription>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search candidate code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-md bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                <th className="py-2.5 px-4">Candidate Code</th>
                <th className="py-2.5 px-4">Classification</th>
                <th className="py-2.5 px-4">LCA Match</th>
                <th className="py-2.5 px-4">UI/UX Match</th>
                <th className="py-2.5 px-4">Processing Status</th>
                <th className="py-2.5 px-4 text-center">Confidence</th>
                <th className="py-2.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Loading candidate dossier register...
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No candidates found matching '{searchTerm}'.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openCandidateDrawer(c.id)}
                    className="hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-white group-hover:text-[#FF5729]">
                      {c.candidate_code}
                    </td>
                    <td className="py-3 px-4">
                      {c.classification === 'LCA' && (
                        <Badge variant="success">LCA Consultant</Badge>
                      )}
                      {c.classification === 'UI_UX' && (
                        <Badge variant="info">UI/UX Designer</Badge>
                      )}
                      {c.classification === 'BOTH' && (
                        <Badge variant="outline" className="border-purple-800 text-purple-300">Dual Match</Badge>
                      )}
                      {c.classification === 'NEITHER_OR_UNCERTAIN' && (
                        <Badge variant="secondary">Uncertain / Review</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {c.lca_score !== null ? (
                        <span className={c.lca_score >= 55.0 ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                          {c.lca_score.toFixed(1)} / 100
                        </span>
                      ) : (
                        <span className="text-zinc-600">null</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {c.uiux_score !== null ? (
                        <span className={c.uiux_score >= 50.0 ? 'text-blue-400 font-semibold' : 'text-zinc-400'}>
                          {c.uiux_score.toFixed(1)} / 100
                        </span>
                      ) : (
                        <span className="text-zinc-600">null</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">
                      {c.processing_status}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={c.extraction_confidence >= 0.8 ? 'text-emerald-400' : 'text-amber-400'}>
                        {(c.extraction_confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCandidateDrawer(c.id);
                        }}
                        className="text-zinc-400 group-hover:text-white"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
