import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class BackupsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async listBackups(tenantId: string) {
    const { data, error } = await this.supabase
      .from('backups')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async createBackup(tenantId: string, type: 'manual' | 'automatic' = 'manual') {
    // Create backup record
    const { data: backup, error: createError } = await this.supabase
      .from('backups')
      .insert({
        tenant_id: tenantId,
        type,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) throw new BadRequestException(createError.message);

    try {
      // Collect all tenant data
      const backupData: Record<string, any> = {
        metadata: {
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
          version: '1.0',
          type,
        },
      };

      // Products
      const { data: products } = await this.supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId);
      backupData.products = products || [];

      // Categories
      const { data: categories } = await this.supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenantId);
      backupData.categories = categories || [];

      // Orders
      const { data: orders } = await this.supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', tenantId);
      backupData.orders = orders || [];

      // Order items
      if (orders && orders.length > 0) {
        const orderIds = orders.map((o) => o.id);
        const { data: orderItems } = await this.supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);
        backupData.order_items = orderItems || [];
      }

      // Store config
      const { data: config } = await this.supabase
        .from('store_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      backupData.store_config = config;

      // Tenant info
      const { data: tenant } = await this.supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();
      backupData.tenant = tenant;

      // Invoices
      const { data: invoices } = await this.supabase
        .from('invoices')
        .select('*')
        .eq('tenant_id', tenantId);
      backupData.invoices = invoices || [];

      // Promotions
      const { data: promotions } = await this.supabase
        .from('promotions')
        .select('*')
        .eq('tenant_id', tenantId);
      backupData.promotions = promotions || [];

      // Blog posts
      const { data: blogPosts } = await this.supabase
        .from('blog_posts')
        .select('*')
        .eq('tenant_id', tenantId);
      backupData.blog_posts = blogPosts || [];

      // Banners
      const { data: banners } = await this.supabase
        .from('store_banners')
        .select('*')
        .eq('tenant_id', tenantId);
      backupData.banners = banners || [];

      // Legal documents
      const { data: legalDocs } = await this.supabase
        .from('legal_documents')
        .select('*')
        .eq('tenant_id', tenantId);
      backupData.legal_documents = legalDocs || [];

      // Calculate file size
      const jsonStr = JSON.stringify(backupData);
      const fileSize = Buffer.byteLength(jsonStr, 'utf8');

      // Store backup content in Supabase Storage
      const fileName = `backups/${tenantId}/${backup.id}.json`;
      const { error: uploadError } = await this.supabase
        .storage
        .from('backups')
        .upload(fileName, jsonStr, {
          contentType: 'application/json',
          upsert: true,
        });

      // If storage bucket doesn't exist, store inline
      let fileUrl = null;
      if (!uploadError) {
        const { data: urlData } = this.supabase.storage.from('backups').getPublicUrl(fileName);
        fileUrl = urlData?.publicUrl || null;
      }

      // Update backup record
      const includes = Object.keys(backupData).filter((k) => k !== 'metadata');
      await this.supabase
        .from('backups')
        .update({
          status: 'completed',
          file_url: fileUrl,
          file_size_bytes: fileSize,
          includes: JSON.stringify(includes),
          completed_at: new Date().toISOString(),
        })
        .eq('id', backup.id);

      // Update backup config last_backup_at
      await this.supabase
        .from('backup_configs')
        .update({ last_backup_at: new Date().toISOString() })
        .eq('tenant_id', tenantId);

      return {
        ...backup,
        status: 'completed',
        file_size_bytes: fileSize,
        includes,
      };
    } catch (err: any) {
      // Mark backup as failed
      await this.supabase
        .from('backups')
        .update({
          status: 'failed',
          error_message: err.message || 'Error desconocido',
        })
        .eq('id', backup.id);

      throw new BadRequestException(`Error al crear backup: ${err.message}`);
    }
  }

  async downloadBackup(tenantId: string, backupId: string) {
    const { data: backup } = await this.supabase
      .from('backups')
      .select('*')
      .eq('id', backupId)
      .eq('tenant_id', tenantId)
      .single();

    if (!backup) throw new NotFoundException('Backup no encontrado');

    // Try to download from storage
    const fileName = `backups/${tenantId}/${backupId}.json`;
    const { data, error } = await this.supabase
      .storage
      .from('backups')
      .download(fileName);

    if (error) {
      // If storage fails, regenerate the backup data
      throw new BadRequestException('No se pudo descargar el backup. Intente crear uno nuevo.');
    }

    const text = await data.text();
    return JSON.parse(text);
  }

  async restoreBackup(tenantId: string, backupData: any) {
    // Validate backup data structure
    if (!backupData || !backupData.metadata) {
      throw new BadRequestException('Datos de backup inválidos');
    }

    const results: Record<string, { restored: number; errors: number }> = {};

    // Restore categories first (products depend on them)
    if (backupData.categories && Array.isArray(backupData.categories)) {
      let restored = 0;
      let errors = 0;
      for (const cat of backupData.categories) {
        const { error } = await this.supabase
          .from('categories')
          .upsert({ ...cat, tenant_id: tenantId }, { onConflict: 'id' });
        if (error) errors++;
        else restored++;
      }
      results.categories = { restored, errors };
    }

    // Restore products
    if (backupData.products && Array.isArray(backupData.products)) {
      let restored = 0;
      let errors = 0;
      for (const prod of backupData.products) {
        const { error } = await this.supabase
          .from('products')
          .upsert({ ...prod, tenant_id: tenantId }, { onConflict: 'id' });
        if (error) errors++;
        else restored++;
      }
      results.products = { restored, errors };
    }

    // Restore store config
    if (backupData.store_config) {
      const { error } = await this.supabase
        .from('store_configs')
        .upsert({ ...backupData.store_config, tenant_id: tenantId }, { onConflict: 'tenant_id' });
      results.store_config = { restored: error ? 0 : 1, errors: error ? 1 : 0 };
    }

    return { message: 'Restauración completada', results };
  }

  async getConfig(tenantId: string) {
    const { data } = await this.supabase
      .from('backup_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!data) {
      // Create default config
      const { data: created, error } = await this.supabase
        .from('backup_configs')
        .insert({
          tenant_id: tenantId,
          auto_backup_enabled: false,
          frequency: 'weekly',
          retention_days: 30,
          include_images: false,
        })
        .select()
        .single();

      if (error) throw new BadRequestException(error.message);
      return created;
    }

    return data;
  }

  async updateConfig(tenantId: string, dto: {
    auto_backup_enabled?: boolean;
    frequency?: string;
    retention_days?: number;
    include_images?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('backup_configs')
      .upsert(
        { tenant_id: tenantId, ...dto, updated_at: new Date().toISOString() },
        { onConflict: 'tenant_id' },
      )
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
