import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';

@Module({
  controllers: [CustomersController, PrivacyController],
  providers: [CustomersService, PrivacyService],
  exports: [CustomersService, PrivacyService],
})
export class CustomersModule {}
