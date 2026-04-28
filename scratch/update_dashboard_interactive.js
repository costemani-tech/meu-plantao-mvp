
const fs = require('fs');
const path = 'src/app/DashboardInteractive.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update EarningsPrivacyWrapper to accept onUpgradeClick
content = content.replace(
    'export function EarningsPrivacyWrapper({ total, isPro }: { total: number, isPro: boolean }) {',
    'export function EarningsPrivacyWrapper({ total, isPro, onUpgradeClick }: { total: number, isPro: boolean, onUpgradeClick?: () => void }) {'
);

// 2. Hide Olhinho if !isPro
content = content.replace(
    /if \(!mounted\) return <div style=\{\{ height: 40 \}\} \/>;[\s\S]*?return \(/,
    `if (!mounted) return <div style={{ height: 40 }} />;

  return (`
);

content = content.replace(
    /<button \s+onClick=\{toggle\}[\s\S]*?<\/button>/,
    `{isPro && (
        <button 
          onClick={toggle}
          style={{ 
            position: 'absolute',
            top: -38,
            right: 0,
            background: 'rgba(255,255,255,0.06)', 
            border: '1px solid var(--border-subtle)', 
            cursor: 'pointer', 
            color: 'var(--text-muted)', 
            padding: '6px 14px', 
            borderRadius: 20, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            fontSize: 12, 
            fontWeight: 700, 
            transition: 'all 0.2s',
            zIndex: 10
          }}
        >
          {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
          {hidden ? 'Mostrar' : 'Ocultar'}
        </button>
      )}`
);

// 3. Redesign the !isPro block in EarningsPrivacyWrapper
content = content.replace(
    /\} : \([\s\S]*?<div style=\{\{ display: 'flex', flexDirection: 'column', gap: 12 \}\}>[\s\S]*?<\/div>[\s\S]*?<\/div>\s+\)\}/,
    `} : (
        <div 
          onClick={onUpgradeClick}
          style={{ 
            background: '#f8fafc', 
            padding: '20px', 
            borderRadius: '20px', 
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          className="hover-card"
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            🔒 Disponível no Plano Pro
          </div>
          <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            📊 Veja seus ganhos extras automaticamente
          </div>
        </div>
      )}`
);

// 4. Update UpcomingShiftsClient (assuming it uses EarningsPrivacyWrapper, wait, I need to check where it's used in page.tsx)
// Looking at src/app/page.tsx, it's used in StatsSection.

fs.writeFileSync(path, content, 'utf8');
console.log('DashboardInteractive updated');
