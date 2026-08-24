'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { DIMENSION_META, DIMENSIONS } from '@/lib/rcsi';
import { CHART_COLORS, SchoolRow } from '@/lib/types';
import { MilestoneBadge } from './DimensionLegend';
import { NarrativeSynopsis } from './NarrativeSynopsis';
import { buildSchoolsNarrative } from '@/lib/narratives';
import { generateSchoolsReport, downloadPdf } from '@/lib/pdfReport';
import { DownloadPdfButton } from './DownloadPdfButton';
import {
  ResponsiveContainer, LineChart, Line,
} from 'recharts';

type SortKey = 'rcsi' | 'milestone' | 'name' | 'researchCount' | 'publishedCount' | 'utilizedCount';

function SortHeaderButton({
  label, k, sortKey, sortDir, onClick,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onClick: (k: SortKey) => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs font-medium hover:bg-muted/40"
      onClick={() => onClick(k)}
    >
      {label}
      {sortKey === k ? (
        sortDir === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
      ) : (
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
      )}
    </Button>
  );
}

export function SchoolsPanel({
  schools,
  onSelectSchool,
}: {
  schools: SchoolRow[];
  onSelectSchool: (id: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rcsi');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = schools;
    if (q) {
      list = list.filter(s => s.name.toLowerCase().includes(q) || String(s.id) === q);
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return av.localeCompare(bv) * dir;
      }
      return ((av as number) - (bv as number)) * dir;
    });
    return list;
  }, [schools, search, sortKey, sortDir]);

  // Build narrative from the FULL school list (not filtered), so the brief
  // always reflects the division-level picture even while searching.
  const narrative = buildSchoolsNarrative(schools);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <NarrativeSynopsis
            tone={narrative.tone}
            title={narrative.title}
            insights={narrative.insights.map((s, i) => <span key={i} dangerouslySetInnerHTML={{ __html: s }} />)}
            recommendation={<span dangerouslySetInnerHTML={{ __html: narrative.recommendation }} />}
          />
        </div>
        <DownloadPdfButton
          onClick={async () => {
            const blob = generateSchoolsReport(schools, narrative);
            downloadPdf(blob, 'RCSI-Schools-Report.pdf');
          }}
          className="shrink-0"
        />
      </div>

      <Card className="border-border/40 bg-card/60 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>School Explorer</CardTitle>
            <CardDescription>
              {filtered.length} of {schools.length} schools · click a row to view full detail
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search school name or ID…"
              className="pl-8 h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/40 overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card/95 backdrop-blur z-10">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="w-16 text-xs">ID</TableHead>
                  <TableHead className="text-xs">
                    <SortHeaderButton label="School" k="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  </TableHead>
                  <TableHead className="text-xs">
                    <SortHeaderButton label="RCSI" k="rcsi" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  </TableHead>
                  <TableHead className="text-xs">
                    <SortHeaderButton label="Milestone" k="milestone" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  </TableHead>
                  {DIMENSIONS.map(d => (
                    <TableHead key={d} className="text-xs text-center" style={{ color: CHART_COLORS[d] }}>
                      {d}
                    </TableHead>
                  ))}
                  <TableHead className="text-xs text-right">Trend</TableHead>
                  <TableHead className="text-xs text-right">
                    <SortHeaderButton label="Research" k="researchCount" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  </TableHead>
                  <TableHead className="text-xs text-right">
                    <SortHeaderButton label="Published" k="publishedCount" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  </TableHead>
                  <TableHead className="text-xs text-right">
                    <SortHeaderButton label="Utilized" k="utilizedCount" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => {
                  const sparkData = s.sparkline.map((v, i) => ({ i, v }));
                  return (
                    <TableRow
                      key={s.id}
                      onClick={() => onSelectSchool(s.id)}
                      className="cursor-pointer border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">{s.id}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <span className="font-mono font-semibold tabular-nums" style={{ color: '#22d3ee' }}>
                          {s.rcsi.toFixed(3)}
                        </span>
                      </TableCell>
                      <TableCell><MilestoneBadge milestone={s.milestone} sustainable={s.sustainable} /></TableCell>
                      {DIMENSIONS.map(d => (
                        <TableCell key={d} className="text-center font-mono text-xs tabular-nums">
                          {s.dims[d].toFixed(2)}
                        </TableCell>
                      ))}
                      <TableCell className="p-0">
                        <ResponsiveContainer width={80} height={28}>
                          <LineChart data={sparkData} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
                            <Line
                              type="monotone"
                              dataKey="v"
                              stroke="#22d3ee"
                              strokeWidth={1.5}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">{s.researchCount}</TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums text-emerald-400">{s.publishedCount}</TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums text-violet-400">{s.utilizedCount}</TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                      No schools match &quot;{search}&quot;
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
