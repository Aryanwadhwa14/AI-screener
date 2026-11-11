'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconShieldCheck, IconLayers, IconSparkles } from '@/components/ui/icons';

export default function MethodologyPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="p-6">
          <Badge variant="secondary" className="font-mono text-[10px] w-fit mb-2">
            AI GOVERNANCE & EVALUATION ENGINE
          </Badge>
          <CardTitle className="text-2xl text-foreground">
            Screening Engine & Verification Architecture
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            Every candidate evaluation is computed deterministically from verified resume text. The system enforces strict provenance checking: unverified claims are rejected, and scoring formulas are executed via versioned, auditable Python algorithms.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Core Architectural Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 space-y-2 hover:border-foreground/20 transition-colors">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block font-semibold">
            Deterministic Engine
          </span>
          <h4 className="text-sm font-semibold text-foreground">Zero Non-Deterministic Drift</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Candidate extraction is validated with regex and string tokenization; scoring arithmetic is executed strictly in Python. Identical resume content yields an identical score and rank every single run.
          </p>
        </Card>

        <Card className="p-4 space-y-2 hover:border-foreground/20 transition-colors">
          <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 block font-semibold">
            Verbatim Verification
          </span>
          <h4 className="text-sm font-semibold text-foreground">Zero Hallucination Guarantee</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every skill and experience claim cited in a candidate dossier must exist verbatim in the source document. Any unverified citation is automatically pruned and reduces extraction confidence.
          </p>
        </Card>

        <Card className="p-4 space-y-2 hover:border-foreground/20 transition-colors">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 block font-semibold">
            Fairness & Audit
          </span>
          <h4 className="text-sm font-semibold text-foreground">Demographic Bias Immunity</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Candidate evaluations exclude demographic indicators (gender, age, ethnicity, photos). Empty or unreadable files produce an explicit null score with manual-review status rather than an arbitrary 0.
          </p>
        </Card>
      </div>

      {/* Requisition Evaluation Criteria Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Requisition 1 */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400">Requisition 01</span>
              <h3 className="text-sm font-bold text-foreground">Sustainability & LCA Specialist (100 Pts Max)</h3>
            </div>
            <Badge variant="success">Benchmark ≥ 55%</Badge>
          </div>

          <div className="space-y-2">
            {[
              {
                name: 'GaBi / SimaPro Tool Proficiency',
                weight: '35 pts',
                desc: 'Explicit verified experience with GaBi, SimaPro, OpenLCA, or certified LCA calculation suites.',
              },
              {
                name: 'ISO 14040 / 14044 Standards Conformance',
                weight: '25 pts',
                desc: 'Goal & scope definition, life cycle inventory (LCI), life cycle impact assessment (LCIA).',
              },
              {
                name: 'Relevant Professional Experience',
                weight: '20 pts',
                desc: 'Graded tenure scale targeting 2–3 years baseline environmental engineering background.',
              },
              {
                name: 'Educational Background',
                weight: '10 pts',
                desc: 'Degree in Environmental Engineering, Sustainability, Chemical Engineering, or related technical disciplines.',
              },
              {
                name: 'Domain Knowledge (EPD, GHG, Circularity)',
                weight: '5 pts',
                desc: 'Environmental Product Declarations, Scope 1/2/3 greenhouse gas accounting, circular economy.',
              },
              {
                name: 'Geographic Alignment (Chennai Onsite)',
                weight: '5 pts',
                desc: 'Willingness to relocate to Chennai or current residence in Tamil Nadu. Unknown values default neutrally to 2/5 pts.',
              },
            ].map((c, i) => (
              <div key={i} className="flex items-start justify-between p-2 rounded-md bg-muted/40 border">
                <div className="pr-3">
                  <div className="text-xs font-semibold text-foreground">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{c.desc}</div>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{c.weight}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Requisition 2 */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-blue-600 dark:text-blue-400">Requisition 02</span>
              <h3 className="text-sm font-bold text-foreground">Product & UI/UX Design Specialist (100 Pts Max)</h3>
            </div>
            <Badge variant="info">Benchmark ≥ 50%</Badge>
          </div>

          <div className="space-y-2">
            {[
              {
                name: 'Figma & Component Design Systems',
                weight: '30 pts',
                desc: 'Component libraries, auto-layout, design tokens, interactive prototyping, and handoff assets.',
              },
              {
                name: 'User Research & Cognitive Psychology',
                weight: '25 pts',
                desc: 'Usability testing, user journey mapping, behavioral economics, qualitative interviews.',
              },
              {
                name: 'Portfolio & Case Study Deliverables',
                weight: '20 pts',
                desc: 'Evidence of published wireframes, end-to-end design artifacts, design thinking case studies.',
              },
              {
                name: 'Professional / Internship Experience',
                weight: '15 pts',
                desc: 'Targeting 0–1 years practical experience in digital product design or high-growth environments.',
              },
              {
                name: 'Relevant Education / Human-Computer Interaction',
                weight: '10 pts',
                desc: 'Studies in Design, Cognitive Science, Computer Science, Human-Computer Interaction, or related.',
              },
            ].map((c, i) => (
              <div key={i} className="flex items-start justify-between p-2 rounded-md bg-muted/40 border">
                <div className="pr-3">
                  <div className="text-xs font-semibold text-foreground">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{c.desc}</div>
                </div>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">{c.weight}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 5-Tier Deterministic Tie-Breaking Protocol */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">5-Tier Deterministic Tie-Breaking Protocol</h3>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          When two or more candidates receive identical total scores, the screening engine breaks ties deterministically without randomness:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {[
            { step: '1', title: 'Total Fit Score', desc: 'Higher primary score ranks higher (null values placed last).' },
            { step: '2', title: 'Extraction Confidence', desc: 'Higher physical text verification confidence percentage.' },
            { step: '3', title: 'Core Tool Points', desc: 'Candidate with higher points on primary requirement (GaBi or Figma).' },
            { step: '4', title: 'Evidence Snippets', desc: 'Candidate with greater count of verified physical citations.' },
            { step: '5', title: 'Candidate Code', desc: 'Alphabetical deterministic sort by candidate ID (e.g. CAND-014 < CAND-017).' },
          ].map((tier, i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/40 border text-center">
              <span className="inline-block w-5 h-5 rounded-full bg-secondary text-[10px] font-mono font-bold text-secondary-foreground mb-1.5">
                {tier.step}
              </span>
              <div className="text-xs font-semibold text-foreground mb-1">{tier.title}</div>
              <div className="text-[10px] text-muted-foreground leading-normal">{tier.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
