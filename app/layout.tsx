import type { Metadata } from 'next';
import './style.css';
import { themeInit } from '@/lib/dashboard-appearance';

export const metadata: Metadata = { title: 'MONITORING UNSPEC SULBAGSEL', description: 'Monitoring saldo dan performansi UNSPEC Sulbagsel' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head><body>{children}</body></html>;
}
