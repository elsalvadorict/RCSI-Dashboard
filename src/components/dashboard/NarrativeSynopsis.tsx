'use client';

import { Card } from '@/components/ui/card';
import { Lightbulb, TrendingUp, AlertTriangle, ShieldAlert, Target } from 'lucide-react';
import { ReactNode } from 'react';

export type NarrativeTone = 'insight' | 'success' | 'warning' | 'danger';

interface NarrativeSynopsisProps {
  tone?: NarrativeTone;
  title: string;
  icon?: ReactNode;
  insights: ReactNode[]; // each entry is one bullet
  recommendation?: ReactNode; // bolded "Recommended intervention" line
  className?: string;
}

const TONE_STYLES: Record<NarrativeTone, {
  border: string;
  bg: string;
  iconBg: string;
  iconColor: string;
  titleColor: string;
  recBg: string;
  recBorder: string;
  recColor: string;
  defaultIcon: ReactNode;
}> = {
  insight: {
    border: 'border-l-amber-400/70',
    bg: 'bg-amber-950/15',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-300',
    titleColor: 'text-amber-100',
    recBg: 'bg-amber-500/10',
    recBorder: 'border-amber-500/30',
    recColor: 'text-amber-100',
    defaultIcon: <Lightbulb className="h-5 w-5" />,
  },
  success: {
    border: 'border-l-emerald-400/70',
    bg: 'bg-emerald-950/15',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-300',
    titleColor: 'text-emerald-100',
    recBg: 'bg-emerald-500/10',
    recBorder: 'border-emerald-500/30',
    recColor: 'text-emerald-100',
    defaultIcon: <TrendingUp className="h-5 w-5" />,
  },
  warning: {
    border: 'border-l-orange-400/70',
    bg: 'bg-orange-950/15',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-300',
    titleColor: 'text-orange-100',
    recBg: 'bg-orange-500/10',
    recBorder: 'border-orange-500/30',
    recColor: 'text-orange-100',
    defaultIcon: <AlertTriangle className="h-5 w-5" />,
  },
  danger: {
    border: 'border-l-rose-400/70',
    bg: 'bg-rose-950/15',
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-300',
    titleColor: 'text-rose-100',
    recBg: 'bg-rose-500/10',
    recBorder: 'border-rose-500/30',
    recColor: 'text-rose-100',
    defaultIcon: <ShieldAlert className="h-5 w-5" />,
  },
};

export function NarrativeSynopsis({
  tone = 'insight',
  title,
  icon,
  insights,
  recommendation,
  className = '',
}: NarrativeSynopsisProps) {
  const s = TONE_STYLES[tone];
  return (
    <Card className={`border border-border/40 border-l-4 ${s.border} ${s.bg} backdrop-blur ${className}`}>
      <div className="p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 h-9 w-9 rounded-lg ${s.iconBg} ${s.iconColor} flex items-center justify-center`}>
            {icon ?? s.defaultIcon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${s.iconColor}`}>
                Executive Brief
              </span>
            </div>
            <h3 className={`text-base md:text-lg font-semibold leading-tight ${s.titleColor}`}>
              {title}
            </h3>
          </div>
        </div>

        <ul className="mt-3 space-y-1.5 text-sm text-foreground/90 leading-relaxed">
          {insights.map((insight, i) => (
            <li key={i} className="flex gap-2">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${s.iconBg.replace('/20', '/80')}`} />
              <span className="flex-1">{insight}</span>
            </li>
          ))}
        </ul>

        {recommendation && (
          <div className={`mt-3 rounded-md border ${s.recBorder} ${s.recBg} p-3`}>
            <div className="flex items-start gap-2">
              <Target className={`h-4 w-4 shrink-0 mt-0.5 ${s.iconColor}`} />
              <div className="flex-1">
                <div className={`text-[10px] font-semibold uppercase tracking-wider ${s.iconColor} mb-0.5`}>
                  Recommended Intervention
                </div>
                <div className={`text-sm leading-relaxed ${s.recColor}`}>
                  {recommendation}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
