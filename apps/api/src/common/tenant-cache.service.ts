import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantCacheService {
  private cache = new Map<string, { value: any; expiresAt: number | null }>();

  private getCacheKey(tenantId: string, resource: string): string {
    return `t:${tenantId}:${resource}`;
  }

  get<T>(tenantId: string, resource: string): T | null {
    const key = this.getCacheKey(tenantId, resource);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  set(tenantId: string, resource: string, value: any, ttlSeconds?: number): void {
    const key = this.getCacheKey(tenantId, resource);
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiresAt });
  }

  delete(tenantId: string, resource: string): void {
    const key = this.getCacheKey(tenantId, resource);
    this.cache.delete(key);
  }

  flushTenant(tenantId: string): void {
    const prefix = `t:${tenantId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}
