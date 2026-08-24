'use client';

import { DIMENSION_META, DIMENSIONS, Dimension } from '@/lib/rcsi';
import { CHART_COLORS } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function DimensionLegend() {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-wrap gap-2">
        {DIMENSIONS.map((d: Dimension) => {
          const meta = DIMENSION_META[d];
          return (
            <Tooltip key={d}>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium cursor-help"
                  style={{
                    borderColor: `${CHART_COLORS[d]}55`,
                    backgroundColor: `${CHART_COLORS[d]}15`,
                    color: CHART_COLORS[d],
                  }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[d] }}
                  />
                  <span className="font-semibold">{d}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{meta.name}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-semibold mb-0.5">{meta.name} (M{meta.milestone})</p>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export function MilestoneBadge({
  milestone,
  sustainable,
  size = 'sm',
}: {
  milestone: number;
  sustainable?: boolean;
  size?: 'sm' | 'md';
}) {
  const colors = [
    'bg-slate-500/20 text-slate-300 border-slate-500/40',
    'bg-red-500/20 text-red-300 border-red-500/40',
    'bg-orange-500/20 text-orange-300 border-orange-500/40',
    'bg-amber-500/20 text-amber-300 border-amber-500/40',
    'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    'bg-lime-500/20 text-lime-300 border-lime-500/40',
    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  ];
  const colorClass = colors[Math.min(milestone, 6)];
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${colorClass} ${padding}`}
    >
      M{milestone}
      {sustainable && milestone === 6 && (
        <span className="text-[10px] uppercase tracking-wide">· Sustainable</span>
      )}
    </span>
  );
}

export function MilestoneProgress({ milestone }: { milestone: number }) {
  // Render M0..M6 as a horizontal stepper with the current milestone highlighted.
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 7 }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < milestone
              ? 'bg-emerald-500/80'
              : i === milestone
              ? 'bg-emerald-400'
              : 'bg-muted-foreground/20'
          }`}
          title={`M${i}`}
        />
      ))}
    </div>
  );
}
