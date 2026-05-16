import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';

import { DesignBriefGeneratorService } from './design-brief-generator.service';
import { DesignBriefController } from './design-brief.controller';
import { DesignBriefRepository } from './design-brief.repository';

@Module({
  imports: [AiModule],
  controllers: [DesignBriefController],
  providers: [DesignBriefGeneratorService, DesignBriefRepository],
  exports: [DesignBriefGeneratorService, DesignBriefRepository],
})
export class DesignBriefModule {}
