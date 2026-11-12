'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CandidateDetailResponse, RoleKey } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  IconClose,
  IconDownload,
  IconRefresh,
  IconCheckCircle,
  IconAlertCircle,
  IconExternalLink,
  IconShieldCheck,
} from '@/components/ui/icons';

interface CandidateDrawerProps {
  candidateId: string | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function CandidateDrawer({
  candidateId,
  onClose,
  onRefresh,
}: CandidateDrawerProps) {
  const [data, setData] = useState<CandidateDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evaluations' | 'profile' | 'document' | 'audit'>('evaluations');
  const [activeRoleEvaluation, setActiveRoleEvaluation] = useState<RoleKey>('LCA');
  const [textViewMode, setTextViewMode] = useState<'normalized' | 'raw'>('normalized');
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!candidateId) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getCandidateDetail(candidateId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          if (res.uiux_score && (!res.lca_score || res.uiux_score > res.lca_score)) {
            setActiveRoleEvaluation('UI_UX');
          } else {
            setActiveRoleEvaluation('LCA');
          }
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load candidate details.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [candidateId]);

  if (!candidateId) return null;

  const handleRetry = async () => {
    if (!data) return;
    setIsRetrying(true);
    try {
      await api.retryProcessing(data.id);
      const updated = await api.getCandidateDetail(data.id);
      setData(updated);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setIsRetrying(false);
    }
  };

