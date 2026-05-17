import { prisma } from '@repo/database';
import { CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { DeleteRowButton, RefreshButton } from './row-actions';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface SiteStats {
  pages: number;
  sections: number;
  images: number;
}

/**
 * Shallow extraction of stats from a persisted Site JSON. Avoids paying the
 * full SiteSchema.parse cost per row — the JSON was validated when it was
 * persisted, so we just walk the shape we need. Returns null when the JSON
 * doesn't look like a Site (corrupt rows, schema drift).
 */
function extractSiteStats(siteJson: unknown): SiteStats | null {
  if (siteJson === null || typeof siteJson !== 'object') return null;
  const pagesArr = (siteJson as { pages?: unknown }).pages;
  if (!Array.isArray(pagesArr)) return null;

  let sections = 0;
  let images = 0;
  for (const page of pagesArr) {
    if (page === null || typeof page !== 'object') continue;
    const sectionsArr = (page as { sections?: unknown }).sections;
    if (!Array.isArray(sectionsArr)) continue;
    sections += sectionsArr.length;

    for (const section of sectionsArr) {
      if (section === null || typeof section !== 'object') continue;
      const { type, props } = section as { type?: unknown; props?: unknown };
      if (props === null || typeof props !== 'object') continue;

      if (type === 'hero') {
        const media = (props as { media?: unknown }).media;
        if (media !== null && typeof media === 'object') {
          const m = media as { kind?: unknown; image?: unknown };
          if (m.kind === 'image' && m.image !== null && typeof m.image === 'object') {
            const url = (m.image as { url?: unknown }).url;
            if (typeof url === 'string' && url !== '') images += 1;
          }
        }
      }

      if (type === 'feature_grid') {
        const items = (props as { items?: unknown }).items;
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item === null || typeof item !== 'object') continue;
            const img = (item as { image?: unknown }).image;
            if (img !== null && typeof img === 'object') {
              const url = (img as { url?: unknown }).url;
              if (typeof url === 'string' && url !== '') images += 1;
            }
          }
        }
      }
    }
  }

  return { pages: pagesArr.length, sections, images };
}

/** Shallow read of DesignBrief.layoutArchetype. Returns null when absent. */
function extractLayout(briefJson: unknown): string | null {
  if (briefJson === null || typeof briefJson !== 'object') return null;
  const archetype = (briefJson as { layoutArchetype?: unknown }).layoutArchetype;
  return typeof archetype === 'string' ? archetype : null;
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
      generatedSiteId: true,
      generatedSiteJson: true,
      designBriefJson: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your projects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {projects.length === 0
              ? 'No projects yet'
              : `${String(projects.length)} ${projects.length === 1 ? 'project' : 'projects'} · refreshed just now`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <Button asChild>
            <Link href="/projects/new">New project</Link>
          </Button>
        </div>
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
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">
                  Project
                </TableHead>
                <TableHead className="text-muted-foreground w-16 text-xs uppercase tracking-wider">
                  Site
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">
                  Pages
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">
                  Layout
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">
                  Created
                </TableHead>
                <TableHead className="text-muted-foreground w-px whitespace-nowrap text-right text-xs uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => {
                const stats = extractSiteStats(project.generatedSiteJson);
                const layout = extractLayout(project.designBriefJson);
                const isComplete =
                  project.status === 'SITE_GENERATED' || project.status === 'COMPLETED';

                return (
                  <TableRow key={project.id}>
                    {/* Project name — primary click target */}
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${project.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {project.name}
                      </Link>
                    </TableCell>

                    {/* Site (icon-only external link to the rendered site) */}
                    <TableCell>
                      {project.generatedSiteId !== null ? (
                        <Link
                          href={`/render/${project.generatedSiteId}`}
                          target="_blank"
                          rel="noopener"
                          className="text-muted-foreground hover:text-foreground inline-flex"
                          aria-label="Open rendered site in a new tab"
                        >
                          <ExternalLink className="size-4" aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    {/* Status badge — uses existing variant ladder */}
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[project.status]}>
                        {isComplete ? <CheckCircle2 className="size-3" aria-hidden="true" /> : null}
                        {STATUS_LABEL[project.status]}
                      </Badge>
                    </TableCell>

                    {/* Pages count + section / image meta */}
                    <TableCell>
                      {stats ? (
                        <div className="leading-tight">
                          <div className="font-medium">
                            {String(stats.pages)}{' '}
                            <span className="text-muted-foreground font-normal">
                              {stats.pages === 1 ? 'page' : 'pages'}
                            </span>
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {String(stats.sections)} sections · {String(stats.images)} imgs
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    {/* Layout archetype */}
                    <TableCell>
                      {layout !== null ? (
                        <Badge variant="outline" className="font-mono text-[11px] font-normal">
                          {layout}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    {/* Created (relative) */}
                    <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                      {formatRelative(project.createdAt)}
                    </TableCell>

                    {/* Actions: primary "View site" (when generated) + Delete */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {project.generatedSiteId !== null ? (
                          <Button asChild size="sm">
                            <Link
                              href={`/render/${project.generatedSiteId}`}
                              target="_blank"
                              rel="noopener"
                            >
                              View site
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild variant="secondary" size="sm">
                            <Link href={`/projects/${project.id}`}>Open</Link>
                          </Button>
                        )}
                        <DeleteRowButton projectId={project.id} projectName={project.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
