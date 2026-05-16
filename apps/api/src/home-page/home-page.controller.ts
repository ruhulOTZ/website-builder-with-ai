import { BadRequestException, Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { type Site } from '@repo/shared-types';

import { GenerateHomePageRequestSchema } from './dto/generate-request.dto';
import { HomePageGeneratorService } from './home-page-generator.service';
import { HomePageRepository } from './home-page.repository';

interface GenerateResponse {
  id?: string;
  site: Site;
  modelUsed: string;
  promptVersion: string;
}

/**
 * Dev-only endpoint for the home-page generator pipeline. Auth comes in
 * Phase 2.5; production access is gated by NODE_ENV.
 */
@Controller('api/home-page')
export class HomePageController {
  constructor(
    private readonly generator: HomePageGeneratorService,
    private readonly repo: HomePageRepository,
  ) {}

  @Post('generate')
  async generate(@Body() body: unknown): Promise<GenerateResponse> {
    this.assertNotProduction();

    const parsed = GenerateHomePageRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid request body',
        issues: parsed.error.issues,
      });
    }
    const { profile, brief, designBriefId, rawDocumentText, sourceLabel, persist } = parsed.data;

    const result = await this.generator.generate({
      profile,
      brief,
      designBriefId,
      ...(rawDocumentText !== undefined ? { rawDocumentText } : {}),
      ...(sourceLabel !== undefined ? { sourceLabel } : {}),
    });

    if (!persist) {
      return {
        site: result.site,
        modelUsed: result.modelUsed,
        promptVersion: result.promptVersion,
      };
    }

    const record = await this.repo.create({
      designBriefId,
      site: result.site,
      modelUsed: result.modelUsed,
      promptVersion: result.promptVersion,
    });

    return {
      id: record.id,
      site: result.site,
      modelUsed: result.modelUsed,
      promptVersion: result.promptVersion,
    };
  }

  private assertNotProduction(): void {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'home-page/generate is disabled in production until auth is wired',
      );
    }
  }
}
