'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CustomerUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  default_address?: any;
  tenant_id: string;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, subdomain: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string, subdomain?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType>({
  customer: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateProfile: async () => {},
});

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('customer_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomer(parsed.customer);
        setToken(parsed.token);
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, subdomain: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const res = await fetch(`${apiUrl}/customers/${subdomain}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al iniciar sesión' }));
      throw new Error(err.message || 'Credenciales incorrectas');
    }
    const data = await res.json();
    setCustomer(data.customer);
    setToken(data.token);
    localStorage.setItem('customer_auth', JSON.stringify({ customer: data.customer, token: data.token }));
  };

  const register = async (email: string, password: string, name: string, phone?: string, subdomain?: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const res = await fetch(`${apiUrl}/customers/${subdomain}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, phone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al registrarse' }));
      throw new Error(err.message || 'Error al crear cuenta');
    }
    const data = await res.json();
    setCustomer(data.customer);
    setToken(data.token);
    localStorage.setItem('customer_auth', JSON.stringify({ customer: data.customer, token: data.token }));
  };

  const logout = () => {
    setCustomer(null);
    setToken(null);
    localStorage.removeItem('customer_auth');
  };

  const updateProfile = async (data: any) => {
    if (!token) throw new Error('No autenticado');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const res = await fetch(`${apiUrl}/customers/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al actualizar perfil' }));
      throw new Error(err.message || 'Error al actualizar perfil');
    }
    const updated = await res.json();
    setCustomer(updated.customer || updated);
    const saved = localStorage.getItem('customer_auth');
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.customer = updated.customer || updated;
      localStorage.setItem('customer_auth', JSON.stringify(parsed));
    }
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, token, loading, login, register, logout, updateProfile }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export const useCustomerAuth = () => useContext(CustomerAuthContext);
