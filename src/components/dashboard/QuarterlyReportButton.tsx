'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, Download, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuarterlyReportButtonProps {
  selectedMonth: string;
}

export function QuarterlyReportButton({ selectedMonth }: QuarterlyReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState<string>('');
  const { toast } = useToast();

  const generateReport = async () => {
    setLoading(true);
    setReport(null);
    setOpen(true);
    try {
      const res = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }
      setReport(data.report);
      setReportPeriod(data.period);
      toast({
        title: 'Report generated',
        description: `Quarterly report for ${data.period} is ready.`,
      });
    } catch (e) {
      toast({
        title: 'Report generation failed',
        description: String(e),
        variant: 'destructive',
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RCSI-Quarterly-Report-${reportPeriod || selectedMonth}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Report downloaded', description: 'Markdown file saved to your downloads.' });
  };

  const downloadAsText = () => {
    if (!report) return;
    // Create a simple formatted text version
    const header = `EL SALVADOR DIVISION RCSI QUARTERLY REPORT\nPeriod: ${reportPeriod}\nGenerated: ${new Date().toLocaleString()}\n${'='.repeat(60)}\n\n`;
    const blob = new Blob([header + report], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RCSI-Quarterly-Report-${reportPeriod || selectedMonth}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button onClick={generateReport} variant="outline" size="sm" className="gap-1.5 shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
        Generate Quarterly Report
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!loading) setOpen(o); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2 border-b border-border/40">
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-400" />
                  AI-Generated Quarterly Report
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {reportPeriod ? `Period: ${reportPeriod}` : 'Generating report…'}
                </DialogDescription>
              </div>
              {report && (
                <div className="flex gap-2">
                  <Button onClick={downloadAsText} variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> .txt
                  </Button>
                  <Button onClick={downloadReport} size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> .md
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] px-6 py-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                </div>
                <h4 className="text-sm font-semibold mb-1">Generating quarterly report…</h4>
                <p className="text-xs text-muted-foreground text-center max-w-sm">
                  The AI is analyzing all dashboard data and writing a comprehensive narrative report.
                  This takes 15–30 seconds.
                </p>
                <Badge variant="outline" className="mt-3 text-[10px] border-violet-500/40 text-violet-300">
                  <Sparkles className="h-3 w-3 mr-1" /> AI-Powered
                </Badge>
              </div>
            ) : report ? (
              <div className="prose prose-sm prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                  {report}
                </pre>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Report generation failed. Please try again.
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
