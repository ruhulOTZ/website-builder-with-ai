import { prisma, type Prisma } from '@repo/database';
import { NextResponse } from 'next/server';

import { PatchProjectSchema } from '../_schemas';

import { requireUserId } from '@/lib/dev-auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id] — 404 if not owned by current user.
export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { userId } = requireUserId();
  const { id } = await context.params;

  const project = await prisma.project.findFirst({
    where: { id, userId },
  });
  if (project === null) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ project });
}

// PATCH /api/projects/[id] — update name and/or rawRequirements.
// When rawRequirements is provided, status advances to REQUIREMENTS_SUBMITTED.
export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  const { userId } = requireUserId();
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);

  const parsed = PatchProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const existing = await prisma.project.findFirst({
    where: { id, userId },
    select: {
      id: true,
      status: true,
      businessProfileJson: true,
      designBriefJson: true,
    },
  });
  if (existing === null) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const data: Prisma.ProjectUpdateInput = {};
  if (parsed.data.name !== undefined) {
    data.name = parsed.data.name;
  }
  if (parsed.data.rawRequirements !== undefined) {
    data.rawRequirements = parsed.data.rawRequirements;
    // Only advance status from DRAFT — re-pasting requirements later
    // (Phase 2.4d) should not reset a project that's further along.
    if (existing.status === 'DRAFT') {
      data.status = 'REQUIREMENTS_SUBMITTED';
    }
  }
  if (parsed.data.businessProfileJson !== undefined) {
    // Editing the profile preserves status — user might save partial edits
    // without confirming. The Confirm action is a separate flag.
    data.businessProfileJson = parsed.data.businessProfileJson;
  }
  if (parsed.data.confirmProfile === true) {
    // Confirm requires a profile to be present (either from this same patch
    // body or already persisted). No-op confirms are invalid input.
    const willHaveProfile =
      parsed.data.businessProfileJson !== undefined || existing.businessProfileJson !== null;
    if (!willHaveProfile) {
      return NextResponse.json({ error: 'cannot_confirm_empty_profile' }, { status: 400 });
    }
    data.status = 'PROFILE_CONFIRMED';
  }
  if (parsed.data.designBriefJson !== undefined) {
    // Same pattern as profile — saving edits preserves status; advancing
    // is gated by the explicit confirmBrief flag.
    data.designBriefJson = parsed.data.designBriefJson;
  }
  if (parsed.data.confirmBrief === true) {
    const willHaveBrief =
      parsed.data.designBriefJson !== undefined || existing.designBriefJson !== null;
    if (!willHaveBrief) {
      return NextResponse.json({ error: 'cannot_confirm_empty_brief' }, { status: 400 });
    }
    data.status = 'BRIEF_CONFIRMED';
  }

  const updated = await prisma.project.update({
    where: { id: existing.id },
    data,
    select: { id: true, name: true, status: true, updatedAt: true },
  });
  return NextResponse.json({ project: updated });
}
