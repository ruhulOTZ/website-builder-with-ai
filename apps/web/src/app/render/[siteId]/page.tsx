import { prisma } from '@repo/database';
import { SiteSchema } from '@repo/shared-types';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import { RenderSite } from '@/app/sites/_render-site';

// Public route — no requireUserId(). Anyone with a siteId can view the
// rendered site. The siteId itself is a cuid (unguessable by brute-force
// in practice), which is the access-control model for Phase 3-minimal.
// Proper auth-gated sharing is a Phase 2.5+ concern.

interface PageProps {
  params: Promise<{ siteId: string }>;
}

async function getRecord(siteId: string) {
  return prisma.generatedSiteRecord.findUnique({
    where: { id: siteId },
    select: { id: true, siteJson: true },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { siteId } = await params;
  const record = await getRecord(siteId);
  if (record === null) return {};

  const parsed = SiteSchema.safeParse(record.siteJson);
  if (!parsed.success) return {};

  const page = parsed.data.pages[0];
  return {
    title: page?.seo.metaTitle ?? parsed.data.metadata.siteName,
    description: page?.seo.metaDescription ?? parsed.data.metadata.siteDescription,
    robots: page?.seo.noIndex ? { index: false, follow: false } : undefined,
  };
}

export default async function RenderSiteByIdPage({ params }: PageProps) {
  const { siteId } = await params;
  const record = await getRecord(siteId);
  if (record === null) notFound();

  // Gate on canonical schema validity. If a stored site no longer validates
  // (e.g. after a schema migration), show a clear error instead of crashing.
  const parsed = SiteSchema.safeParse(record.siteJson);
  if (!parsed.success) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-4 text-xl font-semibold">Site schema validation failed</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          The stored site data does not match the current schema. This usually means the schema was
          updated after this site was generated. Re-generate the site to get a fresh version.
        </p>
        <ul className="space-y-1 font-mono text-xs">
          {parsed.error.issues.slice(0, 20).map((issue, i) => (
            <li key={i} className="text-destructive">
              [{issue.path.join('.')}] {issue.message}
            </li>
          ))}
        </ul>
      </main>
    );
  }

  return <RenderSite site={parsed.data} />;
}
