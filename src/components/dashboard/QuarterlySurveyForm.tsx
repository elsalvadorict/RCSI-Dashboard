'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  SURVEY_DIMENSIONS, LIKERT_SCALE, computeAllDimensionScores,
  answeredCount, SurveyDimension,
} from '@/lib/surveyQuestions';
import { DIMENSION_META, DIMENSIONS, computeRcsi, classifyMilestone } from '@/lib/rcsi';
import { CHART_COLORS } from '@/lib/types';
import { EL_SALVADOR_SCHOOLS } from '@/lib/elSalvadorSchools';
import { Download, FileSpreadsheet, Plus, Trash2, Wand2 } from 'lucide-react';

interface QueuedRow {
  schoolName: string;
  schoolId: number;     // Real DepEd School ID
  schoolDisplayName: string; // Full school name (e.g., "Amoros ES")
  month: string;
  scores: Record<string, number>;
  rcsi: number;
  milestone: number;
}

const MONTHS = (() => {
  // Dynamically generate quarters for the current year and previous year.
  // Auto-selects the current quarter based on today's date.
  const now = new Date();
  const currentYear = now.getFullYear();
  const prevYear = currentYear - 1;
  const currentMonth = now.getMonth() + 1; // 1-12

  // Determine current quarter
  let currentQuarterMonth: number;
  if (currentMonth <= 3) currentQuarterMonth = 1;
  else if (currentMonth <= 6) currentQuarterMonth = 4;
  else if (currentMonth <= 9) currentQuarterMonth = 7;
  else currentQuarterMonth = 10;

  const quarterLabels: Record<number, string> = {
    1: 'Q1 (January)',
    4: 'Q2 (April)',
    7: 'Q3 (July)',
    10: 'Q4 (October)',
  };

  const months: { value: string; label: string; isCurrent: boolean }[] = [];

  // Current year quarters (most recent first for the dropdown, but we'll sort ascending)
  for (const m of [1, 4, 7, 10]) {
    const value = `${currentYear}-${String(m).padStart(2, '0')}`;
    const isCurrent = m === currentQuarterMonth;
    months.push({
      value,
      label: `${quarterLabels[m]} ${currentYear}${isCurrent ? ' · Current' : ''}`,
      isCurrent,
    });
  }

  // Previous year quarters (for back-filling)
  for (const m of [10, 7, 4, 1]) {
    const value = `${prevYear}-${String(m).padStart(2, '0')}`;
    months.push({
      value,
      label: `${quarterLabels[m]} ${prevYear}`,
      isCurrent: false,
    });
  }

  return months;
})();

// The default selected month is the current quarter
const CURRENT_QUARTER = MONTHS.find(m => m.isCurrent)?.value ?? MONTHS[0].value;

