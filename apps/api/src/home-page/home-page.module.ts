import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AiModule } from '../ai/ai.module';

import { HomePageGeneratorService } from './home-page-generator.service';
import { HomePageController } from './home-page.controller';
import { HomePageRepository } from './home-page.repository';
import { IMAGE_RESOLVER } from './image-resolver.tokens';
import { createUnsplashResolver, noopResolver } from './unsplash-resolver';

@Module({
  imports: [AiModule],
  controllers: [HomePageController],
  providers: [
    HomePageGeneratorService,
    HomePageRepository,
    {
      // The image resolver populates ImageRef.url from `query` at the end of
      // generation. The factory picks Unsplash when a key is available, falls
      // back to a no-op otherwise so the pipeline doesn't break on fresh
      // checkouts. See unsplash-resolver.ts for the failure model.
      provide: IMAGE_RESOLVER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const accessKey = config.get<string>('UNSPLASH_ACCESS_KEY');
        if (accessKey === undefined || accessKey === '') {
          new Logger('HomePageModule').warn(
            'UNSPLASH_ACCESS_KEY not set — generated sites will render without resolved photo URLs.',
          );
          return noopResolver;
        }
        return createUnsplashResolver(accessKey);
      },
    },
  ],
  exports: [HomePageGeneratorService, HomePageRepository],
})
export class HomePageModule {}
