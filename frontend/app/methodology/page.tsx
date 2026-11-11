'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MethodologyPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="p-6">
          <Badge variant="default" className="font-mono text-[10px] w-fit mb-2">
            GOVERNANCE & AUDIT TRAIL
          </Badge>
          <CardTitle className="text-xl text-white">
            Scoring Methodology & Verification Rules
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            Grounded directly in canonical Job Descriptions: JD1 (Life Cycle Assessment Consultant) and JD2 (UI/UX Design Intern).
            Every score is calculated deterministically in Python from verified physical resume text snippets; LLMs do not invent or interpolate scores.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Core Architectural Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 block font-semibold">
            Deterministic Engine
          </span>
          <h4 className="text-sm font-semibold text-white">Zero Non-Deterministic Scoring</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            LLMs extract structured candidate facts and quote source snippets; Python scoring algorithms independently calculate all final scores. Identical input yields identical rank every time.
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 block font-semibold">
            Verbatim Verification
          </span>
          <h4 className="text-sm font-semibold text-white">Zero Hallucination Tolerance</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Every claim cited in candidate evaluations must match the resume text verbatim. Unverified claims are stripped and penalize extraction confidence.
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 block font-semibold">
            Fairness & Unknowns
          </span>
          <h4 className="text-sm font-semibold text-white">Non-Punitive Unknown Handling</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Empty documents and failed extractions receive a null score and manual-review status (never zero). Missing relocation willingness is marked UNKNOWN and given neutral credit (never assumed False).
          </p>
        </Card>
      </div>

      {/* Role Scoring Criteria Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LCA Criteria */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-[#FF5729]">Role 1 Criteria</span>
              <h3 className="text-sm font-bold text-white">LCA Consultant (100 Pts Max)</h3>
            </div>
            <Badge variant="success">Threshold 55.0</Badge>
          </div>

          <div className="space-y-2">
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
              <div key={idx} className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80 flex justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-zinc-200 block">{crit.name}</span>
                  <p className="text-[11px] text-zinc-400">{crit.desc}</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#FF5729] shrink-0">{crit.weight}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* UI/UX Criteria */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-blue-400">Role 2 Criteria</span>
              <h3 className="text-sm font-bold text-white">UI/UX Designer Intern (100 Pts Max)</h3>
            </div>
            <Badge variant="info">Threshold 50.0</Badge>
          </div>

          <div className="space-y-2">
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
              <div key={idx} className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80 flex justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-zinc-200 block">{crit.name}</span>
                  <p className="text-[11px] text-zinc-400">{crit.desc}</p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400 shrink-0">{crit.weight}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 5-Tier Tie-Breaking Protocol */}
      <Card className="p-5 space-y-3">
        <CardTitle className="text-sm text-white">Deterministic 5-Tier Tie-Breaking Protocol</CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          When candidates achieve identical scores, ranks are determined deterministically using the following cascading hierarchy:
        </CardDescription>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
          <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#FF5729]">Tier 1</span>
            <div className="text-xs font-medium text-zinc-200">Role Match Score</div>
            <span className="text-[10px] text-zinc-400 block">Descending (null last)</span>
          </div>

          <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#FF5729]">Tier 2</span>
            <div className="text-xs font-medium text-zinc-200">Extraction Confidence</div>
            <span className="text-[10px] text-zinc-400 block">Descending</span>
          </div>

          <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#FF5729]">Tier 3</span>
            <div className="text-xs font-medium text-zinc-200">Primary Criterion Score</div>
            <span className="text-[10px] text-zinc-400 block">GaBi / Figma</span>
          </div>

          <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#FF5729]">Tier 4</span>
            <div className="text-xs font-medium text-zinc-200">Verified Snippet Count</div>
            <span className="text-[10px] text-zinc-400 block">Descending</span>
          </div>

          <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#FF5729]">Tier 5</span>
            <div className="text-xs font-medium text-zinc-200">Candidate Code</div>
            <span className="text-[10px] text-zinc-400 block">Ascending (CAND-001)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
