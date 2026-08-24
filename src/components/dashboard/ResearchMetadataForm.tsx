'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Download, Plus, Trash2, FileSpreadsheet, FlaskConical, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { EL_SALVADOR_SCHOOLS, findSchoolById } from '@/lib/elSalvadorSchools';
import { detectTheme, confidenceLabel } from '@/lib/themeDetector';

// ── Field option constants (aligned with the data dictionary in Appendix A) ──

export const THEMES = [
  'Assessment & Evaluation',
  'Leadership & Governance',
  'Learner Engagement & Well-being',
  'Others',
  'Professional Development',
  'Teaching Strategies',
  'Technology Integration',
] as const;

export const STATUSES = [
  'draft',
  'under_review',
  'submitted',
  'published',
  'rejected',
] as const;

export const DOCUMENT_TYPES = ['abstract', 'full_paper'] as const;

export const TEACHER_RANKS = [
  'Teacher I',
  'Teacher II',
  'Teacher III',
  'Master Teacher I',
  'Master Teacher II',
  'School Head',
] as const;

export const EDUCATIONAL_ATTAINMENTS = ["Bachelor's", "Master's", "Doctorate"] as const;

// ── Form state interface ──

export interface ResearchMetadataRecord {
  upload_date: string;
  teacher_name: string;
  school_id_no: string;
  school_name: string; // for display + ID derivation, matches survey convention
  document_type: string;
  title: string;
  theme: string;
  status: string;
  publication_link: string;
  utilized_by_school: boolean;
  utilization_date: string;
  year_undertaken: number;
  years_of_service: number;
  teacher_rank: string;
  educational_attainment: string;
}

const emptyRecord = (): ResearchMetadataRecord => ({
  upload_date: new Date().toISOString().slice(0, 10),
  teacher_name: '',
  school_id_no: '',
  school_name: '',
  document_type: 'abstract',
  title: '',
  theme: 'Teaching Strategies',
  status: 'draft',
  publication_link: '',
  utilized_by_school: false,
  utilization_date: '',
  year_undertaken: new Date().getFullYear(),
  years_of_service: 0,
  teacher_rank: 'Teacher I',
  educational_attainment: "Bachelor's",
});

const CSV_HEADERS = [
  'upload_date', 'teacher_name', 'school_id_no', 'document_type', 'title', 'theme',
  'status', 'publication_link', 'utilized_by_school', 'utilization_date',
  'year_undertaken', 'years_of_service', 'teacher_rank', 'educational_attainment',
];

