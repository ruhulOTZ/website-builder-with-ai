import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/database/nest';
import { type Site } from '@repo/shared-types';

export interface PersistInput {
  /**
   * Loose-string FK to DesignBriefRecord.id. Same pattern as
   * DesignBriefRecord.businessProfileId — tightens to a real relation in
   * Phase 2.4d / 2.5 when the UI flow demands the relationship.
   */
  designBriefId?: string;
  site: Site;
  modelUsed: string;
  promptVersion: string;
  userId?: string;
}

export interface PersistedRecord {
  id: string;
  createdAt: Date;
}

/**
 * Thin Prisma wrapper around GeneratedSiteRecord. Kept narrow on purpose —
 * the generator / eval pipelines only need create-and-id-back. List / get
 * / delete endpoints come with the builder UI work in a later sub-step.
 */
@Injectable()
export class HomePageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: PersistInput): Promise<PersistedRecord> {
    const record = await this.prisma.generatedSiteRecord.create({
      data: {
        designBriefId: input.designBriefId ?? null,
        siteJson: input.site,
        modelUsed: input.modelUsed,
        promptVersion: input.promptVersion,
        userId: input.userId ?? null,
      },
      select: { id: true, createdAt: true },
    });
    return record;
  }
}
