import { prisma } from '@repo/database';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireUserId } from '@/lib/dev-auth';
import { STATUS_LABEL, STATUS_VARIANT } from '@/lib/project-status';

export const dynamic = 'force-dynamic';

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${String(diffMin)}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${String(diffHr)}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${String(diffDay)}d ago`;
  return date.toLocaleDateString();
}

export default async function ProjectsPage() {
  const { userId } = requireUserId();
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      status: true,
      updatedAt: true,
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your Projects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Build and manage AI-generated websites.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">New Project</Link>
        </Button>
      </header>

      {projects.length === 0 ? (
        <Card className="mx-auto max-w-lg">
          <CardHeader className="items-center text-center">
            <Sparkles className="text-muted-foreground mb-3 size-8" aria-hidden="true" />
            <CardTitle>Start a new project</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-5 text-center text-sm">
            <p>
              Paste a business description — a gym, a clinic, a bakery, anything — and we&apos;ll
              generate a complete website concept: profile, brand archetype, color palette,
              typography, and page architecture.
            </p>
            <Button asChild>
              <Link href="/projects/new">Create your first project</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="hover:border-foreground/30 bg-card shadow-xs block rounded-lg border p-5 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-medium tracking-tight">{project.name}</h2>
                  <Badge variant={STATUS_VARIANT[project.status]}>
                    {STATUS_LABEL[project.status]}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-3 text-xs">
                  Updated {formatRelative(project.updatedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
