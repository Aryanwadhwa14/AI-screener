'use client';

import React, { useState, useMemo } from 'react';
import { CandidateRankingItem, RoleKey } from '@/lib/types';

interface RankingTableProps {
  roleKey: RoleKey;
  roleTitle: string;
  threshold: number;
  candidates: CandidateRankingItem[];
  onSelectCandidate: (candidateId: string) => void;
  isLoading?: boolean;
}

export default function RankingTable({
  roleKey,
  roleTitle,
  threshold,
  candidates,
  onSelectCandidate,
  isLoading = false,
}: RankingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredCandidates = useMemo(() => {
    return candidates.filter((item) => {
      // Search
      const matchesSearch =
        searchTerm === '' ||
        item.candidate_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.key_strengths.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status
      let matchesStatus = true;
      if (filterStatus === 'QUALIFIED') {
        matchesStatus = item.is_qualified === true;
      } else if (filterStatus === 'UNQUALIFIED') {
        matchesStatus = item.qualification_status === 'UNQUALIFIED';
      } else if (filterStatus === 'MANUAL_REVIEW') {
        matchesStatus = item.qualification_status === 'MANUAL_REVIEW_REQUIRED' || item.score === null;
      }

      return matchesSearch && matchesStatus;
    });
  }, [candidates, searchTerm, filterStatus]);

  const getScoreBadge = (score: number | null) => {
    if (score === null || score === undefined) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
          Manual Review
        </span>
      );
    }

    const isQualified = score >= threshold;
    return (
      <div className="flex items-center gap-2">
        <span
          className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
            isQualified
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
          }`}
        >
          {score.toFixed(1)} / 100
        </span>
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Controls Bar */}
      <div className="p-4 rounded-xl bg-[#0d0d11] border border-[#1f1f28] flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <svg
            className="w-4 h-4 text-[#8B8D98] absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search candidate code or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#070709] border border-[#1f1f28] text-sm text-white placeholder-[#8B8D98] focus:outline-none focus:border-[#FF5729]"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#070709] border border-[#1f1f28] self-stretch sm:self-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Candidates' },
            { id: 'QUALIFIED', label: 'Qualified Only' },
            { id: 'UNQUALIFIED', label: 'Unqualified' },
            { id: 'MANUAL_REVIEW', label: 'Manual Review' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-[#FF5729] text-white font-semibold shadow-sm'
                  : 'text-[#8B8D98] hover:text-white hover:bg-[#14141a]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-[#1f1f28] bg-[#0d0d11] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1f1f28] bg-[#08080c] text-[11px] uppercase font-mono tracking-wider text-[#8B8D98]">
                <th className="py-3 px-4 w-14">Rank</th>
                <th className="py-3 px-4">Candidate Code</th>
                <th className="py-3 px-4">Match Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Key Verified Signals</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f28] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#8B8D98]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="w-6 h-6 animate-spin text-[#FF5729]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Loading role rankings...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#8B8D98]">
                    No candidates found matching the selected search criteria.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => {
                  return (
                    <tr
                      key={c.candidate_id}
                      onClick={() => onSelectCandidate(c.candidate_id)}
                      className="hover:bg-[#14141c] transition-colors cursor-pointer group"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs ${
                            c.rank === 1
                              ? 'bg-[#FF5729] text-white shadow-md shadow-[#FF5729]/30'
                              : c.rank === 2
                              ? 'bg-zinc-700 text-white'
                              : c.rank === 3
                              ? 'bg-zinc-800 text-zinc-300'
                              : 'text-[#8B8D98]'
                          }`}
                        >
                          #{c.rank}
                        </span>
                      </td>

                      {/* Candidate Code */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span className="group-hover:text-[#FF5729] transition-colors">
                            {c.candidate_code}
                          </span>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4">{getScoreBadge(c.score)}</td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {c.is_qualified ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            QUALIFIED
                          </span>
                        ) : c.qualification_status === 'MANUAL_REVIEW_REQUIRED' || c.score === null ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            MANUAL REVIEW
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            NOT QUALIFIED
                          </span>
                        )}
                      </td>

                      {/* Key Verified Signals */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {c.key_strengths.length > 0 ? (
                            c.key_strengths.map((strength, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded text-[10px] bg-[#14141a] text-[#B0B3BE] border border-[#272733]"
                              >
                                {strength}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-[#8B8D98] italic">No distinctive signals</span>
                          )}
                        </div>
                      </td>

                      {/* Confidence */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span
                          className={`text-xs ${
                            c.extraction_confidence >= 0.8
                              ? 'text-emerald-400'
                              : c.extraction_confidence >= 0.5
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {(c.extraction_confidence * 100).toFixed(0)}%
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCandidate(c.candidate_id);
                          }}
                          className="px-2.5 py-1 rounded text-xs font-medium text-[#8B8D98] group-hover:text-white group-hover:bg-[#1f1f28] border border-transparent group-hover:border-[#272733] transition-all"
                        >
                          Inspect Evidence →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

