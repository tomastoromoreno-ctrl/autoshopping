import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const VALID_INVITE_ROLES = ['store_admin', 'store_manager', 'store_editor', 'store_viewer'];

@Injectable()
export class UserInvitationsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  /**
   * Create a new invitation for a user to join a tenant with a specific role
   */
  async createInvitation(tenantId: string, email: string, role: string, invitedByUserId: string) {
    // Validate role
    if (!VALID_INVITE_ROLES.includes(role)) {
      throw new BadRequestException(`Rol inválido: ${role}. Roles permitidos: ${VALID_INVITE_ROLES.join(', ')}`);
    }

    // Check if the email already belongs to a user in this tenant
    const { data: existingUser } = await this.supabase
      .from('users')
      .select('id, role, tenant_id')
      .eq('email', email)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (existingUser) {
      throw new BadRequestException('Este usuario ya pertenece a tu equipo.');
    }

    // Expire any existing pending invitations for this email+tenant
    await this.supabase
      .from('team_invitations')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending');

    // Generate unique token
    const token = randomBytes(32).toString('hex');

    // Calculate expiration (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await this.supabase
      .from('team_invitations')
      .insert({
        tenant_id: tenantId,
        email: email.toLowerCase(),
        role,
        token,
        invited_by: invitedByUserId,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select('id, email, role, token, status, expires_at, created_at')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /**
   * List all invitations for a tenant
   */
  async listInvitations(tenantId: string) {
    // First, expire old invitations
    await this.supabase
      .from('team_invitations')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    const { data, error } = await this.supabase
      .from('team_invitations')
      .select('id, email, role, status, expires_at, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  /**
   * Get invitation details by token (public - no auth needed)
   */
  async getInvitationByToken(token: string) {
    const { data, error } = await this.supabase
      .from('team_invitations')
      .select('id, email, role, status, expires_at, tenant_id, tenants(name)')
      .eq('token', token)
      .maybeSingle();

    if (error || !data) throw new NotFoundException('Invitación no encontrada');

    // Check if expired
    if (data.status === 'pending' && new Date(data.expires_at) < new Date()) {
      await this.supabase
        .from('team_invitations')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', data.id);
      throw new BadRequestException('Esta invitación ha expirado.');
    }

    if (data.status !== 'pending') {
      throw new BadRequestException(`Esta invitación ya fue ${data.status === 'accepted' ? 'aceptada' : data.status === 'revoked' ? 'revocada' : 'procesada'}.`);
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role,
      tenant_name: (data as any).tenants?.name || 'Tienda',
      expires_at: data.expires_at,
    };
  }

  /**
   * Accept an invitation — assigns the user to the tenant with the invited role
   */
  async acceptInvitation(token: string, userId: string, userEmail: string) {
    const { data: invitation, error } = await this.supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error || !invitation) throw new NotFoundException('Invitación no encontrada');

    if (invitation.status !== 'pending') {
      throw new BadRequestException('Esta invitación ya no es válida.');
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await this.supabase
        .from('team_invitations')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', invitation.id);
      throw new BadRequestException('Esta invitación ha expirado.');
    }

    // Verify the email matches (case-insensitive)
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new BadRequestException('Esta invitación fue enviada a otro correo electrónico.');
    }

    // Check if user already belongs to a tenant
    const { data: existingUser } = await this.supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', userId)
      .single();

    if (existingUser?.tenant_id) {
      throw new BadRequestException('Ya perteneces a una tienda. Debes salir de ella primero antes de aceptar una invitación.');
    }

    // Assign user to tenant with the invited role
    const { error: updateError } = await this.supabase
      .from('users')
      .update({
        tenant_id: invitation.tenant_id,
        role: invitation.role,
      })
      .eq('id', userId);

    if (updateError) throw new BadRequestException(updateError.message);

    // Update Supabase Auth metadata so JWT contains the new tenant_id and role
    await this.supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        role: invitation.role,
        tenant_id: invitation.tenant_id,
      },
    });

    // Mark invitation as accepted
    await this.supabase
      .from('team_invitations')
      .update({
        status: 'accepted',
        accepted_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    return { message: 'Invitación aceptada exitosamente', role: invitation.role, tenant_id: invitation.tenant_id };
  }

  /**
   * Revoke a pending invitation
   */
  async revokeInvitation(invitationId: string, tenantId: string) {
    const { data, error } = await this.supabase
      .from('team_invitations')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', invitationId)
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Invitación no encontrada o ya no está pendiente');
    return { message: 'Invitación revocada' };
  }
}
