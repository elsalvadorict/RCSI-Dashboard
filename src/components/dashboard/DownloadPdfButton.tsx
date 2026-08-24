'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DownloadPdfButtonProps {
  onClick: () => Promise<void>;
  label?: string;
  className?: string;
}

export function DownloadPdfButton({ onClick, label = 'Download PDF', className = '' }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
      toast({ title: 'PDF downloaded', description: 'Check your downloads folder.' });
    } catch (e) {
      toast({
        title: 'PDF generation failed',
        description: String(e),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant="outline"
      size="sm"
      className={`gap-1.5 ${className}`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}
