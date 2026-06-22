import { Module } from '@nestjs/common';
import { StoresController, ConfigController, DashboardController } from './stores.controller';
import { StoresService } from './stores.service';

@Module({
  controllers: [StoresController, ConfigController, DashboardController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
