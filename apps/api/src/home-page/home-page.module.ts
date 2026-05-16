import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';

import { HomePageGeneratorService } from './home-page-generator.service';
import { HomePageController } from './home-page.controller';
import { HomePageRepository } from './home-page.repository';

@Module({
  imports: [AiModule],
  controllers: [HomePageController],
  providers: [HomePageGeneratorService, HomePageRepository],
  exports: [HomePageGeneratorService, HomePageRepository],
})
export class HomePageModule {}