  const getScoreColor = (score: number | null, threshold: number) => {
    if (score === null || score === undefined) return 'text-muted-foreground';
    if (score >= threshold) return 'text-emerald-600 dark:text-emerald-400 font-bold';
    return 'text-muted-foreground';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl h-full bg-background border-l flex flex-col shadow-2xl text-left overflow-hidden">
        {/* Drawer Header */}
        <div className="p-5 border-b bg-card flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold font-mono text-foreground tracking-tight">
                {data ? data.candidate_code : 'Loading...'}
              </h2>
              {data && (
                <>
                  {data.classification === 'LCA' && <Badge variant="success">Sustainability & LCA</Badge>}
                  {data.classification === 'UI_UX' && <Badge variant="info">Product & UI/UX</Badge>}
                  {data.classification === 'BOTH' && <Badge variant="default">Multi-Disciplinary</Badge>}
                  {data.classification === 'NEITHER_OR_UNCERTAIN' && <Badge variant="secondary">Under Benchmark</Badge>}
                  <span className="text-[11px] font-mono text-muted-foreground px-1.5 py-0.5 rounded border bg-muted/50">
                    {data.processing_status}
                  </span>
                </>
              )}
            </div>
            {data?.document?.original_filename && (
              <p className="text-xs font-mono text-muted-foreground mt-1 truncate max-w-md">
                {data.document.original_filename}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {data && data.document?.access_url && (
              <a href={data.document.access_url} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                  <IconDownload size={13} />
                  <span>Resume</span>
                </Button>
              </a>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <IconClose size={16} />
            </Button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-5 border-b bg-muted/30 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`py-3 px-3 font-medium border-b-2 transition-all ${
              activeTab === 'evaluations'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Requisition Scoring & Evidence
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 font-medium border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Structured Profile
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={`py-3 px-3 font-medium border-b-2 transition-all ${
              activeTab === 'document'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Source Resume Text
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 font-medium border-b-2 transition-all ${
              activeTab === 'audit'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Audit & Confidence
            {data?.warnings && data.warnings.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono">
                {data.warnings.length}
              </span>
            )}
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <span className="text-xs text-muted-foreground font-mono">Loading dossier...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* TAB 1: Role Scoring & Evidence */}
              {activeTab === 'evaluations' && (
                <div className="space-y-4">
                  {/* Position Selector Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setActiveRoleEvaluation('LCA')}
                      className={`cursor-pointer p-3.5 rounded-lg border transition-all ${
                        activeRoleEvaluation === 'LCA'
                          ? 'border-primary bg-muted/60 shadow-sm'
                          : 'bg-card hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono uppercase text-muted-foreground">Requisition 01</span>
                        <span className="text-muted-foreground font-mono">Bench ≥ 55%</span>
                      </div>
                      <div className="text-xs font-semibold text-foreground mt-1">
                        Sustainability & LCA Specialist
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-xl font-mono ${getScoreColor(data.lca_score, 55.0)}`}>
                          {data.lca_score !== null ? `${data.lca_score.toFixed(1)} / 100` : 'Unavailable'}
                        </span>
                        {data.lca_evaluation?.is_qualified && (
                          <Badge variant="success">QUALIFIED</Badge>
                        )}
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveRoleEvaluation('UI_UX')}
                      className={`cursor-pointer p-3.5 rounded-lg border transition-all ${
                        activeRoleEvaluation === 'UI_UX'
                          ? 'border-primary bg-muted/60 shadow-sm'
                          : 'bg-card hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono uppercase text-muted-foreground">Requisition 02</span>
                        <span className="text-muted-foreground font-mono">Bench ≥ 50%</span>
                      </div>
                      <div className="text-xs font-semibold text-foreground mt-1">
                        Product & UI/UX Design Specialist
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-xl font-mono ${getScoreColor(data.uiux_score, 50.0)}`}>
                          {data.uiux_score !== null ? `${data.uiux_score.toFixed(1)} / 100` : 'Unavailable'}
                        </span>
                        {data.uiux_evaluation?.is_qualified && (
                          <Badge variant="info">QUALIFIED</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Active Evaluation Criteria Breakdown */}
                  {(() => {
                    const evalObj =
                      activeRoleEvaluation === 'LCA' ? data.lca_evaluation : data.uiux_evaluation;
                    if (!evalObj) {
                      return (
                        <div className="p-8 text-center rounded-lg border bg-muted/20 text-muted-foreground text-xs">
                          Evaluation data not available for this requisition.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="p-3.5 rounded-lg bg-card border space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground">Evaluation Summary</span>
                            <span className="text-[11px] font-mono text-muted-foreground">Engine: {evalObj.scoring_version}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {evalObj.summary || 'Computed deterministically from verified source evidence.'}
                          </p>
                        </div>

                        {/* Breakdown List */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
                            Criterion-by-Criterion Scoring & Evidence Provenance
                          </span>

                          {Object.values(evalObj.breakdown).map((crit) => {
                            const weightedContrib = ((crit.score / 100) * crit.weight).toFixed(1);
                            return (
                              <div
                                key={crit.criterion_key}
                                className="p-3.5 rounded-lg bg-card border space-y-1.5"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">{crit.criterion_name}</span>
                                    <span className="text-[11px] font-mono text-muted-foreground">({crit.weight} pts)</span>
                                  </div>
                                  <div className="flex items-center gap-3 font-mono text-xs">
                                    <span className="text-muted-foreground">{crit.score}/100</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">+{weightedContrib} pts</span>
                                  </div>
                                </div>

                                {crit.notes && (
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">{crit.notes}</p>
                                )}

                                {/* Cited Evidence Snippets */}
                                {crit.evidence && crit.evidence.length > 0 && (
                                  <div className="mt-2 pt-2 border-t space-y-1.5">
                                    <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                                      Verbatim Source Citation (Physical Provenance):
                                    </span>
                                    {crit.evidence.map((snip, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs font-mono text-foreground bg-muted/60 border-l-2 border-emerald-500 px-3 py-2 rounded-r-md flex items-start gap-1.5"
                                      >
                                        <span className="break-words italic">"{snip}"</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 2: Structured Profile */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  {data.profile ? (
                    <>
                      {/* Metric Row */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-card border">
                          <span className="text-[10px] font-mono uppercase text-muted-foreground block">Total Experience</span>
                          <span className="text-base font-bold font-mono text-foreground mt-0.5 block">
                            {data.profile.total_years_experience !== null && data.profile.total_years_experience !== undefined
                              ? `${data.profile.total_years_experience} Years`
                              : 'Unknown'}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-card border">
                          <span className="text-[10px] font-mono uppercase text-muted-foreground block">Relocation Status</span>
                          <span className="text-xs font-mono font-semibold text-foreground mt-1 block">
                            {data.profile.relocation_willingness || 'UNKNOWN'}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-card border">
                          <span className="text-[10px] font-mono uppercase text-muted-foreground block">Extraction Confidence</span>
                          <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                            {data.profile.extraction_confidence != null
                              ? `${(data.profile.extraction_confidence * 100).toFixed(0)}%`
                              : '100%'}
                          </span>
                        </div>
                      </div>

                      {/* Tools & Skills */}
                      <div className="p-4 rounded-lg bg-card border space-y-3">
                        <div>
                          <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold block mb-2">
                            Extracted Tools & Technologies
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {(data.profile.tools_and_technologies || []).map((t, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-muted border text-xs font-mono text-foreground">
                                {t}
                              </span>
                            ))}
                            {(!data.profile.tools_and_technologies || data.profile.tools_and_technologies.length === 0) && (
                              <span className="text-xs text-muted-foreground">None extracted</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold block mb-2">
                            Skills & Domains
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {(data.profile.skills || []).map((s, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-muted/60 border text-[11px] text-muted-foreground">
                                {s}
                              </span>
                            ))}
                            {(!data.profile.skills || data.profile.skills.length === 0) && (
                              <span className="text-xs text-muted-foreground">None extracted</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Work Experience */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-mono uppercase text-muted-foreground block">Employment History</span>
                        {(data.profile.work_experience || []).map((exp, idx) => (
                          <div key={idx} className="p-3.5 rounded-lg bg-card border space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-foreground">{exp.role_title || 'Role'}</span>
                              <span className="font-mono text-muted-foreground text-[11px]">
                                {exp.start_date || 'N/A'} — {exp.is_current ? 'Present' : exp.end_date || 'N/A'}
                              </span>
                            </div>
                            {exp.company_or_org && (
                              <p className="text-xs text-foreground/80">{exp.company_or_org}</p>
                            )}
                            {exp.responsibilities && exp.responsibilities.length > 0 && (
                              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 pt-1">
                                {(exp.responsibilities || []).map((r, rIdx) => (
                                  <li key={rIdx}>{r}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                        {(!data.profile.work_experience || data.profile.work_experience.length === 0) && (
                          <div className="p-3 rounded-lg border text-xs text-muted-foreground">
                            No employment history recorded.
                          </div>
                        )}
                      </div>

                      {/* Education */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-mono uppercase text-muted-foreground block">Education</span>
                        {(data.profile.education || []).map((edu, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-card border flex justify-between items-center text-xs">
                            <div>
                              <span className="font-medium text-foreground block">
                                {edu.degree || 'Degree'} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                              </span>
                              <span className="text-[11px] text-muted-foreground">{edu.institution || 'Unknown Institution'}</span>
                            </div>
                            {edu.graduation_year && (
                              <span className="font-mono text-muted-foreground">{edu.graduation_year}</span>
                            )}
                          </div>
                        ))}
                        {(!data.profile.education || data.profile.education.length === 0) && (
                          <div className="p-3 rounded-lg border text-xs text-muted-foreground">
                            No education entries recorded.
                          </div>
                        )}
                      </div>

                      {/* Portfolio Links */}
                      {(data.profile.portfolio_links || []).length > 0 && (
                        <div className="p-3.5 rounded-lg bg-card border space-y-1.5">
                          <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold block">Portfolio Deliverables</span>
                          <div className="space-y-1">
                            {(data.profile.portfolio_links || []).map((link, idx) => (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate"
                              >
                                <IconExternalLink size={12} />
                                <span>{link}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center rounded-lg border text-muted-foreground text-xs">
                      Structured profile is not yet extracted for this candidate.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Source Resume Text */}
              {activeTab === 'document' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border text-xs">
                    <span className="font-mono text-muted-foreground">
                      Parser: {data.extracted_text?.parser_name || 'N/A'} • Size: {(((data.document?.file_size || 0)) / 1024).toFixed(1)} KB
                    </span>

                    <div className="flex items-center gap-1 border rounded p-0.5 bg-muted">
                      <button
                        onClick={() => setTextViewMode('normalized')}
                        className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
                          textViewMode === 'normalized'
                            ? 'bg-background text-foreground font-medium shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Normalized Text
                      </button>
                      <button
                        onClick={() => setTextViewMode('raw')}
                        className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
                          textViewMode === 'raw'
                            ? 'bg-background text-foreground font-medium shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Raw Extracted
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/40 border font-mono text-[11px] text-foreground/80 max-h-[460px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                    {textViewMode === 'normalized'
                      ? data.extracted_text?.normalized_text || '(Empty text)'
                      : data.extracted_text?.raw_text || '(Empty text)'}
                  </div>
                </div>
              )}

              {/* TAB 4: Audit & Warnings */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-card border flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">Extraction Confidence Score</h4>
                      <p className="text-[11px] text-muted-foreground">Reflects verified physical text density against unverified claims</p>
                    </div>
                    <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {((data.profile?.extraction_confidence ?? 1.0) * 100).toFixed(0)}%
                    </span>
                  </div>

                  {data.warnings && data.warnings.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono uppercase text-amber-600 dark:text-amber-400 block font-semibold">Parser Warnings</span>
                      {(data.warnings || []).map((w, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                          <IconAlertCircle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                      <IconCheckCircle size={14} className="text-emerald-500" />
                      <span>Zero parser warnings or extraction flags recorded for this candidate.</span>
                    </div>
                  )}

                  {data.profile?.unsupported_claims && data.profile.unsupported_claims.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-mono uppercase text-destructive block font-semibold">Unsupported Extracted Claims</span>
                      {(data.profile.unsupported_claims || []).map((claim, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-destructive/10 border border-destructive/20 text-xs text-destructive font-mono">
                          {claim}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRetry}
                      disabled={isRetrying}
                      className="gap-1.5"
                    >
                      <IconRefresh size={13} className={isRetrying ? 'animate-spin' : ''} />
                      <span>{isRetrying ? 'Reprocessing...' : 'Re-run Evaluation'}</span>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
