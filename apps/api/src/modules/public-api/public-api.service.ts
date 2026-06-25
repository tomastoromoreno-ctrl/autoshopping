import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

@Injectable()
export class PublicApiService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async createKey(
    tenantId: string,
    dto: { name: string; scopes: string[]; environment?: 'live' | 'sandbox'; expiresDays?: number },
    userId: string,
  ) {
    const environment = dto.environment || 'live';
    const scopes = dto.scopes || [];

    // Generate random key payload
    const token = crypto.randomBytes(24).toString('hex'); // 48 chars
    const prefix = environment === 'live' ? 'sk_live_' : 'sk_sandbox_';
    const fullKey = `${prefix}${token}`;

    // SHA-256 Hash for storage
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');
    const displayPrefix = `${prefix}${token.substring(0, 4)}...`;

    let expiresAt: string | null = null;
    if (dto.expiresDays) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + dto.expiresDays);
      expiresAt = expDate.toISOString();
    }

    const { data, error } = await this.supabase
      .from('api_keys')
      .insert({
        tenant_id: tenantId,
        name: dto.name,
        key_hash: keyHash,
        key_prefix: displayPrefix,
        scopes,
        environment,
        expires_at: expiresAt,
        created_by: userId,
      })
      .select('id, name, key_prefix, scopes, environment, expires_at, created_at')
      .single();

    if (error) {
      throw new BadRequestException(`Error creando clave API: ${error.message}`);
    }

    // Return plain key only once
    return {
      ...data,
      api_key: fullKey,
    };
  }

  async listKeys(tenantId: string) {
    const { data, error } = await this.supabase
      .from('api_keys')
      .select('id, name, key_prefix, scopes, environment, last_used_at, expires_at, created_at')
      .eq('tenant_id', tenantId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async revokeKey(tenantId: string, keyId: string) {
    const { error } = await this.supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', keyId)
      .eq('tenant_id', tenantId);

    if (error) throw new BadRequestException(error.message);
    return { success: true, message: 'Clave API revocada' };
  }

  async getKeyUsage(tenantId: string, keyId: string) {
    // Check key exists and belongs to tenant
    const { data: keyData } = await this.supabase
      .from('api_keys')
      .select('id')
      .eq('id', keyId)
      .eq('tenant_id', tenantId)
      .single();

    if (!keyData) throw new NotFoundException('Clave API no encontrada');

    // Fetch last 30 days request counts
    const { data: logs, error } = await this.supabase
      .from('api_request_logs')
      .select('created_at, status_code, response_time_ms')
      .eq('api_key_id', keyId)
      .order('created_at', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    // Group logs by day for chart representation
    const stats: Record<string, { requests: number; errors: number; avgTime: number; totalTime: number }> = {};
    
    logs?.forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      if (!stats[date]) {
        stats[date] = { requests: 0, errors: 0, avgTime: 0, totalTime: 0 };
      }
      stats[date].requests++;
      if (log.status_code >= 400) {
        stats[date].errors++;
      }
      stats[date].totalTime += log.response_time_ms || 0;
      stats[date].avgTime = Math.round(stats[date].totalTime / stats[date].requests);
    });

    return Object.entries(stats).map(([date, val]) => ({
      date,
      requests: val.requests,
      errors: val.errors,
      avg_response_time_ms: val.avgTime,
    }));
  }

  async getIntrospection(tenantId: string, apiKeyId: string) {
    const { data: keyData, error } = await this.supabase
      .from('api_keys')
      .select('id, name, scopes, environment, key_prefix, tenants(id, name, subdomain, custom_domain, status, plan)')
      .eq('id', apiKeyId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !keyData) throw new NotFoundException('Clave API no encontrada');

    return {
      api_key_id: keyData.id,
      name: keyData.name,
      scopes: keyData.scopes,
      environment: keyData.environment,
      prefix: keyData.key_prefix,
      tenant: keyData.tenants,
    };
  }
}
