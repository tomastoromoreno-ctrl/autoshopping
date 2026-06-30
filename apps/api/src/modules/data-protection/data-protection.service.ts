import { Injectable, Inject, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DataProtectionService {
  private readonly logger = new Logger(DataProtectionService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  // ==================== PROCESSING ACTIVITIES ====================
  async listActivities(tenantId: string) {
    const { data, error } = await this.supabase
      .from('processing_activities')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async createActivity(tenantId: string, dto: any) {
    const { data, error } = await this.supabase
      .from('processing_activities')
      .insert({ ...dto, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateActivity(id: string, tenantId: string, dto: any) {
    const { data, error } = await this.supabase
      .from('processing_activities')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Actividad no encontrada');
    return data;
  }

  async deleteActivity(id: string, tenantId: string) {
    const { error } = await this.supabase
      .from('processing_activities')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Actividad eliminada' };
  }

  // ==================== DATA BREACHES ====================
  async listBreaches(tenantId: string) {
    const { data, error } = await this.supabase
      .from('data_breaches')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('detected_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async createBreach(tenantId: string, dto: any) {
    const { data, error } = await this.supabase
      .from('data_breaches')
      .insert({ ...dto, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateBreach(id: string, tenantId: string, dto: any) {
    const { data, error } = await this.supabase
      .from('data_breaches')
      .update(dto)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Brecha no encontrada');
    return data;
  }

  async getBreach(id: string, tenantId: string) {
    const { data, error } = await this.supabase
      .from('data_breaches')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();
    if (error || !data) throw new NotFoundException('Brecha no encontrada');
    return data;
  }

  // ==================== DPO ====================
  async getDpo(tenantId: string) {
    const { data, error } = await this.supabase
      .from('data_protection_officers')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return data || null;
  }

  async upsertDpo(tenantId: string, dto: any) {
    const existing = await this.getDpo(tenantId);
    if (existing) {
      const { data, error } = await this.supabase
        .from('data_protection_officers')
        .update(dto)
        .eq('tenant_id', tenantId)
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }
    const { data, error } = await this.supabase
      .from('data_protection_officers')
      .insert({ ...dto, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteDpo(tenantId: string) {
    const { error } = await this.supabase
      .from('data_protection_officers')
      .delete()
      .eq('tenant_id', tenantId);
    if (error) throw new BadRequestException(error.message);
    return { message: 'DPO eliminado' };
  }

  // ==================== PROCESSOR CONTRACTS ====================
  async listProcessors(tenantId: string) {
    const { data, error } = await this.supabase
      .from('data_processor_contracts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async createProcessor(tenantId: string, dto: any) {
    const { data, error } = await this.supabase
      .from('data_processor_contracts')
      .insert({ ...dto, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateProcessor(id: string, tenantId: string, dto: any) {
    const { data, error } = await this.supabase
      .from('data_processor_contracts')
      .update(dto)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Contrato no encontrado');
    return data;
  }

  async deleteProcessor(id: string, tenantId: string) {
    const { error } = await this.supabase
      .from('data_processor_contracts')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Contrato eliminado' };
  }

  // ==================== DPIA ====================
  async completeDpia(tenantId: string, dto: { processing_activity_id: string; risks: string; mitigation: string; result: string }) {
    const { data, error } = await this.supabase
      .from('processing_activities')
      .update({
        dpia_risks: dto.risks,
        dpia_mitigation: dto.mitigation,
        dpia_result: dto.result,
        dpia_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', dto.processing_activity_id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Actividad no encontrada');
    return data;
  }
}
