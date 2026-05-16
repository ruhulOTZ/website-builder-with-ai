'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface Props {
  projectId: string;
  /** When true, the button replaces an existing profile (regenerate flow). */
  regenerate?: boolean;
  label?: string;
}

const PROGRESS_LABELS = [
  'Reading your requirements…',
  'Extracting business details…',
  'Validating the result…',
];

export function GenerateProfileButton({
  projectId,
  regenerate = false,
  label = 'Generate profile',
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [progressIdx, setProgressIdx] = useState(0);

  // Cycle the progress label every ~2.5s while submitting so 5–7s of waiting
  // doesn't feel like the request hung. Pure cosmetic — no real progress.
  useEffect(() => {
    if (!submitting) return;
    const interval = setInterval(() => {
      setProgressIdx((idx) => Math.min(idx + 1, PROGRESS_LABELS.length - 1));
    }, 2500);
    return () => {
      clearInterval(interval);
    };
  }, [submitting]);

  async function run(): Promise<void> {
    setSubmitting(true);
    setProgressIdx(0);
    try {
      const res = await fetch(`/api/projects/${projectId}/parse`, { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        const message = body.message ?? `Generation failed (${String(res.status)})`;
        toast.error(message);
        setSubmitting(false);
        return;
      }
      toast.success(regenerate ? 'Profile regenerated' : 'Profile generated');
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
        {PROGRESS_LABELS[progressIdx]}
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
