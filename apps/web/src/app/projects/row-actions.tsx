'use client';

// Small client islands for the projects table row.
//   - DeleteRowButton: icon-only delete trigger that opens an AlertDialog.
//     Mirrors DeleteProjectButton in projects/[id]/project-actions.tsx, but
//     compact for inline use in a table row.
//   - RefreshButton: server-revalidates the list page on click. The list
//     is `force-dynamic`, so this is mostly a UX affordance — pulls fresh
//     status badges if the AI just finished generating in another tab.

import { RotateCw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
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

interface DeleteRowButtonProps {
  projectId: string;
  projectName: string;
}

export function DeleteRowButton({ projectId, projectName }: DeleteRowButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function onConfirm(): Promise<void> {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? `Delete failed (${String(res.status)})`);
        setDeleting(false);
        return;
      }
      toast.success('Project deleted');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error');
      setDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive gap-1.5"
          aria-label={`Delete ${projectName}`}
          disabled={deleting}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{projectName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the project, its parsed profile, and its design brief. This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 text-white"
            onClick={() => {
              void onConfirm();
            }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
    >
      <RotateCw className={`size-3.5 ${pending ? 'animate-spin' : ''}`} aria-hidden="true" />
      {pending ? 'Refreshing…' : 'Refresh'}
    </Button>
  );
}
