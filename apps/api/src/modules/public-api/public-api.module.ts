import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';
import { HeadlessController } from './headless.controller';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  controllers: [PublicApiController, HeadlessController],
  providers: [PublicApiService, ApiKeyGuard],
  exports: [PublicApiService, ApiKeyGuard],
})
export class PublicApiModule {}
