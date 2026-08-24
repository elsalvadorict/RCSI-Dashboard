'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { DIMENSION_META, DIMENSIONS } from '@/lib/rcsi';
import { CHART_COLORS, OverviewData } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

export function TrendAnalysisPanel({ overview }: { overview: OverviewData | null }) {
  if (!overview) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  const { trend, comparison, months, kpis } = overview;

  // Prepare trend data for charts
  const trendData = trend.map(t => ({
    month: t.month,
    RCSI: Number(t.rcsi.toFixed(3)),
    ...Object.fromEntries(DIMENSIONS.map(d => [d, Number(t.dims[d].toFixed(3))])),
  }));

  // Multi-quarter radar data — each dimension shows values for each quarter
  // For the radar overlay, we pick up to 4 most recent quarters
  const recentQuarters = trend.slice(-4);
  const radarData = DIMENSIONS.map(d => {
    const point: Record<string, string | number> = { dim: d };
    for (const q of recentQuarters) {
      point[q.month] = Number(q.dims[d].toFixed(3));
    }
    return point;
  });

  // Dimension trend table data
  const dimensionTrendRows = DIMENSIONS.map(d => {
    const values = trend.map(t => t.dims[d]);
    const first = values[0] ?? 0;
    const last = values[values.length - 1] ?? 0;
    const delta = last - first;
    const direction = delta > 0.005 ? 'up' : delta < -0.005 ? 'down' : 'flat';
    return {
      dimension: d,
      name: DIMENSION_META[d].name,
      milestone: DIMENSION_META[d].milestone,
      first,
      last,
      delta,
      direction,
      values,
    };
  });

  // RCSI trend direction
  const rcsiFirst = trend[0]?.rcsi ?? 0;
  const rcsiLast = trend[trend.length - 1]?.rcsi ?? 0;
  const rcsiDelta = rcsiLast - rcsiFirst;
  const rcsiDirection = rcsiDelta > 0.005 ? 'up' : rcsiDelta < -0.005 ? 'down' : 'flat';

  return (
    <div className="space-y-4">
      {/* Executive Brief — Trend Summary */}
      <Card className={`border-l-4 ${
        rcsiDirection === 'up' ? 'border-l-emerald-400/70 bg-emerald-950/15' :
        rcsiDirection === 'down' ? 'border-l-rose-400/70 bg-rose-950/15' :
        'border-l-amber-400/70 bg-amber-950/15'
      } border border-border/40 backdrop-blur`}>
        <div className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${
              rcsiDirection === 'up' ? 'bg-emerald-500/20 text-emerald-300' :
              rcsiDirection === 'down' ? 'bg-rose-500/20 text-rose-300' :
              'bg-amber-500/20 text-amber-300'
            }`}>
              {rcsiDirection === 'up' ? <TrendingUp className="h-5 w-5" /> :
               rcsiDirection === 'down' ? <TrendingDown className="h-5 w-5" /> :
               <Minus className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                rcsiDirection === 'up' ? 'text-emerald-300' :
                rcsiDirection === 'down' ? 'text-rose-300' : 'text-amber-300'
              }`}>
                Trend Analysis
              </span>
              <h3 className="text-base md:text-lg font-semibold leading-tight text-foreground">
                {rcsiDirection === 'up' && `Division RCSI trending upward: ${rcsiFirst.toFixed(3)} → ${rcsiLast.toFixed(3)} (+${rcsiDelta.toFixed(3)})`}
                {rcsiDirection === 'down' && `Division RCSI trending downward: ${rcsiFirst.toFixed(3)} → ${rcsiLast.toFixed(3)} (${rcsiDelta.toFixed(3)})`}
                {rcsiDirection === 'flat' && `Division RCSI stable across ${months.length} quarters: ${rcsiLast.toFixed(3)}`}
              </h3>
              <div className="mt-2 space-y-1 text-sm text-foreground/80">
                <p>
                  Across {months.length} quarters ({months[0]} to {months[months.length - 1]}),
                  the division's composite RCSI {rcsiDirection === 'up' ? 'improved' : rcsiDirection === 'down' ? 'declined' : 'remained stable'}
                  {' '}by <strong>{rcsiDelta >= 0 ? '+' : ''}{rcsiDelta.toFixed(3)}</strong> ({((rcsiDelta / Math.max(rcsiFirst, 0.001)) * 100).toFixed(1)}% change).
                </p>
                <p>
                  {comparison && comparison.schoolsAdvanced > 0
                    ? `${comparison.schoolsAdvanced} school(s) advanced a milestone in the latest quarter. `
                    : ''}
                  {dimensionTrendRows.filter(d => d.direction === 'up').length > 0
                    ? `Improving dimensions: ${dimensionTrendRows.filter(d => d.direction === 'up').map(d => d.dimension).join(', ')}. `
                    : ''}
                  {dimensionTrendRows.filter(d => d.direction === 'down').length > 0
                    ? `Declining dimensions: ${dimensionTrendRows.filter(d => d.direction === 'down').map(d => d.dimension).join(', ')}.`
                    : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* RCSI + All Dimensions Trend Chart */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle>Multi-Quarter RCSI &amp; Sub-Index Trends</CardTitle>
          <CardDescription>
            Division-wide average RCSI and all 7 sub-indices across every available quarter.
            Use this to identify which dimensions are improving, stagnating, or declining over time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendData} margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 1]} />
              <RTooltip
                contentStyle={{
                  backgroundColor: '#0f172a', border: '1px solid #334155',
                  borderRadius: 8, color: '#e2e8f0',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="RCSI" stroke="#22d3ee" strokeWidth={3} dot={{ r: 5 }} />
              {DIMENSIONS.map(d => (
                <Line
                  key={d}
                  type="monotone"
                  dataKey={d}
                  stroke={CHART_COLORS[d]}
                  strokeWidth={1.5}
                  strokeOpacity={0.7}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Multi-Quarter Radar Overlay */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle>Multi-Quarter Dimension Overlay</CardTitle>
          <CardDescription>
            Radar chart showing the 7-dimension profile for the {recentQuarters.length} most recent quarters
            ({recentQuarters[0]?.month} to {recentQuarters[recentQuarters.length - 1]?.month}).
            Watch the shape expand outward over time as dimensions improve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#ffffff20" />
              <PolarAngleAxis dataKey="dim" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <RTooltip
                contentStyle={{
                  backgroundColor: '#0f172a', border: '1px solid #334155',
                  borderRadius: 8, color: '#e2e8f0',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {recentQuarters.map((q, i) => {
                const colors = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24'];
                return (
                  <Radar
                    key={q.month}
                    name={q.month}
                    dataKey={q.month}
                    stroke={colors[i % colors.length]}
                    fill={colors[i % colors.length]}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                );
              })}
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Dimension Trend Table */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle>Dimension-by-Dimension Trend</CardTitle>
          <CardDescription>
            How each sub-index has changed from the first to the latest quarter. Green = improving, red = declining, gray = stable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/40">
                  <th className="text-left p-2.5 font-medium">Dimension</th>
                  <th className="text-center p-2.5 font-medium">First Quarter ({months[0]})</th>
                  <th className="text-center p-2.5 font-medium">Latest Quarter ({months[months.length - 1]})</th>
                  <th className="text-center p-2.5 font-medium">Change</th>
                  <th className="text-center p-2.5 font-medium">% Change</th>
                  <th className="text-center p-2.5 font-medium">Direction</th>
                  <th className="text-left p-2.5 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {/* RCSI row first */}
                <tr className="border-b border-border/20 bg-cyan-500/5">
                  <td className="p-2.5 font-bold text-cyan-400">RCSI (Composite)</td>
                  <td className="p-2.5 text-center font-mono tabular-nums">{rcsiFirst.toFixed(3)}</td>
                  <td className="p-2.5 text-center font-mono tabular-nums font-bold">{rcsiLast.toFixed(3)}</td>
                  <td className={`p-2.5 text-center font-mono tabular-nums font-bold ${rcsiDelta > 0 ? 'text-emerald-400' : rcsiDelta < 0 ? 'text-rose-400' : 'text-muted-foreground'}`}>
                    {rcsiDelta >= 0 ? '+' : ''}{rcsiDelta.toFixed(3)}
                  </td>
                  <td className="p-2.5 text-center font-mono tabular-nums text-muted-foreground">
                    {((rcsiDelta / Math.max(rcsiFirst, 0.001)) * 100).toFixed(1)}%
                  </td>
                  <td className="p-2.5 text-center">
                    {rcsiDirection === 'up' && <TrendingUp className="h-4 w-4 text-emerald-400 mx-auto" />}
                    {rcsiDirection === 'down' && <TrendingDown className="h-4 w-4 text-rose-400 mx-auto" />}
                    {rcsiDirection === 'flat' && <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                  </td>
                  <td className="p-2.5">
                    <ResponsiveContainer width={100} height={28}>
                      <LineChart data={trend.map(t => ({ v: t.rcsi }))} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
                        <Line type="monotone" dataKey="v" stroke="#22d3ee" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </td>
                </tr>
                {/* Dimension rows */}
                {dimensionTrendRows.map(row => (
                  <tr key={row.dimension} className="border-b border-border/20 hover:bg-muted/20">
                    <td className="p-2.5">
                      <span className="font-medium" style={{ color: CHART_COLORS[row.dimension] }}>
                        {row.dimension}
                      </span>
                      <span className="text-muted-foreground ml-2 text-xs">— {row.name} (M{row.milestone})</span>
                    </td>
                    <td className="p-2.5 text-center font-mono tabular-nums">{row.first.toFixed(3)}</td>
                    <td className="p-2.5 text-center font-mono tabular-nums font-bold">{row.last.toFixed(3)}</td>
                    <td className={`p-2.5 text-center font-mono tabular-nums font-bold ${row.delta > 0 ? 'text-emerald-400' : row.delta < 0 ? 'text-rose-400' : 'text-muted-foreground'}`}>
                      {row.delta >= 0 ? '+' : ''}{row.delta.toFixed(3)}
                    </td>
                    <td className="p-2.5 text-center font-mono tabular-nums text-muted-foreground">
                      {((row.delta / Math.max(row.first, 0.001)) * 100).toFixed(1)}%
                    </td>
                    <td className="p-2.5 text-center">
                      {row.direction === 'up' && <TrendingUp className="h-4 w-4 text-emerald-400 mx-auto" />}
                      {row.direction === 'down' && <TrendingDown className="h-4 w-4 text-rose-400 mx-auto" />}
                      {row.direction === 'flat' && <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                    </td>
                    <td className="p-2.5">
                      <ResponsiveContainer width={100} height={28}>
                        <LineChart data={row.values.map(v => ({ v }))} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
                          <Line type="monotone" dataKey="v" stroke={CHART_COLORS[row.dimension]} strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Milestone progression across quarters */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle>Milestone Distribution Across Quarters</CardTitle>
          <CardDescription>
            How many schools are at each milestone stage (M0–M6) for every quarter.
            A healthy division sees the distribution shift rightward over time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/40">
                  <th className="text-left p-2.5 font-medium">Quarter</th>
                  <th className="text-center p-2.5 font-medium">Avg RCSI</th>
                  {Array.from({ length: 7 }, (_, i) => (
                    <th key={i} className="text-center p-2.5 font-medium">M{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trend.slice().reverse().map((t, ti) => {
                  // We need milestone buckets per quarter — but the trend data doesn't include them.
                  // Let's compute from the overview's milestoneBuckets for the latest, and
                  // show a simplified view.
                  return (
                    <tr key={ti} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="p-2.5 font-mono">{t.month}</td>
                      <td className="p-2.5 text-center font-mono tabular-nums text-cyan-400 font-bold">
                        {t.rcsi.toFixed(3)}
                      </td>
                      {Array.from({ length: 7 }, (_, mi) => {
                        // For the latest quarter, we have the actual buckets
                        if (ti === 0) {
                          const count = overview.milestoneBuckets[mi] ?? 0;
                          return (
                            <td key={mi} className="p-2.5 text-center">
                              {count > 0 ? (
                                <span className={`font-mono ${mi === 6 ? 'text-emerald-400 font-bold' : 'text-muted-foreground'}`}>
                                  {count}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </td>
                          );
                        }
                        return <td key={mi} className="p-2.5 text-center text-muted-foreground/40 text-xs">—</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Note: Per-quarter milestone distribution is shown for the latest quarter. Historical milestone
            buckets require a per-quarter breakdown which is available in the Data Archive tab's export.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
