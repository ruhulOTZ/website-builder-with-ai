import { Body, Controller, ForbiddenException, Inject, Post } from '@nestjs/common';
import { type AIProvider } from '@repo/ai';
import { z } from 'zod';

import { AI_PROVIDER } from './ai.tokens';

const DEFAULT_MODEL = 'gemini-2.5-flash';

interface TextRequestBody {
  prompt?: unknown;
  model?: unknown;
}

const StructuredOutputSchema = z.object({
  summary: z.string(),
  keywords: z.array(z.string()).min(1).max(5),
});
type StructuredOutput = z.infer<typeof StructuredOutputSchema>;

/**
 * Dev-only smoke-test surface for the AI provider. Gated on NODE_ENV: in
 * production these endpoints return 403 regardless of payload. Real
 * domain endpoints will live in dedicated controllers once the parsing /
 * brief-generation pipelines exist.
 */
@Controller('api/ai/test')
export class AiController {
  constructor(@Inject(AI_PROVIDER) private readonly ai: AIProvider) {}

  @Post('text')
  async generateText(@Body() body: TextRequestBody): Promise<{ text: string }> {
    this.assertNotProduction();
    const prompt = ensureNonEmptyString(body.prompt, 'prompt');
    const model =
      typeof body.model === 'string' && body.model.length > 0 ? body.model : DEFAULT_MODEL;
    const text = await this.ai.generateText(prompt, { model });
    return { text };
  }

  @Post('structured')
  async generateStructured(@Body() body: TextRequestBody): Promise<StructuredOutput> {
    this.assertNotProduction();
    const prompt = ensureNonEmptyString(body.prompt, 'prompt');
    const model =
      typeof body.model === 'string' && body.model.length > 0 ? body.model : DEFAULT_MODEL;
    return this.ai.generateStructured(StructuredOutputSchema, prompt, { model });
  }

  private assertNotProduction(): void {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('AI test endpoints are disabled in production');
    }
  }
}

function ensureNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing or empty "${field}" in request body`);
  }
  return value;
}
