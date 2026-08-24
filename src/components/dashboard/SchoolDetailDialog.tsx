'use client';

import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend,
} from 'recharts';
import { DIMENSION_META, DIMENSIONS } from '@/lib/rcsi';
import { CHART_COLORS, SchoolDetail } from '@/lib/types';
import { MilestoneBadge, MilestoneProgress } from './DimensionLegend';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
  under_review: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  submitted: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  published: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/40',
};

export function SchoolDetailDialog({
  schoolId,
  onClose,
}: {
  schoolId: number | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (schoolId == null) return;
    let cancelled = false;
    // Use an async IIFE so setState calls happen in a microtask, not synchronously in the effect body.
    (async () => {
      setLoading(true);
      setData(null);
      try {
        const r = await fetch(`/api/schools/detail?id=${schoolId}`);
        const d = await r.json();
        if (!cancelled) setData(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [schoolId]);

  const open = schoolId != null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl">
            {data?.school.name ?? 'Loading…'}
          </DialogTitle>
          <DialogDescription>
            {data?.school ? `School ID ${data.school.id}` : ''} · Quarterly Research Culture Profile
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="py-16 text-center text-muted-foreground">Loading school profile…</div>
        )}

        {data && !loading && (
          <ScrollArea className="max-h-[75vh] px-6 pb-6">
            <div className="space-y-4 pr-2">
              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-border/40 bg-card/40">
                  <CardContent className="py-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Current RCSI</div>
                    <div className="text-2xl font-bold" style={{ color: '#22d3ee' }}>
                      {data.latest?.rcsi.toFixed(3) ?? '—'}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/40 bg-card/40">
                  <CardContent className="py-3 space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Milestone</div>
                    <div>
                      <MilestoneBadge milestone={data.latest?.milestone ?? 0} sustainable={data.latest?.milestone === 6 && (data.latest?.rcsi ?? 0) >= 0.7} size="md" />
                    </div>
                    <MilestoneProgress milestone={data.latest?.milestone ?? 0} />
                  </CardContent>
                </Card>
                <Card className="border-border/40 bg-card/40">
                  <CardContent className="py-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Research Outputs</div>
                    <div className="text-2xl font-bold text-violet-300">{data.research.total}</div>
                    <div className="text-xs text-muted-foreground">
                      {data.research.published} published · {data.research.utilized} utilized
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/40 bg-card/40">
                  <CardContent className="py-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Document Mix</div>
                    <div className="text-2xl font-bold text-amber-300">
                      {data.research.fullPapers}/{data.research.abstracts}
                    </div>
                    <div className="text-xs text-muted-foreground">full papers / abstracts</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Radar chart */}
                <Card className="border-border/40 bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">7-Dimension Profile (Latest Quarter)</CardTitle>
                    <CardDescription>
                      Snapshot of all sub-indices for {data.school.name} in {data.latest?.month ?? '—'}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.latest && (
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={DIMENSIONS.map(d => ({
                          dim: `${d} · ${DIMENSION_META[d].name}`,
                          short: d,
                          value: data.latest!.dims[d],
                        }))}>
                          <PolarGrid stroke="#ffffff20" />
                          <PolarAngleAxis dataKey="short" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 10 }} />
                          <RTooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: 8,
                              color: '#e2e8f0',
                            }}
                          />
                          <Radar
                            name={data.school.name}
                            dataKey="value"
                            stroke="#22d3ee"
                            fill="#22d3ee"
                            fillOpacity={0.35}
                            strokeWidth={2}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Quarterly trend */}
                <Card className="border-border/40 bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Quarterly RCSI Trend</CardTitle>
                    <CardDescription>RCSI progression across available quarters.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={data.trend.map(t => ({ month: t.month, RCSI: Number(t.rcsi.toFixed(3)) }))}
                        margin={{ top: 8, right: 16, bottom: 8, left: -16 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 1]} />
                        <RTooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: 8,
                            color: '#e2e8f0',
                          }}
                        />
                        <Line type="monotone" dataKey="RCSI" stroke="#22d3ee" strokeWidth={3} dot={{ fill: '#22d3ee', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Per-dimension trend over time */}
              <Card className="border-border/40 bg-card/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Sub-Index Evolution</CardTitle>
                  <CardDescription>Each of the 7 sub-indices across quarters.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart
                      data={data.trend.map(t => ({
                        month: t.month,
                        ...Object.fromEntries(DIMENSIONS.map(d => [d, Number(t.dims[d].toFixed(3))])),
                      }))}
                      margin={{ top: 8, right: 16, bottom: 8, left: -16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 1]} />
                      <RTooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          color: '#e2e8f0',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {DIMENSIONS.map(d => (
                        <Line key={d} type="monotone" dataKey={d} stroke={CHART_COLORS[d]} strokeWidth={2} dot={{ r: 3 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Research portfolio breakdown */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-border/40 bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Research Themes</CardTitle>
                    <CardDescription>Breakdown of research outputs by theme for this school.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(data.research.themeCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([theme, count]) => (
                        <div key={theme} className="flex items-center justify-between">
                          <span className="text-sm">{theme}</span>
                          <Badge variant="secondary" className="font-mono">{count}</Badge>
                        </div>
                      ))}
                    {Object.keys(data.research.themeCounts).length === 0 && (
                      <p className="text-sm text-muted-foreground">No research records for this school.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/40 bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Status Mix</CardTitle>
                    <CardDescription>Research outputs by publication status.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(data.research.statusCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-mono ${STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground'}`}
                          >
                            {count}
                          </span>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recent research records */}
              <Card className="border-border/40 bg-card/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Research Records</CardTitle>
                  <CardDescription>Latest 50 records for this school (showing first 20).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-border/30 overflow-hidden">
                    <ScrollArea className="max-h-72">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30 sticky top-0">
                          <tr>
                            <th className="text-left p-2 font-medium">Title</th>
                            <th className="text-left p-2 font-medium">Teacher</th>
                            <th className="text-left p-2 font-medium">Theme</th>
                            <th className="text-left p-2 font-medium">Status</th>
                            <th className="text-right p-2 font-medium">Year</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.research.records.slice(0, 20).map((r, i) => (
                            <tr key={i} className="border-t border-border/20">
                              <td className="p-2 max-w-xs truncate" title={r.title}>
                                {r.link ? (
                                  <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">
                                    {r.title}
                                  </a>
                                ) : (
                                  r.title
                                )}
                              </td>
                              <td className="p-2 text-muted-foreground">{r.teacher}</td>
                              <td className="p-2 text-muted-foreground">{r.theme}</td>
                              <td className="p-2">
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${STATUS_COLORS[r.status] ?? 'bg-muted text-muted-foreground'}`}>
                                  {r.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-2 text-right font-mono text-xs">{r.year}</td>
                            </tr>
                          ))}
                          {data.research.records.length === 0 && (
                            <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No research records.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
