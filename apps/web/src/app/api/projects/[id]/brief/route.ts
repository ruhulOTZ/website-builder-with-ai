import { prisma } from '@repo/database';
import { DesignBriefSchema } from '@repo/shared-types';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserId } from '@/lib/dev-auth';

// Mirror of the parse proxy at apps/web/src/app/api/projects/[id]/parse/route.ts.
// Same five-classified-error pattern (api_unreachable / api_timeout /
// quota_exceeded / brief_validation_failed / brief_failed) and the same
// validate-at-the-seam discipline. If the NestJS DesignBrief response shape
// drifts from DesignBriefSchema, it surfaces here instead of corrupting the
// project row.

const BriefEndpointResponse = z.object({
  id: z.string().optional(),
  brief: DesignBriefSchema,
  modelUsed: z.string(),
  promptVersion: z.string(),
});

const BRIEF_TIMEOUT_MS = 60_000;

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ClassifiedError {
  status: number;
  body: { error: string; message: string };
}

function classifyError(err: unknown, status?: number, bodyText?: string): ClassifiedError {
  if (bodyText?.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 503,
      body: {
        error: 'quota_exceeded',
        message: 'Daily AI quota reached. Try again after midnight Pacific.',
      },
    };
  }
  if (bodyText?.includes('AIValidationError')) {
    return {
      status: 500,
      body: {
        error: 'brief_validation_failed',
        message: "The AI's response didn't match the expected format. This is a bug.",
      },
    };
  }
  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return {
        status: 504,
        body: {
          error: 'api_timeout',
          message: 'The AI service took too long to respond. Try again.',
        },
      };
    }
    const causeCode =
      err.cause !== null && typeof err.cause === 'object' && 'code' in err.cause
        ? String(err.cause.code)
        : '';
    if (
      err.message.includes('fetch failed') ||
      err.message.includes('ECONNREFUSED') ||
      causeCode === 'ECONNREFUSED' ||
      causeCode === 'ENOTFOUND'
    ) {
      return {
        status: 502,
        body: {
          error: 'api_unreachable',
          message: 'The AI service is unavailable. Try again in a moment.',
        },
      };
    }
  }
  if (status !== undefined && status >= 500) {
    return {
      status: 502,
      body: {
        error: 'api_unreachable',
        message: 'The AI service is unavailable. Try again in a moment.',
      },
    };
  }
  return {
    status: 500,
    body: {
      error: 'brief_failed',
      message: 'Something went wrong while generating the brief.',
    },
  };
}

// POST /api/projects/[id]/brief — server-side proxy to NestJS brief generator.
// Requires the project to be in PROFILE_CONFIRMED — there's no point
// generating a brief from a profile the user hasn't reviewed.
export async function POST(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { userId } = requireUserId();
  const { id } = await context.params;

  const project = await prisma.project.findFirst({
    where: { id, userId },
    select: {
      id: true,
      status: true,
      rawRequirements: true,
      businessProfileJson: true,
    },
  });
  if (project === null) {
    return NextResponse.json({ error: 'not_found', message: 'Project not found' }, { status: 404 });
  }
  // The brief generator can run from PROFILE_CONFIRMED (first generation),
  // BRIEF_GENERATED (regenerate from existing brief), or BRIEF_CONFIRMED
  // (regenerate after confirming). It cannot run from earlier states —
  // PROFILE_CONFIRMED is the explicit "user reviewed the facts" gate.
  if (
    project.status !== 'PROFILE_CONFIRMED' &&
    project.status !== 'BRIEF_GENERATED' &&
    project.status !== 'BRIEF_CONFIRMED'
  ) {
    return NextResponse.json(
      {
        error: 'profile_not_confirmed',
        message: 'Confirm the business profile before generating a brief.',
      },
      { status: 400 },
    );
  }
  if (project.businessProfileJson === null) {
    return NextResponse.json(
      {
        error: 'profile_missing',
        message: 'Project has no business profile yet.',
      },
      { status: 400 },
    );
  }

  const baseUrl = process.env.NEXT_INTERNAL_API_URL ?? 'http://localhost:3001';
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, BRIEF_TIMEOUT_MS);

  let res: Response;
  let bodyText = '';
  try {
    res = await fetch(`${baseUrl}/api/design-brief/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        profile: project.businessProfileJson,
        // rawDocumentText is what gives the brief generator voice/tone
        // context. brief-v2's findings explicitly relied on this — drop it
        // and the brand-voice cascade rule fires on a weaker signal.
        rawDocumentText: project.rawRequirements ?? undefined,
        sourceLabel: project.id,
        persist: true,
      }),
      signal: controller.signal,
    });
    bodyText = await res.text();
  } catch (err) {
    clearTimeout(timeout);
    const classified = classifyError(err);
    return NextResponse.json(classified.body, { status: classified.status });
  }
  clearTimeout(timeout);

  if (!res.ok) {
    const classified = classifyError(undefined, res.status, bodyText);
    return NextResponse.json(classified.body, { status: classified.status });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return NextResponse.json(
      { error: 'brief_validation_failed', message: 'AI service returned non-JSON.' },
      { status: 500 },
    );
  }
  const validated = BriefEndpointResponse.safeParse(parsed);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: 'brief_validation_failed',
        message: "The AI service's response didn't match the expected format.",
      },
      { status: 500 },
    );
  }

  // Status: regenerate always returns the project to BRIEF_GENERATED.
  // Confirmation is a property of specific content; new content needs
  // re-confirmation. (Mirror of the 2.4d backlog item for the parse proxy.)
  await prisma.project.update({
    where: { id: project.id },
    data: {
      designBriefId: validated.data.id ?? null,
      designBriefJson: validated.data.brief,
      status: 'BRIEF_GENERATED',
    },
  });

  return NextResponse.json({
    brief: validated.data.brief,
    designBriefId: validated.data.id ?? null,
    modelUsed: validated.data.modelUsed,
    promptVersion: validated.data.promptVersion,
  });
}
