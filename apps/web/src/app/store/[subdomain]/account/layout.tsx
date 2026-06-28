import { CustomerAuthProvider } from '@/contexts/CustomerAuthContext';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <CustomerAuthProvider>{children}</CustomerAuthProvider>;
}
