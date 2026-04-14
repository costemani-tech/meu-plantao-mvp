import type { Metadata } from 'next';
import './globals.css';
import AppShell from '../components/AppShell';

export const metadata: Metadata = {
  title: 'Meu Plantão — Controle de Escalas Médicas',
  description: 'Gerencie suas escalas de plantão de forma inteligente',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#1a1e2d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* OneSignal Web Push */}
        <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              OneSignalDeferred.push(async function(OneSignal) {
                await OneSignal.init({
                  appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'SUA_CHAVE_ONESIGNAL'}",
                  notifyButton: { enable: false },
                  allowLocalhostAsSecureOrigin: true
                });
                
                // Solicita permissão de notificação nativa no primeiro acesso
                if (typeof OneSignal.Slidedown !== 'undefined') {
                   OneSignal.Slidedown.promptPush();
                } else if (typeof OneSignal.promptForPushNotificationsWithUserResponse !== 'undefined') {
                   OneSignal.promptForPushNotificationsWithUserResponse();
                }
              });
            `
          }}
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
