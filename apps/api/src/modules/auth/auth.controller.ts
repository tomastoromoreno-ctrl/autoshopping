import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  signUp(@Body() body: { email: string; password: string; name: string }) {
    return this.auth.signUp(body.email, body.password, body.name);
  }

  @Post('signin')
  signIn(@Body() body: { email: string; password: string }) {
    return this.auth.signIn(body.email, body.password);
  }

  @Post('signout')
  @UseGuards(AuthGuard)
  signOut(@Headers('authorization') auth: string) {
    return this.auth.signOut(auth.replace('Bearer ', ''));
  }

  @Post('refresh')
  refresh(@Body() body: { refresh_token: string }) {
    return this.auth.refreshToken(body.refresh_token);
  }

  @Post('confirm')
  confirm(@Body() body: { token: string }) {
    return this.auth.confirmEmail(body.token);
  }

  @Post('resend-confirmation')
  resend(@Body() body: { email: string }) {
    return this.auth.resendConfirmation(body.email);
  }
}
