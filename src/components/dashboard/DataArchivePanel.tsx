'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, Download, FileSpreadsheet, History, Archive, TrendingUp } from 'lucide-react';

interface UploadBatch {
  id: string;
  timestamp: string;
  mode: string;
  fileName: string;
  detectedKind: string;
  rowCount: number;
  inserted: number;
  updated: number;
  skipped: number;
  status: string;
  error: string | null;
}

interface QuarterSummary {
  month: string;
  schoolCount: number;
  avgRcsi: number;
  milestoneBuckets: number[];
}

interface ArchiveData {
  batches: UploadBatch[];
  quarterSummary: QuarterSummary[];
  researchCount: number;
  schoolCount: number;
  totalQuarters: number;
}

export function DataArchivePanel() {
  const [data, setData] = useState<ArchiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/archive')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const exportSurvey = (month: string) => {
    window.open(`/api/archive?export=survey&month=${month}`, '_blank');
  };

  const exportResearch = () => {
    window.open('/api/archive?export=research', '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <Database className="h-3.5 w-3.5" /> Total Quarters
            </div>
            <div className="text-2xl font-bold text-cyan-400">{data.totalQuarters}</div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <Archive className="h-3.5 w-3.5" /> Schools in DB
            </div>
            <div className="text-2xl font-bold text-violet-400">{data.schoolCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Research Records
            </div>
            <div className="text-2xl font-bold text-emerald-400">{data.researchCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <History className="h-3.5 w-3.5" /> Upload Operations
            </div>
            <div className="text-2xl font-bold text-amber-400">{data.batches.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quarter snapshots */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-cyan-400" />
            Quarter Snapshots
          </CardTitle>
          <CardDescription>
            All quarters with data in the database. Export any quarter's raw survey data as CSV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.quarterSummary.length > 0 ? (
            <div className="overflow-x-auto rounded-md border border-border/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/40">
                    <th className="text-left p-2.5 font-medium">Quarter</th>
                    <th className="text-center p-2.5 font-medium">Schools</th>
                    <th className="text-center p-2.5 font-medium">Avg RCSI</th>
                    <th className="text-center p-2.5 font-medium">M0</th>
                    <th className="text-center p-2.5 font-medium">M1</th>
                    <th className="text-center p-2.5 font-medium">M2</th>
                    <th className="text-center p-2.5 font-medium">M3</th>
                    <th className="text-center p-2.5 font-medium">M4</th>
                    <th className="text-center p-2.5 font-medium">M5</th>
                    <th className="text-center p-2.5 font-medium">M6</th>
                    <th className="text-right p-2.5 font-medium">Export</th>
                  </tr>
                </thead>
                <tbody>
                  {data.quarterSummary.slice().reverse().map((q, i) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="p-2.5 font-mono font-medium">{q.month}</td>
                      <td className="p-2.5 text-center">{q.schoolCount}</td>
                      <td className="p-2.5 text-center font-mono tabular-nums text-cyan-400">{q.avgRcsi.toFixed(3)}</td>
                      {q.milestoneBuckets.map((count, mi) => (
                        <td key={mi} className="p-2.5 text-center font-mono text-xs">
                          {count > 0 ? (
                            <span className={count > 0 && mi === 6 ? 'text-emerald-400 font-bold' : 'text-muted-foreground'}>
                              {count}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                      ))}
                      <td className="p-2.5 text-right">
                        <Button
                          onClick={() => exportSurvey(q.month)}
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                        >
                          <Download className="h-3 w-3" /> CSV
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No survey data in the database.</p>
          )}
        </CardContent>
      </Card>

      {/* Export all research */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-sm">Full Research Metadata Export</CardTitle>
          <CardDescription className="text-xs">
            Download all research records as a single CSV file (for backup or external analysis).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportResearch} className="gap-1.5">
            <Download className="h-4 w-4" />
            Export All Research ({data.researchCount.toLocaleString()} records)
          </Button>
        </CardContent>
      </Card>

      {/* Upload audit log */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-amber-400" />
            Upload Audit Log
          </CardTitle>
          <CardDescription>
            Complete history of every upload operation (most recent first).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.batches.length > 0 ? (
            <ScrollArea className="max-h-96">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card/95 backdrop-blur">
                    <tr className="border-b border-border/40">
                      <th className="text-left p-2 font-medium">Timestamp</th>
                      <th className="text-left p-2 font-medium">Mode</th>
                      <th className="text-left p-2 font-medium">File</th>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-center p-2 font-medium">Rows</th>
                      <th className="text-center p-2 font-medium">Inserted</th>
                      <th className="text-center p-2 font-medium">Updated</th>
                      <th className="text-center p-2 font-medium">Skipped</th>
                      <th className="text-center p-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.batches.map((b, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-muted/20">
                        <td className="p-2 font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(b.timestamp).toLocaleString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="p-2">
                          <Badge
                            variant="outline"
                            className={b.mode === 'merge'
                              ? 'border-emerald-500/40 text-emerald-300 text-[9px]'
                              : 'border-rose-500/40 text-rose-300 text-[9px]'}
                          >
                            {b.mode}
                          </Badge>
                        </td>
                        <td className="p-2 truncate max-w-[200px]" title={b.fileName}>{b.fileName}</td>
                        <td className="p-2 text-muted-foreground">{b.detectedKind}</td>
                        <td className="p-2 text-center font-mono">{b.rowCount}</td>
                        <td className="p-2 text-center font-mono text-emerald-400">{b.inserted}</td>
                        <td className="p-2 text-center font-mono text-cyan-400">{b.updated}</td>
                        <td className="p-2 text-center font-mono text-amber-400">{b.skipped}</td>
                        <td className="p-2 text-center">
                          {b.status === 'success' ? (
                            <span className="text-emerald-400">✓</span>
                          ) : (
                            <span className="text-rose-400" title={b.error || ''}>✗</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No uploads recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
