import { prisma } from '@repo/database';
import { notFound, redirect } from 'next/navigation';

import { GeneratingPipeline } from './generating-pipeline';

import { requireUserId } from '@/lib/dev-auth';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Auto-pipeline orchestration page. Reached from /projects/new after the user
// submits name + description. The client pipeline component picks up from
// whatever the current status is and runs the remaining steps:
//
//   parse profile → confirm profile → generate brief → confirm brief
//                 → generate home page → redirect to /render/[siteId]
//
// Idempotent: the page can be reloaded mid-flow (or revisited after an error)
// and the pipeline will pick up where it left off.
export default async function GeneratingPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = requireUserId();

  const project = await prisma.project.findFirst({
    where: { id, userId },
    select: {
      id: true,
      name: true,
      status: true,
      generatedSiteId: true,
    },
  });
  if (project === null) {
    notFound();
  }

  // Already done — jump straight to the rendered site.
  if (project.generatedSiteId !== null && project.status === 'SITE_GENERATED') {
    redirect(`/render/${project.generatedSiteId}`);
  }

  // Not enough info yet (no requirements pasted). Send to the manual flow
  // where the user can paste requirements.
  if (project.status === 'DRAFT') {
    redirect(`/projects/${id}`);
  }

  return (
    <GeneratingPipeline
      projectId={project.id}
      projectName={project.name}
      initialStatus={project.status}
    />
  );
}
