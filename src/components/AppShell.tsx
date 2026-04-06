'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { LayoutDashboard, CalendarDays, Settings2, PlusCircle, LogOut, Sun, Moon, Activity, Bell } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Central de Plantões', href: '/' },
  { icon: CalendarDays, label: 'Calendário', href: '/calendario' },
  { icon: Settings2, label: 'Escalas', href: '/escalas' },
  { icon: PlusCircle, label: 'Plantão Extra', href: '/plantao-extra' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<{titulo: string, mensagem: string} | null>(null);
  const [overCapacity, setOverCapacity] = useState(false);

  const isPro = false; // Trava Central do Freemium

  useEffect(() => {
    let currentUser: { id: string } | null = null;

    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      currentUser = user;
      
      const { count } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id)
        .eq('lida', false);
      setUnreadCount(count || 0);
    };
    
    // So pesquisa silenciosa e websocket se não for tela de login externa
    if (pathname !== '/login') {
      fetchUnread();
      const channel = supabase
        .channel('realtime-notis')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notificacoes' }, (payload) => {
          fetchUnread(); // Atualiza contador na hora se mudou la no Postgres
          
          if (payload.eventType === 'INSERT' && currentUser && payload.new.usuario_id === currentUser.id) {
            // Toca um beep suave nativo do navegador!
            try {
              const AudioContext = window.AudioContext || (window as Window & { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.5);
            } catch (e) {
              console.log('Audio error:', e);
            }

            // Exibe o Toast visual top down
            setToast({ titulo: payload.new.titulo, mensagem: payload.new.mensagem });
            setTimeout(() => setToast(null), 5000);
          }
        })
        .subscribe();
      
      const checkCapacity = async () => {
        if (!isPro && pathname !== '/login' && pathname !== '/locais') {
          const { count } = await supabase.from('locais_trabalho').select('*', { count: 'exact', head: true });
          setOverCapacity(count !== null && count > 2);
        } else {
          setOverCapacity(false);
        }
      };

      checkCapacity();

      return () => { supabase.removeChannel(channel); };
    }
  }, [pathname, isPro]);


  useEffect(() => {
    const saved = localStorage.getItem('plantao-theme');
    if (saved === 'dark') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('plantao-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Activity color="white" size={24} />
          </div>
          <div className="sidebar-logo-text">
            Meu <span>Plantão</span>
          </div>
        </div>
        <nav className="nav-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="nav-label">Menu</div>
          <div className="nav-links" style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  href={item.href} 
                  key={item.href} 
                  className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                  style={{ width: '100%', textDecoration: 'none' }}
                >
                  <Icon className="nav-icon" size={20} />
                  {item.label}
                </Link>
              );
            })}
            
            {/* Desktop spacer to push buttons to bottom */}
            <div className="desktop-spacer" style={{ flex: 1 }} />
            
            <button onClick={toggleTheme} className="nav-item" style={{ marginBottom: 8 }}>
              {theme === 'light' ? <Moon className="nav-icon" size={20} /> : <Sun className="nav-icon" size={20} />}
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </button>

            <button onClick={handleLogout} className="nav-item logout-btn" style={{ color: '#EF4444' }}>
              <LogOut className="nav-icon" size={20} />
              Sair
            </button>
          </div>
        </nav>
      </aside>
      <main className="main-content" style={{ position: 'relative' }}>
        {pathname !== '/login' && (
          <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 50, display: 'flex', gap: 12 }}>
            <button 
              onClick={toggleTheme} 
              className="mobile-only"
              style={{
                background: 'var(--bg-secondary)', padding: 10, borderRadius: '50%',
                boxShadow: 'var(--shadow-sm)', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', cursor: 'pointer',
                transition: 'all 0.2s', width: 44, height: 44
              }}
              title="Trocar Tema"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <Link href="/notificacoes" style={{
              background: 'var(--bg-secondary)', padding: 10, borderRadius: '50%',
              boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', transition: 'all 0.2s',
              cursor: 'pointer', width: 44, height: 44
            }}
            >
              <div style={{ position: 'relative', display: 'flex' }}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="bell-badge" style={{ 
                    position: 'absolute', top: -4, right: -4, 
                    background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 800, 
                    borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--bg-secondary)', transition: 'transform 0.2s'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* TOAST FLUTUANTE DE NOTIFICAÇÃO REALTIME */}
        {toast && (
          <div style={{
            position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
            background: 'var(--bg-secondary)', padding: '16px 24px', borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-float)', display: 'flex', alignItems: 'center', gap: 16,
            borderLeft: '4px solid var(--accent-blue)', minWidth: 320
          }}>
            <div style={{ width: 40, height: 40, background: 'var(--accent-blue-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={20} color="var(--accent-blue)" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{toast.titulo}</h4>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{toast.mensagem}</p>
            </div>
          </div>
        )}

        {/* Global Block Screen: Over Capacity na versão Free */}
        {overCapacity ? (
          <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ maxWidth: 440, width: '100%', textAlign: 'center', borderColor: '#EF4444' }}>
              <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>⚠️</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Conta Bloqueada</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
                Seu plano Pro expirou e você possui <strong>mais de 2 hospitais</strong> configurados na sua conta. <br/><br/>
                Para voltar a visualizar seu Calendário e gerenciar escalas, você precisa ir até a aba de <strong>Locais</strong> e deletar os excedentes, ou assinar a versão Premium novamente.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                  onClick={() => {}}
                >
                  ⭐ Assinar Versão Pro
                </button>
                <Link 
                  href="/locais" 
                  style={{ textDecoration: 'none' }}
                  className="btn btn-secondary"
                >
                  <div style={{ width: '100%', textAlign: 'center' }}>Gerenciar e Excluir Locais</div>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Navegação Mobile Inferior - Exclusiva para Celulares */}
      {pathname !== '/login' && (
        <nav className="mobile-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Simplificando textos compridos para caber no rodapé do celular
            let shortLabel = item.label;
            if (item.label === 'Central de Plantões') shortLabel = 'Início';
            if (item.label === 'Plantão Extra') shortLabel = 'Extra';
            
            return (
              <Link
                href={item.href}
                key={item.href}
                className={`mobile-nav-item ${pathname === item.href ? 'active' : ''}`}
                title={item.label}
              >
                <Icon className="nav-icon" size={24} strokeWidth={pathname === item.href ? 2.5 : 2} />
                <span>{shortLabel}</span>
              </Link>
            );
          })}
          
          {/* Logout Mobile */}
          <button
            onClick={handleLogout}
            className="mobile-nav-item logout-btn-mobile"
            title="Sair"
            style={{ background: 'none', border: 'none', color: '#EF4444', outline: 'none' }}
          >
            <LogOut className="nav-icon" size={24} strokeWidth={2} color="#EF4444" />
            <span style={{ color: '#EF4444' }}>Sair</span>
          </button>
        </nav>
      )}
    </div>
  );
}
