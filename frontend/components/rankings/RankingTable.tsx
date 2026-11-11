'use client';

import React, { useState, useMemo } from 'react';
import { CandidateRankingItem, RoleKey } from '@/lib/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  IconSearch,
  IconChevronRight,
  IconShieldCheck,
  IconAlertCircle,
  IconCheckCircle,
} from '@/components/ui/icons';

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

  return (
    <div className="w-full space-y-4">
      {/* Search & Filter Toolbar */}
      <Card className="bg-zinc-900/30 border-zinc-800/80 p-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <IconSearch size={14} className="absolute left-3 top-2.5 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search candidate code or verified skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-xs bg-zinc-950/80 border-zinc-800"
            />
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 self-stretch sm:self-auto overflow-x-auto">
            {[
              { id: 'ALL', label: `All Candidates (${candidates.length})` },
              { id: 'QUALIFIED', label: `Qualified (${candidates.filter((c) => c.is_qualified).length})` },
              { id: 'UNQUALIFIED', label: 'Under Threshold' },
              { id: 'MANUAL_REVIEW', label: 'Needs Review' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filterStatus === tab.id
                    ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Ranking Table */}
      <Card className="bg-zinc-900/30 border-zinc-800/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 font-mono text-xs">
            Calculating deterministic role rankings...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs">
            No candidates match the specified filter criteria.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 font-mono text-[11px]">Rank</TableHead>
                <TableHead className="w-28 font-mono text-[11px]">Candidate</TableHead>
                <TableHead className="w-44 font-mono text-[11px]">Match Score</TableHead>
                <TableHead className="font-mono text-[11px]">Verified Competencies</TableHead>
                <TableHead className="font-mono text-[11px]">Provenance</TableHead>
                <TableHead className="text-right font-mono text-[11px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.map((item) => {
                const isTopCandidate = item.rank <= 3 && item.is_qualified;
                const isReview = item.qualification_status === 'MANUAL_REVIEW_REQUIRED' || item.score === null;

                return (
                  <TableRow
                    key={item.candidate_id}
                    onClick={() => onSelectCandidate(item.candidate_id)}
                    className="cursor-pointer"
                  >
                    {/* Rank Badge */}
                    <TableCell>
                      {item.score === null ? (
                        <span className="font-mono text-zinc-600 text-xs">—</span>
                      ) : (
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${item.rank === 1
                              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
                              : item.rank === 2
                                ? 'bg-zinc-300/10 text-zinc-200 border border-zinc-300/30'
                                : item.rank === 3
                                  ? 'bg-amber-700/10 text-amber-500 border border-amber-700/30'
                                  : 'text-zinc-500'
                            }`}
                        >
                          #{item.rank}
                        </span>
                      )}
                    </TableCell>

                    {/* Candidate Code */}
                    <TableCell>
                      <div className="font-mono font-bold text-zinc-100">
                        {item.candidate_code}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {item.is_qualified ? (
                          <span className="text-emerald-400">Bench Passed</span>
                        ) : isReview ? (
                          <span className="text-amber-400">Empty Doc</span>
                        ) : (
                          <span>Under Bench</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Match Score & Progress Bar */}
                    <TableCell>
                      {item.score === null ? (
                        <span className="font-mono text-[11px] text-zinc-500">null (failed)</span>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className={item.is_qualified ? 'font-bold text-emerald-400' : 'text-zinc-400'}>
                              {item.score.toFixed(1)} / 100
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              (Min {threshold}%)
                            </span>
                          </div>
                          <Progress
                            value={item.score}
                            className="h-1.5 bg-zinc-800"
                            indicatorClassName={item.is_qualified ? 'bg-emerald-500' : 'bg-zinc-600'}
                          />
                        </div>
                      )}
                    </TableCell>

                    {/* Verified Competencies */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {item.key_strengths.length > 0 ? (
                          item.key_strengths.slice(0, 4).map((strength, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono"
                            >
                              {strength}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-500 italic text-[11px]">No confirmed skills</span>
                        )}
                        {item.key_strengths.length > 4 && (
                          <span className="text-[10px] text-zinc-500 font-mono self-center">
                            +{item.key_strengths.length - 4}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Provenance Status */}
                    <TableCell>
                      {isReview ? (
                        <Badge variant="warning">Manual Review</Badge>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                          <IconShieldCheck size={13} className="text-emerald-400" />
                          <span className="font-mono text-[11px]">{item.verified_evidence_count} Citations</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-1 font-mono text-[11px] text-zinc-400 hover:text-white">
                        <span>Dossier</span>
                        <IconChevronRight size={13} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
