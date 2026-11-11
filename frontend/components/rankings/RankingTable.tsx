'use client';

import React, { useState, useMemo } from 'react';
import { CandidateRankingItem, RoleKey } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconSearch } from '@/components/ui/icons';

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
      const matchesSearch =
        searchTerm === '' ||
        item.candidate_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.key_strengths.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

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
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
          Manual Review
        </span>
      );
    }

    const isQualified = score >= threshold;
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${
          isQualified
            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
            : 'bg-zinc-900 text-zinc-400 border-zinc-800'
        }`}
      >
        {score.toFixed(1)} / 100
      </span>
    );
  };

  return (
    <div className="w-full space-y-3">
      {/* Search & Filter Toolbar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search candidate code or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-0.5 rounded-md bg-zinc-900/90 border border-zinc-800 self-stretch sm:self-auto overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Candidates' },
              { id: 'QUALIFIED', label: 'Qualified' },
              { id: 'UNQUALIFIED', label: 'Not Qualified' },
              { id: 'MANUAL_REVIEW', label: 'Needs Review' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  filterStatus === tab.id
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table Container */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                <th className="py-2.5 px-4 w-14">Rank</th>
                <th className="py-2.5 px-4">Candidate Code</th>
                <th className="py-2.5 px-4">Role Match Score</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Key Verified Signals</th>
                <th className="py-2.5 px-4 text-center">Confidence</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Loading role rankings...
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No candidates found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => (
                  <tr
                    key={c.candidate_id}
                    onClick={() => onSelectCandidate(c.candidate_id)}
                    className="hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 font-mono font-medium text-zinc-400">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-mono ${
                          c.rank === 1
                            ? 'bg-[#FF5729] text-white font-bold'
                            : c.rank === 2
                            ? 'bg-zinc-800 text-zinc-200 font-bold'
                            : c.rank === 3
                            ? 'bg-zinc-800 text-zinc-300'
                            : 'text-zinc-500'
                        }`}
                      >
                        #{c.rank}
                      </span>
                    </td>

                    {/* Candidate Code */}
                    <td className="py-3 px-4 font-mono font-semibold text-white group-hover:text-[#FF5729]">
                      {c.candidate_code}
                    </td>

                    {/* Score */}
                    <td className="py-3 px-4">{getScoreBadge(c.score)}</td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {c.is_qualified ? (
                        <Badge variant="success">QUALIFIED</Badge>
                      ) : c.qualification_status === 'MANUAL_REVIEW_REQUIRED' || c.score === null ? (
                        <Badge variant="warning">MANUAL REVIEW</Badge>
                      ) : (
                        <Badge variant="secondary">NOT QUALIFIED</Badge>
                      )}
                    </td>

                    {/* Key Signals */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {c.key_strengths.length > 0 ? (
                          c.key_strengths.map((strength, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono"
                            >
                              {strength}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-zinc-500 italic">No distinctive signals</span>
                        )}
                      </div>
                    </td>

                    {/* Confidence */}
                    <td className="py-3 px-4 text-center font-mono">
                      <span
                        className={
                          c.extraction_confidence >= 0.8
                            ? 'text-emerald-400'
                            : c.extraction_confidence >= 0.5
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }
                      >
                        {(c.extraction_confidence * 100).toFixed(0)}%
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCandidate(c.candidate_id);
                        }}
                        className="text-zinc-400 group-hover:text-white"
                      >
                        Inspect Dossier
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
