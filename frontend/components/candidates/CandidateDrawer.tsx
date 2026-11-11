'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CandidateDetailResponse, RoleKey } from '@/lib/types';

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
          // Auto-select whichever evaluation has higher score or exists
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

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'LCA':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">LCA Consultant</span>;
      case 'UI_UX':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">UI/UX Designer</span>;
      case 'BOTH':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">Dual-Match (Both)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-700/30 text-zinc-300 border border-zinc-700">Uncertain / Review</span>;
    }
  };

  const getScoreColor = (score: number | null, threshold: number) => {
    if (score === null || score === undefined) return 'text-[#8B8D98]';
    if (score >= threshold) return 'text-emerald-400 font-bold';
    return 'text-amber-400 font-bold';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-full bg-[#0B0C0E] border-l border-[#1f1f28] flex flex-col shadow-2xl text-left overflow-hidden">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#1f1f28] bg-[#0d0d11] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {data ? data.candidate_code : 'Loading Candidate...'}
              </h2>
              {data && getClassificationBadge(data.classification)}
              {data && (
                <span className="text-xs px-2 py-0.5 rounded bg-[#1f1f28] text-[#8B8D98] font-mono">
                  {data.processing_status}
                </span>
              )}
            </div>
            {data?.profile?.full_name && (
              <p className="text-xs text-[#8B8D98] mt-1 font-mono">
                {data.profile.full_name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {data && data.document?.access_url && (
              <a
                href={data.document.access_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded text-xs font-medium bg-[#14141a] hover:bg-[#1f1f28] text-white border border-[#272733] transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Resume</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#8B8D98] hover:text-white hover:bg-[#1f1f28] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 px-6 border-b border-[#1f1f28] bg-[#0a0a0e] shrink-0 text-sm">
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'evaluations'
                ? 'border-[#FF5729] text-white'
                : 'border-transparent text-[#8B8D98] hover:text-white'
            }`}
          >
            Dual Scoring & Evidence
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-[#FF5729] text-white'
                : 'border-transparent text-[#8B8D98] hover:text-white'
            }`}
          >
            Structured Profile
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'document'
                ? 'border-[#FF5729] text-white'
                : 'border-transparent text-[#8B8D98] hover:text-white'
            }`}
          >
            Source Document & Text
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-[#FF5729] text-white'
                : 'border-transparent text-[#8B8D98] hover:text-white'
            }`}
          >
            Integrity & Warnings
            {data && data.warnings.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
                {data.warnings.length}
              </span>
            )}
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <svg className="w-8 h-8 animate-spin text-[#FF5729]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-sm text-[#8B8D98]">Retrieving candidate dossier...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-900/60 text-sm text-rose-300">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* TAB 1: Dual Scoring & Evidence */}
              {activeTab === 'evaluations' && (
                <div className="space-y-6">
                  {/* Role Switcher Bar */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* LCA Card */}
                    <div
                      onClick={() => setActiveRoleEvaluation('LCA')}
                      className={`cursor-pointer p-4 rounded-lg border transition-all ${
                        activeRoleEvaluation === 'LCA'
                          ? 'border-[#FF5729] bg-[#14141a]'
                          : 'border-[#1f1f28] bg-[#0d0d11] hover:border-[#272733]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-semibold text-[#8B8D98]">
                          Role 1: LCA Consultant
                        </span>
                        <span className="text-xs text-[#8B8D98]">Threshold: 55.0</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-2xl font-mono ${getScoreColor(data.lca_score, 55.0)}`}>
                          {data.lca_score !== null ? `${data.lca_score.toFixed(1)} / 100` : 'Unavailable'}
                        </span>
                        {data.lca_evaluation?.is_qualified && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                            QUALIFIED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8B8D98] mt-1">Chennai Onsite • GaBi / SimaPro • ISO 14040/44</p>
                    </div>

                    {/* UI/UX Card */}
                    <div
                      onClick={() => setActiveRoleEvaluation('UI_UX')}
                      className={`cursor-pointer p-4 rounded-lg border transition-all ${
                        activeRoleEvaluation === 'UI_UX'
                          ? 'border-[#FF5729] bg-[#14141a]'
                          : 'border-[#1f1f28] bg-[#0d0d11] hover:border-[#272733]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-semibold text-[#8B8D98]">
                          Role 2: UI/UX Designer Intern
                        </span>
                        <span className="text-xs text-[#8B8D98]">Threshold: 50.0</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-2xl font-mono ${getScoreColor(data.uiux_score, 50.0)}`}>
                          {data.uiux_score !== null ? `${data.uiux_score.toFixed(1)} / 100` : 'Unavailable'}
                        </span>
                        {data.uiux_evaluation?.is_qualified && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                            QUALIFIED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8B8D98] mt-1">Remote • Figma • User Research & Psychology</p>
                    </div>
                  </div>

                  {/* Selected Evaluation Breakdown */}
                  {(() => {
                    const evalObj =
                      activeRoleEvaluation === 'LCA' ? data.lca_evaluation : data.uiux_evaluation;
                    if (!evalObj) {
                      return (
                        <div className="p-8 text-center rounded-lg border border-[#1f1f28] bg-[#0d0d11] text-[#8B8D98]">
                          Evaluation for {activeRoleEvaluation} is not available for this candidate.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-[#0d0d11] border border-[#1f1f28]">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-white">Evaluation Summary</h4>
                            <span className="text-xs font-mono text-[#8B8D98]">
                              Version: {evalObj.scoring_version}
                            </span>
                          </div>
                          <p className="text-xs text-[#B0B3BE] leading-relaxed">
                            {evalObj.summary || 'Deterministic evaluation computed across canonical JD criteria.'}
                          </p>
                        </div>

                        {/* Criteria Breakdown List */}
                        <div className="space-y-3">
                          <h4 className="text-xs uppercase tracking-wider text-[#8B8D98] font-semibold">
                            Criterion-by-Criterion Scoring Breakdown
                          </h4>

                          {Object.values(evalObj.breakdown).map((crit) => {
                            const weightedContrib = ((crit.score / 100) * crit.weight).toFixed(1);
                            return (
                              <div
                                key={crit.criterion_key}
                                className="p-4 rounded-lg bg-[#0d0d11] border border-[#1f1f28] space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white">
                                      {crit.criterion_name}
                                    </span>
                                    <span className="text-xs text-[#8B8D98] font-mono">
                                      (Weight: {crit.weight} pts)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-[#8B8D98]">
                                      Raw: <span className="text-white font-mono">{crit.score}/100</span>
                                    </span>
                                    <span className="text-xs font-mono font-bold text-[#FF5729]">
                                      +{weightedContrib} pts
                                    </span>
                                  </div>
                                </div>

                                {crit.notes && (
                                  <p className="text-xs text-[#8B8D98] italic">{crit.notes}</p>
                                )}

                                {/* Cited Evidence */}
                                {crit.evidence && crit.evidence.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-[#191922] space-y-1">
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8B8D98] block">
                                      Verified Source Evidence:
                                    </span>
                                    {crit.evidence.map((snip, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs font-mono text-emerald-300/90 bg-[#08120d] border border-emerald-900/30 p-2 rounded flex items-start gap-2"
                                      >
                                        <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="break-words">"{snip}"</span>
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
                <div className="space-y-6">
                  {data.profile ? (
                    <>
                      {/* Overview Grid */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 rounded-lg bg-[#0d0d11] border border-[#1f1f28]">
                          <span className="text-[10px] uppercase text-[#8B8D98] font-semibold block">Total Experience</span>
                          <span className="text-lg font-bold text-white font-mono mt-0.5 block">
                            {data.profile.total_years_experience !== null
                              ? `${data.profile.total_years_experience} Years`
                              : 'Unknown'}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-[#0d0d11] border border-[#1f1f28]">
                          <span className="text-[10px] uppercase text-[#8B8D98] font-semibold block">Relocation Willingness</span>
                          <span className="text-sm font-bold text-[#FF5729] mt-1 block">
                            {data.profile.relocation_willingness || 'UNKNOWN'}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-[#0d0d11] border border-[#1f1f28]">
                          <span className="text-[10px] uppercase text-[#8B8D98] font-semibold block">Extraction Confidence</span>
                          <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
                            {(data.profile.extraction_confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Skills & Tools */}
                      <div className="p-4 rounded-lg bg-[#0d0d11] border border-[#1f1f28] space-y-3">
                        <h4 className="text-xs uppercase font-semibold text-[#8B8D98]">Tools & Technologies</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {data.profile.tools_and_technologies.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded bg-[#14141a] text-xs font-mono text-white border border-[#272733]"
                            >
                              {t}
                            </span>
                          ))}
                          {data.profile.tools_and_technologies.length === 0 && (
                            <span className="text-xs text-[#8B8D98]">No tools identified.</span>
                          )}
                        </div>

                        <h4 className="text-xs uppercase font-semibold text-[#8B8D98] pt-2">Skills & Domains</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {data.profile.skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-[#0a0a0e] text-xs text-[#B0B3BE] border border-[#1f1f28]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Work Experience */}
                      <div className="space-y-3">
                        <h4 className="text-xs uppercase font-semibold text-[#8B8D98]">Work Experience</h4>
                        {data.profile.work_experience.map((exp, idx) => (
                          <div key={idx} className="p-4 rounded-lg bg-[#0d0d11] border border-[#1f1f28] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-white">{exp.role_title}</span>
                              <span className="text-xs text-[#8B8D98] font-mono">
                                {exp.start_date || 'N/A'} — {exp.is_current ? 'Present' : exp.end_date || 'N/A'}
                              </span>
                            </div>
                            {exp.company_or_org && (
                              <p className="text-xs text-[#FF5729]">{exp.company_or_org}</p>
                            )}
                            {exp.responsibilities && exp.responsibilities.length > 0 && (
                              <ul className="list-disc list-inside text-xs text-[#B0B3BE] space-y-1 pt-1">
                                {exp.responsibilities.map((r, rIdx) => (
                                  <li key={rIdx}>{r}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                        {data.profile.work_experience.length === 0 && (
                          <p className="text-xs text-[#8B8D98]">No employment history found.</p>
                        )}
                      </div>

                      {/* Education */}
                      <div className="space-y-3">
                        <h4 className="text-xs uppercase font-semibold text-[#8B8D98]">Education</h4>
                        {data.profile.education.map((edu, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-[#0d0d11] border border-[#1f1f28] flex justify-between items-center">
                            <div>
                              <span className="text-xs font-semibold text-white block">
                                {edu.degree || 'Degree'} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                              </span>
                              <span className="text-xs text-[#8B8D98]">{edu.institution || 'Unknown Institution'}</span>
                            </div>
                            {edu.graduation_year && (
                              <span className="text-xs font-mono text-[#8B8D98]">{edu.graduation_year}</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Portfolio Links */}
                      {data.profile.portfolio_links.length > 0 && (
                        <div className="p-4 rounded-lg bg-[#0d0d11] border border-[#1f1f28] space-y-2">
                          <h4 className="text-xs uppercase font-semibold text-[#8B8D98]">Portfolio & Links</h4>
                          <div className="space-y-1">
                            {data.profile.portfolio_links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-[#FF5729] hover:underline block truncate"
                              >
                                {link}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center rounded-lg border border-[#1f1f28] bg-[#0d0d11] text-[#8B8D98]">
                      Structured profile is not yet extracted for this candidate.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Source Document & Text */}
              {activeTab === 'document' && (
                <div className="space-y-4">
                  {/* Meta Bar */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d11] border border-[#1f1f28]">
                    <div className="flex items-center gap-4 text-xs font-mono text-[#8B8D98]">
                      <span>File: <span className="text-white">{data.document.original_filename}</span></span>
                      <span>Size: {(data.document.file_size / 1024).toFixed(1)} KB</span>
                      <span>Parser: {data.extracted_text.parser_name || 'N/A'}</span>
                    </div>

                    <div className="flex items-center gap-1 border border-[#1f1f28] rounded p-0.5 bg-[#0a0a0e]">
                      <button
                        onClick={() => setTextViewMode('normalized')}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                          textViewMode === 'normalized'
                            ? 'bg-[#FF5729] text-white font-medium'
                            : 'text-[#8B8D98] hover:text-white'
                        }`}
                      >
                        Normalized Text
                      </button>
                      <button
                        onClick={() => setTextViewMode('raw')}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                          textViewMode === 'raw'
                            ? 'bg-[#FF5729] text-white font-medium'
                            : 'text-[#8B8D98] hover:text-white'
                        }`}
                      >
                        Raw Extracted
                      </button>
                    </div>
                  </div>

                  {/* Text Container */}
                  <div className="p-4 rounded-lg bg-[#070709] border border-[#1f1f28] font-mono text-xs text-[#B0B3BE] max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                    {textViewMode === 'normalized'
                      ? data.extracted_text.normalized_text || '(Empty text)'
                      : data.extracted_text.raw_text || '(Empty text)'}
                  </div>
                </div>
              )}

              {/* TAB 4: Integrity & Warnings */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  {/* Confidence Summary */}
                  <div className="p-4 rounded-lg bg-[#0d0d11] border border-[#1f1f28] flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Extraction Confidence Score</h4>
                      <p className="text-xs text-[#8B8D98]">Reflects verifiable evidence density vs unsupported claims</p>
                    </div>
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {((data.profile?.extraction_confidence ?? 1.0) * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Warnings List */}
                  {data.warnings && data.warnings.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase font-semibold text-amber-400">Detected System Warnings</h4>
                      {data.warnings.map((w, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200 flex items-start gap-2"
                        >
                          <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300">
                      No parser warnings or extraction flags recorded for this candidate.
                    </div>
                  )}

                  {/* Unsupported Claims */}
                  {data.profile?.unsupported_claims && data.profile.unsupported_claims.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs uppercase font-semibold text-rose-400">Unsupported Extracted Claims</h4>
                      <p className="text-xs text-[#8B8D98]">These claims failed strict source verification and were excluded from scoring.</p>
                      {data.profile.unsupported_claims.map((claim, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-rose-950/20 border border-rose-900/30 text-xs text-rose-200 font-mono">
                          {claim}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Retry Action */}
                  <div className="pt-4 border-t border-[#1f1f28] flex justify-end">
                    <button
                      onClick={handleRetry}
                      disabled={isRetrying}
                      className="px-4 py-2 rounded-md bg-[#1f1f28] hover:bg-[#272733] text-white text-xs font-medium transition-colors flex items-center gap-2"
                    >
                      {isRetrying ? 'Reprocessing...' : 'Re-run Extraction & Scoring'}
                    </button>
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

