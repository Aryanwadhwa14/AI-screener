'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MethodologyResponse } from '@/lib/types';

export default function MethodologyPage() {
  const [methodology, setMethodology] = useState<MethodologyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getMethodology()
      .then((res) => {
        if (isMounted) setMethodology(res);
      })
      .catch((err) => {
        console.warn('Could not load dynamic methodology from backend:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-xl bg-[#0d0d11] border border-[#1f1f28] shadow-xl">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#FF5729]/15 text-[#FF5729] border border-[#FF5729]/30 mb-2">
          GOVERNANCE & TRANSPARENCY
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Scoring Methodology & Evidence Verification Rules
        </h1>
        <p className="text-xs sm:text-sm text-[#8B8D98] mt-1 max-w-3xl leading-relaxed">
          Grounded directly in the canonical Job Descriptions (JD1: LCA Consultant and JD2: UI/UX Designer Intern).
          Every score is deterministic, reproducible in Python, and mathematically auditable from verified source text.
        </p>
      </div>

      {/* Core Architectural Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#0d0d11] border border-[#1f1f28] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-sm">
            ✓
          </div>
          <h3 className="text-sm font-bold text-white">Deterministic Scoring Engine</h3>
          <p className="text-xs text-[#8B8D98] leading-relaxed">
            LLMs extract structured candidate facts and quote source snippets; Python scoring algorithms independently calculate all final scores. Identical input yields identical rank every time.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#0d0d11] border border-[#1f1f28] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-sm">
            🔍
          </div>
          <h3 className="text-sm font-bold text-white">Verbatim Evidence Verification</h3>
          <p className="text-xs text-[#8B8D98] leading-relaxed">
            Zero hallucination tolerance: Every claim cited in candidate evaluations must match the resume text verbatim. Unverified claims are stripped and penalize extraction confidence.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#0d0d11] border border-[#1f1f28] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold text-sm">
            ⚖
          </div>
          <h3 className="text-sm font-bold text-white">Non-Punitive Unknown Handling</h3>
          <p className="text-xs text-[#8B8D98] leading-relaxed">
            Empty documents and failed extractions receive a null score and manual-review status (never zero). Missing relocation willingness is marked UNKNOWN and given neutral credit.
          </p>
        </div>
      </div>

      {/* Role Scoring Criteria Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LCA Criteria */}
        <div className="rounded-xl border border-[#1f1f28] bg-[#0d0d11] p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f1f28]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#FF5729]">Role 1 Criteria</span>
              <h3 className="text-lg font-bold text-white">LCA Consultant (100 Pts Max)</h3>
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded bg-[#14141a] text-emerald-400 border border-[#272733]">
              Threshold: 55.0 Pts
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                name: 'GaBi / SimaPro Tool Proficiency',
                weight: '35 pts',
                desc: 'Explicit mentions of GaBi, SimaPro, OpenLCA, or certified LCA calculation packages.',
              },
              {
                name: 'ISO 14040 / 14044 Standards Conformance',
                weight: '25 pts',
                desc: 'Goal & scope definition, life cycle inventory (LCI), life cycle impact assessment (LCIA).',
              },
              {
                name: 'Relevant Professional Experience',
                weight: '20 pts',
                desc: '2–3 years baseline per canonical JD1 lines 29–30. Graded scale based on verified tenure.',
              },
              {
                name: 'Educational Background',
                weight: '10 pts',
                desc: 'Degree in Environmental Engineering, Sustainability, Chemical Engineering, or related.',
              },
              {
                name: 'Domain Knowledge (EPD, GHG, Circularity)',
                weight: '5 pts',
                desc: 'Environmental Product Declarations, Scope 1/2/3 greenhouse gas accounting.',
              },
              {
                name: 'Chennai Onsite Relocation Willingness',
                weight: '5 pts',
                desc: 'Chennai local (5 pts), UNKNOWN (2 pts neutral), Explicit refusal (0 pts). Never infer false.',
              },
            ].map((crit, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#070709] border border-[#1f1f28] flex justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white block">{crit.name}</span>
                  <p className="text-[11px] text-[#8B8D98]">{crit.desc}</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#FF5729] shrink-0">{crit.weight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* UI/UX Criteria */}
        <div className="rounded-xl border border-[#1f1f28] bg-[#0d0d11] p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f1f28]">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-400">Role 2 Criteria</span>
              <h3 className="text-lg font-bold text-white">UI/UX Designer Intern (100 Pts Max)</h3>
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded bg-[#14141a] text-blue-400 border border-[#272733]">
              Threshold: 50.0 Pts
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                name: 'Figma & Design Tooling Mastery',
                weight: '30 pts',
                desc: 'Proficiency in Figma (auto-layout, design systems, interactive prototyping, components).',
              },
              {
                name: 'User Research & Cognitive Psychology',
                weight: '25 pts',
                desc: 'User testing, cognitive biases, mental models, empathy mapping, heuristic evaluations.',
              },
              {
                name: 'Target Experience Alignment',
                weight: '20 pts',
                desc: '0–1 years target intern experience per JD2 line 19. Designed specifically for early-career.',
              },
              {
                name: 'Education / Design Coursework',
                weight: '10 pts',
                desc: 'HCI, Design, Computer Science, Psychology, or certified UI/UX bootcamps.',
              },
              {
                name: 'Tangible Projects & Portfolio Deliverables',
                weight: '15 pts',
                desc: 'Case studies, mobile/web mockups, Behance/Dribbble/Notion/portfolio URLs.',
              },
            ].map((crit, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#070709] border border-[#1f1f28] flex justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white block">{crit.name}</span>
                  <p className="text-[11px] text-[#8B8D98]">{crit.desc}</p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400 shrink-0">{crit.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5-Tier Tie-Breaking Protocol */}
      <div className="rounded-xl border border-[#1f1f28] bg-[#0d0d11] p-6 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-white">Deterministic 5-Tier Ranking Protocol</h3>
        <p className="text-xs text-[#8B8D98]">
          When candidates achieve identical scores, ranks are determined deterministically using the following cascading hierarchy:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-[#070709] border border-[#1f1f28] text-center space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#FF5729]">Tier 1</span>
            <div className="text-xs font-bold text-white">Role Match Score</div>
            <span className="text-[10px] text-[#8B8D98] block">Descending (null last)</span>
          </div>

          <div className="p-3 rounded-lg bg-[#070709] border border-[#1f1f28] text-center space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#FF5729]">Tier 2</span>
            <div className="text-xs font-bold text-white">Extraction Confidence</div>
            <span className="text-[10px] text-[#8B8D98] block">Descending</span>
          </div>

          <div className="p-3 rounded-lg bg-[#070709] border border-[#1f1f28] text-center space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#FF5729]">Tier 3</span>
            <div className="text-xs font-bold text-white">Primary Criterion Score</div>
            <span className="text-[10px] text-[#8B8D98] block">GaBi / Figma</span>
          </div>

          <div className="p-3 rounded-lg bg-[#070709] border border-[#1f1f28] text-center space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#FF5729]">Tier 4</span>
            <div className="text-xs font-bold text-white">Verified Snippet Count</div>
            <span className="text-[10px] text-[#8B8D98] block">Descending</span>
          </div>

          <div className="p-3 rounded-lg bg-[#070709] border border-[#1f1f28] text-center space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#FF5729]">Tier 5</span>
            <div className="text-xs font-bold text-white">Candidate Code</div>
            <span className="text-[10px] text-[#8B8D98] block">Ascending (e.g. CAND-001)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

