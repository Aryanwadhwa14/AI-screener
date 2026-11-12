'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconShieldCheck, IconLayers, IconSparkles } from '@/components/ui/icons';

export default function MethodologyPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Evaluation Methodology
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Deterministic scoring formulas and verifiable citation rules used to rank candidates.
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 space-y-1.5 hover:border-foreground/20 transition-colors">
          <div className="text-xs font-semibold text-foreground">Deterministic Scoring</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All final scores are computed using versioned mathematical formulas. Identical resume data produces identical rank every run.
          </p>
        </Card>

        <Card className="p-4 space-y-1.5 hover:border-foreground/20 transition-colors">
          <div className="text-xs font-semibold text-foreground">Verified Evidence</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every claimed tool, standard, or experience is matched verbatim against the uploaded resume text. Unverified claims are discarded.
          </p>
        </Card>

        <Card className="p-4 space-y-1.5 hover:border-foreground/20 transition-colors">
          <div className="text-xs font-semibold text-foreground">Neutral Unknowns</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Empty documents receive a null score and manual-review flag. Unstated relocation defaults to neutral credit.
          </p>
        </Card>
      </div>

      {/* Role Criteria Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LCA */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b">
            <div>
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Role 1</span>
              <h3 className="text-sm font-semibold text-foreground">LCA Consultant</h3>
            </div>
            <Badge variant="success">Pass: ≥ 55%</Badge>
          </div>

          <div className="space-y-1.5 text-xs">
            {[
              { name: 'GaBi / SimaPro Modeling', pts: '35 pts', note: 'Hands-on modeling tool experience' },
              { name: 'ISO 14040 / 14044 Conformance', pts: '25 pts', note: 'Life cycle assessment standards & LCIA' },
              { name: 'Professional Experience', pts: '20 pts', note: 'Targeting 2–3 years baseline experience' },
              { name: 'Relevant Education', pts: '10 pts', note: 'Environmental or chemical engineering degree' },
              { name: 'EPD & GHG Accounting', pts: '5 pts', note: 'Declarations and carbon calculations' },
              { name: 'Chennai Onsite Alignment', pts: '5 pts', note: 'Willingness to work onsite (neutral if unstated)' },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/40 text-xs">
                <div>
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="text-[11px] text-muted-foreground block">{c.note}</span>
                </div>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">{c.pts}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* UI/UX */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b">
            <div>
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Role 2</span>
              <h3 className="text-sm font-semibold text-foreground">UI/UX Design Intern</h3>
            </div>
            <Badge variant="info">Pass: ≥ 50%</Badge>
          </div>

          <div className="space-y-1.5 text-xs">
            {[
              { name: 'Figma & Design Systems', pts: '30 pts', note: 'Component libraries and interactive prototypes' },
              { name: 'User Research & Psychology', pts: '25 pts', note: 'Usability testing, interviews, cognitive design' },
              { name: 'Portfolio & Case Studies', pts: '20 pts', note: 'Documented design artifacts and deliverables' },
              { name: 'Relevant Experience', pts: '15 pts', note: 'Targeting 0–1 years practical design background' },
              { name: 'Design / HCI Education', pts: '10 pts', note: 'Degree or coursework in design / HCI' },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/40 text-xs">
                <div>
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="text-[11px] text-muted-foreground block">{c.note}</span>
                </div>
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 shrink-0">{c.pts}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tie Breaking */}
      <Card className="p-4">
        <h3 className="text-xs font-semibold text-foreground mb-1">5-Tier Tie-Breaking Sequence</h3>
        <p className="text-xs text-muted-foreground mb-3">
          When candidates tie on total score, the following deterministic rules determine rank order:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
          {[
            { step: '1', label: 'Primary Score', desc: 'Highest overall score' },
            { step: '2', label: 'Confidence', desc: 'Text verification rate' },
            { step: '3', label: 'Core Skill', desc: 'GaBi or Figma points' },
            { step: '4', label: 'Citations', desc: 'Verified snippet count' },
            { step: '5', label: 'ID Alpha', desc: 'Deterministic candidate code' },
          ].map((t, idx) => (
            <div key={idx} className="p-2.5 rounded bg-muted/30 border text-center">
              <span className="text-[10px] font-mono text-muted-foreground font-semibold block mb-0.5">Tier {t.step}</span>
              <div className="font-medium text-foreground text-xs">{t.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
