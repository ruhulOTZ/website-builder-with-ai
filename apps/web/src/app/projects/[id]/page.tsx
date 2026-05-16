import { prisma } from '@repo/database';
import { BusinessProfileSchema, DesignBriefSchema } from '@repo/shared-types';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BriefForm } from './brief-form';
import { GenerateBriefButton } from './generate-brief-button';
import { GenerateProfileButton } from './generate-profile-button';
import { PasteRequirementsForm } from './paste-requirements-form';
import { ProfileForm } from './profile-form';
import { ProfileSummary } from './profile-summary';
import { DeleteProjectButton, RenameProjectButton } from './project-actions';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireUserId } from '@/lib/dev-auth';
import { STATUS_LABEL, STATUS_VARIANT } from '@/lib/project-status';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = requireUserId();
  const project = await prisma.project.findFirst({
    where: { id, userId },
    select: {
      id: true,
      name: true,
      status: true,
      rawRequirements: true,
      businessProfileJson: true,
      designBriefJson: true,
      updatedAt: true,
    },
  });
  if (project === null) {
    notFound();
  }

  const profile =
    project.businessProfileJson !== null
      ? BusinessProfileSchema.parse(project.businessProfileJson)
      : null;
  const brief =
    project.designBriefJson !== null ? DesignBriefSchema.parse(project.designBriefJson) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-2 text-sm">
        <Link href="/projects" className="text-muted-foreground hover:text-foreground">
          ← Your projects
        </Link>
      </div>
      <header className="mb-10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
          <RenameProjectButton projectId={project.id} currentName={project.name} />
        </div>
        <Badge variant={STATUS_VARIANT[project.status]} className="mt-2 shrink-0">
          {STATUS_LABEL[project.status]}
        </Badge>
      </header>

      {project.status === 'DRAFT' ? (
        <Card>
          <CardHeader>
            <CardTitle>Paste your requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Paste a description of the business. Cover what they do, who they serve, their tone
              and brand personality, and any specific services or features. The more you give us,
              the better the result.
            </p>
            <PasteRequirementsForm
              projectId={project.id}
              initialValue={project.rawRequirements ?? ''}
            />
          </CardContent>
        </Card>
      ) : project.status === 'REQUIREMENTS_SUBMITTED' ? (
        <Card>
          <CardHeader>
            <CardTitle>Requirements saved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Your requirements are saved. Generating the business profile takes roughly 5–10
              seconds and costs one AI call.
            </p>
            <details className="bg-muted/30 text-muted-foreground rounded-md border p-3 text-sm">
              <summary className="cursor-pointer text-xs uppercase tracking-wide">
                Preview saved requirements
              </summary>
              <pre className="mt-3 whitespace-pre-wrap font-mono text-xs">
                {project.rawRequirements ?? ''}
              </pre>
            </details>
            <GenerateProfileButton projectId={project.id} />
          </CardContent>
        </Card>
      ) : project.status === 'PROFILE_GENERATED' && profile !== null ? (
        <Card>
          <CardHeader>
            <CardTitle>Review the business profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6 text-sm">
              Edit any field. Save changes preserves edits without advancing the project; Confirm
              and continue moves to design brief generation.
            </p>
            <ProfileForm projectId={project.id} initialProfile={profile} status={project.status} />
          </CardContent>
        </Card>
      ) : project.status === 'PROFILE_CONFIRMED' && profile !== null ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Confirmed business profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6 text-sm">
                You&apos;ve confirmed this profile. Generate the design brief below, or edit and
                re-confirm if needed.
              </p>
              <ProfileForm
                projectId={project.id}
                initialProfile={profile}
                status={project.status}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Generate the design brief</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                The brief defines the visual and verbal identity of the website — archetype, color
                palette, typography, layout, voice. Generation takes roughly 20 seconds and costs
                one AI call.
              </p>
              <GenerateBriefButton projectId={project.id} />
            </CardContent>
          </Card>
        </div>
      ) : (project.status === 'BRIEF_GENERATED' || project.status === 'BRIEF_CONFIRMED') &&
        brief !== null &&
        profile !== null ? (
        <div>
          <ProfileSummary profile={profile} />
          <Card>
            <CardHeader>
              <CardTitle>
                {project.status === 'BRIEF_CONFIRMED'
                  ? 'Confirmed design brief'
                  : 'Review the design brief'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.status === 'BRIEF_CONFIRMED' ? (
                <p className="text-muted-foreground mb-6 text-sm">
                  You&apos;ve confirmed this brief. You can still edit it; site generation arrives
                  in Phase 3.
                </p>
              ) : (
                <p className="text-muted-foreground mb-6 text-sm">
                  Edit any field. Save changes preserves edits; Confirm and continue advances the
                  project to site generation.
                </p>
              )}
              <BriefForm projectId={project.id} initialBrief={brief} status={project.status} />
            </CardContent>
          </Card>
          {project.status === 'BRIEF_CONFIRMED' ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Next: site generation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Site generation — page architecture, section content, image resolution — wires up
                  in Phase 3.
                </p>
                <Button disabled title="Phase 3">
                  Generate site (coming soon)
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Project state unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              The project is in an unexpected state. Re-run the previous step.
            </p>
          </CardContent>
        </Card>
      )}

      <footer className="mt-12 flex justify-end border-t pt-6">
        <DeleteProjectButton projectId={project.id} projectName={project.name} />
      </footer>
    </main>
  );
}
