import os
import re

def remove_emojis(text):
    # Just list the specific emojis user mentioned or were present:
    emojis = ['🗓️', '⚙️', '💸', '⚡', '📋', '🚀', '⏰', '🔄', '🗑️', '✂️', '⚠️', '✅', '⭐', '🎉', '🔁', '🏠', '➕', '▶️', '⏹️', '💵', '🔒', '⏳', '👇']
    # Removing corrupted emojis found in the original file:
    emojis.extend(['ðŸ“…', 'ðŸ’°', 'ðŸŽ‰', 'âš ï¸', 'ðŸ—‘ï¸', 'âœ‚ï¸', 'â ³', 'â­', 'ðŸ“„', 'âœ…', 'ðŸ—‘'])
    for e in emojis:
        text = text.replace(e, '')
    return text

def fix_encoding(text):
    fixes = {
        'CalendÃ¡rio': 'Calendário',
        'SÃ¡b': 'Sáb',
        'MarÃ§o': 'Março',
        'PrÃ³ximos': 'Próximos',
        'PlantÃµes': 'Plantões',
        'PlantÃ£o': 'Plantão',
        'ExportaÃ§Ã£o': 'Exportação',
        'mÃªs': 'mês',
        'famÃ­lia': 'família',
        'pÃºblico': 'público',
        'RelatÃ³rio': 'Relatório',
        'RelatÃ³rios': 'Relatórios',
        'MÃ©dica': 'Médica',
        'InÃ­cio': 'Início',
        'TÃ©rmino': 'Término',
        'CabeÃ§alho': 'Cabeçalho',
        'RodapÃ©': 'Rodapé',
        'opÃ§Ãµes': 'opções',
        'histÃ³rico': 'histórico',
        'recalcularÃ¡': 'recalculará',
        'AbrirÃ¡': 'Abrirá',
        'TÃ©rmino': 'Término',
        'ExclusÃ£o': 'Exclusão',
        'criaÃ§Ã£o': 'criação',
        'pÃ¡gina': 'página',
        'recalcularÃ¡': 'recalculará',
        'entrarÃ¡': 'entrará',
        'OpÃ§Ãµes': 'Opções',
        'AtenÃ§Ã£o': 'Atenção',
        'ConfiguraÃ§Ãµes': 'Configurações',
        'MÃªs': 'Mês',
        'PrÃ©via': 'Prévia',
        'PRÃ‰VIA': 'PRÉVIA',
        'NÃ£o': 'Não',
        'nÃ£o': 'não',
        'tÃ©rmino': 'término',
        'inÃ­cio': 'início',
        'Ã s': 'às',
        'Ã ': 'à',
        'âœ•': '✕',
        'â† ': '←',
        'â†’': '→',
        'âŸ³': '⟳',
        'â†—': '↗',
        'â€“': '—',
        'â€”': '—',
        'Â·': '·'
    }
    for bad, good in fixes.items():
        text = text.replace(bad, good)
        
    # generic fallback if missed any
    generic_fixes = {
        'Ã¡': 'á', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã§': 'ç', 'Ã©': 'é', 'Ãª': 'ê', 
        'Ã­': 'í', 'Ã³': 'ó', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ãº': 'ú', 'Ã ': 'à',
        'Ã‡': 'Ç', 'Ã€': 'À', 'Ã£o': 'ão', 'Ãµes': 'ões', 'Ã§Ã£o': 'ção', 'Â': ''
    }
    for bad, good in generic_fixes.items():
        text = text.replace(bad, good)
        
    return text

files = [
    'src/app/calendario/page.tsx', 
    'src/app/escalas/page.tsx', 
    'src/app/plantao-extra/page.tsx',
    'src/app/layout.tsx'
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = fix_encoding(content)
        content = remove_emojis(content)
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
print("Done")
