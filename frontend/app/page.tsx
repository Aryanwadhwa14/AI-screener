'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { CandidateSummaryItem, SystemStats } from '@/lib/types';
import { useReviewer } from '@/components/layout/ReviewerContext';

export default function HomePage() {
  const { openCandidateDrawer, openUploadModal, refreshTrigger } = useReviewer();
  const [candidates, setCandidates] = useState<CandidateSummaryItem[]>([]);
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

        // Compute system stats from live dataset
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1f1f28]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#1f1f28] bg-[#0d0d11] text-xs font-mono text-[#FF5729] mb-2">
            <span>Verified Dataset</span>
            <span className="w-1 h-1 rounded-full bg-[#FF5729]" />
            <span>47 Resumes Analyzed</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Resume Intelligence Dashboard
          </h1>
          <p className="text-sm text-[#8B8D98] mt-1 max-w-2xl">
            Dual-role screening, deterministic scoring, and verbatim evidence verification for Life Cycle Assessment and UI/UX Design positions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openUploadModal}
            className="px-4 py-2 rounded-lg bg-[#FF5729] hover:bg-[#E0481D] text-white text-sm font-medium transition-all shadow-lg shadow-[#FF5729]/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Ingest New Resume</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0d0d11] border border-[#1f1f28] shadow-lg">
          <span className="text-xs uppercase font-semibold text-[#8B8D98]">Total Resumes</span>
          <div className="text-3xl font-bold font-mono text-white mt-2">
            {loading ? '—' : stats.totalCandidates}
          </div>
          <span className="text-[11px] text-[#8B8D98] mt-1 block">Full audited dataset</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0d0d11] border border-emerald-900/30 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-emerald-400">LCA Qualified</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">≥ 55.0</span>
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400 mt-2">
            {loading ? '—' : stats.lcaQualified}
          </div>
          <span className="text-[11px] text-[#8B8D98] mt-1 block">Chennai Onsite / GaBi</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0d0d11] border border-blue-900/30 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-blue-400">UI/UX Qualified</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">≥ 50.0</span>
          </div>
          <div className="text-3xl font-bold font-mono text-blue-400 mt-2">
            {loading ? '—' : stats.uiuxQualified}
          </div>
          <span className="text-[11px] text-[#8B8D98] mt-1 block">Remote / Figma Design</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0d0d11] border border-amber-900/30 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-amber-400">Manual Review</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">Null / Flagged</span>
          </div>
          <div className="text-3xl font-bold font-mono text-amber-400 mt-2">
            {loading ? '—' : stats.manualReviewRequired}
          </div>
          <span className="text-[11px] text-[#8B8D98] mt-1 block">Empty/unparsed docs</span>
        </div>
      </div>

      {/* Role Comparison Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LCA Banner */}
        <div className="p-6 rounded-xl bg-[#0d0d11] border border-[#1f1f28] flex flex-col justify-between hover:border-[#2f2f3e] transition-all shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-[#FF5729] tracking-wider">Role Profile 1</span>
              <span className="text-xs font-mono text-[#8B8D98]">Target Exp: 2–3 Years</span>
            </div>
            <h2 className="text-xl font-bold text-white">Life Cycle Assessment (LCA) Consultant</h2>
            <p className="text-xs text-[#B0B3BE] leading-relaxed">
              Chennai Onsite requirement. Requires GaBi or SimaPro proficiency (35 pts), ISO 14040/14044 standards (25 pts), and demonstrated industrial LCA experience.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="px-2 py-0.5 rounded text-[11px] bg-[#14141a] text-[#B0B3BE] border border-[#272733]">GaBi / SimaPro</span>
              <span className="px-2 py-0.5 rounded text-[11px] bg-[#14141a] text-[#B0B3BE] border border-[#272733]">ISO 14040 / 14044</span>
              <span className="px-2 py-0.5 rounded text-[11px] bg-[#14141a] text-[#B0B3BE] border border-[#272733]">Chennai Onsite</span>
            </div>
          </div>
          <div className="pt-6 mt-4 border-t border-[#1f1f28] flex items-center justify-between">
            <span className="text-xs font-mono text-[#8B8D98]">
              Qualified: <span className="text-emerald-400 font-bold">{stats.lcaQualified}</span> candidates
            </span>
            <Link
              href="/rankings/lca"
              className="px-3.5 py-1.5 rounded-md bg-[#14141a] hover:bg-[#1f1f28] text-white text-xs font-medium border border-[#272733] transition-colors"
            >
              View LCA Rankings →
            </Link>
          </div>
        </div>

        {/* UI/UX Banner */}
        <div className="p-6 rounded-xl bg-[#0d0d11] border border-[#1f1f28] flex flex-col justify-between hover:border-[#2f2f3e] transition-all shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">Role Profile 2</span>
              <span className="text-xs font-mono text-[#8B8D98]">Target Exp: 0–1 Years</span>
            </div>
            <h2 className="text-xl font-bold text-white">UI/UX Designer Intern</h2>
            <p className="text-xs text-[#B0B3BE] leading-relaxed">
              Fully Remote position. Prioritizes Figma mastery (30 pts), user research & cognitive psychology principles (25 pts), design thinking, and tangible portfolio projects.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="px-2 py-0.5 rounded text-[11px] bg-[#14141a] text-[#B0B3BE] border border-[#272733]">Figma</span>
              <span className="px-2 py-0.5 rounded text-[11px] bg-[#14141a] text-[#B0B3BE] border border-[#272733]">User Research</span>
              <span className="px-2 py-0.5 rounded text-[11px] bg-[#14141a] text-[#B0B3BE] border border-[#272733]">Cognitive Psychology</span>
            </div>
          </div>
          <div className="pt-6 mt-4 border-t border-[#1f1f28] flex items-center justify-between">
            <span className="text-xs font-mono text-[#8B8D98]">
              Qualified: <span className="text-blue-400 font-bold">{stats.uiuxQualified}</span> candidates
            </span>
            <Link
              href="/rankings/uiux"
              className="px-3.5 py-1.5 rounded-md bg-[#14141a] hover:bg-[#1f1f28] text-white text-xs font-medium border border-[#272733] transition-colors"
            >
              View UI/UX Rankings →
            </Link>
          </div>
        </div>
      </div>

      {/* Dataset Register Table */}
      <div className="rounded-xl border border-[#1f1f28] bg-[#0d0d11] p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Candidate Inventory & Review Register</h3>
            <p className="text-xs text-[#8B8D98] mt-0.5">
              Click any candidate row to open the complete extraction dossier, dual evaluations, and source text.
            </p>
          </div>
          <span className="text-xs font-mono text-[#8B8D98]">
            Showing {candidates.length} candidates
          </span>
        </div>

        {error && (
          <div className="p-3 rounded bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1f1f28] bg-[#08080c] text-[11px] uppercase font-mono tracking-wider text-[#8B8D98]">
                <th className="py-2.5 px-3">Candidate Code</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">LCA Score</th>
                <th className="py-2.5 px-3">UI/UX Score</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Confidence</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f28] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8B8D98]">
                    Loading candidate register...
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8B8D98]">
                    No candidates found.
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openCandidateDrawer(c.id)}
                    className="hover:bg-[#14141c] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-white group-hover:text-[#FF5729]">
                      {c.candidate_code}
                    </td>
                    <td className="py-3 px-3">
                      {c.classification === 'LCA' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          LCA Consultant
                        </span>
                      )}
                      {c.classification === 'UI_UX' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          UI/UX Designer
                        </span>
                      )}
                      {c.classification === 'BOTH' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                          Dual Match
                        </span>
                      )}
                      {c.classification === 'NEITHER_OR_UNCERTAIN' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Uncertain / Review
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {c.lca_score !== null ? (
                        <span className={c.lca_score >= 55.0 ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                          {c.lca_score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-zinc-500">null</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {c.uiux_score !== null ? (
                        <span className={c.uiux_score >= 50.0 ? 'text-blue-400 font-bold' : 'text-zinc-400'}>
                          {c.uiux_score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-zinc-500">null</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#14141a] text-[#8B8D98] font-mono border border-[#272733]">
                        {c.processing_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span className="text-emerald-400">
                        {(c.extraction_confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCandidateDrawer(c.id);
                        }}
                        className="px-2 py-1 rounded text-xs text-[#8B8D98] group-hover:text-white group-hover:bg-[#1f1f28] transition-colors"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
