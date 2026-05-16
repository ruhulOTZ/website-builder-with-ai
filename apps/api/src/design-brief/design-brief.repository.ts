import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/database/nest';
import { type DesignBrief } from '@repo/shared-types';

export interface PersistInput {
  /**
   * Optional reference to a BusinessProfileRecord. Kept as a loose string
   * (not a Prisma relation) for now: the eval rig generates briefs from
   * non-persisted profiles, and forcing a relation would require persistence
   * in the parse path before brief generation can run. Tightens to a real
   * FK in Phase 2.4 when the builder UI lands.
   */
  businessProfileId?: string;
  brief: DesignBrief;
  modelUsed: string;
  promptVersion: string;
  userId?: string;
}

export interface PersistedRecord {
  id: string;
  createdAt: Date;
}

/**
 * Thin Prisma wrapper around DesignBriefRecord. Kept narrow on purpose —
 * the generator/eval pipelines only need create-and-id-back. List/get/delete
 * endpoints come in Phase 2.4 with the builder UI.
 */
@Injectable()
export class DesignBriefRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: PersistInput): Promise<PersistedRecord> {
    const record = await this.prisma.designBriefRecord.create({
      data: {
        businessProfileId: input.businessProfileId ?? null,
        briefJson: input.brief,
        modelUsed: input.modelUsed,
        promptVersion: input.promptVersion,
        userId: input.userId ?? null,
      },
      select: { id: true, createdAt: true },
    });
    return record;
  }
}
