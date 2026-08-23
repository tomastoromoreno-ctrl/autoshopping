import { createBrowserClient } from '@supabase/ssr';

const DEFAULT_SUPABASE_URL = 'https://tghomchdukigohcmgjwv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnaG9tY2hkdWtpZ29oY21nand2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTgwMjIsImV4cCI6MjA5NzM5NDAyMn0.iD2qstk6G49kOq4ujazQc-M2QhnJAvfLJQ_EueqRpec';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  return createBrowserClient(url, anonKey);
}
