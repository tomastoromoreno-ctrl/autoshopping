'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase';

interface PermissionsData {
  role: string;
  permissions: string[];
}

/**
 * Hook to load and check the current user's permissions.
 * Caches permissions for the duration of the session.
 */

export function usePermissions() {
  const [data, setData] = useState<PermissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function loadPermissions() {
      const cached = sessionStorage.getItem('user_permissions');
      if (cached) {
        try {
          setData(JSON.parse(cached));
          setLoading(false);
          return;
        } catch {}
      }

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const role = user.user_metadata?.role || 'store_owner';
          const permData = { role, permissions: ['*'] };
          setData(permData);
          sessionStorage.setItem('user_permissions', JSON.stringify(permData));
          setLoading(false);
          return;
        }
      } catch {}

      api.get<PermissionsData>('/permissions/my')
        .then((res) => {
          setData(res);
          sessionStorage.setItem('user_permissions', JSON.stringify(res));
        })
        .catch(() => {
          setData({ role: 'store_owner', permissions: ['*'] });
        })
        .finally(() => setLoading(false));
    }

    loadPermissions();
  }, []);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!data) return false;
      // store_owner has all permissions
      if (data.role === 'store_owner') return true;
      // wildcard permission
      if (data.permissions.includes('*')) return true;
      return data.permissions.includes(permission);
    },
    [data],
  );

  const hasAnyPermission = useCallback(
    (...perms: string[]): boolean => {
      if (!data) return false;
      if (data.role === 'store_owner') return true;
      if (data.permissions.includes('*')) return true;
      return perms.some((p) => data.permissions.includes(p));
    },
    [data],
  );

  const refreshPermissions = useCallback(async () => {
    try {
      const res = await api.get<PermissionsData>('/permissions/my');
      setData(res);
      sessionStorage.setItem('user_permissions', JSON.stringify(res));
    } catch {}
  }, []);

  return {
    role: data?.role || '',
    permissions: data?.permissions || [],
    loading,
    hasPermission,
    hasAnyPermission,
    refreshPermissions,
  };
}
