const fs = require('fs');

// PATCH PLANTAO EXTRA
let extraContent = fs.readFileSync('src/app/plantao-extra/page.tsx', 'utf-8');
extraContent = extraContent.replace(/Local de Trabalho \*/g, 'Local de Trabalho');
extraContent = extraContent.replace(/Data do Plantão \*/g, 'Data do Plantão');
extraContent = extraContent.replace(/Hora Início \*/g, 'Hora Início');
extraContent = extraContent.replace(/Hora Fim \*/g, 'Hora Fim');
extraContent = extraContent.replace(/Tipo de Plantão Extra \*/g, 'Tipo de Plantão Extra');
fs.writeFileSync('src/app/plantao-extra/page.tsx', extraContent, 'utf-8');

// PATCH ESCALAS
let escalasContent = fs.readFileSync('src/app/escalas/page.tsx', 'utf-8');

// Header changes
escalasContent = escalasContent.replace(
  '<p>Gerencie suas jornadas e datas de trabalho</p>',
  '<p>Organize seus plantões de forma simples</p>'
);
escalasContent = escalasContent.replace(
  '<span style={{ fontSize: 16 }}>+</span> Nova Escala',
  '<span style={{ fontSize: 16 }}>+</span> Criar Escala'
);

// Cancel button in form
const saveButtonRegex = /(<button\s*className="btn btn-primary"\s*style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}\s*onClick=\{\(\) => salvarEscala\(\)\}\s*disabled=\{saving[^\}]+\}\s*>\s*\{saving \? ' Criando\.\.\.' : ' Criar Escala'\}\s*<\/button>)/s;

const newButtons = `<div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => salvarEscala()}
              disabled={saving || (isCustomRule && (!(parseInt(horasTrabalhoOutro,10) > 0) || !(parseInt(horasDescansoOutro,10) > 0)))}
            >
              {saving ? ' Criando...' : ' Criar Escala'}
            </button>
          </div>`;

escalasContent = escalasContent.replace(saveButtonRegex, newButtons);


// Refactor Active Scales and add Empty State
const activeScalesRegex = /\{\!\s*showForm\s*&&\s*escalasAtivas\.length\s*>\s*0\s*&&\s*\(\s*<div style=\{\{ marginTop: 32 \}\}>\s*<h2 style=\{\{ fontWeight: 700, fontSize: 16, marginBottom: 16 \}\}> Minhas Escalas Ativas<\/h2>\s*<div style=\{\{ display: 'flex', flexDirection: 'column', gap: 10 \}\}>.*?(<\/div>\s*<\/div>\s*\)\})/s;

const newActiveScales = `{!showForm && (
        <div style={{ marginTop: 32 }}>
          {escalasAtivas.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-icon">📅</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Você ainda não tem escalas</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Crie sua primeira escala para automatizar sua agenda.</p>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Criar primeira escala</button>
            </div>
          ) : (
            <>
              <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--text-primary)' }}> Minhas Escalas Ativas</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {escalasAtivas.map(e => {
                  const p = e.plantoes?.[0];
                  let horaFinalFormatada = '--:--';
                  let horaInicialFormatada = '--:--';
                  let proximoPlantaoStr = 'Sem plantões futuros';
                  
                  if (p) {
                    horaInicialFormatada = new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    horaFinalFormatada = new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    proximoPlantaoStr = \`Próximo: \${new Date(p.data_hora_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às \${horaInicialFormatada}\`;
                  }
                  
                  return (
                    <div 
                      key={e.id} 
                      className="card" 
                      style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}
                      onClick={() => setMenuEscalaId(menuEscalaId === e.id ? null : e.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: e.local?.cor_calendario ?? '#4f8ef7', flexShrink: 0, boxShadow: '0 0 0 2px var(--bg-primary)' }} />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{e.local?.nome ?? 'Local desconhecido'}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 600 }}>{e.regra}</span>
                              <span style={{ opacity: 0.5 }}>|</span>
                              <span>{horaInicialFormatada} → {horaFinalFormatada}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ padding: '4px 8px', borderRadius: 12, background: 'rgba(34,197,94,0.1)', color: 'var(--accent-green)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}/> Ativa
                          </div>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); setMenuEscalaId(menuEscalaId === e.id ? null : e.id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)', padding: '4px' }}
                            title="Opções da escala"
                          >⋮</button>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px dashed var(--border-subtle)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Início: <strong style={{ color: 'var(--text-secondary)' }}>{new Date(e.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-blue)', background: 'rgba(37,99,235,0.05)', padding: '4px 8px', borderRadius: 6 }}>
                          {proximoPlantaoStr}
                        </div>
                      </div>

                      {menuEscalaId === e.id && (
                        <div style={{ position: 'absolute', right: 16, top: 48, zIndex: 100, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 180, overflow: 'hidden' }} onClick={ev => ev.stopPropagation()}>
                          <button
                            onClick={() => { setMenuEscalaId(null); showToast('Edição em breve.', 'info'); }}
                            style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                          >✏️ Editar Escala</button>
                          <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
                          <button
                            onClick={() => { setMenuEscalaId(null); setModalAlertas(e); }}
                            style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                          >🔔 Configurar Alertas</button>
                          <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
                          <button
                            onClick={() => { setModalEncerrar({ id: e.id, nome: e.local?.nome ?? 'Escala' }); setMenuEscalaId(null); }}
                            style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#f59e0b', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                          >⏸ Pausar / Encerrar</button>
                          <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
                          <button
                            onClick={() => { if (confirm('Tem certeza? Isso apagará TODOS os plantões desta escala, incluindo os passados.')) excluirEscala(e.id, 'completo'); }}
                            style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#ef4444', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                          >🗑 Excluir Escala</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}`;

escalasContent = escalasContent.replace(activeScalesRegex, newActiveScales);

fs.writeFileSync('src/app/escalas/page.tsx', escalasContent, 'utf-8');

console.log('Patch UX Premium completed.');
