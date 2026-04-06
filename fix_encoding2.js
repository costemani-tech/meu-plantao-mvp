const fs = require('fs');
const path = require('path');

function remove_emojis(text) {
    const emojis = ['🗓️', '⚙️', '💸', '⚡', '📋', '🚀', '⏰', '🔄', '🗑️', '✂️', '⚠️', '✅', '⭐', '🎉', '🔁', '🏠', '➕', '▶️', '⏹️', '💵', '🔒', '⏳', '👇'];
    const corrupted = ['ðŸ“…', 'ðŸ’°', 'ðŸŽ‰', 'âš ï¸', 'ðŸ—‘ï¸', 'âœ‚ï¸', 'â ³', 'â­', 'ðŸ“„', 'âœ…', 'ðŸ—‘'];
    
    for (const e of [...emojis, ...corrupted]) {
        text = text.replaceAll(e, '');
    }
    return text;
}

function fix_encoding(text) {
    const fixes = {
        'CalendÃ¡rio': 'Calendário',
        'SÃ¡b': 'Sáb',
        'sÃ¡b': 'sáb',
        'MarÃ§o': 'Março',
        'PrÃ³ximos': 'Próximos',
        'PlantÃµes': 'Plantões',
        'PlantÃ£o': 'Plantão',
        'plantÃ£o': 'plantão',
        'plantÃµes': 'plantões',
        'ExportaÃ§Ã£o': 'Exportação',
        'mÃªs': 'mês',
        'MÃªs': 'Mês',
        'famÃ­lia': 'família',
        'pÃºblico': 'público',
        'RelatÃ³rio': 'Relatório',
        'RelatÃ³rios': 'Relatórios',
        'MÃ©dica': 'Médica',
        'InÃ­cio': 'Início',
        'inÃ­cio': 'início',
        'TÃ©rmino': 'Término',
        'tÃ©rmino': 'término',
        'CabeÃ§alho': 'Cabeçalho',
        'RodapÃ©': 'Rodapé',
        'opÃ§Ãµes': 'opções',
        'OpÃ§Ãµes': 'Opções',
        'histÃ³rico': 'histórico',
        'recalcularÃ¡': 'recalculará',
        'AbrirÃ¡': 'Abrirá',
        'ExclusÃ£o': 'Exclusão',
        'criaÃ§Ã£o': 'criação',
        'pÃ¡gina': 'página',
        'entrarÃ¡': 'entrará',
        'AtenÃ§Ã£o': 'Atenção',
        'ConfiguraÃ§Ãµes': 'Configurações',
        'PrÃ©via': 'Prévia',
        'PRÃ‰VIA': 'PRÉVIA',
        'NÃ£o': 'Não',
        'nÃ£o': 'não',
        'Ã s': 'às',
        'Ã ': 'à',
        'Ã§Ã£o': 'ção',
        'Ãµes': 'ões',
        'âœ•': '✕',
        'â† ': '←',
        'â†’': '→',
        'âŸ³': '⟳',
        'â†—': '↗',
        'â€“': '—',
        'â€”': '—',
        'Â·': '·'
    };
    
    for (const [bad, good] of Object.entries(fixes)) {
        text = text.replaceAll(bad, good);
    }
    
    const generic_fixes = {
        'Ã¡': 'á', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã§': 'ç', 'Ã©': 'é', 'Ãª': 'ê', 
        'Ã­': 'í', 'Ã³': 'ó', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ãº': 'ú', 'Ã ': 'à',
        'Ã‡': 'Ç', 'Ã€': 'À', 'Ã£o': 'ão', 'Ãµes': 'ões', 'Ã§Ã£o': 'ção', 'Â': ''
    };
    for (const [bad, good] of Object.entries(generic_fixes)) {
        text = text.replaceAll(bad, good);
    }
        
    return text;
}

const files = [
    'src/app/calendario/page.tsx', 
    'src/app/escalas/page.tsx', 
    'src/app/plantao-extra/page.tsx',
    'src/app/layout.tsx'
];

for (const file of files) {
    const p = path.resolve(__dirname, file);
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        content = fix_encoding(content);
        content = remove_emojis(content);
        fs.writeFileSync(p, content, 'utf8');
    }
}
console.log("Done");
