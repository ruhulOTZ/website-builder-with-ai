'use client';

import { type ProjectStatus } from '@repo/database';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

/**
 * Numeric rank for each persisted status. Higher = further along. Used to
 * skip API calls that have already completed when the page is reloaded
 * mid-flow.
 */
const STATUS_RANK: Record<ProjectStatus, number> = {
  DRAFT: 0,
  REQUIREMENTS_SUBMITTED: 1,
  PROFILE_GENERATED: 2,
  PROFILE_CONFIRMED: 3,
  BRIEF_GENERATED: 4,
  BRIEF_CONFIRMED: 5,
  SITE_GENERATED: 6,
  COMPLETED: 7,
};

/**
 * User-facing steps. Each step combines a generate API call with its
 * auto-confirm follow-up (server-side detail that the user doesn't need to
 * see as a separate step).
 */
const STEPS = [
  { key: 'profile', label: 'Understanding your business', completeAtRank: 3 },
  { key: 'brief', label: 'Designing the brief', completeAtRank: 5 },
  { key: 'site', label: 'Building your website', completeAtRank: 6 },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

interface PipelineError {
  step: StepKey;
  message: string;
}

interface GeneratingPipelineProps {
  projectId: string;
  projectName: string;
  initialStatus: ProjectStatus;
}

export function GeneratingPipeline({
  projectId,
  projectName,
  initialStatus,
}: GeneratingPipelineProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ProjectStatus>(initialStatus);
  const [activeStep, setActiveStep] = useState<StepKey | null>(null);
  const [error, setError] = useState<PipelineError | null>(null);
  // Guard against React 19 dev StrictMode double-invocation: the pipeline
  // makes real API calls and we don't want to fire them twice.
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    void runPipeline(initialStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  async function runPipeline(startStatus: ProjectStatus): Promise<void> {
    setError(null);
    let currentRank = STATUS_RANK[startStatus];

    try {
      // 1. Parse profile (REQUIREMENTS_SUBMITTED → PROFILE_GENERATED)
      if (currentRank < STATUS_RANK.PROFILE_GENERATED) {
        setActiveStep('profile');
        await callJson(`/api/projects/${projectId}/parse`, { method: 'POST' });
        currentRank = STATUS_RANK.PROFILE_GENERATED;
        setStatus('PROFILE_GENERATED');
      }

      // 2. Confirm profile (PROFILE_GENERATED → PROFILE_CONFIRMED)
      if (currentRank < STATUS_RANK.PROFILE_CONFIRMED) {
        await callJson(`/api/projects/${projectId}`, {
          method: 'PATCH',
          body: { confirmProfile: true },
        });
        currentRank = STATUS_RANK.PROFILE_CONFIRMED;
        setStatus('PROFILE_CONFIRMED');
      }

      // 3. Generate brief (PROFILE_CONFIRMED → BRIEF_GENERATED)
      if (currentRank < STATUS_RANK.BRIEF_GENERATED) {
        setActiveStep('brief');
        await callJson(`/api/projects/${projectId}/brief`, { method: 'POST' });
        currentRank = STATUS_RANK.BRIEF_GENERATED;
        setStatus('BRIEF_GENERATED');
      }

      // 4. Confirm brief (BRIEF_GENERATED → BRIEF_CONFIRMED)
      if (currentRank < STATUS_RANK.BRIEF_CONFIRMED) {
        await callJson(`/api/projects/${projectId}`, {
          method: 'PATCH',
          body: { confirmBrief: true },
        });
        currentRank = STATUS_RANK.BRIEF_CONFIRMED;
        setStatus('BRIEF_CONFIRMED');
      }

      // 5. Generate home page (BRIEF_CONFIRMED → SITE_GENERATED)
      setActiveStep('site');
      const siteResponse = await callJson<{ generatedSiteId: string | null }>(
        `/api/projects/${projectId}/home-page`,
        { method: 'POST' },
      );
      currentRank = STATUS_RANK.SITE_GENERATED;
      setStatus('SITE_GENERATED');

      if (siteResponse.generatedSiteId === null) {
        throw new Error('Home page generation returned no site ID');
      }

      // Done. router.replace so the user can't hit Back into the loading screen.
      router.replace(`/render/${siteResponse.generatedSiteId}`);
    } catch (err) {
      const currentStep: StepKey =
        activeStep ??
        (currentRank < STATUS_RANK.PROFILE_GENERATED
          ? 'profile'
          : currentRank < STATUS_RANK.BRIEF_GENERATED
            ? 'brief'
            : 'site');
      setError({
        step: currentStep,
        message: err instanceof Error ? err.message : 'Generation failed',
      });
    }
  }

  function retry(): void {
    hasStartedRef.current = false;
    setError(null);
    // Re-fetch the current status from the server before retrying — the
    // failed call may have partially advanced the project.
    router.refresh();
    // After refresh, the page will remount and the pipeline starts from the
    // server-fetched status (initialStatus prop). To avoid waiting for the
    // refresh round-trip, also kick off the pipeline from the locally-known
    // status, which is at least as fresh.
    hasStartedRef.current = true;
    void runPipeline(status);
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col items-center justify-center px-6 py-12">
      <div className="w-full text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {error !== null
            ? 'Something went wrong'
            : status === 'SITE_GENERATED'
              ? 'Ready'
              : 'Generating your website'}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {error !== null
            ? error.message
            : status === 'SITE_GENERATED'
              ? 'Taking you to your site…'
              : `${projectName} · this takes about a minute`}
        </p>
      </div>

      <ol className="mt-10 w-full max-w-md space-y-3">
        {STEPS.map((step) => {
          const currentRank = STATUS_RANK[status];
          const isComplete = currentRank >= step.completeAtRank;
          const isActive = !isComplete && activeStep === step.key && error === null;
          const isErrored = error !== null && error.step === step.key;

          return (
            <li
              key={step.key}
              className={`flex items-center gap-3 rounded-md border px-4 py-3 transition-colors ${
                isErrored
                  ? 'border-destructive/40 bg-destructive/5'
                  : isActive
                    ? 'border-primary/30 bg-primary/5'
                    : isComplete
                      ? 'bg-muted/30'
                      : ''
              }`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="flex size-6 shrink-0 items-center justify-center">
                {isErrored ? (
                  <AlertCircle className="text-destructive size-5" aria-hidden="true" />
                ) : isComplete ? (
                  <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
                ) : isActive ? (
                  <Loader2 className="text-primary size-5 animate-spin" aria-hidden="true" />
                ) : (
                  <span
                    className="border-muted-foreground/30 size-3 rounded-full border"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span
                className={`text-sm ${
                  isActive
                    ? 'text-foreground font-medium'
                    : isComplete
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/70'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {error !== null ? (
        <div className="mt-8 flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href={`/projects/${projectId}`}>Open project</Link>
          </Button>
          <Button onClick={retry}>Try again</Button>
        </div>
      ) : null}
    </main>
  );
}

interface CallOptions {
  method: 'POST' | 'PATCH';
  body?: unknown;
}

/**
 * Thin fetch wrapper that throws on non-2xx with the server-provided message
 * when available, so the pipeline UI can show a meaningful error.
 */
async function callJson<T = unknown>(url: string, options: CallOptions): Promise<T> {
  const init: RequestInit = {
    method: options.method,
    headers: { 'content-type': 'application/json' },
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(
      body.message ?? body.error ?? `Request failed: ${String(res.status)} ${res.statusText}`,
    );
  }
  return (await res.json()) as T;
}
