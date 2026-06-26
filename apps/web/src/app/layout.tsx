import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n-context';
import I18nWrapper from '@/components/I18nWrapper';

export const metadata: Metadata = {
  title: 'AutoShopping - Tu tienda online',
  description: 'Crea tu tienda online con AutoShopping',
  manifest: '/manifest.webmanifest',
  other: { 'mobile-web-app-capable': 'yes' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AutoShopping" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="font-sans antialiased">
        <I18nProvider>
          <I18nWrapper>
            {children}
          </I18nWrapper>
        </I18nProvider>
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`,
        }} />
      </body>
    </html>
  );
}
