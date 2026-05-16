import { prisma } from '@repo/database';
import { NextResponse } from 'next/server';

import { CreateProjectSchema } from './_schemas';

import { requireUserId } from '@/lib/dev-auth';

// GET /api/projects — list the current user's projects, most-recent first.
export async function GET(): Promise<NextResponse> {
  const { userId } = requireUserId();
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ projects });
}

// POST /api/projects — create a new draft project.
export async function POST(request: Request): Promise<NextResponse> {
  const { userId } = requireUserId();
  const body: unknown = await request.json().catch(() => null);
  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const project = await prisma.project.create({
    data: { userId, name: parsed.data.name },
    select: { id: true },
  });
  return NextResponse.json(project, { status: 201 });
}
