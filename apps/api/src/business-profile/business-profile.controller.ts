import { BadRequestException, Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { type BusinessProfile } from '@repo/shared-types';

import { BusinessProfileParserService } from './business-profile-parser.service';
import { BusinessProfileRepository } from './business-profile.repository';
import { ParseRequestSchema } from './dto/parse-request.dto';

interface ParseResponse {
  id?: string;
  profile: BusinessProfile;
  modelUsed: string;
  promptVersion: string;
}

/**
 * Dev-only endpoint for the business-profile parser pipeline. Auth comes
 * in Phase 2.5; production access is gated by NODE_ENV.
 */
@Controller('api/business-profile')
export class BusinessProfileController {
  constructor(
    private readonly parser: BusinessProfileParserService,
    private readonly repo: BusinessProfileRepository,
  ) {}

  @Post('parse')
  async parse(@Body() body: unknown): Promise<ParseResponse> {
    this.assertNotProduction();

    const parsed = ParseRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid request body',
        issues: parsed.error.issues,
      });
    }
    const { rawText, sourceLabel, persist } = parsed.data;

    const result = await this.parser.parse({
      rawText,
      ...(sourceLabel !== undefined ? { sourceLabel } : {}),
    });

    if (!persist) {
      return {
        profile: result.profile,
        modelUsed: result.modelUsed,
        promptVersion: result.promptVersion,
      };
    }

    const record = await this.repo.create({
      rawText,
      ...(sourceLabel !== undefined ? { sourceLabel } : {}),
      profile: result.profile,
      modelUsed: result.modelUsed,
      promptVersion: result.promptVersion,
    });

    return {
      id: record.id,
      profile: result.profile,
      modelUsed: result.modelUsed,
      promptVersion: result.promptVersion,
    };
  }

  private assertNotProduction(): void {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'business-profile/parse is disabled in production until auth is wired',
      );
    }
  }
}
