import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiProvider } from '@repo/ai';

import { AiController } from './ai.controller';
import { AI_PROVIDER } from './ai.tokens';

@Module({
  controllers: [AiController],
  providers: [
    {
      provide: AI_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const apiKey = config.getOrThrow<string>('GEMINI_API_KEY');
        return new GeminiProvider({ apiKey });
      },
    },
  ],
  exports: [AI_PROVIDER],
})
export class AiModule {}
