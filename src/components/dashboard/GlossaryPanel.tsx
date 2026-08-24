'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Search, ChevronDown, ChevronUp, Link2 } from 'lucide-react';
import {
  GLOSSARY_TERMS, GLOSSARY_CATEGORIES, CATEGORY_COLORS,
  searchGlossary, getTermsByCategory, GlossaryCategory, GlossaryTerm,
} from '@/lib/glossaryTerms';

export function GlossaryPanel() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<GlossaryCategory | 'All'>('All');
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

  const filteredTerms = useMemo(() => {
    let terms = searchGlossary(query);
    if (activeCategory !== 'All') {
      terms = terms.filter(t => t.category === activeCategory);
    }
    // Sort alphabetically within each category
    return terms.sort((a, b) => {
      if (a.category !== b.category) {
        return GLOSSARY_CATEGORIES.indexOf(a.category) - GLOSSARY_CATEGORIES.indexOf(b.category);
      }
      return a.term.localeCompare(b.term);
    });
  }, [query, activeCategory]);

  const toggleExpand = (term: string) => {
    setExpandedTerms(prev => {
      const next = new Set(prev);
      if (next.has(term)) {
        next.delete(term);
      } else {
        next.add(term);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedTerms(new Set(filteredTerms.map(t => t.term)));
  };

  const collapseAll = () => {
    setExpandedTerms(new Set());
  };

  // Group terms by category for display
  const groupedTerms = useMemo(() => {
    const groups: Record<string, GlossaryTerm[]> = {};
    for (const term of filteredTerms) {
      if (!groups[term.category]) groups[term.category] = [];
      groups[term.category].push(term);
    }
    return groups;
  }, [filteredTerms]);

  const findTerm = (termName: string): GlossaryTerm | undefined => {
    return GLOSSARY_TERMS.find(t => t.term === termName);
  };

  const handleRelatedClick = (termName: string) => {
    setQuery(termName);
    setExpandedTerms(new Set([termName]));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-card/60 to-violet-950/20 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-cyan-400" />
            Glossary
          </CardTitle>
          <CardDescription>
            Definitions of all key terms used across the RCSI dashboard, organized by category.
            Click any term to expand its full definition. Use the search box to find a specific term.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search + controls */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardContent className="py-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search terms, definitions, or categories…"
              className="pl-8"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory('All')}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                activeCategory === 'All'
                  ? 'border-foreground/40 bg-foreground/10 text-foreground'
                  : 'border-border/40 text-muted-foreground hover:bg-muted/30'
              }`}
            >
              All ({GLOSSARY_TERMS.length})
            </button>
            {GLOSSARY_CATEGORIES.map(cat => {
              const count = getTermsByCategory(cat).length;
              const color = CATEGORY_COLORS[cat];
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? 'border-transparent text-white'
                      : 'border-border/40 text-muted-foreground hover:bg-muted/30'
                  }`}
                  style={isActive ? { backgroundColor: color } : {}}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Expand/collapse all */}
          <div className="flex items-center gap-2 text-xs">
            <button onClick={expandAll} className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <ChevronDown className="h-3 w-3" /> Expand all
            </button>
            <span className="text-muted-foreground">·</span>
            <button onClick={collapseAll} className="text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ChevronUp className="h-3 w-3" /> Collapse all
            </button>
            <span className="ml-auto text-muted-foreground">
              {filteredTerms.length} term{filteredTerms.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Terms grouped by category */}
      <div className="space-y-4">
        {Object.entries(groupedTerms).map(([category, terms]) => (
          <div key={category}>
            {/* Category header */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[category as GlossaryCategory] }}
              />
              <h3 className="text-sm font-semibold" style={{ color: CATEGORY_COLORS[category as GlossaryCategory] }}>
                {category}
              </h3>
              <span className="text-xs text-muted-foreground">({terms.length})</span>
            </div>

            {/* Terms */}
            <div className="space-y-1.5">
              {terms.map(term => {
                const isExpanded = expandedTerms.has(term.term);
                const color = CATEGORY_COLORS[term.category];
                return (
                  <Card
                    key={term.term}
                    className={`border-border/40 bg-card/60 backdrop-blur transition-all cursor-pointer ${
                      isExpanded ? 'ring-1 ring-cyan-500/20' : ''
                    }`}
                    onClick={() => toggleExpand(term.term)}
                  >
                    <CardContent className="py-3">
                      {/* Term header (always visible) */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{term.term}</span>
                            <span
                              className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
                              style={{
                                borderColor: `${color}40`,
                                backgroundColor: `${color}10`,
                                color: color,
                              }}
                            >
                              {term.category}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {term.shortDef}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                      </div>

                      {/* Full definition (expanded) */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            {term.fullDef}
                          </p>
                          {term.related && term.related.length > 0 && (
                            <div className="flex items-start gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Link2 className="h-3 w-3" /> Related:
                              </span>
                              {term.related.map(rel => {
                                const relTerm = findTerm(rel);
                                return (
                                  <button
                                    key={rel}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRelatedClick(rel);
                                    }}
                                    className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/5 px-1.5 py-0.5 text-[10px] text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                                    title={relTerm ? relTerm.shortDef : 'Click to search'}
                                  >
                                    {rel}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {filteredTerms.length === 0 && (
          <Card className="border-border/40 bg-card/60 backdrop-blur">
            <CardContent className="py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No terms found for &quot;{query}&quot;
              </p>
              <button
                onClick={() => { setQuery(''); setActiveCategory('All'); }}
                className="text-xs text-cyan-400 hover:text-cyan-300 mt-1"
              >
                Clear search
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
