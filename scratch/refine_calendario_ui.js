
const fs = require('fs');
const path = 'src/app/calendario/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state for modal
content = content.replace(
    'const [showExportModal, setShowExportModal] = useState(false);',
    'const [showExportModal, setShowExportModal] = useState(false);\n  const [showUpgradeModal, setShowUpgradeModal] = useState(false);'
);

// 2. Replace alert with modal trigger
content = content.replace(
    'if (!isPro) { alert("Esta é uma funcionalidade Premium. Assine o PRO no Início para desbloquear."); return; }',
    'if (!isPro) { setShowUpgradeModal(true); return; }'
);

// 3. Add Upgrade Modal at the end
const modalHtml = `
      {showUpgradeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: -1 }} onClick={() => setShowUpgradeModal(false)} />
          <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center', borderRadius: '32px', padding: '40px 32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Meu Plantão</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24, color: '#001a41', lineHeight: 1.2 }}>💎 Leve seu controle para outro nível</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, textAlign: 'left' }}>
              {[
                { icon: '💰', title: 'Previsão Financeira', desc: 'Veja quanto vai receber no mês.' },
                { icon: '📄', title: 'Escalas Premium', desc: 'Gere PDF profissional para envio.' },
                { icon: '⚡', title: 'Controle Ilimitado', desc: 'Gestão total das suas escalas.' }
              ].map((b, i) => (
                <div key={i} style={{ background: '#eff6ff', padding: '16px', borderRadius: '16px', borderLeft: '4px solid #3b82f6', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ fontSize: 18, marginTop: 2 }}>{b.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1e3a8a' }}>{b.title}</div>
                    <div style={{ fontSize: 12, color: '#60a5fa' }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(to right, #2563eb, #1e40af)', border: 'none', borderRadius: '100px', padding: '18px', fontSize: 16, fontWeight: 900 }} onClick={() => setShowUpgradeModal(false)}>🚀 Desbloquear agora</button>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowUpgradeModal(false)}>Talvez mais tarde</button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace('</>\n  );\n}', modalHtml + '</>\n  );\n}');

fs.writeFileSync(path, content, 'utf8');
console.log('CalendarioPage refined');
