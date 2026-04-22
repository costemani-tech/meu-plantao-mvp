const fs = require('fs');

// Patch Escalas Page
let content = fs.readFileSync('src/app/escalas/page.tsx', 'utf-8');

content = content.replace('{preview.length > 0 ? (', '{(dataInicioSo && regraFinal && preview.length > 0) ? (');
content = content.replace("{saving ? ' Processando no servidor...' : ' Criar Escala e Gerar Plantões'}", "{saving ? ' Criando...' : ' Criar Escala'}");

const dateBlockRegex = /(<div className="form-group mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>\s*<div>\s*<label className="form-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>\s*Dia do 1º Plantão\s*<\/label>.*?<\/label>\s*<input\s*type="time"\s*className="form-input"\s*style={{ cursor: 'pointer' }}\s*value={horaInicio}\s*onChange={e => setHoraInicio\(e\.target\.value\)}\s*\/>\s*<\/div>\s*<\/div>)/s;

const dateBlockMatch = content.match(dateBlockRegex);
if (dateBlockMatch) {
    const dateBlock = dateBlockMatch[1];
    content = content.replace(dateBlock, '');
    
    const targetBlockRegex = /(<div style={{ display: 'grid', gridTemplateColumns: tipoJornada === 'Diarista' \? '1fr 1fr' : '1fr', gap: 12, marginTop: 8, alignItems: 'start' }}>)/;
    content = content.replace(targetBlockRegex, dateBlock + '\n\n          $1');
}

const localBtnRegex = /(<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>\s*<label className="form-label" style={{ margin: 0 }}>Local de Trabalho<\/label>)\s*<button.*?<\/button>\s*(<\/div>)/s;
content = content.replace(localBtnRegex, '$1$2');

const selectBlock = /(<select className="form-select" value={localId} onChange={e => setLocalId\(e\.target\.value\)}>\s*<option value="">Selecione um local\.\.\.<\/option>\s*\{locais\.map\(l => <option key=\{l\.id\} value=\{l\.id\}>\{l\.nome\}<\/option>\)\}\s*<\/select>)/;
const newBtn = '\n                <button type="button" onClick={() => setIsCreatingLocal(true)} style={{ background: "none", border: "none", color: "var(--accent-blue)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 0 0 0", display: "flex", alignItems: "center", gap: 4 }}>+ Novo local</button>';
content = content.replace(selectBlock, '$1' + newBtn);

fs.writeFileSync('src/app/escalas/page.tsx', content, 'utf-8');

// Patch Plantao Extra Page
let extraContent = fs.readFileSync('src/app/plantao-extra/page.tsx', 'utf-8');

extraContent = extraContent.replace(
    '<label className="form-label">Valor do Plantão Extra</label>',
    '{tipo === \'Remunerado\' && (<>\n            <label className="form-label">Valor do Plantão Extra</label>'
);

const valorInputRegex = /(onChange={e => setValor\(e\.target\.value\.replace\('R\$', ''\)\)}\s*\/>)/;
const newValorInput = `onChange={e => {
                  let v = e.target.value.replace(/\\D/g, '');
                  v = (parseInt(v) / 100).toFixed(2) + '';
                  v = v.replace(".", ",");
                  v = v.replace(/(\\d)(?=(\\d{3})+(?!\\d))/g, "$1.");
                  setValor(v === '0,00' ? '' : v);
                }}
              />
            </>)
            }`;
extraContent = extraContent.replace(valorInputRegex, newValorInput);

extraContent = extraContent.replace(
    "style={{ background: 'var(--accent-green)', border: 'none' }}",
    ""
);
extraContent = extraContent.replace(
    "{saving ? 'Salvando...' : 'Salvar Plantão Extra'}",
    "{saving ? 'Salvando...' : 'Salvar Plantão'}"
);

fs.writeFileSync('src/app/plantao-extra/page.tsx', extraContent, 'utf-8');

console.log("Patch applied via JS.");
