const fs = require('fs');
let content = fs.readFileSync('src/app/escalas/page.tsx', 'utf-8');

// 1. Add showForm state
if (!content.includes('const [showForm, setShowForm]')) {
    content = content.replace(
        'const [showProModal, setShowProModal] = useState(false);',
        'const [showProModal, setShowProModal] = useState(false);\n  const [showForm, setShowForm] = useState(false);'
    );
}

// 2. Change page header to include toggle button and back button
const oldHeader = /<div className="page-header">\s*<h1>Configurar Escala <\/h1>\s*<p>Configure a sua jornada, datas e locais de trabalho<\/p>\s*<\/div>/;
const newHeader = `<div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Escalas</h1>
          <p>Gerencie suas jornadas e datas de trabalho</p>
        </div>
        {!showForm && (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(true)}
            style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span style={{ fontSize: 16 }}>+</span> Nova Escala
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ marginBottom: 32, animation: 'fadeIn 0.3s ease' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowForm(false)}
            style={{ marginBottom: 16, border: 'none', background: 'transparent', padding: 0, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            ← Voltar para lista
          </button>`;
content = content.replace(oldHeader, newHeader);

// 3. Close the showForm div after the form grid
const endFormRegex = /(<div className="empty-state" style={{ padding: 32 }}>.*?<\/div>\s*)\}\s*<\/div>\s*<\/div>\s*<\/div>/s;
content = content.replace(endFormRegex, '$1}\n          </div>\n        </div>\n      </div>\n      </div>\n      )}');

// 4. Hide "Minhas Escalas Ativas" when showForm is true
const activeScalesRegex = /(\{\/\* ══════════════════════════════════════════\s*SEÇÃO: Minhas Escalas Ativas\s*══════════════════════════════════════════ \*\/\}\s*)\{escalasAtivas\.length > 0 && \(/s;
content = content.replace(activeScalesRegex, '$1{!showForm && escalasAtivas.length > 0 && (');

fs.writeFileSync('src/app/escalas/page.tsx', content, 'utf-8');

console.log('Patch Escalas completed.');
