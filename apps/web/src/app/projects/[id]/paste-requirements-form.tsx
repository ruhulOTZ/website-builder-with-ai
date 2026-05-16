'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { REQUIREMENTS_LIMITS } from '@/app/api/projects/_schemas';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  projectId: string;
  initialValue: string;
}

export function PasteRequirementsForm({ projectId, initialValue }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);

  const trimmedLen = value.trim().length;
  const canSubmit =
    !submitting && trimmedLen >= REQUIREMENTS_LIMITS.min && trimmedLen <= REQUIREMENTS_LIMITS.max;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rawRequirements: value.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? `Save failed (${String(res.status)})`);
        setSubmitting(false);
        return;
      }
      toast.success('Requirements saved');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        placeholder="Paste a description of the business here."
        rows={24}
        className="min-h-[500px] text-sm"
        disabled={submitting}
      />
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>
          {String(trimmedLen)} characters
          {trimmedLen < REQUIREMENTS_LIMITS.min ? (
            <> · need at least {String(REQUIREMENTS_LIMITS.min)} to save</>
          ) : null}
        </span>
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? 'Saving…' : 'Save requirements'}
        </Button>
      </div>
    </form>
  );
}
