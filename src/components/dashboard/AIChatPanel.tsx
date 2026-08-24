'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, Send, Loader2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const SUGGESTED_QUESTIONS = [
  'How is the division doing this quarter?',
  'Which schools need the most help?',
  'What\'s the biggest bottleneck to reaching M1?',
  'Who are the top teacher-researchers?',
  'What intervention should we prioritize?',
];

export function AIChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          sessionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
      }]);
    } catch (e) {
      toast({
        title: 'AI Advisor unavailable',
        description: String(e),
        variant: 'destructive',
      });
      // Remove the user message on error so they can retry
      setMessages(prev => prev.filter(m => m !== userMessage));
    } finally {
      setLoading(false);
    }
  }, [messages, loading, sessionId, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    toast({ title: 'Conversation cleared' });
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:scale-105 transition-transform group"
          title="Ask the AI Research Advisor"
        >
          <Sparkles className="h-6 w-6" />
          <span className="absolute right-full mr-3 whitespace-nowrap rounded-md bg-card px-3 py-1.5 text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-border/40">
            AI Research Advisor
          </span>
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse" />
        </button>
      )}

      {/* Slide-out panel */}
      {open && (
        <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[420px] h-[600px] sm:h-[80vh] sm:max-h-700 sm:bottom-6 sm:right-6 flex flex-col rounded-t-xl sm:rounded-xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/40 bg-gradient-to-r from-cyan-950/30 to-violet-950/30">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">AI Research Advisor</h3>
                  <Badge variant="outline" className="text-[9px] border-cyan-500/40 text-cyan-300 py-0 h-4">
                    AI
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">Powered by live dashboard data</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  onClick={clearConversation}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  title="Clear conversation"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                onClick={() => setOpen(false)}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-cyan-400" />
                </div>
                <h4 className="text-sm font-semibold mb-1">Ask me anything about the dashboard</h4>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  I have access to live RCSI data, school profiles, research outputs, and milestone progress. Try one of these:
                </p>
                <div className="space-y-1.5 w-full">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left text-xs rounded-lg border border-border/40 bg-card/60 px-3 py-2 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-cyan-500/20 border border-cyan-500/30 text-foreground'
                        : 'bg-muted/30 border border-border/30 text-foreground'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="h-3 w-3 text-cyan-400" />
                        <span className="text-[10px] font-semibold text-cyan-400">AI Advisor</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  </div>
                </div>
              ))
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted/30 border border-border/30 rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                  <span className="text-xs text-muted-foreground">Analyzing dashboard data…</span>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-3 border-t border-border/40 bg-card/60">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about schools, RCSI, interventions…"
                disabled={loading}
                className="text-sm"
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                size="sm"
                className="gap-1.5 shrink-0"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
              AI responses are based on live dashboard data. Verify before making decisions.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
