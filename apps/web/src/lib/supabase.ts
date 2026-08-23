import { createBrowserClient } from '@supabase/ssr';

const DEFAULT_SUPABASE_URL = 'https://tghomchdukigohcmgjwv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnaG9tY2hkdWtpZ29oY21nand2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTgwMjIsImV4cCI6MjA5NzM5NDAyMn0.iD2qstk6G49kOq4ujazQc-M2QhnJAvfLJQ_EueqRpec';

function getValidUrl(urlStr?: string): string {
  if (!urlStr || typeof urlStr !== 'string' || !urlStr.trim().startsWith('http')) {
    return DEFAULT_SUPABASE_URL;
  }
  return urlStr.trim();
}

function getValidKey(keyStr?: string): string {
  if (!keyStr || typeof keyStr !== 'string' || keyStr.trim().length < 20) {
    return DEFAULT_SUPABASE_ANON_KEY;
  }
  return keyStr.trim();
}

export function createClient() {
  const url = getValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = getValidKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return createBrowserClient(url, anonKey);
}
