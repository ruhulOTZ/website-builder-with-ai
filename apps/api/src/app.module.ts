import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@repo/database/nest';

import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BusinessProfileModule } from './business-profile/business-profile.module';
import { DesignBriefModule } from './design-brief/design-brief.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AiModule,
    BusinessProfileModule,
    DesignBriefModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
