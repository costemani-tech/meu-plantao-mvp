import re

# Patch Escalas Page
with open('src/app/escalas/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Preview display condition
# Replace: {preview.length > 0 ? (
# With: {(dataInicioSo && regraFinal && preview.length > 0) ? (
content = content.replace('{preview.length > 0 ? (', '{(dataInicioSo && regraFinal && preview.length > 0) ? (')

# 2. Update button text from "Criar Escala e Gerar Plantões" to "Criar Escala"
content = content.replace('{saving ? \' Processando no servidor...\' : \' Criar Escala e Gerar Plantões\'}', '{saving ? \' Criando...\' : \' Criar Escala\'}')

# 3. Form reordering in Escalas:
# The order should be: Local -> Tipo de Jornada -> Regra -> Datas/Horários.
# We will use regex to extract the blocks.

# Extrac block 1: Dates (Dia do 1º Plantão + Horário de Início)
date_block_regex = r'(<div className="form-group mobile-stack" style={{ display: \'grid\', gridTemplateColumns: \'1fr 1fr\', gap: 12 }}>\s*<div>\s*<label className="form-label" style={{ display: \'flex\', gap: 6, alignItems: \'center\' }}>\s*Dia do 1º Plantão\s*</label>.*?</label>\s*<input\s*type="time"\s*className="form-input"\s*style={{ cursor: \'pointer\' }}\s*value={horaInicio}\s*onChange={e => setHoraInicio\(e\.target\.value\)}\s*/>\s*</div>\s*</div>)'
date_block_match = re.search(date_block_regex, content, re.DOTALL)
if date_block_match:
    date_block = date_block_match.group(1)
    content = content.replace(date_block, '') # Remove from original place
    
    # We want to place it right before the "Escala até" block which is:
    # <div style={{ display: 'grid', gridTemplateColumns: tipoJornada === 'Diarista' ? '1fr 1fr' : '1fr', gap: 12, marginTop: 8, alignItems: 'start' }}>
    target_block_regex = r'(<div style={{ display: \'grid\', gridTemplateColumns: tipoJornada === \'Diarista\' \? \'1fr 1fr\' : \'1fr\', gap: 12, marginTop: 8, alignItems: \'start\' }}>)'
    content = re.sub(target_block_regex, date_block + '\n\n          ' + r'\1', content, 1)

# Modify Local button
local_btn_regex = r'(<div style={{ display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\', marginBottom: 6 }}>\s*<label className="form-label" style={{ margin: 0 }}>Local de Trabalho</label>)\s*<button.*?</button>\s*(</div>)'
content = re.sub(local_btn_regex, r'\1\3', content, flags=re.DOTALL)

# Add the '+ Novo local' button below the select
select_block = r'(<select className="form-select" value={localId} onChange={e => setLocalId\(e\.target\.value\)}>\s*<option value="">Selecione um local...</option>\s*\{locais\.map\(l => <option key=\{l\.id\} value=\{l\.id\}>\{l\.nome\}</option>\)\}\s*</select>)'
new_btn = r'\n                <button type="button" onClick={() => setIsCreatingLocal(true)} style={{ background: "none", border: "none", color: "var(--accent-blue)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 0 0 0", display: "flex", alignItems: "center", gap: 4 }}>+ Novo local</button>'
content = re.sub(select_block, r'\1' + new_btn, content)

with open('src/app/escalas/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Patch Plantao Extra Page
with open('src/app/plantao-extra/page.tsx', 'r', encoding='utf-8') as f:
    extra_content = f.read()

# Make "Valor" conditional and add mask
extra_content = extra_content.replace(
    '<label className="form-label">Valor do Plantão Extra</label>',
    '{tipo === \'Remunerado\' && (<>\n            <label className="form-label">Valor do Plantão Extra</label>'
)
# The input for Valor ends with: />\n          </div>
# We will use regex to find the end of the input and close the condition
valor_input_regex = r'(onChange={e => setValor\(e\.target\.value\.replace\(\'R\$\', \'\'\)\)}\s*/>)'
new_valor_input = r'''onChange={e => {
                  let v = e.target.value.replace(/\D/g, '');
                  v = (parseInt(v) / 100).toFixed(2) + '';
                  v = v.replace(".", ",");
                  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
                  setValor(v === '0,00' ? '' : v);
                }}
              />
            </>)
            }'''
extra_content = re.sub(valor_input_regex, new_valor_input, extra_content)

# Change button style
extra_content = extra_content.replace(
    'style={{ background: \'var(--accent-green)\', border: \'none\' }}',
    ''
)
extra_content = extra_content.replace(
    '{saving ? \'Salvando...\' : \'Salvar Plantão Extra\'}',
    '{saving ? \'Salvando...\' : \'Salvar Plantão\'}'
)

with open('src/app/plantao-extra/page.tsx', 'w', encoding='utf-8') as f:
    f.write(extra_content)

print("Patch applied successfully.")
