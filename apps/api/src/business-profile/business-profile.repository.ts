import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/database/nest';
import { type BusinessProfile } from '@repo/shared-types';

export interface PersistInput {
  rawText: string;
  sourceLabel?: string;
  profile: BusinessProfile;
  modelUsed: string;
  promptVersion: string;
  userId?: string;
}

export interface PersistedRecord {
  id: string;
  createdAt: Date;
}

/**
 * Thin Prisma wrapper around BusinessProfileRecord. Kept narrow on purpose —
 * the parser/eval pipelines only need create-and-id-back. List/get/delete
 * endpoints (and the dashboard UI behind them) come in a later phase.
 */
@Injectable()
export class BusinessProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: PersistInput): Promise<PersistedRecord> {
    const record = await this.prisma.businessProfileRecord.create({
      data: {
        rawText: input.rawText,
        sourceLabel: input.sourceLabel ?? null,
        // Prisma's Json column accepts the validated object directly — Zod has
        // already enforced shape, so the JSON.stringify Prisma does internally
        // is safe.
        profileJson: input.profile,
        modelUsed: input.modelUsed,
        promptVersion: input.promptVersion,
        userId: input.userId ?? null,
      },
      select: { id: true, createdAt: true },
    });
    return record;
  }
}
