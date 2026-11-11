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
  IconBriefcase,
  IconFileText,
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
    if (score === null || score === undefined) return 'text-zinc-500';
    if (score >= threshold) return 'text-emerald-400 font-bold';
    return 'text-zinc-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl h-full bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl text-left overflow-hidden">
        {/* Drawer Header */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-950 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold font-mono text-zinc-100 tracking-tight">
                {data ? data.candidate_code : 'Loading...'}
              </h2>
              {data && (
                <>
                  {data.classification === 'LCA' && <Badge variant="success">Sustainability & LCA</Badge>}
                  {data.classification === 'UI_UX' && <Badge variant="info">Product & UI/UX</Badge>}
                  {data.classification === 'BOTH' && <Badge variant="default">Multi-Disciplinary</Badge>}
                  {data.classification === 'NEITHER_OR_UNCERTAIN' && <Badge variant="secondary">Under Benchmark</Badge>}
                  <span className="text-[11px] font-mono text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900/60">
                    {data.processing_status}
                  </span>
                </>
              )}
            </div>
            {data?.document?.original_filename && (
              <p className="text-xs font-mono text-zinc-500 mt-1 truncate max-w-md">
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
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-zinc-400 hover:text-white">
              <IconClose size={16} />
            </Button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-5 border-b border-zinc-800/80 bg-zinc-900/30 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`py-3 px-3 font-medium border-b-2 transition-all ${activeTab === 'evaluations'
                ? 'border-zinc-100 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
          >
            Requisition Scoring & Evidence
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 font-medium border-b-2 transition-all ${activeTab === 'profile'
                ? 'border-zinc-100 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
          >
            Structured Profile
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={`py-3 px-3 font-medium border-b-2 transition-all ${activeTab === 'document'
                ? 'border-zinc-100 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
          >
            Source Resume Text
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 font-medium border-b-2 transition-all ${activeTab === 'audit'
                ? 'border-zinc-100 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
          >
            Audit & Confidence
            {data && data.warnings.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                {data.warnings.length}
              </span>
            )}
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <span className="text-xs text-zinc-500 font-mono">Loading dossier...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300">
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
                      className={`cursor-pointer p-3.5 rounded-lg border transition-all ${activeRoleEvaluation === 'LCA'
                          ? 'border-zinc-300 bg-zinc-900/90 shadow-sm'
                          : 'border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700'
                        }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono uppercase text-zinc-400">Requisition 01</span>
                        <span className="text-zinc-500 font-mono">Bench ≥ 55%</span>
                      </div>
                      <div className="text-xs font-semibold text-zinc-200 mt-1">
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
                      className={`cursor-pointer p-3.5 rounded-lg border transition-all ${activeRoleEvaluation === 'UI_UX'
                          ? 'border-zinc-300 bg-zinc-900/90 shadow-sm'
                          : 'border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700'
                        }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono uppercase text-zinc-400">Requisition 02</span>
                        <span className="text-zinc-500 font-mono">Bench ≥ 50%</span>
                      </div>
                      <div className="text-xs font-semibold text-zinc-200 mt-1">
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
                        <div className="p-8 text-center rounded-lg border border-zinc-800 bg-zinc-950/40 text-zinc-500 text-xs">
                          Evaluation data not available for this requisition.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="p-3.5 rounded-lg bg-zinc-900/30 border border-zinc-800/80 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-zinc-200">Evaluation Summary</span>
                            <span className="text-[11px] font-mono text-zinc-500">Engine: {evalObj.scoring_version}</span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {evalObj.summary || 'Computed deterministically from verified source evidence.'}
                          </p>
                        </div>

                        {/* Breakdown List */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">
                            Criterion-by-Criterion Scoring & Evidence Provenance
                          </span>

                          {Object.values(evalObj.breakdown).map((crit) => {
                            const weightedContrib = ((crit.score / 100) * crit.weight).toFixed(1);
                            return (
                              <div
                                key={crit.criterion_key}
                                className="p-3.5 rounded-lg bg-zinc-900/30 border border-zinc-800/80 space-y-1.5"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-zinc-200">{crit.criterion_name}</span>
                                    <span className="text-[11px] font-mono text-zinc-500">({crit.weight} pts)</span>
                                  </div>
                                  <div className="flex items-center gap-3 font-mono text-xs">
                                    <span className="text-zinc-400">{crit.score}/100</span>
                                    <span className="font-bold text-emerald-400">+{weightedContrib} pts</span>
                                  </div>
                                </div>

                                {crit.notes && (
                                  <p className="text-[11px] text-zinc-400 leading-relaxed">{crit.notes}</p>
                                )}

                                {/* Cited Evidence Snippets */}
                                {crit.evidence && crit.evidence.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-zinc-800/60 space-y-1.5">
                                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                                      Verbatim Source Citation (Physical Provenance):
                                    </span>
                                    {crit.evidence.map((snip, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs font-mono text-zinc-300 bg-zinc-950/80 border-l-2 border-emerald-500 px-3 py-2 rounded-r-md flex items-start gap-1.5"
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
                        <div className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/80">
                          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Total Experience</span>
                          <span className="text-base font-bold font-mono text-zinc-200 mt-0.5 block">
                            {data.profile.total_years_experience !== null
                              ? `${data.profile.total_years_experience} Years`
                              : 'Unknown'}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/80">
                          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Relocation Status</span>
                          <span className="text-xs font-mono font-semibold text-zinc-300 mt-1 block">
                            {data.profile.relocation_willingness || 'UNKNOWN'}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/80">
                          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Extraction Confidence</span>
                          <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
                            {(data.profile.extraction_confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Tools & Skills */}
                      <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/80 space-y-3">
                        <div>
                          <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block mb-2">
                            Extracted Tools & Technologies
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {data.profile.tools_and_technologies.map((t, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200">
                                {t}
                              </span>
                            ))}
                            {data.profile.tools_and_technologies.length === 0 && (
                              <span className="text-xs text-zinc-500">None extracted</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block mb-2">
                            Skills & Domains
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {data.profile.skills.map((s, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-300">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Work Experience */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-mono uppercase text-zinc-500 block">Employment History</span>
                        {data.profile.work_experience.map((exp, idx) => (
                          <div key={idx} className="p-3.5 rounded-lg bg-zinc-900/30 border border-zinc-800/80 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-zinc-100">{exp.role_title}</span>
                              <span className="font-mono text-zinc-500 text-[11px]">
                                {exp.start_date || 'N/A'} — {exp.is_current ? 'Present' : exp.end_date || 'N/A'}
                              </span>
                            </div>
                            {exp.company_or_org && (
                              <p className="text-xs text-zinc-300">{exp.company_or_org}</p>
                            )}
                            {exp.responsibilities && exp.responsibilities.length > 0 && (
                              <ul className="list-disc list-inside text-xs text-zinc-400 space-y-0.5 pt-1">
                                {exp.responsibilities.map((r, rIdx) => (
                                  <li key={rIdx}>{r}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Education */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-mono uppercase text-zinc-500 block">Education</span>
                        {data.profile.education.map((edu, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/80 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-medium text-zinc-200 block">
                                {edu.degree || 'Degree'} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                              </span>
                              <span className="text-[11px] text-zinc-500">{edu.institution || 'Unknown Institution'}</span>
                            </div>
                            {edu.graduation_year && (
                              <span className="font-mono text-zinc-400">{edu.graduation_year}</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Portfolio Links */}
                      {data.profile.portfolio_links.length > 0 && (
                        <div className="p-3.5 rounded-lg bg-zinc-900/30 border border-zinc-800/80 space-y-1.5">
                          <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block">Portfolio Deliverables</span>
                          <div className="space-y-1">
                            {data.profile.portfolio_links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1 truncate"
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
                    <div className="p-8 text-center rounded-lg border border-zinc-800 text-zinc-500 text-xs">
                      Structured profile is not yet extracted for this candidate.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Source Resume Text */}
              {activeTab === 'document' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-800/80 text-xs">
                    <span className="font-mono text-zinc-400">
                      Parser: {data.extracted_text.parser_name || 'N/A'} • Size: {(data.document.file_size / 1024).toFixed(1)} KB
                    </span>

                    <div className="flex items-center gap-1 border border-zinc-800 rounded p-0.5 bg-zinc-950">
                      <button
                        onClick={() => setTextViewMode('normalized')}
                        className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${textViewMode === 'normalized'
                            ? 'bg-zinc-800 text-white font-medium'
                            : 'text-zinc-400 hover:text-white'
                          }`}
                      >
                        Normalized Text
                      </button>
                      <button
                        onClick={() => setTextViewMode('raw')}
                        className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${textViewMode === 'raw'
                            ? 'bg-zinc-800 text-white font-medium'
                            : 'text-zinc-400 hover:text-white'
                          }`}
                      >
                        Raw Extracted
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-400 max-h-[460px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                    {textViewMode === 'normalized'
                      ? data.extracted_text.normalized_text || '(Empty text)'
                      : data.extracted_text.raw_text || '(Empty text)'}
                  </div>
                </div>
              )}

              {/* TAB 4: Audit & Warnings */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-100">Extraction Confidence Score</h4>
                      <p className="text-[11px] text-zinc-400">Reflects verified physical text density against unverified claims</p>
                    </div>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {((data.profile?.extraction_confidence ?? 1.0) * 100).toFixed(0)}%
                    </span>
                  </div>

                  {data.warnings && data.warnings.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono uppercase text-amber-400 block font-semibold">Parser Warnings</span>
                      {data.warnings.map((w, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-xs text-amber-300 flex items-start gap-2">
                          <IconAlertCircle size={14} className="shrink-0 mt-0.5 text-amber-400" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300 flex items-center gap-2">
                      <IconCheckCircle size={14} className="text-emerald-400" />
                      <span>Zero parser warnings or extraction flags recorded for this candidate.</span>
                    </div>
                  )}

                  {data.profile?.unsupported_claims && data.profile.unsupported_claims.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-mono uppercase text-rose-400 block font-semibold">Unsupported Extracted Claims</span>
                      {data.profile.unsupported_claims.map((claim, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-rose-950/20 border border-rose-900/40 text-xs text-rose-300 font-mono">
                          {claim}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-zinc-800 flex justify-end">
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
