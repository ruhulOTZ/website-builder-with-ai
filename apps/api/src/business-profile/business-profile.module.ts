import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';

import { BusinessProfileParserService } from './business-profile-parser.service';
import { BusinessProfileController } from './business-profile.controller';
import { BusinessProfileRepository } from './business-profile.repository';

@Module({
  imports: [AiModule],
  controllers: [BusinessProfileController],
  providers: [BusinessProfileParserService, BusinessProfileRepository],
  exports: [BusinessProfileParserService, BusinessProfileRepository],
})
export class BusinessProfileModule {}
