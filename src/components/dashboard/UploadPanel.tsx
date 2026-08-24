'use client';

import { useCallback, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { UploadPreviewFile } from '@/lib/types';

export function UploadPanel({ onUploadCommitted }: { onUploadCommitted: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<UploadPreviewFile[] | null>(null);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitMode, setCommitMode] = useState<'merge' | 'replace'>('merge');
  const [commitResult, setCommitResult] = useState<{
    surveysInserted: number; surveysUpdated: number;
    researchInserted: number; researchUpdated: number; researchSkipped: number;
    schoolsAffected: number;
  } | null>(null);
  const { toast } = useToast();

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    setFiles(Array.from(incoming));
    setPreviews(null);
    setCommitResult(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const validate = async () => {
    if (files.length === 0) return;
    setValidating(true);
    setCommitResult(null);
    try {
      const fd = new FormData();
      for (const f of files) fd.append('files', f);
      fd.append('mode', 'validate');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      setPreviews(data.files);
    } catch (e) {
      toast({ title: 'Validation failed', description: String(e), variant: 'destructive' });
    } finally {
      setValidating(false);
    }
  };

  const commit = async (retryCount = 0) => {
    if (files.length === 0) return;
    setCommitting(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append('files', f);
      fd.append('mode', commitMode);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.status === 409 && retryCount < 3) {
        // Another upload is in progress — wait and retry
        toast({
          title: 'Another upload in progress',
          description: `Waiting ${data.retryAfter || 5}s before retrying… (${retryCount + 1}/3)`,
        });
        setTimeout(() => commit(retryCount + 1), (data.retryAfter || 5) * 1000);
        return;
      }
      if (!res.ok) {
        toast({ title: 'Upload failed', description: data.error || 'Unknown error', variant: 'destructive' });
      } else {
        setCommitResult({
          surveysInserted: data.surveysInserted,
          surveysUpdated: data.surveysUpdated,
          researchInserted: data.researchInserted,
          researchUpdated: data.researchUpdated,
          researchSkipped: data.researchSkipped,
          schoolsAffected: data.schoolsAffected,
        });
        const totalSurvey = data.surveysInserted + data.surveysUpdated;
        const totalResearch = data.researchInserted + data.researchUpdated;
        toast({
          title: 'Upload successful',
          description: commitMode === 'merge'
            ? `Merged: ${totalSurvey} survey rows (${data.surveysInserted} new, ${data.surveysUpdated} updated) and ${totalResearch} research records (${data.researchInserted} new, ${data.researchUpdated} updated).`
            : `Replaced all: inserted ${data.surveysInserted} survey rows and ${data.researchInserted} research records.`,
        });
        onUploadCommitted();
      }
    } catch (e) {
      toast({ title: 'Upload failed', description: String(e), variant: 'destructive' });
    } finally {
      setCommitting(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setPreviews(null);
    setCommitResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const allClean = previews && previews.every(p => p.errors.length === 0);
  const anyErrors = previews && previews.some(p => p.errors.length > 0);

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle>Excel / CSV Upload Portal</CardTitle>
        <CardDescription>
          Upload your quarterly survey data and/or research metadata files.
          The portal auto-detects file type by inspecting column headers.
          Supported formats: <code className="text-cyan-300">.csv</code>, <code className="text-cyan-300">.xlsx</code>, <code className="text-cyan-300">.xls</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-cyan-400 bg-cyan-500/10' : 'border-border/50 hover:border-cyan-500/50 hover:bg-muted/20'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".csv,.tsv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <UploadCloud className={`mx-auto h-12 w-12 ${dragOver ? 'text-cyan-400' : 'text-muted-foreground'}`} />
          <p className="mt-3 text-sm">
            <span className="font-medium">Click to browse</span> or drag &amp; drop your files here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Expected: <code>quarterly_survey_data.csv</code> and/or <code>research_metadata.csv</code>
          </p>
        </div>

        {/* Selected files */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Selected files</div>
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-md border border-border/40 p-2.5">
                  <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Upload mode toggle */}
            <div className="flex items-center gap-3 rounded-md border border-border/40 bg-muted/20 p-3">
              <div className="flex-1">
                <div className="text-xs font-medium mb-0.5">Upload Mode</div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCommitMode('merge')}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                      commitMode === 'merge'
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                        : 'border-border/40 text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    Merge (recommended)
                  </button>
                  <button
                    onClick={() => setCommitMode('replace')}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                      commitMode === 'replace'
                        ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                        : 'border-border/40 text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    Replace All
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground max-w-[280px]">
                {commitMode === 'merge'
                  ? 'Adds new rows and updates existing ones by their natural key (school+quarter for surveys, teacher+title+year for research). Previous data is preserved.'
                  : '⚠ Wipes all existing data before inserting. Use only for full dataset refreshes.'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={validate} disabled={validating} className="gap-1.5">
                {validating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Validate
              </Button>
              <Button
                onClick={() => commit()}
                disabled={committing || !allClean}
                variant="secondary"
                className="gap-1.5"
              >
                {committing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {commitMode === 'merge' ? 'Merge to Database' : 'Replace Database'}
              </Button>
              <Button onClick={reset} variant="ghost">Clear</Button>
            </div>
            {!allClean && previews && (
              <p className="text-xs text-amber-400">
                Resolve validation errors before committing.
              </p>
            )}
          </div>
        )}

        {/* Commit warning */}
        {commitMode === 'replace' ? (
          <Alert className="border-rose-500/30 bg-rose-950/20 text-rose-100">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-rose-200">Replace mode — data loss warning</AlertTitle>
            <AlertDescription className="text-rose-200/80">
              <strong>Replace mode wipes all existing survey and research data</strong> before inserting your uploaded file(s).
              This is irreversible. Use <strong>Merge mode</strong> (recommended) unless you need a full refresh.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-emerald-500/30 bg-emerald-950/20 text-emerald-100">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle className="text-emerald-200">Merge mode — historical data preserved</AlertTitle>
            <AlertDescription className="text-emerald-200/80">
              Merge mode adds new rows and updates existing ones by their natural key. Previous quarters' data is preserved,
              enabling historical trend analysis and quarter-over-quarter comparison in the narratives.
            </AlertDescription>
          </Alert>
        )}

        {/* Validation previews */}
        {previews && (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Validation results</div>
            {previews.map((p, i) => (
              <div key={i} className="rounded-md border border-border/40 bg-card/40 p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                  <span className="font-medium text-sm">{p.fileName}</span>
                  <Badge variant="outline" className={
                    p.detectedKind === 'survey' ? 'border-cyan-500/40 text-cyan-300' :
                    p.detectedKind === 'research' ? 'border-violet-500/40 text-violet-300' :
                    'border-rose-500/40 text-rose-300'
                  }>
                    {p.detectedKind}
                  </Badge>
                  <Badge variant="secondary">{p.rowCount} rows</Badge>
                  {p.errors.length === 0 ? (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Clean
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-rose-500/40 text-rose-300">
                      <XCircle className="h-3 w-3 mr-1" /> {p.errors.length} error{p.errors.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                {p.errors.length > 0 && (
                  <ul className="text-xs space-y-0.5 text-rose-300">
                    {p.errors.map((e, j) => <li key={j}>• {e}</li>)}
                  </ul>
                )}
                {p.warnings.length > 0 && (
                  <ul className="text-xs space-y-0.5 text-amber-300">
                    {p.warnings.map((w, j) => <li key={j}>• {w}</li>)}
                  </ul>
                )}
                {p.preview.length > 0 && (
                  <ScrollArea className="max-h-40 rounded border border-border/30">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30 sticky top-0">
                        <tr>
                          {Object.keys(p.preview[0]).map(h => (
                            <th key={h} className="text-left p-1.5 font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {p.preview.map((row, j) => (
                          <tr key={j} className="border-t border-border/20">
                            {Object.values(row).map((v, k) => (
                              <td key={k} className="p-1.5 whitespace-nowrap font-mono text-muted-foreground">{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Commit result */}
        {commitResult && (
          <Alert className="border-emerald-500/30 bg-emerald-950/20 text-emerald-100">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle className="text-emerald-200">Upload successful</AlertTitle>
            <AlertDescription className="text-emerald-200/80">
              {commitMode === 'merge' ? (
                <>
                  <strong>Survey data:</strong> {commitResult.surveysInserted} new + {commitResult.surveysUpdated} updated rows.<br/>
                  <strong>Research records:</strong> {commitResult.researchInserted} new + {commitResult.researchUpdated} updated
                  {commitResult.researchSkipped > 0 ? ` (${commitResult.researchSkipped} skipped due to duplicates)` : ''}.<br/>
                  Across <strong>{commitResult.schoolsAffected}</strong> schools. All dashboard tiles have been refreshed with historical data preserved.
                </>
              ) : (
                <>
                  Inserted <strong>{commitResult.surveysInserted}</strong> survey rows and{' '}
                  <strong>{commitResult.researchInserted}</strong> research records across{' '}
                  <strong>{commitResult.schoolsAffected}</strong> schools. All dashboard tiles have been refreshed.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Schema reference */}
        <details className="rounded-md border border-border/40 bg-card/30 p-3">
          <summary className="cursor-pointer text-sm font-medium">Expected column schemas</summary>
          <div className="mt-3 grid md:grid-cols-2 gap-3 text-xs">
            <div>
              <div className="font-semibold text-cyan-300 mb-1">quarterly_survey_data</div>
              <code className="block bg-muted/30 rounded p-2 font-mono text-[10px] leading-relaxed">
                month, school_id_no, school_name, R, A, C, S, I, P, M
              </code>
              <p className="mt-1 text-muted-foreground">
                Each row = one school × one quarter. <code>month</code> format: <code>YYYY-MM</code>.
              </p>
            </div>
            <div>
              <div className="font-semibold text-violet-300 mb-1">research_metadata</div>
              <code className="block bg-muted/30 rounded p-2 font-mono text-[10px] leading-relaxed">
                upload_date, teacher_name, school_id_no, document_type, title, theme, status, publication_link,
                utilized_by_school, utilization_date, year_undertaken, years_of_service, teacher_rank, educational_attainment
              </code>
              <p className="mt-1 text-muted-foreground">
                Each row = one research output by a teacher.
              </p>
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
