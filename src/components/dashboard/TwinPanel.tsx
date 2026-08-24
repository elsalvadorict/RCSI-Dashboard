'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Tooltip as RTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Cell,
} from 'recharts';
import {
  DIMENSION_META, DIMENSIONS, Dimension, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS,
} from '@/lib/rcsi';
import { CHART_COLORS, SchoolRow, TwinResult } from '@/lib/types';
import { MilestoneBadge, MilestoneProgress } from './DimensionLegend';
import { NarrativeSynopsis } from './NarrativeSynopsis';
import { buildTwinNarrative } from '@/lib/narratives';
import { generateTwinReport, downloadPdf } from '@/lib/pdfReport';
import { DownloadPdfButton } from './DownloadPdfButton';
import {
  POLICY_LEVERS, defaultLeverValues, computeDeltasFromLevers, leverContributions,
} from '@/lib/policyLevers';
import { RotateCcw, Sparkles, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface TwinPanelProps {
  schools: SchoolRow[];
}

export function TwinPanel({ schools }: TwinPanelProps) {
  const [selectedSchoolId, setSelectedSchoolId] = useState<number>(schools[0]?.id ?? 1);
  const [deltas, setDeltas] = useState<Record<Dimension, number>>({
    R: 0, A: 0, C: 0, S: 0, I: 0, P: 0, M: 0,
  });
  const [useCustomWeights, setUseCustomWeights] = useState(false);
  const [weights, setWeights] = useState<Record<Dimension, number>>({
    R: 1 / 8, A: 1 / 8, C: 1 / 8, S: 1 / 8, I: 1 / 8, P: 1 / 8, M: 1 / 8,
  });
  const [thresholds, setThresholds] = useState<Record<Dimension, number>>({
    R: 0, A: 0.8, C: 0.5, S: 0.5, I: 0.5, P: 0.5, M: 0.5,
  });
  const [useCustomThresholds, setUseCustomThresholds] = useState(false);
  const [result, setResult] = useState<TwinResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'policy' | 'intervention' | 'weights' | 'thresholds'>('policy');
  const [leverValues, setLeverValues] = useState<Record<string, number>>(defaultLeverValues());
  // Track whether the last delta edit came from policy levers (true) or direct
  // Intervention slider edits (false). This lets us sync levers → deltas without
  // clobbering manual Intervention edits when the user switches tabs.
  const [deltaSource, setDeltaSource] = useState<'policy' | 'manual'>('policy');

  // Reset deltas AND levers when school changes
  useEffect(() => {
    setDeltas({ R: 0, A: 0, C: 0, S: 0, I: 0, P: 0, M: 0 });
    setLeverValues(defaultLeverValues());
    setDeltaSource('policy');
  }, [selectedSchoolId]);

  // When policy levers change, recompute deltas from them.
  // This is the key wiring: levers → deltas → simulation (auto-runs via the
  // existing useEffect below that watches `deltas`).
  const onLeverChange = (key: string, value: number) => {
    setLeverValues(prev => {
      const next = { ...prev, [key]: value };
      const newDeltas = computeDeltasFromLevers(next);
      setDeltas(newDeltas);
      setDeltaSource('policy');
      return next;
    });
  };

  // Per-lever contribution to each dimension (for UI display)
  const contributions = useMemo(() => leverContributions(leverValues), [leverValues]);

const runSimulation = async () => {
  setLoading(true);
  try {
    const payload: Record<string, unknown> = {
      schoolId: selectedSchoolId,
      deltas,
    };

    if (useCustomWeights) payload.weights = weights;
    if (useCustomThresholds) payload.thresholds = thresholds;

    const res = await fetch('/api/twin/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Twin simulation failed:', res.status, errorText);
      setResult(null);
      return;
    }

    const data = await res.json();
    setResult(data);
  } catch (error) {
    console.error('Twin simulation request failed:', error);
    setResult(null);
  } finally {
    setLoading(false);
  }
};

  // Auto-run on mount and whenever inputs change (debounced via simple effect)
  useEffect(() => {
    const t = setTimeout(() => { runSimulation(); }, 150);
    return () => clearTimeout(t);
  }, [selectedSchoolId, deltas, useCustomWeights, weights, useCustomThresholds, thresholds]);

  const reset = () => {
    setDeltas({ R: 0, A: 0, C: 0, S: 0, I: 0, P: 0, M: 0 });
    setLeverValues(defaultLeverValues());
    setDeltaSource('policy');
    setUseCustomWeights(false);
    setWeights({ R: 1 / 8, A: 1 / 8, C: 1 / 8, S: 1 / 8, I: 1 / 8, P: 1 / 8, M: 1 / 8 });
    setUseCustomThresholds(false);
    setThresholds({ R: 0, A: 0.8, C: 0.5, S: 0.5, I: 0.5, P: 0.5, M: 0.5 });
  };

  const radarData = useMemo(() => {
    if (!result) return [];
    return DIMENSIONS.map(d => {
      const cmp = result.dimensionComparison.find(c => c.dimension === d);
      return {
        dim: d,
        Actual: Number((cmp?.actual ?? 0).toFixed(3)),
        Projected: Number((cmp?.projected ?? 0).toFixed(3)),
      };
    });
  }, [result]);

  const barData = useMemo(() => {
    if (!result) return [];
    return result.dimensionComparison.map(c => ({
      dimension: c.dimension,
      Delta: Number(c.delta.toFixed(3)),
    }));
  }, [result]);

  const weightSum = Object.values(weights).reduce((s, v) => s + v, 0);

  // Build a reactive narrative from the latest simulation result.
  // When no result is available yet, the narrative guides the user to start.
  const twinNarrative = result
    ? buildTwinNarrative(result)
    : {
        tone: 'insight' as const,
        title: `Adjust the policy levers to model an intervention for ${schools.find(s => s.id === selectedSchoolId)?.name ?? 'a school'}`,
        insights: [
          `The Twin Sandbox lets you simulate "what-if" interventions before committing resources. ` +
          `Use the <strong>Policy Levers</strong> tab to adjust decision-maker-friendly inputs — Training frequency, Mentorship ratio, Support budget, Leadership commitment, and Collaboration frequency. ` +
          `Each lever maps to one or more of the 7 sub-indices (R, A, C, S, I, P, M) and drives the simulation in real time.`,
          `You can also switch to the <strong>Intervention</strong> tab to set dimension deltas directly, ` +
          `or use the <strong>Weights</strong> and <strong>Thresholds</strong> tabs to override the RCSI formula and milestone cutoffs.`,
        ],
        recommendation: `Start on the <strong>Policy Levers</strong> tab. For a school at M0, the highest-leverage first move is usually ` +
          `<strong>Training frequency</strong> (boosts A — Awareness, the M0 → M1 gatekeeper) and <strong>Leadership commitment</strong> ` +
          `(boosts both A and I — Institutional Anchoring). Watch this brief update live as you drag the sliders.`,
      };

  return (
    <div className="space-y-4">
      {/* Reactive executive brief — updates live as sliders move + download button */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <NarrativeSynopsis
            tone={twinNarrative.tone}
            title={twinNarrative.title}
            insights={twinNarrative.insights.map((s, i) => <span key={i} dangerouslySetInnerHTML={{ __html: s }} />)}
            recommendation={<span dangerouslySetInnerHTML={{ __html: twinNarrative.recommendation }} />}
          />
        </div>
        {result && (
          <DownloadPdfButton
            onClick={async () => {
              const school = schools.find(s => s.id === selectedSchoolId);
              const blob = generateTwinReport(result, twinNarrative, school?.name ?? `School ${selectedSchoolId}`);
              downloadPdf(blob, `RCSI-Twin-Report-${school?.name ?? selectedSchoolId}.pdf`);
            }}
            label="Download PDF"
            className="shrink-0"
          />
        )}
      </div>

      <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-card/60 to-violet-950/30 backdrop-blur">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                Digital Twin Sandbox
              </CardTitle>
              <CardDescription className="mt-1">
                A real-time what-if simulator. Drag sliders to model interventions and see the projected RCSI
                and milestone update live against the actual baseline.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-[1fr_2fr] gap-4">
            {/* Configuration column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Twin School</Label>
                <Select
                  value={String(selectedSchoolId)}
                  onValueChange={(v) => setSelectedSchoolId(parseInt(v, 10))}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {schools.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} · RCSI {s.rcsi.toFixed(3)} · M{s.milestone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="policy">Policy Levers</TabsTrigger>
                  <TabsTrigger value="intervention">Intervention</TabsTrigger>
                  <TabsTrigger value="weights">Weights</TabsTrigger>
                  <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
                </TabsList>

                {activeTab === 'policy' && (
                  <div className="space-y-3 pt-3">
                    <p className="text-xs text-muted-foreground">
                      Decision-maker-friendly policy inputs. Each lever maps to one or more of the 7 sub-indices
                      and drives the simulation in real time. Baseline = current status quo.
                    </p>
                    {POLICY_LEVERS.map(lever => {
                      const value = leverValues[lever.key] ?? lever.baseline;
                      const atBaseline = value === lever.baseline;
                      return (
                        <div key={lever.key} className="space-y-1.5 rounded-md border border-border/30 p-2.5">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="text-xs font-medium">{lever.name}</span>
                            <span className={`font-mono text-xs tabular-nums ${atBaseline ? 'text-muted-foreground' : 'text-cyan-300'}`}>
                              {lever.formatValue(value)}
                              {atBaseline ? ' (baseline)' : ''}
                            </span>
                          </div>
                          <Slider
                            value={[value]}
                            min={lever.min}
                            max={lever.max}
                            step={lever.step}
                            onValueChange={(v) => onLeverChange(lever.key, v[0])}
                          />
                          {/* Dimension impact chips */}
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {lever.affects.map(a => {
                              const delta = contributions[lever.key]?.[a.dimension] ?? 0;
                              const isZero = Math.abs(delta) < 0.0005;
                              return (
                                <span
                                  key={a.dimension}
                                  className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-mono ${
                                    isZero ? 'border-border/30 text-muted-foreground/60'
                                    : delta > 0 ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                                    : 'border-rose-500/40 text-rose-300 bg-rose-500/10'
                                  }`}
                                  title={`${a.dimension} — ${DIMENSION_META[a.dimension].name} (M${a.milestone})`}
                                >
                                  <span style={{ color: CHART_COLORS[a.dimension] }}>{a.dimension}</span>
                                  <span>M{a.milestone}</span>
                                  <span>·</span>
                                  <span>{delta >= 0 ? '+' : ''}{delta.toFixed(3)}</span>
                                </span>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-muted-foreground/70 leading-tight">{lever.description}</p>
                        </div>
                      );
                    })}
                    <div className="rounded-md border border-cyan-500/20 bg-cyan-950/10 p-2.5 mt-2">
                      <p className="text-[10px] text-cyan-200/80 leading-relaxed">
                        <strong className="text-cyan-300">Tip:</strong> Switch to the <em>Intervention</em> tab to see the
                        combined dimension deltas these levers produce, or to fine-tune individual dimensions directly.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'intervention' && (
                  <div className="space-y-3 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        Direct dimension deltas (range −0.30 to +0.30). Values clamp to [0, 1].
                      </p>
                      {deltaSource === 'policy' && (
                        <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                          Synced from Policy Levers
                        </span>
                      )}
                    </div>
                    {DIMENSIONS.map(d => (
                      <div key={d} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium" style={{ color: CHART_COLORS[d] }}>
                            {d} · {DIMENSION_META[d].name}
                          </span>
                          <span className="font-mono tabular-nums">
                            {deltas[d] >= 0 ? '+' : ''}{deltas[d].toFixed(2)}
                          </span>
                        </div>
                        <Slider
                          value={[deltas[d] * 100]}
                          min={-30}
                          max={30}
                          step={1}
                          onValueChange={(v) => {
                            setDeltas(prev => ({ ...prev, [d]: v[0] / 100 }));
                            setDeltaSource('manual');
                          }}
                        />
                      </div>
                    ))}
                    {deltaSource === 'manual' && (
                      <p className="text-[10px] text-amber-300/70 pt-1">
                        Manual edits override the Policy Levers. Switch back to Policy Levers and adjust a lever to re-sync.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === 'weights' && (
                  <div className="space-y-3 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Override equal weights (12.5% each).</p>
                      <Switch checked={useCustomWeights} onCheckedChange={setUseCustomWeights} />
                    </div>
                    <div className={`space-y-3 ${useCustomWeights ? '' : 'opacity-50 pointer-events-none'}`}>
                      <div className="flex justify-between text-xs">
                        <span>Total weight</span>
                        <span className={`font-mono ${Math.abs(weightSum - 1) < 0.01 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {(weightSum * 100).toFixed(1)}%
                        </span>
                      </div>
                      {DIMENSIONS.map(d => (
                        <div key={d} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium" style={{ color: CHART_COLORS[d] }}>{d}</span>
                            <span className="font-mono tabular-nums">{(weights[d] * 100).toFixed(1)}%</span>
                          </div>
                          <Slider
                            value={[weights[d] * 100]}
                            min={0}
                            max={50}
                            step={1}
                            onValueChange={(v) => setWeights(prev => ({ ...prev, [d]: v[0] / 100 }))}
                          />
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground pt-1">
                        Weights are auto-normalized to sum to 1.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'thresholds' && (
                  <div className="space-y-3 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Override milestone thresholds.</p>
                      <Switch checked={useCustomThresholds} onCheckedChange={setUseCustomThresholds} />
                    </div>
                    <div className={`space-y-3 ${useCustomThresholds ? '' : 'opacity-50 pointer-events-none'}`}>
                      <p className="text-xs text-muted-foreground">
                        The default M0→M1 threshold for <strong>A</strong> is <strong>0.80</strong> (per spec).
                        Other dimensions default to 0.50.
                      </p>
                      {DIMENSIONS.filter(d => d !== 'R').map(d => (
                        <div key={d} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium" style={{ color: CHART_COLORS[d] }}>
                              {d} · {DIMENSION_META[d].name} (M{DIMENSION_META[d].milestone})
                            </span>
                            <span className="font-mono tabular-nums">{thresholds[d].toFixed(2)}</span>
                          </div>
                          <Slider
                            value={[thresholds[d] * 100]}
                            min={0}
                            max={100}
                            step={5}
                            onValueChange={(v) => setThresholds(prev => ({ ...prev, [d]: v[0] / 100 }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Tabs>
            </div>

            {/* Results column */}
            <div className="space-y-4">
              {loading && !result && (
                <div className="py-12 text-center text-muted-foreground">Running simulation…</div>
              )}
              {result && (
                <>
                  {/* Headline comparison */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="border-border/40 bg-card/40">
                      <CardContent className="py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Actual</div>
                        <div className="text-2xl font-bold" style={{ color: '#94a3b8' }}>
                          {result.actual.rcsi.toFixed(3)}
                        </div>
                        <div className="mt-1"><MilestoneBadge milestone={result.actual.milestone} /></div>
                      </CardContent>
                    </Card>
                    <Card className="border-cyan-500/40 bg-cyan-950/20">
                      <CardContent className="py-3">
                        <div className="text-xs uppercase tracking-wide text-cyan-300">Projected</div>
                        <div className="text-2xl font-bold text-cyan-300">
                          {result.projected.rcsi.toFixed(3)}
                        </div>
                        <div className="mt-1"><MilestoneBadge milestone={result.projected.milestone} sustainable={result.projected.sustainable} /></div>
                      </CardContent>
                    </Card>
                    <Card className="border-border/40 bg-card/40">
                      <CardContent className="py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Δ Change</div>
                        <div
                          className={`text-2xl font-bold flex items-center gap-1 ${
                            result.delta.rcsi > 0.0005 ? 'text-emerald-400'
                            : result.delta.rcsi < -0.0005 ? 'text-rose-400'
                            : 'text-muted-foreground'
                          }`}
                        >
                          {result.delta.rcsi > 0.0005 ? <ArrowUp className="h-5 w-5" />
                          : result.delta.rcsi < -0.0005 ? <ArrowDown className="h-5 w-5" />
                          : <Minus className="h-5 w-5" />}
                          {result.delta.rcsi >= 0 ? '+' : ''}{result.delta.rcsi.toFixed(3)}
                        </div>
                        {result.delta.milestone !== 0 && (
                          <Badge
                            variant="outline"
                            className={`mt-1 ${result.delta.milestone > 0 ? 'border-emerald-500/40 text-emerald-300' : 'border-rose-500/40 text-rose-300'}`}
                          >
                            {result.delta.milestone > 0 ? '▲' : '▼'} {Math.abs(result.delta.milestone)} milestone{Math.abs(result.delta.milestone) !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Milestone progress bars */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="border-border/40 bg-card/40">
                      <CardContent className="py-3 space-y-1">
                        <div className="text-xs text-muted-foreground">Actual milestone path</div>
                        <MilestoneProgress milestone={result.actual.milestone} />
                        <div className="text-xs text-muted-foreground pt-1">
                          {result.actual.nextThreshold ? (
                            <>
                              Next: reach <strong style={{ color: CHART_COLORS[result.actual.nextThreshold.dimension] }}>
                              {result.actual.nextThreshold.dimension}
                              </strong>{' '}
                              ≥ {result.actual.nextThreshold.value.toFixed(2)} (currently {result.actual.nextThreshold.current.toFixed(2)})
                            </>
                          ) : result.actual.sustainable ? 'Sustainable — cycling back to M0 for the next iteration' : 'M6 reached'}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-cyan-500/30 bg-cyan-950/10">
                      <CardContent className="py-3 space-y-1">
                        <div className="text-xs text-cyan-300">Projected milestone path</div>
                        <MilestoneProgress milestone={result.projected.milestone} />
                        <div className="text-xs text-muted-foreground pt-1">
                          {result.projected.nextThreshold ? (
                            <>
                              Next: reach <strong style={{ color: CHART_COLORS[result.projected.nextThreshold.dimension] }}>
                              {result.projected.nextThreshold.dimension}
                              </strong>{' '}
                              ≥ {result.projected.nextThreshold.value.toFixed(2)} (currently {result.projected.nextThreshold.current.toFixed(2)})
                            </>
                          ) : result.projected.sustainable ? 'Sustainable — cycling back to M0 for the next iteration' : 'M6 reached'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Radar comparison */}
                    <Card className="border-border/40 bg-card/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Actual vs Projected Profile</CardTitle>
                        <CardDescription>7-dimension overlay of the twin simulation.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="#ffffff20" />
                            <PolarAngleAxis dataKey="dim" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 10 }} />
                            <RTooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: 8,
                                color: '#e2e8f0',
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Radar name="Actual" dataKey="Actual" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} strokeWidth={2} />
                            <Radar name="Projected" dataKey="Projected" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} strokeWidth={2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Delta bar chart */}
                    <Card className="border-border/40 bg-card/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Per-Dimension Delta</CardTitle>
                        <CardDescription>
                          Positive bars (cyan) = improvement; negative bars (rose) = regression.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={barData} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="dimension" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} domain={[-0.5, 0.5]} />
                            <RTooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: 8,
                                color: '#e2e8f0',
                              }}
                            />
                            <ReferenceLine y={0} stroke="#ffffff40" />
                            <Bar dataKey="Delta" radius={[4, 4, 0, 0]}>
                              {barData.map((d, i) => (
                                <Cell key={i} fill={d.Delta >= 0 ? '#22d3ee' : '#fb7185'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
