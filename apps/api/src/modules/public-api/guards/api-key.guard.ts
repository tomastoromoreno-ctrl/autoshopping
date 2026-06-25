import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../../common/supabase.module';
import { SCOPE_KEY } from '../decorators/scopes.decorator';
import * as crypto from 'crypto';

// Simple in-memory rate limiting map
// key: tenant_id + minute_timestamp
// value: count
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.throwRfcError(
        request,
        HttpStatus.UNAUTHORIZED,
        'API key requerida',
        'El header Authorization es requerido con formato: Bearer sk_...',
      );
    }

    const apiKey = authHeader.substring(7).trim();
    if (!apiKey) {
      this.throwRfcError(
        request,
        HttpStatus.UNAUTHORIZED,
        'API key requerida',
        'El token de la API key no puede estar vacío',
      );
    }

    // SHA-256 Hash of API key
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Query in database
    const { data: keyData, error } = await this.supabase
      .from('api_keys')
      .select('*, tenants(*)')
      .eq('key_hash', hashedKey)
      .limit(1)
      .maybeSingle();

    if (error || !keyData) {
      this.throwRfcError(
        request,
        HttpStatus.UNAUTHORIZED,
        'API key inválida',
        'La API key proporcionada es incorrecta o no existe',
      );
    }

    if (keyData.revoked_at) {
      this.throwRfcError(
        request,
        HttpStatus.UNAUTHORIZED,
        'API key revocada',
        'La API key ha sido revocada y no se puede utilizar',
      );
    }

    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      this.throwRfcError(
        request,
        HttpStatus.UNAUTHORIZED,
        'API key expirada',
        'La API key ha expirado',
      );
    }

    // Rate Limiting Check
    const plan = keyData.tenants?.plan || 'free';
    let limitPerMinute = keyData.rate_limit_per_minute || 60;
    
    // Override limit depending on plan if not specified or for standard values
    if (plan === 'free') limitPerMinute = Math.min(limitPerMinute, 30);
    else if (plan === 'pro') limitPerMinute = Math.min(limitPerMinute, 120);
    else if (plan === 'enterprise') limitPerMinute = Math.min(limitPerMinute, 600);

    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    const limitKey = `${keyData.tenant_id}:${currentMinute}`;
    const rateData = rateLimitCache.get(limitKey);

    let count = 1;
    let resetTime = Math.ceil((now + 60000) / 60000) * 60000; // Next minute

    if (rateData) {
      rateData.count++;
      count = rateData.count;
      resetTime = rateData.resetTime;
    } else {
      rateLimitCache.set(limitKey, { count, resetTime });
    }

    // Clean old entries from cache
    for (const [k, v] of rateLimitCache.entries()) {
      if (v.resetTime < now) rateLimitCache.delete(k);
    }

    // Set standard response headers
    response.setHeader('X-RateLimit-Limit', limitPerMinute);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, limitPerMinute - count));
    response.setHeader('X-RateLimit-Reset', Math.floor(resetTime / 1000));
    response.setHeader('X-Request-ID', request.headers['x-request-id'] || crypto.randomUUID());

    if (count > limitPerMinute) {
      response.setHeader('Retry-After', Math.ceil((resetTime - now) / 1000));
      this.throwRfcError(
        request,
        HttpStatus.TOO_MANY_REQUESTS,
        'Límite de peticiones excedido',
        `Has excedido el límite de peticiones permitido para tu plan (${limitPerMinute} req/min).`,
      );
    }

    // Check scopes
    const requiredScope = this.reflector.getAllAndOverride<string>(SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredScope) {
      const scopes: string[] = keyData.scopes || [];
      const hasScope = scopes.includes(requiredScope) || scopes.includes('*');
      if (!hasScope) {
        this.throwRfcError(
          request,
          HttpStatus.FORBIDDEN,
          'Scope insuficiente',
          `Se requiere el scope: ${requiredScope} para acceder a esta ruta`,
        );
      }
    }

    // Attach details to request object
    request.apiKey = keyData;
    request.tenantId = keyData.tenant_id;
    request.environment = keyData.environment || 'live';
    request.isSandbox = keyData.environment === 'sandbox';

    // Asynchronously log the request and update last used date
    this.logRequest(request, response, keyData);

    return true;
  }

  private async logRequest(request: any, response: any, keyData: any) {
    try {
      const startTime = Date.now();
      
      // Update last_used_at
      await this.supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', keyData.id);

      // We wait for route execution finish to log status code and response time
      response.on('finish', async () => {
        const duration = Date.now() - startTime;
        await this.supabase
          .from('api_request_logs')
          .insert({
            tenant_id: keyData.tenant_id,
            api_key_id: keyData.id,
            method: request.method,
            path: request.url,
            query_params: request.query || {},
            status_code: response.statusCode,
            response_time_ms: duration,
            ip_address: request.ip || request.headers['x-forwarded-for'] || '',
            user_agent: request.headers['user-agent'] || '',
            request_id: response.getHeader('X-Request-ID') as string || '',
          });
      });
    } catch (e) {
      console.error('Error logging api key request:', e);
    }
  }

  private throwRfcError(request: any, status: number, title: string, detail: string) {
    const errorBody = {
      type: `https://docs.autoshopping.cl/errors/${status === 401 ? 'unauthorized' : status === 403 ? 'forbidden' : status === 429 ? 'rate-limit' : 'error'}`,
      title,
      status,
      detail,
      instance: request.url,
      request_id: request.headers['x-request-id'] || crypto.randomUUID(),
    };

    if (status === HttpStatus.UNAUTHORIZED) {
      throw new UnauthorizedException(errorBody);
    } else if (status === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException(errorBody);
    } else {
      // For 429 or others, throw raw exception with status
      throw new ForbiddenException(errorBody); // Nest handles throw of objects nicely inside guards
    }
  }
}
