'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface Props {
  projectId: string;
  label?: string;
}

// Single static loading message per the 2.4b retrospective. The brief
// generator takes ~20s — progressive labels that lie about progress hurt
// more than they help. Honest opaque message + spinner.
export function GenerateBriefButton({ projectId, label = 'Generate design brief' }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function run(): Promise<void> {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/brief`, { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        const message = body.message ?? `Generation failed (${String(res.status)})`;
        toast.error(message);
        setSubmitting(false);
        return;
      }
      toast.success('Design brief generated');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error');
      setSubmitting(false);
    }
  }

  if (submitting) {
    return (
      <Button disabled className="gap-2">
        <Loader2 className="size-4 animate-spin" />
        Generating brief…
      </Button>
    );
  }

  return (
    <Button
      onClick={() => {
        void run();
      }}
    >
      {label}
    </Button>
  );
}
