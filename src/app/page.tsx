'use client';

import { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OverviewPanel } from '@/components/dashboard/OverviewPanel';
import { SchoolsPanel } from '@/components/dashboard/SchoolsPanel';
import { SchoolDetailDialog } from '@/components/dashboard/SchoolDetailDialog';
import { ResearchPanel } from '@/components/dashboard/ResearchPanel';
import { TwinPanel } from '@/components/dashboard/TwinPanel';
import { UploadPanel } from '@/components/dashboard/UploadPanel';
import { SurveyPanel } from '@/components/dashboard/SurveyPanel';
import { DataArchivePanel } from '@/components/dashboard/DataArchivePanel';
import { TrendAnalysisPanel } from '@/components/dashboard/TrendAnalysisPanel';
import { AIChatPanel } from '@/components/dashboard/AIChatPanel';
import { QuarterlyReportButton } from '@/components/dashboard/QuarterlyReportButton';
import { PWAInstallPrompt } from '@/components/dashboard/PWAInstallPrompt';
import { GlossaryPanel } from '@/components/dashboard/GlossaryPanel';
import { OverviewData, SchoolRow } from '@/lib/types';
import { Activity, Building2, FlaskConical, Sparkles, UploadCloud, RefreshCw, ClipboardList, Archive, TrendingUp, BookOpen } from 'lucide-react';

type TabKey = 'overview' | 'schools' | 'research' | 'twin' | 'survey' | 'archive' | 'trends' | 'glossary' | 'upload';

export default function Home() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState<string>('latest');

  const fetchOverview = useCallback(async (month?: string) => {
    setLoadingOverview(true);
    try {
      const url = month && month !== 'latest' ? `/api/overview?month=${month}` : '/api/overview';
      const r = await fetch(url);
      const d = await r.json();
      setOverview(d);
      // Update selectedMonth to the actual resolved month from the API
      if (d.selectedMonth) setSelectedMonth(d.selectedMonth);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const fetchSchools = useCallback(async () => {
    setLoadingSchools(true);
    try {
      const r = await fetch('/api/schools');
      const d = await r.json();
      setSchools(d.schools ?? []);
    } finally {
      setLoadingSchools(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview(selectedMonth);
    fetchSchools();
  }, [fetchOverview, fetchSchools, refreshKey, selectedMonth]);

  const refreshAll = () => setRefreshKey(k => k + 1);

  const onSelectSchool = (id: number) => setSelectedSchoolId(id);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/40 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base md:text-lg font-bold tracking-tight truncate">
                  El Salvador Division Research Culture Sustainability Index
                </h1>
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 whitespace-nowrap"
                  title="This application is a prototype pending approval from the Division Superintendents. The official El Salvador Division logo will be added upon approval."
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Prototype — For Approval
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                RCSI Dashboard · Digital Twin Sandbox · Research Analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="hidden md:inline-flex border-cyan-500/40 text-cyan-300">
              {overview ? `${overview.schoolCount} schools` : '—'}
            </Badge>
            {overview && overview.months.length > 0 && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  {overview.months.slice().reverse().map(m => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {m === overview.latestMonth ? `${m} (Latest)` : m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="ghost" size="sm" asChild className="gap-1.5">
              <a href="/RCSI-User-Manual.pdf" download="RCSI-User-Manual-v2.pdf" title="Download the User Manual (v2.0, 28 pages, PDF)">
                <BookOpen className="h-3.5 w-3.5" /> Manual
              </a>
            </Button>
            {overview && overview.schoolCount > 0 && (
              <QuarterlyReportButton selectedMonth={overview.selectedMonth} />
            )}
            <Button variant="ghost" size="sm" onClick={refreshAll} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto max-w-[1600px] w-full px-4 md:px-6 py-4 md:py-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-9 h-auto">
            <TabsTrigger value="overview" className="gap-1.5 py-2">
              <Activity className="h-4 w-4" /> <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="schools" className="gap-1.5 py-2">
              <Building2 className="h-4 w-4" /> <span className="hidden sm:inline">Schools</span>
            </TabsTrigger>
            <TabsTrigger value="research" className="gap-1.5 py-2">
              <FlaskConical className="h-4 w-4" /> <span className="hidden sm:inline">Research</span>
            </TabsTrigger>
            <TabsTrigger value="twin" className="gap-1.5 py-2">
              <Sparkles className="h-4 w-4" /> <span className="hidden sm:inline">Twin Sandbox</span>
              <span className="sm:hidden">Twin</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-1.5 py-2">
              <TrendingUp className="h-4 w-4" /> <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
            <TabsTrigger value="survey" className="gap-1.5 py-2">
              <ClipboardList className="h-4 w-4" /> <span className="hidden sm:inline">Survey</span>
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-1.5 py-2">
              <Archive className="h-4 w-4" /> <span className="hidden sm:inline">Archive</span>
            </TabsTrigger>
            <TabsTrigger value="glossary" className="gap-1.5 py-2">
              <BookOpen className="h-4 w-4" /> <span className="hidden sm:inline">Glossary</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5 py-2">
              <UploadCloud className="h-4 w-4" /> <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-2">
            {loadingOverview || !overview ? (
              <DashboardSkeleton />
            ) : (
              <OverviewPanel data={overview} />
            )}
          </TabsContent>

          <TabsContent value="schools" className="space-y-4 mt-2">
            {loadingSchools ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <SchoolsPanel schools={schools} onSelectSchool={onSelectSchool} />
            )}
          </TabsContent>

          <TabsContent value="research" className="space-y-4 mt-2">
            {loadingOverview || !overview ? (
              <DashboardSkeleton />
            ) : (
              <ResearchPanel data={overview} />
            )}
          </TabsContent>

          <TabsContent value="twin" className="space-y-4 mt-2">
            {loadingSchools ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <TwinPanel schools={schools} />
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4 mt-2">
            <TrendAnalysisPanel overview={overview} />
          </TabsContent>

          <TabsContent value="survey" className="space-y-4 mt-2">
            <SurveyPanel />
          </TabsContent>

          <TabsContent value="archive" className="space-y-4 mt-2">
            <DataArchivePanel />
          </TabsContent>

          <TabsContent value="glossary" className="space-y-4 mt-2">
            <GlossaryPanel />
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-2">
            <UploadPanel onUploadCommitted={refreshAll} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 bg-card/30 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Copyright 2026 El Salvador Division
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/5 px-1.5 py-0.5 text-[9px] font-medium text-amber-400/80">
              Prototype
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Research Culture Sustainability Index · RCSI Composite (Equal 12.5% per dimension)
          </p>
        </div>
      </footer>

      {/* School detail dialog (global) */}
      <SchoolDetailDialog
        schoolId={selectedSchoolId}
        onClose={() => setSelectedSchoolId(null)}
      />

      {/* AI Research Advisor — floating chat panel */}
      <AIChatPanel />

      {/* PWA Install Prompt — shows on Android/Chrome when installable */}
      <PWAInstallPrompt />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-80" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
