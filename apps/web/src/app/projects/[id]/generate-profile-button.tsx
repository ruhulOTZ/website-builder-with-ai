'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface Props {
  projectId: string;
  /** When true, the button replaces an existing profile (regenerate flow). */
  regenerate?: boolean;
  label?: string;
}

// Single static loading message — no progressive labels. The underlying
// request is one POST; cycling labels lies about progress, which hurts more
// than it helps. Matches the brief button's pattern (2.4d retrospective).
export function GenerateProfileButton({
  projectId,
  regenerate = false,
  label = 'Generate profile',
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function run(): Promise<void> {
    setSubmitting(true);
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
        Generating profile…
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
