import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CustomerGuard implements CanActivate {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException('Token requerido');

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    if (error || !user) throw new UnauthorizedException('Token inválido');

    const { data: customer } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!customer) throw new UnauthorizedException('Cliente no encontrado');

    request.customer = customer;
    return true;
  }
}
