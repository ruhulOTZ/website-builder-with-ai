'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface Props {
  projectId: string;
  /** When true, shows the AlertDialog "Regenerate" confirmation flow. */
  isRegenerate?: boolean;
}

// Single static loading message — the home-page generator takes ~20s.
// Progressive labels that lie about progress hurt more than they help.
export function GenerateHomePageButton({ projectId, isRegenerate = false }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function run(): Promise<void> {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/home-page`, { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        const message = body.message ?? `Generation failed (${String(res.status)})`;
        toast.error(message);
        setSubmitting(false);
        return;
      }
      toast.success(isRegenerate ? 'Home page regenerated' : 'Home page generated');
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
        Generating home page…
      </Button>
    );
  }

  if (isRegenerate) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Regenerate</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate home page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current generated site with a fresh AI run. The previous version
              is not recoverable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void run();
              }}
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Button
      className="gap-2"
      onClick={() => {
        void run();
      }}
    >
      <Sparkles className="size-4" />
      Generate home page
    </Button>
  );
}
