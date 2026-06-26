import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserInvitationsService } from './user-invitations.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserInvitationsService],
  exports: [UsersService, UserInvitationsService],
})
export class UsersModule {}
