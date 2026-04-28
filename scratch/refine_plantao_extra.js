
const fs = require('fs');
const path = 'src/app/plantao-extra/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state for modal in PlantaoExtraPage (to keep it simple and self-contained)
content = content.replace(
    'const [limiteExtrasAtingido, setLimiteExtrasAtingido] = useState(false);',
    'const [limiteExtrasAtingido, setLimiteExtrasAtingido] = useState(false);\n  const [showUpgradeModal, setShowUpgradeModal] = useState(false);'
);

// 2. Redesign Valor do Plantão (R$) field
const oldField = `<div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label">Valor do Plantão (R$)</label>
            <input
              type="text"
              inputMode="numeric"
              className="form-input"
              placeholder={isPro ? "Ex: R$ 1.200,00" : "🔒 Bloqueado (Pro)"}
              value={isPro ? valorGanho : ""}
              onChange={e => {
                let v = e.target.value.replace(/\\D/g, '');
                if (!v) { setValorGanho(''); return; }
                
                const value = parseInt(v) / 100;
                const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
                setValorGanho(formatter.format(value));
              }}
              disabled={!isPro || tipoExtra === 'Troca'}
              style={{ opacity: (!isPro || tipoExtra === 'Troca') ? 0.6 : 1, cursor: (!isPro || tipoExtra === 'Troca') ? 'not-allowed' : 'text' }}
            />
          </div>`;

const newField = `{isPro ? (
            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label">Valor do Plantão (R$)</label>
              <input
                type="text"
                inputMode="numeric"
                className="form-input"
                placeholder="Ex: R$ 1.200,00"
                value={valorGanho}
                onChange={e => {
                  let v = e.target.value.replace(/\\D/g, '');
                  if (!v) { setValorGanho(''); return; }
                  const value = parseInt(v) / 100;
                  const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
                  setValorGanho(formatter.format(value));
                }}
                disabled={tipoExtra === 'Troca'}
                style={{ opacity: tipoExtra === 'Troca' ? 0.6 : 1, cursor: tipoExtra === 'Troca' ? 'not-allowed' : 'text' }}
              />
            </div>
          ) : (
            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label">Valor do Plantão (R$)</label>
              <div 
                onClick={() => setShowUpgradeModal(true)}
                style={{ 
                  background: '#f8fafc', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                className="hover-card"
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  🔒 Disponível no Plano Pro
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  📊 Veja seus ganhos extras automaticamente
                </div>
              </div>
            </div>
          )}`;

content = content.replace(oldField, newField);

// 3. Remove the orange alert and replace with the modal trigger
content = content.replace(
    /\{!isPro && \([\s\S]*?Assinar Agora[\s\S]*?<\/a>\s+<\/div>\s+\)\}/,
    ''
);

// 4. Add the Upgrade Modal at the end of the return
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
console.log('PlantaoExtra updated');
