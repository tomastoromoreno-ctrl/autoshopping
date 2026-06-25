import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

// Default permissions for each role
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  store_owner: [
    'products.read', 'products.write', 'products.delete',
    'orders.read', 'orders.write', 'orders.update_status',
    'categories.read', 'categories.write',
    'analytics.read',
    'invoicing.read', 'invoicing.generate',
    'config.read', 'config.write',
    'users.read', 'users.write', 'users.delete',
    'appearance.read', 'appearance.write',
    'blog.read', 'blog.write',
    'promotions.read', 'promotions.write',
    'banners.read', 'banners.write',
    'domain.read', 'domain.write',
    'legal.read', 'legal.write',
    'backups.read', 'backups.write',
  ],
  store_admin: [
    'products.read', 'products.write', 'products.delete',
    'orders.read', 'orders.write', 'orders.update_status',
    'categories.read', 'categories.write',
    'analytics.read',
    'invoicing.read',
    'config.read',
    'users.read', 'users.write',
    'appearance.read', 'appearance.write',
    'blog.read', 'blog.write',
    'promotions.read', 'promotions.write',
    'banners.read', 'banners.write',
    'domain.read',
    'legal.read', 'legal.write',
    'backups.read',
  ],
  store_manager: [
    'products.read', 'products.write',
    'orders.read', 'orders.write', 'orders.update_status',
    'categories.read', 'categories.write',
    'analytics.read',
    'invoicing.read',
    'blog.read', 'blog.write',
    'promotions.read', 'promotions.write',
    'banners.read', 'banners.write',
    'legal.read',
    'backups.read',
  ],
  store_editor: [
    'products.read', 'products.write',
    'categories.read',
    'blog.read', 'blog.write',
    'banners.read', 'banners.write',
    'promotions.read',
  ],
  store_viewer: [
    'products.read',
    'orders.read',
    'categories.read',
    'analytics.read',
    'invoicing.read',
    'blog.read',
    'promotions.read',
    'banners.read',
  ],
};

const ALL_PERMISSIONS = [
  'products.read', 'products.write', 'products.delete',
  'orders.read', 'orders.write', 'orders.update_status',
  'categories.read', 'categories.write',
  'analytics.read',
  'invoicing.read', 'invoicing.generate',
  'config.read', 'config.write',
  'users.read', 'users.write', 'users.delete',
  'appearance.read', 'appearance.write',
  'blog.read', 'blog.write',
  'promotions.read', 'promotions.write',
  'banners.read', 'banners.write',
  'domain.read', 'domain.write',
  'legal.read', 'legal.write',
  'backups.read', 'backups.write',
];

const ROLE_LABELS: Record<string, string> = {
  store_owner: 'Dueño de la tienda',
  store_admin: 'Administrador',
  store_manager: 'Gerente',
  store_editor: 'Editor',
  store_viewer: 'Visualizador',
};

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getRoles(tenantId: string) {
    // Get custom permissions from DB
    const { data: customPerms } = await this.supabase
      .from('role_permissions')
      .select('*')
      .eq('tenant_id', tenantId);

    const roles = Object.keys(DEFAULT_ROLE_PERMISSIONS).map((role) => {
      const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role];
      const permissions: Record<string, boolean> = {};

      ALL_PERMISSIONS.forEach((perm) => {
        // Check if there's a custom override
        const custom = (customPerms || []).find(
          (cp) => cp.role === role && cp.permission === perm,
        );
        if (custom !== undefined) {
          permissions[perm] = custom.granted;
        } else {
          permissions[perm] = defaultPerms.includes(perm);
        }
      });

      return {
        role,
        label: ROLE_LABELS[role],
        permissions,
      };
    });

    return { roles, allPermissions: ALL_PERMISSIONS };
  }

  async getMyPermissions(tenantId: string, userRole: string) {
    const { data: customPerms } = await this.supabase
      .from('role_permissions')
      .select('permission, granted')
      .eq('tenant_id', tenantId)
      .eq('role', userRole);

    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[userRole] || [];
    const permissions: string[] = [];

    ALL_PERMISSIONS.forEach((perm) => {
      const custom = (customPerms || []).find((cp) => cp.permission === perm);
      if (custom !== undefined) {
        if (custom.granted) permissions.push(perm);
      } else if (defaultPerms.includes(perm)) {
        permissions.push(perm);
      }
    });

    return { role: userRole, permissions };
  }

  async updateRolePermissions(
    tenantId: string,
    role: string,
    permissions: Record<string, boolean>,
  ) {
    if (!DEFAULT_ROLE_PERMISSIONS[role]) {
      throw new BadRequestException(`Rol inválido: ${role}`);
    }

    // Upsert each permission
    const upserts = Object.entries(permissions).map(([permission, granted]) => ({
      tenant_id: tenantId,
      role,
      permission,
      granted,
    }));

    const { error } = await this.supabase
      .from('role_permissions')
      .upsert(upserts, { onConflict: 'tenant_id,role,permission' });

    if (error) throw new BadRequestException(error.message);

    return this.getRoles(tenantId);
  }

  async resetRolePermissions(tenantId: string) {
    const { error } = await this.supabase
      .from('role_permissions')
      .delete()
      .eq('tenant_id', tenantId);

    if (error) throw new BadRequestException(error.message);

    return this.getRoles(tenantId);
  }

  /**
   * Check if a user has a specific permission (used by PermissionsGuard)
   */
  async hasPermission(tenantId: string, userRole: string, permission: string): Promise<boolean> {
    // store_owner always has all permissions
    if (userRole === 'store_owner') return true;

    const { data: custom } = await this.supabase
      .from('role_permissions')
      .select('granted')
      .eq('tenant_id', tenantId)
      .eq('role', userRole)
      .eq('permission', permission)
      .maybeSingle();

    if (custom) return custom.granted;

    // Fall back to defaults
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[userRole] || [];
    return defaultPerms.includes(permission);
  }
}
