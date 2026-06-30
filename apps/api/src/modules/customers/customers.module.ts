import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CustomersController, PrivacyController],
  providers: [CustomersService, PrivacyService],
  exports: [CustomersService, PrivacyService],
})
export class CustomersModule {}
