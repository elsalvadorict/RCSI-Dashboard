'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { DIMENSION_META, DIMENSIONS } from '@/lib/rcsi';
import { CHART_COLORS, OverviewData } from '@/lib/types';
import { DimensionLegend, MilestoneBadge } from './DimensionLegend';
import { NarrativeSynopsis } from './NarrativeSynopsis';
import { buildOverviewNarrative } from '@/lib/narratives';
import { generateOverviewReport, downloadPdf } from '@/lib/pdfReport';
import { DownloadPdfButton } from './DownloadPdfButton';

const STATUS_COLORS: Record<string, string> = {
  draft: '#71717a',
  under_review: '#f59e0b',
  submitted: '#3b82f6',
  published: '#10b981',
  rejected: '#ef4444',
};

function KpiCard({
  label, value, sublabel, accent,
}: { label: string; value: string; sublabel?: string; accent: string }) {
  return (
    <Card className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <CardHeader className="pb-2">
        <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight" style={{ color: accent }}>
          {value}
        </div>
        {sublabel && (
          <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function OverviewPanel({ data }: { data: OverviewData }) {
  const { kpis, trend, avgDims, milestoneBuckets, themeCounts, statusCounts, yearTrend } = data;
  const narrative = buildOverviewNarrative(data);

  // Trend data — flatten dims into named keys for Recharts
  const trendData = trend.map(t => ({
    month: t.month,
    RCSI: Number(t.rcsi.toFixed(3)),
    ...Object.fromEntries(DIMENSIONS.map(d => [d, Number(t.dims[d].toFixed(3))])),
  }));

  // Milestone distribution
  const milestoneData = milestoneBuckets
    .map((count, i) => ({ name: `M${i}`, value: count, milestone: i }))
    .filter(d => d.value > 0);

  // Theme distribution (top 8)
  const themeData = Object.entries(themeCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Status distribution
  const statusData = Object.entries(statusCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Year trend
  const yearData = yearTrend.map(y => ({ year: y.year, count: y.count }));

  

const themePalette = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#60a5fa', '#f472b6', '#94a3b8'];

  return (
    <div className="space-y-6">
      {/* Executive brief — narrative synopsis + download button */}
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
            const blob = generateOverviewReport(data, narrative);
            downloadPdf(blob, `RCSI-Overview-Report-${data.latestMonth}.pdf`);
          }}
          label="Download PDF"
          className="shrink-0"
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <KpiCard
          label="Division Avg RCSI"
          value={kpis.avgRcsi.toFixed(3)}
          sublabel={`Latest quarter: ${data.latestMonth}`}
          accent="#22d3ee"
        />
        <KpiCard
          label="Sustainable Schools"
          value={`${kpis.sustainableCount} / ${data.schoolCount}`}
          sublabel="At M6 with RCSI ≥ 0.70"
          accent="#34d399"
        />
        <KpiCard
          label="Total Research"
          value={kpis.totalResearch.toLocaleString()}
          sublabel={`${kpis.fullPapers} full papers · ${kpis.abstracts} abstracts`}
          accent="#a78bfa"
        />
        <KpiCard
          label="Publication Rate"
          value={`${(kpis.publicationRate * 100).toFixed(1)}%`}
          sublabel={`${kpis.publishedCount} published`}
          accent="#fbbf24"
        />
        <KpiCard
          label="Utilization Rate"
          value={`${(kpis.utilizationRate * 100).toFixed(1)}%`}
          sublabel={`${kpis.utilizedCount} utilized`}
          accent="#fb7185"
        />
      </div>

      {/* Dimension legend */}
      <Card className="border-border/40 bg-card/40">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              7 Sub-Indices of Research Sustainability
            </span>
            <DimensionLegend />
          </div>
        </CardContent>
      </Card>

      {/* RCSI Trend */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle>Division RCSI Trend</CardTitle>
          <CardDescription>
            Average composite Research Culture Sustainability Index across all {data.schoolCount} schools, per quarter. The faint lines show the 7 sub-indices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={trendData} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
              <defs>
                <linearGradient id="rcsiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="RCSI"
                stroke="#22d3ee"
                strokeWidth={3}
                fill="url(#rcsiGrad)"
              />
              {DIMENSIONS.map(d => (
                <Line
                  key={d}
                  type="monotone"
                  dataKey={d}
                  stroke={CHART_COLORS[d]}
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  dot={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Milestone distribution */}
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Milestone Distribution</CardTitle>
            <CardDescription>
              Schools by current milestone stage (latest quarter). M6 indicates a sustainable research culture.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={milestoneData}
                    isAnimationActive={false}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {milestoneData.map((entry) => {
                      const colors = ['#64748b', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#10b981'];
                      return <Cell key={entry.name} fill={colors[entry.milestone]} />;
                    })}
                  </Pie>
                  <RTooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      color: '#e2e8f0',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {milestoneData.map((m) => (
                  <div key={m.name} className="flex items-center justify-between">
                    <MilestoneBadge milestone={m.milestone} />
                    <span className="text-sm text-muted-foreground">
                      {m.value} school{m.value !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
                {milestoneData.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Division average per dimension */}
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Division Average per Sub-Index</CardTitle>
            <CardDescription>
              The mean value of each sub-index across all schools in the latest quarter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {DIMENSIONS.map(d => {
              const v = avgDims[d] ?? 0;
              return (
                <div key={d} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: CHART_COLORS[d] }}
                      />
                      {d} — {DIMENSION_META[d].name}
                    </span>
                    <span className="text-muted-foreground tabular-nums">{v.toFixed(3)}</span>
                  </div>
                  <Progress value={v * 100} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Theme distribution */}
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Research Themes</CardTitle>
            <CardDescription>Distribution of research outputs by theme.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={themeData}
                  isAnimationActive={false}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={1}
                  stroke="none"
                  label={({ name, value }) => `${name.length > 18 ? name.slice(0, 16) + '…' : name}: ${value}`}
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                >
                  {themeData.map((_, i) => (
                    <Cell key={i} fill={themePalette[i % themePalette.length]} />
                  ))}
                </Pie>
                <RTooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#e2e8f0',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: '#cbd5e1', paddingTop: 8 }}
                  formatter={(value) => (
                    <span style={{ color: '#cbd5e1', fontSize: 11 }}>
                      {value.length > 22 ? value.slice(0, 20) + '…' : value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Research Status</CardTitle>
            <CardDescription>Distribution of research outputs by publication status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusData.map(s => (
              <div key={s.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium capitalize">{s.name.replace('_', ' ')}</span>
                  <span className="text-muted-foreground tabular-nums">{s.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(s.value / kpis.totalResearch) * 100}%`,
                      backgroundColor: STATUS_COLORS[s.name] || '#71717a',
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Year trend */}
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Research Outputs per Year</CardTitle>
            <CardDescription>Total research undertaken by year.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={yearData} margin={{ top: 8, right: 8, bottom: 8, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <RTooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#e2e8f0',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#a78bfa"
                  strokeWidth={3}
                  dot={{ fill: '#a78bfa', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
