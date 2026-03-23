import type { Metadata } from 'next';
import './globals.css';
import AppShell from '../components/AppShell';

export const metadata: Metadata = {
  title: 'Plantão.pro — Controle de Escalas Médicas',
  description: 'Gerencie suas escalas de plantão de forma inteligente',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