export function QuarterlySurveyForm() {
  const [schoolId, setSchoolId] = useState<number>(EL_SALVADOR_SCHOOLS[0].id);
  const [month, setMonth] = useState(CURRENT_QUARTER);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [queue, setQueue] = useState<QueuedRow[]>([]);
  const { toast } = useToast();

  const selectedSchool = useMemo(
    () => EL_SALVADOR_SCHOOLS.find(s => s.id === schoolId) ?? EL_SALVADOR_SCHOOLS[0],
    [schoolId]
  );
  // For CSV output: use the school name. The Upload portal derives the canonical
  // ID from the School_N suffix, so we prefix with "School_" + a synthetic index
  // to keep the naming convention compatible. The real DepEd ID is preserved in
  // the school_id_no column.
  const schoolName = useMemo(() => {
    const idx = EL_SALVADOR_SCHOOLS.findIndex(s => s.id === schoolId) + 1;
    return `School_${idx}`;
  }, [schoolId]);

  const scores = useMemo(() => computeAllDimensionScores(responses), [responses]);
  const rcsi = useMemo(() => computeRcsi(scores), [scores]);
  const milestoneInfo = useMemo(() => classifyMilestone(scores), [scores]);

  const totalAnswered = useMemo(() => {
    return SURVEY_DIMENSIONS.reduce((sum, dim) => sum + answeredCount(dim, responses), 0);
  }, [responses]);

  const totalQuestions = 35;
  const completionPct = (totalAnswered / totalQuestions) * 100;

  const handleResponse = (questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const resetForm = () => {
    setResponses({});
  };

  // ── Load Example Data ──
  // Pre-fills all 35 questions with realistic values that produce an
  // interesting RCSI profile (strong R and A, weaker M) for demonstration.
  const loadExample = () => {
    const exampleResponses: Record<string, number> = {};
    // R (Readiness) — strong: mostly High to Full
    exampleResponses['R1'] = 0.75;
    exampleResponses['R2'] = 1.0;
    exampleResponses['R3'] = 0.5;
    exampleResponses['R4'] = 0.75;
    exampleResponses['R5'] = 0.5;
    // A (Awareness) — strong: mostly High (need A >= 0.80 to reach M1)
    exampleResponses['A1'] = 0.75;
    exampleResponses['A2'] = 1.0;
    exampleResponses['A3'] = 0.75;
    exampleResponses['A4'] = 0.75;
    exampleResponses['A5'] = 0.75;
    // C (Capacity) — moderate
    exampleResponses['C1'] = 0.5;
    exampleResponses['C2'] = 0.75;
    exampleResponses['C3'] = 0.5;
    exampleResponses['C4'] = 0.5;
    exampleResponses['C5'] = 0.25;
    // S (Structured Support) — weak
    exampleResponses['S1'] = 0.25;
    exampleResponses['S2'] = 0.5;
    exampleResponses['S3'] = 0.25;
    exampleResponses['S4'] = 0.25;
    exampleResponses['S5'] = 0.0;
    // I (Institutional Anchoring) — moderate
    exampleResponses['I1'] = 0.5;
    exampleResponses['I2'] = 0.75;
    exampleResponses['I3'] = 0.25;
    exampleResponses['I4'] = 0.5;
    exampleResponses['I5'] = 0.25;
    // P (Community of Practice) — weak
    exampleResponses['P1'] = 0.5;
    exampleResponses['P2'] = 0.25;
    exampleResponses['P3'] = 0.5;
    exampleResponses['P4'] = 0.25;
    exampleResponses['P5'] = 0.0;
    // M (Impact Realization) — very weak (no publications/utilizations yet)
    exampleResponses['M1'] = 0.0;
    exampleResponses['M2'] = 0.0;
    exampleResponses['M3'] = 0.0;
    exampleResponses['M4'] = 0.25;
    exampleResponses['M5'] = 0.0;

    setResponses(exampleResponses);
    // Pick a random school for variety
    const randomSchool = EL_SALVADOR_SCHOOLS[Math.floor(Math.random() * EL_SALVADOR_SCHOOLS.length)];
    setSchoolId(randomSchool.id);

    const newScores = computeAllDimensionScores(exampleResponses);
    const newRcsi = computeRcsi(newScores);
    const newMs = classifyMilestone(newScores);
    toast({
      title: 'Example data loaded',
      description: `Filled all 35 questions for ${randomSchool.name}. RCSI = ${newRcsi.toFixed(3)}, M${newMs.milestone}.`,
    });
  };

  const addToQueue = () => {
    if (totalAnswered < totalQuestions) {
      toast({
        title: 'Incomplete survey',
        description: `Please answer all 35 questions. Currently ${totalAnswered}/${totalQuestions} answered.`,
        variant: 'destructive',
      });
      return;
    }
    const row: QueuedRow = {
      schoolName: schoolName.trim(),
      schoolId: selectedSchool.id,
      schoolDisplayName: selectedSchool.name,
      month,
      scores: { ...scores },
      rcsi,
      milestone: milestoneInfo.milestone,
    };
    setQueue(prev => [...prev, row]);
    toast({
      title: 'Added to queue',
      description: `${selectedSchool.name} (${month}) added. Queue has ${queue.length + 1} row(s).`,
    });
    resetForm();
  };

  const downloadCsv = () => {
    const rowsToDownload = queue.length > 0 ? queue : (totalAnswered === totalQuestions ? [{
      schoolName: schoolName.trim(),
      schoolId: selectedSchool.id,
      schoolDisplayName: selectedSchool.name,
      month,
      scores: { ...scores },
      rcsi,
      milestone: milestoneInfo.milestone,
    }] : []);

    if (rowsToDownload.length === 0) {
      toast({
        title: 'Nothing to download',
        description: 'Complete the survey or add rows to the queue first.',
        variant: 'destructive',
      });
      return;
    }

    // Generate CSV in the exact format of quarterly_survey_data.csv
    const headers = ['month', 'school_id_no', 'school_name', 'R', 'A', 'C', 'S', 'I', 'P', 'M'];
    const lines = [headers.join(',')];

    for (const row of rowsToDownload) {
      // Use the real DepEd School ID and the School_N naming convention
      // (the dashboard derives the canonical ID from the name suffix)
      const values = [
        row.month,
        String(row.schoolId),
        row.schoolName,
        row.scores.R.toFixed(9),
        row.scores.A.toFixed(9),
        row.scores.C.toFixed(9),
        row.scores.S.toFixed(9),
        row.scores.I.toFixed(9),
        row.scores.P.toFixed(9),
        row.scores.M.toFixed(9),
      ];
      lines.push(values.join(','));
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `quarterly_survey_data_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV downloaded',
      description: `${rowsToDownload.length} row(s) exported. Upload via the Upload tab to update the dashboard.`,
    });
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    setQueue([]);
    toast({ title: 'Queue cleared' });
  };

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* Questionnaire column */}
        <div className="space-y-4">
          {/* Survey header controls */}
          <Card className="border-border/40 bg-card/60 backdrop-blur">
            <CardContent className="py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">School</Label>
                  <Select value={String(schoolId)} onValueChange={v => setSchoolId(parseInt(v, 10))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EL_SALVADOR_SCHOOLS.map(school => (
                        <SelectItem key={school.id} value={String(school.id)}>
                          <span className="font-mono text-xs text-muted-foreground mr-2">{school.id}</span>
                          {school.name}
                          <span className="ml-2 text-[10px] text-muted-foreground">· {school.level}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{selectedSchool.name}</span>
                    {' '}(DepEd ID: <span className="font-mono">{selectedSchool.id}</span>)
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Quarter</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Select the quarter this survey covers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress bar */}
          <Card className="border-border/40 bg-card/60 backdrop-blur">
            <CardContent className="py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Survey Completion
                </span>
                <span className="text-xs font-mono tabular-nums text-cyan-300">
                  {totalAnswered} / {totalQuestions}
                </span>
              </div>
              <Progress value={completionPct} className="h-2" />
            </CardContent>
          </Card>

          {/* 7 dimension sections */}
          {SURVEY_DIMENSIONS.map((dim) => (
            <DimensionSection
              key={dim.code}
              dimension={dim}
              responses={responses}
              onResponse={handleResponse}
              score={scores[dim.code]}
              answered={answeredCount(dim, responses)}
            />
          ))}

          {/* Action buttons */}
          <Card className="border-border/40 bg-card/60 backdrop-blur">
            <CardContent className="py-4 flex flex-wrap gap-2">
              <Button onClick={downloadCsv} className="gap-1.5">
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
              <Button onClick={addToQueue} variant="secondary" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add to Queue
              </Button>
              <Button onClick={loadExample} variant="outline" className="gap-1.5">
                <Wand2 className="h-4 w-4" />
                Load Example
              </Button>
              <Button onClick={resetForm} variant="ghost" className="gap-1.5">
                <Trash2 className="h-4 w-4" />
                Reset Form
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: live scores + queue */}
        <div className="space-y-4">
          {/* Live scores */}
          <Card className="border-border/40 bg-card/60 backdrop-blur sticky top-20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Live Computed Scores</CardTitle>
              <CardDescription className="text-xs">
                Updates as you answer questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* RCSI headline */}
              <div className="rounded-md border border-cyan-500/30 bg-cyan-950/20 p-3 text-center">
                <div className="text-[10px] uppercase tracking-wide text-cyan-300">RCSI</div>
                <div className="text-3xl font-bold text-cyan-300 tabular-nums">{rcsi.toFixed(3)}</div>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
                    M{milestoneInfo.milestone}
                  </Badge>
                  {milestoneInfo.sustainable && (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
                      Sustainable
                    </Badge>
                  )}
                </div>
                {milestoneInfo.nextThreshold && (
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Next: {milestoneInfo.nextThreshold.dimension} ≥ {milestoneInfo.nextThreshold.value.toFixed(2)}
                    {' '}(now {milestoneInfo.nextThreshold.current.toFixed(2)})
                  </p>
                )}
              </div>

              {/* Per-dimension scores */}
              <div className="space-y-2">
                {DIMENSIONS.map(d => {
                  const v = scores[d];
                  return (
                    <div key={d} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium" style={{ color: CHART_COLORS[d] }}>
                          {d} — {DIMENSION_META[d].name}
                        </span>
                        <span className="font-mono tabular-nums">{v.toFixed(3)}</span>
                      </div>
                      <Progress value={v * 100} className="h-1" />
                    </div>
                  );
                })}
              </div>

              {/* CSV preview */}
              <div className="rounded-md border border-border/40 bg-muted/20 p-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  CSV Row Preview
                </div>
                <code className="text-[9px] font-mono text-muted-foreground break-all leading-relaxed">
                  {month},{schoolName || 'School_?'},
                  {scores.R.toFixed(3)},{scores.A.toFixed(3)},{scores.C.toFixed(3)},
                  {scores.S.toFixed(3)},{scores.I.toFixed(3)},{scores.P.toFixed(3)},{scores.M.toFixed(3)}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Queue */}
          {queue.length > 0 && (
            <Card className="border-border/40 bg-card/60 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Download Queue</CardTitle>
                  <Button onClick={clearQueue} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    Clear
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  {queue.length} row(s) ready for download.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-48">
                  <div className="space-y-1.5">
                    {queue.map((row, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 rounded border border-border/30 p-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{row.schoolDisplayName}</div>
                          <div className="text-muted-foreground">
                            {row.month} · RCSI {row.rcsi.toFixed(3)} · M{row.milestone}
                          </div>
                        </div>
                        <Button
                          onClick={() => removeFromQueue(i)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button onClick={downloadCsv} size="sm" className="w-full mt-2 gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Download All ({queue.length})
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dimension section component ──

function DimensionSection({
  dimension, responses, onResponse, score, answered,
}: {
  dimension: SurveyDimension;
  responses: Record<string, number>;
  onResponse: (id: string, value: number) => void;
  score: number;
  answered: number;
}) {
  const color = CHART_COLORS[dimension.code as keyof typeof CHART_COLORS];
  const allAnswered = answered === dimension.questions.length;

  return (
    <Card className={`border-border/40 bg-card/60 backdrop-blur ${allAnswered ? 'ring-1 ring-emerald-500/20' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-bold"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {dimension.code}
            </span>
            <div>
              <CardTitle className="text-sm">{dimension.name}</CardTitle>
              <CardDescription className="text-xs">
                {dimension.description} · M{dimension.milestone}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold tabular-nums" style={{ color }}>
              {score.toFixed(3)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {answered}/{dimension.questions.length} answered
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        {dimension.questions.map((q) => {
          const current = responses[q.id];
          return (
            <div key={q.id} className="rounded-md border border-border/30 p-2.5">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-[10px] font-mono text-muted-foreground mt-0.5">{q.id}</span>
                <span className="text-xs leading-relaxed flex-1">{q.text}</span>
              </div>
              <div className="flex gap-1 ml-7">
                {LIKERT_SCALE.map((opt) => {
                  const isSelected = current === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => onResponse(q.id, opt.value)}
                      className={`flex-1 rounded px-1 py-1 text-[10px] font-medium transition-colors border ${
                        isSelected
                          ? 'border-transparent text-white'
                          : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/30'
                      }`}
                      style={isSelected ? { backgroundColor: color } : {}}
                      title={opt.label}
                    >
                      {opt.short}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
