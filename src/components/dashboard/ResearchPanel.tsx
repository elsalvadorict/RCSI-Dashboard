'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OverviewData } from '@/lib/types';
import { NarrativeSynopsis } from './NarrativeSynopsis';
import { buildResearchNarrative } from '@/lib/narratives';
import { generateResearchReport, downloadPdf } from '@/lib/pdfReport';
import { DownloadPdfButton } from './DownloadPdfButton';

const STATUS_COLORS: Record<string, string> = {
  draft: '#71717a',
  under_review: '#f59e0b',
  submitted: '#3b82f6',
  published: '#10b981',
  rejected: '#ef4444',
};

const THEME_COLORS: Record<string, string> = {
  'Assessment & Evaluation': '#22d3ee',
  'Leadership & Governance': '#a78bfa',
  'Learner Engagement & Well-being': '#34d399',
  'Others': '#94a3b8',
  'Professional Development': '#fbbf24',
  'Teaching Strategies': '#fb7185',
  'Technology Integration': '#60a5fa',
};

function heatmapColor(value: number, max: number): string {
  if (max === 0) return 'transparent';
  const ratio = value / max;
  // teal-to-violet gradient
  const hue = 180 - ratio * 100; // 180 (cyan) -> 80 (yellow-green)
  const sat = 70;
  const light = 25 + ratio * 35; // 25% -> 60%
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

export function ResearchPanel({ data }: { data: OverviewData }) {
  const { matrix, heatmap, kpis } = data;
  const narrative = buildResearchNarrative(data);
  const maxCell = Math.max(1, ...matrix.themes.flatMap(t => matrix.statuses.map(s => matrix.data[t]?.[s] ?? 0)));
  const maxHeat = Math.max(1, ...heatmap.ranks.flatMap(r => heatmap.educations.map(e => heatmap.data[r]?.[e] ?? 0)));

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
            const blob = generateResearchReport(data, narrative);
            downloadPdf(blob, 'RCSI-Research-Report.pdf');
          }}
          className="shrink-0"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Theme x Status matrix */}
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Theme × Status Matrix</CardTitle>
            <CardDescription>
              Number of research outputs broken down by theme (rows) and publication status (columns).
              Hover any cell to see the exact count.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2 font-medium text-muted-foreground">Theme</th>
                    {matrix.statuses.map(s => (
                      <th key={s} className="text-center p-2 font-medium capitalize" style={{ color: STATUS_COLORS[s] }}>
                        {s.replace('_', ' ')}
                      </th>
                    ))}
                    <th className="text-right p-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.themes.map(theme => {
                    const rowTotal = matrix.statuses.reduce((sum, s) => sum + (matrix.data[theme]?.[s] ?? 0), 0);
                    return (
                      <tr key={theme} className="border-t border-border/30">
                        <td className="p-2 font-medium" style={{ color: THEME_COLORS[theme] || '#cbd5e1' }}>
                          {theme}
                        </td>
                        {matrix.statuses.map(s => {
                          const v = matrix.data[theme]?.[s] ?? 0;
                          return (
                            <td
                              key={s}
                              className="p-1 text-center"
                              title={`${theme} · ${s.replace('_', ' ')}: ${v}`}
                            >
                              <div
                                className="h-9 rounded flex items-center justify-center font-mono text-xs tabular-nums"
                                style={{
                                  backgroundColor: v === 0 ? 'transparent' : heatmapColor(v, maxCell),
                                  color: v / maxCell > 0.4 ? '#0f172a' : '#e2e8f0',
                                  border: '1px solid #ffffff10',
                                }}
                              >
                                {v > 0 ? v : ''}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-2 text-right font-mono font-semibold tabular-nums">{rowTotal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Rank x Education heatmap */}
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Teacher Rank × Education Heatmap</CardTitle>
            <CardDescription>
              Research output count grouped by teacher rank (rows) and educational attainment (columns).
              Darker cells indicate more outputs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2 font-medium text-muted-foreground">Rank</th>
                    {heatmap.educations.map(e => (
                      <th key={e} className="text-center p-2 font-medium">{e}</th>
                    ))}
                    <th className="text-right p-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {heatmap.ranks.map(rank => {
                    const rowTotal = heatmap.educations.reduce((sum, e) => sum + (heatmap.data[rank]?.[e] ?? 0), 0);
                    return (
                      <tr key={rank} className="border-t border-border/30">
                        <td className="p-2 font-medium">{rank}</td>
                        {heatmap.educations.map(e => {
                          const v = heatmap.data[rank]?.[e] ?? 0;
                          return (
                            <td key={e} className="p-1 text-center" title={`${rank} · ${e}: ${v}`}>
                              <div
                                className="h-9 rounded flex items-center justify-center font-mono text-xs tabular-nums"
                                style={{
                                  backgroundColor: v === 0 ? 'transparent' : heatmapColor(v, maxHeat),
                                  color: v / maxHeat > 0.4 ? '#0f172a' : '#e2e8f0',
                                  border: '1px solid #ffffff10',
                                }}
                              >
                                {v > 0 ? v : ''}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-2 text-right font-mono font-semibold tabular-nums">{rowTotal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardContent className="py-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Outputs</div>
            <div className="text-2xl font-bold">{kpis.totalResearch.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {kpis.fullPapers} full · {kpis.abstracts} abstracts
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardContent className="py-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Published</div>
            <div className="text-2xl font-bold text-emerald-400">{kpis.publishedCount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {(kpis.publicationRate * 100).toFixed(1)}% publication rate
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardContent className="py-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Utilized</div>
            <div className="text-2xl font-bold text-violet-400">{kpis.utilizedCount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {(kpis.utilizationRate * 100).toFixed(1)}% utilization rate
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardContent className="py-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Schools</div>
            <div className="text-2xl font-bold text-cyan-400">{data.schoolCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Across the division</div>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Teacher-Researchers — Recognition Section */}
      <Card className="border-amber-400/30 bg-gradient-to-br from-amber-950/15 via-card/60 to-yellow-950/10 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-amber-400">🏆</span>
            Top 10 Teacher-Researchers
          </CardTitle>
          <CardDescription>
            Recognition for the division's most productive researchers, ranked by number of research outputs.
            Celebrating their contribution advances the division's research culture and RCSI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.topResearchers && data.topResearchers.length > 0 ? (
            <div className="overflow-x-auto rounded-md border border-border/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-500/15 border-b border-border/40">
                    <th className="text-left p-2.5 font-semibold text-amber-200 w-12">Rank</th>
                    <th className="text-left p-2.5 font-semibold text-amber-200">Teacher-Researcher</th>
                    <th className="text-center p-2.5 font-semibold text-amber-200 w-20">Research<br/>Outputs</th>
                    <th className="text-left p-2.5 font-semibold text-amber-200 w-32">Rank</th>
                    <th className="text-left p-2.5 font-semibold text-amber-200 w-32">Education</th>
                    <th className="text-center p-2.5 font-semibold text-amber-200 w-20">Years of<br/>Service</th>
                    <th className="text-left p-2.5 font-semibold text-amber-200 w-32">Years<br/>Undertaken</th>
                    <th className="text-left p-2.5 font-semibold text-amber-200">Themes Covered</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topResearchers.map((r, i) => (
                    <tr key={i} className={`border-b border-border/20 hover:bg-amber-500/5 transition-colors ${i < 3 ? 'bg-amber-500/5' : ''}`}>
                      <td className="p-2.5 text-center">
                        {i === 0 && <span className="text-lg">🥇</span>}
                        {i === 1 && <span className="text-lg">🥈</span>}
                        {i === 2 && <span className="text-lg">🥉</span>}
                        {i >= 3 && <span className="font-mono text-muted-foreground">{i + 1}</span>}
                      </td>
                      <td className="p-2.5 font-medium">{r.teacherName}</td>
                      <td className="p-2.5 text-center">
                        <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full bg-amber-500/20 text-amber-300 font-bold text-sm tabular-nums">
                          {r.researchCount}
                        </span>
                      </td>
                      <td className="p-2.5 text-muted-foreground">{r.teacherRank}</td>
                      <td className="p-2.5 text-muted-foreground">{r.educationalAttainment}</td>
                      <td className="p-2.5 text-center font-mono tabular-nums">{r.yearsOfService}</td>
                      <td className="p-2.5 font-mono text-xs text-muted-foreground">
                        {r.yearsUndertaken.length > 0
                          ? r.yearsUndertaken.length <= 2
                            ? r.yearsUndertaken.join(', ')
                            : `${r.yearsUndertaken[0]}–${r.yearsUndertaken[r.yearsUndertaken.length - 1]}`
                          : '—'}
                      </td>
                      <td className="p-2.5">
                        <div className="flex flex-wrap gap-1">
                          {r.themes.slice(0, 3).map((t, ti) => (
                            <span key={ti} className="inline-flex items-center rounded-full border border-border/30 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {t.length > 20 ? t.slice(0, 18) + '…' : t}
                            </span>
                          ))}
                          {r.themes.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{r.themes.length - 3} more</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No research records available. Upload research metadata to see the top researchers.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
