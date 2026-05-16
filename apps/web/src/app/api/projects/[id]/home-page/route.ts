import { prisma } from '@repo/database';
import { SiteSchema } from '@repo/shared-types';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserId } from '@/lib/dev-auth';

// Mirror of apps/web/src/app/api/projects/[id]/brief/route.ts.
// Same five-classified-error pattern, same 60 s timeout, same
// validate-at-the-seam discipline. If the NestJS Site response shape drifts
// from SiteSchema, it surfaces here instead of corrupting the project row.

const HomePageEndpointResponse = z.object({
  id: z.string().optional(),
  site: SiteSchema,
  modelUsed: z.string(),
  promptVersion: z.string(),
});

const HOME_PAGE_TIMEOUT_MS = 60_000;

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
        error: 'home_page_validation_failed',
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
      error: 'home_page_failed',
      message: 'Something went wrong while generating the home page.',
    },
  };
}

// POST /api/projects/[id]/home-page — server-side proxy to NestJS home-page
// generator. Requires the project to be in BRIEF_CONFIRMED or SITE_GENERATED
// (regenerate). Cannot run from earlier states — the user must have reviewed
// and confirmed both profile and brief before the site generation gate.
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
      designBriefId: true,
      designBriefJson: true,
    },
  });
  if (project === null) {
    return NextResponse.json({ error: 'not_found', message: 'Project not found' }, { status: 404 });
  }

  if (project.status !== 'BRIEF_CONFIRMED' && project.status !== 'SITE_GENERATED') {
    return NextResponse.json(
      {
        error: 'brief_not_confirmed',
        message: 'Confirm the design brief before generating a home page.',
      },
      { status: 400 },
    );
  }
  if (project.designBriefJson === null) {
    return NextResponse.json(
      { error: 'brief_missing', message: 'Project has no design brief yet.' },
      { status: 400 },
    );
  }
  if (project.businessProfileJson === null) {
    return NextResponse.json(
      { error: 'profile_missing', message: 'Project has no business profile yet.' },
      { status: 400 },
    );
  }

  // designBriefId is required by the NestJS endpoint (max 64 chars). Use a
  // synthetic fallback when the project's brief wasn't persisted, so the
  // endpoint always receives a non-empty string.
  const designBriefId = project.designBriefId ?? `brief_project_${project.id}`;

  const baseUrl = process.env.NEXT_INTERNAL_API_URL ?? 'http://localhost:3001';
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, HOME_PAGE_TIMEOUT_MS);

  let res: Response;
  let bodyText = '';
  try {
    res = await fetch(`${baseUrl}/api/home-page/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        profile: project.businessProfileJson,
        brief: project.designBriefJson,
        designBriefId,
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
      { error: 'home_page_validation_failed', message: 'AI service returned non-JSON.' },
      { status: 500 },
    );
  }
  const validated = HomePageEndpointResponse.safeParse(parsed);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: 'home_page_validation_failed',
        message: "The AI service's response didn't match the expected format.",
      },
      { status: 500 },
    );
  }

  // Status stays SITE_GENERATED whether it's the first generation or a
  // regeneration — there's no "confirmed" gate for the site in Phase 3-minimal.
  await prisma.project.update({
    where: { id: project.id },
    data: {
      generatedSiteId: validated.data.id ?? null,
      generatedSiteJson: validated.data.site,
      status: 'SITE_GENERATED',
    },
  });

  return NextResponse.json({
    site: validated.data.site,
    generatedSiteId: validated.data.id ?? null,
    modelUsed: validated.data.modelUsed,
    promptVersion: validated.data.promptVersion,
  });
}
