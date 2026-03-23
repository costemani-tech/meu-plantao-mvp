'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../app/globals.css';

const navItems = [
  { icon: '🏠', label: 'Mission Control', href: '/' },
  { icon: '📅', label: 'Calendário', href: '/calendario' },
  { icon: '⚙️', label: 'Escalas', href: '/escalas' },
  { icon: '➕', label: 'Plantão Extra', href: '/plantao-extra' },
  { icon: '👥', label: 'Locais', href: '/locais' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏥</div>
          <div className="sidebar-logo-text">
            Plantão<span>.pro</span>
          </div>
        </div>
        <nav className="nav-section">
          <div className="nav-label">Menu</div>
          {navItems.map((item) => (
            <Link href={item.href} key={item.href} style={{ display: 'block' }}>
              <button className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
