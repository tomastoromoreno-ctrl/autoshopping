import { Injectable, Inject, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
  ) {}

  async signUp(email: string, password: string, name: string) {
    const { data: existingUser } = await this.supabase
      .from('users')
      .select('id, email_confirmed')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      if (existingUser.email_confirmed) {
        throw new BadRequestException('El correo electrónico ya está registrado.');
      } else {
        throw new BadRequestException('Este correo electrónico ya está registrado pero aún no ha sido confirmado. Por favor, revisa tu bandeja de entrada o solicita un nuevo correo de confirmación.');
      }
    }

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${this.config.get('APP_URL')}/auth/confirm`,
      },
    });

    if (error) throw new BadRequestException(error.message);

    const { error: dbError } = await this.supabase.from('users').insert({
      id: data.user?.id,
      email,
      name,
      role: 'customer',
    });

    if (dbError) throw new BadRequestException(dbError.message);

    return { message: 'Confirmation email sent', user: data.user };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new UnauthorizedException('Invalid credentials');

    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user: data.user,
    };
  }

  async signOut(token: string) {
    const { error } = await this.supabase.auth.admin.signOut(token);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Signed out successfully' };
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) throw new UnauthorizedException('Invalid refresh token');

    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
    };
  }

  async confirmEmail(token: string) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      token_hash: token,
      type: 'signup',
    });

    if (error) throw new BadRequestException(error.message);

    await this.supabase
      .from('users')
      .update({ email_confirmed: true })
      .eq('id', data.user?.id);

    return { message: 'Email confirmed successfully' };
  }

  async resendConfirmation(email: string) {
    const { error } = await this.supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) throw new BadRequestException(error.message);
    return { message: 'Confirmation email resent' };
  }
}
