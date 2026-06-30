import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  private supabase: SupabaseClient;
  private adminSupabase: SupabaseClient;

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      config.getOrThrow('SUPABASE_URL'),
      config.getOrThrow('SUPABASE_ANON_KEY'),
    );
    this.adminSupabase = createClient(
      config.getOrThrow('SUPABASE_URL'),
      config.getOrThrow('SUPABASE_SERVICE_KEY'),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    // 1. Intentar validar como token de Modo Dios
    try {
      const secret = this.config.getOrThrow('JWT_SECRET');
      const decoded = jwt.verify(token, secret) as any;
      if (decoded && decoded.targetUserId && decoded.targetStoreId) {
        const { data: session } = await this.adminSupabase
          .from('god_mode_sessions')
          .select('*')
          .eq('token', token)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (session) {
          const { data: targetUser } = await this.adminSupabase
            .from('users')
            .select('id, email, name, role, email_confirmed')
            .eq('id', decoded.targetUserId)
            .single();

          if (targetUser) {
            request.user = {
              id: targetUser.id,
              email: targetUser.email,
              name: targetUser.name,
              role: 'store_owner',
              tenant_id: decoded.targetStoreId,
              email_confirmed: targetUser.email_confirmed,
              isGodMode: true,
              operatorId: decoded.superadminId,
              godModeSessionId: session.id,
            };
            return true;
          }
        }
      }
    } catch (e) {
      // No es un token de modo dios válido o expiró, continuamos con la validación estándar de Supabase
    }

    // 2. Validación estándar con Supabase Auth
    const { data: { user }, error } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid token');
    }

    const { data: dbUser } = await this.adminSupabase
      .from('users')
      .select('id, email, name, role, tenant_id, email_confirmed, tenants(status)')
      .eq('id', user.id)
      .single();

    request.user = {
      id: user.id,
      email: user.email,
      name: dbUser?.name || user.user_metadata?.name || '',
      role: dbUser?.role || 'customer',
      tenant_id: dbUser?.tenant_id || null,
      email_confirmed: dbUser?.email_confirmed || false,
    };

    // 3. Verificar si la tienda está suspendida (excluyendo a superadmins/support_agents)
    const isStaff = request.user.role === 'super_admin' || request.user.role === 'support_agent';
    if (!isStaff && request.user.tenant_id) {
      const tenantStatus = (dbUser as any)?.tenants?.status;
      if (tenantStatus === 'suspended') {
        const path = request.url;
        const isAllowedPath = path.includes('/billing') || path.includes('/auth/signout') || path.includes('/payments/webhook');
        if (!isAllowedPath) {
          throw new ForbiddenException('Tu tienda se encuentra suspendida. Por favor actualiza tu método de pago o contacta a soporte.');
        }
      }
    }

    return true;
  }

  private extractToken(request: any): string | null {
    const auth = request.headers.authorization;
    if (!auth) return null;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
