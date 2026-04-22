const fs = require('fs');
let content = fs.readFileSync('src/app/plantao-extra/page.tsx', 'utf-8');

content = content.replace(
  "Cadastre seus plantões para controle financeiro.",
  "Adicione plantões extras e acompanhe seus ganhos"
);
content = content.replace(
  "color: isPro ? '#059669' : '#d97706'",
  "color: isPro ? 'var(--text-secondary)' : '#d97706'"
);

const oldValorInput = /<input\s*type="number"\s*className="form-input"\s*placeholder="Ex: 1200\.00"\s*value=\{valorGanho\}\s*onChange=\{e => setValorGanho\(e\.target\.value\)\}\s*\/>/;
const newValorInput = `<input
                    type="text"
                    className="form-input"
                    placeholder="Ex: R$ 1.200,00"
                    value={valorGanho}
                    onChange={e => {
                      let v = e.target.value.replace(/\\D/g, '');
                      if (!v) { setValorGanho(''); return; }
                      v = (parseInt(v) / 100).toFixed(2) + '';
                      v = v.replace(".", ",");
                      v = v.replace(/(\\d)(?=(\\d{3})+(?!\\d))/g, "$1.");
                      setValorGanho(v === '0,00' ? '' : 'R$ ' + v);
                    }}
                  />`;
content = content.replace(oldValorInput, newValorInput);

content = content.replace(
  "background: 'var(--accent-teal)'",
  "background: 'var(--accent-blue)'"
);

content = content.replace(
  "{saving ? ' Inserindo no calendário...' : ' Salvar Plantão Avulso'}",
  "{saving ? ' Salvando...' : ' Salvar Plantão'}"
);

fs.writeFileSync('src/app/plantao-extra/page.tsx', content, 'utf-8');
console.log('Patch Plantão Extra completed.');
