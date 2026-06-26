import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) throw new NotFoundException('User not found');
    return data;
  }

  async updateProfile(userId: string, updates: { name?: string; avatar_url?: string }) {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getTenantUsers(tenantId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, name, email, role, email_confirmed, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async changeRole(userId: string, role: string, tenantId: string, requesterId: string) {
    const validRoles = ['store_owner', 'store_admin', 'store_manager', 'store_editor', 'store_viewer'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Rol inválido: ${role}`);
    }

    // Cannot change your own role
    if (userId === requesterId) {
      throw new ForbiddenException('No puedes cambiar tu propio rol.');
    }

    // Verify the target user belongs to the same tenant
    const { data: targetUser, error: targetError } = await this.supabase
      .from('users')
      .select('id, role, tenant_id')
      .eq('id', userId)
      .single();

    if (targetError || !targetUser) throw new NotFoundException('Usuario no encontrado');
    if (targetUser.tenant_id !== tenantId) throw new ForbiddenException('No puedes modificar usuarios de otra tienda.');

    // If changing TO store_owner, the requester must also be store_owner
    if (role === 'store_owner') {
      const { data: requester } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', requesterId)
        .single();
      if (requester?.role !== 'store_owner') {
        throw new ForbiddenException('Solo el dueño de la tienda puede asignar el rol de dueño.');
      }
    }

    const { data, error } = await this.supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Also update Supabase Auth metadata
    await this.supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    });

    return data;
  }

  async deleteUser(userId: string, tenantId: string, requesterId: string) {
    // Cannot delete yourself
    if (userId === requesterId) {
      throw new ForbiddenException('No puedes eliminarte a ti mismo.');
    }

    // Verify the target user belongs to the same tenant
    const { data: targetUser, error: targetError } = await this.supabase
      .from('users')
      .select('id, role, tenant_id')
      .eq('id', userId)
      .single();

    if (targetError || !targetUser) throw new NotFoundException('Usuario no encontrado');
    if (targetUser.tenant_id !== tenantId) throw new ForbiddenException('No puedes eliminar usuarios de otra tienda.');

    // Cannot delete a store_owner
    if (targetUser.role === 'store_owner') {
      throw new ForbiddenException('No se puede eliminar al dueño de la tienda.');
    }

    // Remove user from tenant (set tenant_id to null and role to customer)
    const { error } = await this.supabase
      .from('users')
      .update({ tenant_id: null, role: 'customer' })
      .eq('id', userId);

    if (error) throw new BadRequestException(error.message);

    // Update auth metadata
    await this.supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: 'customer', tenant_id: null },
    });

    return { message: 'Usuario removido del equipo' };
  }
}
