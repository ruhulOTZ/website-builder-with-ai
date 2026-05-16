import { prisma } from '@repo/database';
import { BusinessProfileSchema } from '@repo/shared-types';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserId } from '@/lib/dev-auth';

// The NestJS parser response shape. Validated at the proxy boundary so the
// route handler can't accidentally accept a malformed AI service response.
const ParseEndpointResponse = z.object({
  id: z.string().optional(),
  profile: BusinessProfileSchema,
  modelUsed: z.string(),
  promptVersion: z.string(),
});

// Generous-but-bounded timeout. Parser takes 5–7 s typically with internal
// retries on 429. 60 s prevents a hung NestJS from hanging this route.
const PARSE_TIMEOUT_MS = 60_000;

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ClassifiedError {
  status: number;
  body: { error: string; message: string };
}

function classifyError(err: unknown, status?: number, bodyText?: string): ClassifiedError {
  // Quota exhaustion bubbles up as a 503-ish from NestJS or as a parsed-out
  // AIQuotaExhaustedError class name. Either way the body contains the
  // Gemini error string.
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
        error: 'parser_validation_failed',
        message: "The AI's response didn't match the expected format. This is a bug.",
      },
    };
  }
  // Network-level: fetch threw (DNS, ECONNREFUSED, timeout). Node's undici
  // wraps the underlying error in a generic TypeError('fetch failed') with
  // the real code on `.cause` — we have to dig past the top-level message.
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
  // HTTP-level: NestJS returned non-2xx for some other reason.
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
      error: 'parser_failed',
      message: 'Something went wrong while generating the profile.',
    },
  };
}

// POST /api/projects/[id]/parse — server-side proxy to NestJS parser.
// Browser never talks to NestJS directly; this handler holds the trust
// boundary (and, in Phase 2.5, the Clerk JWT).
export async function POST(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { userId } = requireUserId();
  const { id } = await context.params;

  const project = await prisma.project.findFirst({
    where: { id, userId },
    select: { id: true, rawRequirements: true, status: true },
  });
  if (project === null) {
    return NextResponse.json({ error: 'not_found', message: 'Project not found' }, { status: 404 });
  }
  if (project.rawRequirements === null || project.rawRequirements.trim().length < 50) {
    return NextResponse.json(
      {
        error: 'requirements_missing',
        message: 'Project has no saved requirements text yet.',
      },
      { status: 400 },
    );
  }

  const baseUrl = process.env.NEXT_INTERNAL_API_URL ?? 'http://localhost:3001';
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, PARSE_TIMEOUT_MS);

  let res: Response;
  let bodyText = '';
  try {
    res = await fetch(`${baseUrl}/api/business-profile/parse`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        rawText: project.rawRequirements,
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

  // Validate the upstream response shape at the boundary. Any drift on the
  // NestJS side surfaces here instead of corrupting the project row.
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return NextResponse.json(
      { error: 'parser_validation_failed', message: 'AI service returned non-JSON.' },
      { status: 500 },
    );
  }
  const validated = ParseEndpointResponse.safeParse(parsed);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: 'parser_validation_failed',
        message: "The AI service's response didn't match the expected format.",
      },
      { status: 500 },
    );
  }

  // Persist. Status only advances forward — never resets a confirmed profile
  // back to GENERATED on an accidental re-parse mid-flow.
  const nextStatus =
    project.status === 'PROFILE_CONFIRMED' ? 'PROFILE_CONFIRMED' : 'PROFILE_GENERATED';
  await prisma.project.update({
    where: { id: project.id },
    data: {
      businessProfileId: validated.data.id ?? null,
      businessProfileJson: validated.data.profile,
      status: nextStatus,
    },
  });

  return NextResponse.json({
    profile: validated.data.profile,
    businessProfileId: validated.data.id ?? null,
    modelUsed: validated.data.modelUsed,
    promptVersion: validated.data.promptVersion,
  });
}
