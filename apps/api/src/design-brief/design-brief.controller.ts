import { BadRequestException, Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { type DesignBrief } from '@repo/shared-types';

import { DesignBriefGeneratorService } from './design-brief-generator.service';
import { DesignBriefRepository } from './design-brief.repository';
import { GenerateBriefRequestSchema } from './dto/generate-request.dto';

interface GenerateResponse {
  id?: string;
  brief: DesignBrief;
  modelUsed: string;
  promptVersion: string;
}

/**
 * Dev-only endpoint for the design-brief generator pipeline. Auth comes in
 * Phase 2.5; production access is gated by NODE_ENV.
 */
@Controller('api/design-brief')
export class DesignBriefController {
  constructor(
    private readonly generator: DesignBriefGeneratorService,
    private readonly repo: DesignBriefRepository,
  ) {}

  @Post('generate')
  async generate(@Body() body: unknown): Promise<GenerateResponse> {
    this.assertNotProduction();

    const parsed = GenerateBriefRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid request body',
        issues: parsed.error.issues,
      });
    }
    const { profile, rawDocumentText, sourceLabel, businessProfileId, persist } = parsed.data;

    const result = await this.generator.generate({
      profile,
      ...(rawDocumentText !== undefined ? { rawDocumentText } : {}),
      ...(sourceLabel !== undefined ? { sourceLabel } : {}),
    });

    if (!persist) {
      return {
        brief: result.brief,
        modelUsed: result.modelUsed,
        promptVersion: result.promptVersion,
      };
    }

    const record = await this.repo.create({
      ...(businessProfileId !== undefined ? { businessProfileId } : {}),
      brief: result.brief,
      modelUsed: result.modelUsed,
      promptVersion: result.promptVersion,
    });

    return {
      id: record.id,
      brief: result.brief,
      modelUsed: result.modelUsed,
      promptVersion: result.promptVersion,
    };
  }

  private assertNotProduction(): void {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'design-brief/generate is disabled in production until auth is wired',
      );
    }
  }
}
