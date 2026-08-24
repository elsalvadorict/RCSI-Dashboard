'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, FlaskConical, Printer } from 'lucide-react';
import { QuarterlySurveyForm } from './QuarterlySurveyForm';
import { ResearchMetadataForm } from './ResearchMetadataForm';
import { printQuestionnaire } from './PrintableQuestionnaire';

type FormTab = 'quarterly' | 'research';

export function SurveyPanel() {
  const [tab, setTab] = useState<FormTab>('quarterly');
  const { toast } = useToast();

  const handlePrint = () => {
    try {
      printQuestionnaire();
      toast({
        title: 'Print dialog opened',
        description: 'A printable version of the 35-item questionnaire has opened in a new window.',
      });
    } catch (e) {
      toast({
        title: 'Print failed',
        description: 'Please allow pop-ups for this site, then try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Intro + print button */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-card/60 to-violet-950/20 backdrop-blur p-4 md:p-5">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base md:text-lg font-semibold">
                Data Collection Tools
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Two quarterly instruments aligned with the RCSI framework. The <strong>Quarterly Survey</strong> is a
              35-item questionnaire that computes the seven sub-indices per school. The <strong>Research Metadata</strong> form
              captures individual research outputs (abstracts and full papers) by teachers. Both produce CSV files
              in the exact format expected by the Upload tab.
            </p>
          </div>
        </div>
        <Button onClick={handlePrint} variant="outline" className="shrink-0 gap-1.5">
          <Printer className="h-4 w-4" />
          Print Questionnaire
        </Button>
      </div>

      {/* Sub-tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as FormTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quarterly" className="gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Quarterly Survey (35 items)
          </TabsTrigger>
          <TabsTrigger value="research" className="gap-1.5">
            <FlaskConical className="h-4 w-4" />
            Research Metadata
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quarterly" className="mt-4">
          <QuarterlySurveyForm />
        </TabsContent>

        <TabsContent value="research" className="mt-4">
          <ResearchMetadataForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