function recordToCsvRow(r: ResearchMetadataRecord): string {
  // Derive school_id_no from school_name suffix if not provided
  let sid = r.school_id_no;
  if (!sid && r.school_name) {
    const m = /(\d+)$/.exec(r.school_name);
    if (m) sid = m[1];
  }
  const fields = [
    r.upload_date,
    r.teacher_name,
    sid,
    r.document_type,
    r.title,
    r.theme,
    r.status,
    r.publication_link,
    String(r.utilized_by_school),
    r.utilization_date,
    String(r.year_undertaken),
    String(r.years_of_service),
    r.teacher_rank,
    r.educational_attainment,
  ];
  // Escape fields containing commas, quotes, or newlines (RFC 4180)
  return fields.map(f => {
    const s = String(f ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }).join(',');
}

export function ResearchMetadataForm() {
  const [record, setRecord] = useState<ResearchMetadataRecord>(emptyRecord);
  const [queue, setQueue] = useState<ResearchMetadataRecord[]>([]);
  const { toast } = useToast();

  const update = <K extends keyof ResearchMetadataRecord>(key: K, value: ResearchMetadataRecord[K]) => {
    setRecord(prev => ({ ...prev, [key]: value }));
  };

  const isValid = useMemo(() => {
    return (
      record.teacher_name.trim() !== '' &&
      record.title.trim() !== '' &&
      (record.school_id_no.trim() !== '' || record.school_name.trim() !== '')
    );
  }, [record]);

  // ── Auto-theme detection from title (keyword-based, instant) ──
  const themeDetection = useMemo(() => detectTheme(record.title), [record.title]);

  // Track whether the user has manually overridden the auto-detected theme.
  // If they have, we stop auto-updating on title changes until they reset.
  const [themeOverridden, setThemeOverridden] = useState(false);

  // ── AI-powered theme classification (hybrid approach) ──
  // Keywords give instant feedback while typing.
  // AI gives a more accurate classification when the user stops typing.
  const [aiTheme, setAiTheme] = useState<string | null>(null);
  const [aiClassifying, setAiClassifying] = useState(false);

  // Debounced AI classification — runs 1.5 seconds after the user stops typing
  // Only depends on record.title and themeOverridden (NOT record.theme, to avoid loops)
  useEffect(() => {
    if (!record.title.trim() || record.title.trim().length < 5 || themeOverridden) {
      setAiTheme(null);
      return;
    }
    const titleSnapshot = record.title;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setAiClassifying(true);
      try {
        const res = await fetch('/api/ai/classify-theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: titleSnapshot }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.theme && data.confidence === 'high') {
          setAiTheme(data.theme);
        }
      } catch {
        // Silent fail — keyword detection is the fallback
      } finally {
        if (!cancelled) setAiClassifying(false);
      }
    }, 1500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [record.title, themeOverridden]);

  // When the title changes, auto-set the theme using keyword detection (instant)
  const handleTitleChange = (newTitle: string) => {
    const detection = detectTheme(newTitle);
    setRecord(prev => ({
      ...prev,
      title: newTitle,
      // Only auto-update theme if user hasn't manually overridden
      theme: !themeOverridden && detection.confidence !== 'none'
        ? detection.theme
        : prev.theme,
    }));
    // Reset override flag and AI state when title changes
    if (themeOverridden) setThemeOverridden(false);
    setAiTheme(null);
  };

  // When the user manually selects a theme, mark it as overridden.
  const handleThemeChange = (value: string) => {
    setThemeOverridden(true);
    setAiTheme(null);
    update('theme', value);
  };

  // ── School dropdown handler ──
  const handleSchoolSelect = (schoolIdStr: string) => {
    const schoolId = parseInt(schoolIdStr, 10);
    const school = findSchoolById(schoolId);
    if (school) {
      setRecord(prev => ({
        ...prev,
        school_id_no: String(school.id),
        school_name: school.name,
      }));
    }
  };

  // ── Load Example Data ──
  const loadExample = () => {
    const examples = [
      {
        teacher_name: 'Maria Santos',
        title: 'Assessment of Student Engagement Through Formative Assessment Strategies',
        theme: 'Assessment & Evaluation' as const,
        document_type: 'full_paper',
        status: 'published',
        teacher_rank: 'Master Teacher I',
        educational_attainment: "Master's",
        years_of_service: 15,
        year_undertaken: 2024,
        publication_link: 'https://doi.org/10.5333/926',
        utilized_by_school: true,
        utilization_date: new Date().toISOString().slice(0, 10),
      },
      {
        teacher_name: 'Juan dela Cruz',
        title: 'Integrating Technology in Teaching Mathematics: A Blended Learning Approach',
        theme: 'Technology Integration' as const,
        document_type: 'abstract',
        status: 'under_review',
        teacher_rank: 'Teacher III',
        educational_attainment: "Bachelor's",
        years_of_service: 8,
        year_undertaken: 2025,
        publication_link: '',
        utilized_by_school: false,
        utilization_date: '',
      },
      {
        teacher_name: 'Ana Reyes',
        title: 'Leadership and Governance Practices of School Heads in Promoting Research Culture',
        theme: 'Leadership & Governance' as const,
        document_type: 'full_paper',
        status: 'submitted',
        teacher_rank: 'School Head',
        educational_attainment: 'Doctorate',
        years_of_service: 22,
        year_undertaken: 2025,
        publication_link: '',
        utilized_by_school: false,
        utilization_date: '',
      },
    ];
    // Pick a random example each time
    const ex = examples[Math.floor(Math.random() * examples.length)];
    // Pick a random school from the division
    const school = EL_SALVADOR_SCHOOLS[Math.floor(Math.random() * EL_SALVADOR_SCHOOLS.length)];
    setRecord(prev => ({
      ...prev,
      ...ex,
      upload_date: new Date().toISOString().slice(0, 10),
      school_id_no: String(school.id),
      school_name: school.name,
    }));
    setThemeOverridden(false);
    toast({
      title: 'Example data loaded',
      description: `Filled with a sample ${ex.theme} research record. Adjust as needed.`,
    });
  };

  const resetForm = () => {
    setRecord(emptyRecord());
    setThemeOverridden(false);
    setAiTheme(null);
  };

  const addToQueue = () => {
    if (!isValid) {
      toast({
        title: 'Incomplete record',
        description: 'Teacher name, research title, and school identifier are required.',
        variant: 'destructive',
      });
      return;
    }
    setQueue(prev => [...prev, { ...record }]);
    toast({
      title: 'Added to queue',
      description: `"${record.title}" by ${record.teacher_name} added. Queue has ${queue.length + 1} record(s).`,
    });
    resetForm();
  };

  const downloadCsv = useCallback(() => {
    const recordsToDownload = queue.length > 0 ? queue : (isValid ? [record] : []);
    if (recordsToDownload.length === 0) {
      toast({
        title: 'Nothing to download',
        description: 'Fill in the required fields or add records to the queue first.',
        variant: 'destructive',
      });
      return;
    }

    const lines = [CSV_HEADERS.join(','), ...recordsToDownload.map(recordToCsvRow)];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `research_metadata_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV downloaded',
      description: `${recordsToDownload.length} record(s) exported. Upload via the Upload tab to update the dashboard.`,
    });
  }, [queue, record, isValid, toast]);

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    setQueue([]);
    toast({ title: 'Queue cleared' });
  };

  return (
    <div className="space-y-4">
      {/* Intro */}
      <Card className="border-violet-500/30 bg-gradient-to-br from-violet-950/20 via-card/60 to-cyan-950/20 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-violet-400" />
            Research Metadata Collection Form
          </CardTitle>
          <CardDescription>
            Capture individual research outputs (abstracts and full papers) produced by teachers.
            Fill in the form for each output, add to the queue, then download a CSV in the exact
            format of <code className="text-violet-300">research_metadata.csv</code>. Upload via
            the Upload tab to refresh the Research Analytics tab.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* Form column */}
        <div className="space-y-4">
          {/* Researcher & School section */}
          <Card className="border-border/40 bg-card/60 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Researcher &amp; School</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Teacher Name <span className="text-rose-400">*</span></Label>
                  <Input
                    value={record.teacher_name}
                    onChange={e => update('teacher_name', e.target.value)}
                    placeholder="e.g., Maria Santos"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">School <span className="text-rose-400">*</span></Label>
                  <Select
                    value={record.school_id_no || undefined}
                    onValueChange={handleSchoolSelect}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a school…" />
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
                  {record.school_name && (
                    <p className="text-[10px] text-muted-foreground">
                      Selected: <span className="font-medium text-foreground">{record.school_name}</span>
                      {' '}(ID: <span className="font-mono">{record.school_id_no}</span>)
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Upload Date</Label>
                  <Input
                    type="date"
                    value={record.upload_date}
                    onChange={e => update('upload_date', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Teacher Rank</Label>
                  <Select value={record.teacher_rank} onValueChange={v => update('teacher_rank', v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEACHER_RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Educational Attainment</Label>
                  <Select value={record.educational_attainment} onValueChange={v => update('educational_attainment', v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EDUCATIONAL_ATTAINMENTS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Years of Service</Label>
                  <Input
                    type="number"
                    min={0}
                    value={record.years_of_service}
                    onChange={e => update('years_of_service', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Year Undertaken</Label>
                  <Input
                    type="number"
                    min={2000}
                    max={2100}
                    value={record.year_undertaken}
                    onChange={e => update('year_undertaken', parseInt(e.target.value) || new Date().getFullYear())}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Research Output section */}
          <Card className="border-border/40 bg-card/60 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Research Output</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  Title <span className="text-rose-400">*</span>
                  {themeDetection.confidence !== 'none' && !themeOverridden && !aiTheme && (
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-medium text-violet-300">
                            <Sparkles className="h-2.5 w-2.5" />
                            Auto-detected
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="font-semibold mb-0.5">{confidenceLabel(themeDetection.confidence)}</p>
                          <p className="text-xs text-muted-foreground">
                            Matched: {themeDetection.matchedKeywords.join(', ')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {aiClassifying && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-medium text-cyan-300">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      AI classifying…
                    </span>
                  )}
                  {aiTheme && !themeOverridden && (
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-medium text-cyan-300">
                            <Sparkles className="h-2.5 w-2.5" />
                            AI-verified
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="font-semibold mb-0.5">AI Classification Applied</p>
                          <p className="text-xs text-muted-foreground">
                            The AI refined the theme from the keyword-based suggestion.
                            You can still change it manually.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {themeOverridden && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
                      Manual override
                    </span>
                  )}
                </Label>
                <Input
                  value={record.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="e.g., Assessment of Student Engagement Through Formative Assessment Strategies"
                />
                {themeDetection.confidence !== 'none' && !aiTheme && (
                  <p className="text-[10px] text-muted-foreground">
                    Detected theme: <span className="font-medium text-violet-300">{themeDetection.theme}</span>
                    {' '}· {confidenceLabel(themeDetection.confidence)}
                    {themeDetection.matchedKeywords.length > 0 && (
                      <span className="text-muted-foreground/70">
                        {' '}(keywords: {themeDetection.matchedKeywords.slice(0, 4).join(', ')}
                        {themeDetection.matchedKeywords.length > 4 ? '…' : ''})
                      </span>
                    )}
                  </p>
                )}
                {aiTheme && !themeOverridden && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                    <span>
                      AI suggests: <span className="font-medium text-cyan-300">{aiTheme}</span>
                    </span>
                    {aiTheme !== record.theme && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          update('theme', aiTheme);
                        }}
                        className="inline-flex items-center rounded-full border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                      >
                        Apply
                      </button>
                    )}
                  </p>
                )}
                {themeDetection.confidence === 'none' && !aiTheme && !aiClassifying && record.title.trim() !== '' && (
                  <p className="text-[10px] text-muted-foreground">
                    No theme keywords detected — AI classification in progress or select manually.
                  </p>
                )}
                {aiClassifying && themeDetection.confidence === 'none' && (
                  <p className="text-[10px] text-cyan-400/70">
                    AI is analyzing the title…
                  </p>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Document Type</Label>
                  <Select value={record.document_type} onValueChange={v => update('document_type', v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map(d => <SelectItem key={d} value={d} className="capitalize">{d.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    Theme
                    {themeDetection.confidence !== 'none' && !themeOverridden && (
                      <Wand2 className="h-3 w-3 text-violet-400" />
                    )}
                  </Label>
                  <Select value={record.theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {THEMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={record.status} onValueChange={v => update('status', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Publication Link (optional)</Label>
                <Input
                  value={record.publication_link}
                  onChange={e => update('publication_link', e.target.value)}
                  placeholder="https://doi.org/..."
                  className="font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Utilization section */}
          <Card className="border-border/40 bg-card/60 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Utilization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-md border border-border/30 p-3">
                <div>
                  <Label className="text-xs">Utilized by School</Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Whether this research has been utilized in classroom practice or school programs.
                  </p>
                </div>
                <Switch
                  checked={record.utilized_by_school}
                  onCheckedChange={v => update('utilized_by_school', v)}
                />
              </div>
              {record.utilized_by_school && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Utilization Date</Label>
                  <Input
                    type="date"
                    value={record.utilization_date}
                    onChange={e => update('utilization_date', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

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
              {!isValid && (
                <p className="text-xs text-amber-400 self-center">
                  Required fields: teacher name, title, and school.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: live preview + queue */}
        <div className="space-y-4">
          {/* CSV row preview */}
          <Card className="border-border/40 bg-card/60 backdrop-blur sticky top-20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">CSV Row Preview</CardTitle>
              <CardDescription className="text-xs">
                The exact row that will be added to <code>research_metadata.csv</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-md border border-border/40 bg-muted/20 p-2 max-h-48 overflow-auto">
                <code className="text-[10px] font-mono text-muted-foreground break-all leading-relaxed">
                  {recordToCsvRow(record)}
                </code>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Required fields</span>
                  <span className={isValid ? 'text-emerald-400' : 'text-amber-400'}>
                    {isValid ? '✓ Complete' : 'Incomplete'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total columns</span>
                  <span className="font-mono">14</span>
                </div>
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
                  {queue.length} record(s) ready for download.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-64">
                  <div className="space-y-1.5">
                    {queue.map((r, i) => (
                      <div key={i} className="flex items-start justify-between gap-2 rounded border border-border/30 p-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{r.title || 'Untitled'}</div>
                          <div className="text-muted-foreground truncate">
                            {r.teacher_name} · {r.school_name || r.school_id_no || '?'} · {r.theme}
                          </div>
                          <Badge variant="outline" className="mt-0.5 text-[9px] capitalize">
                            {r.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Button
                          onClick={() => removeFromQueue(i)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 shrink-0"
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
