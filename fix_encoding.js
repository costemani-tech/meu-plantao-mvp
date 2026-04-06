const fs = require('fs');
const path = require('path');

function fixText(text) {
  let fixed = text
    .replaceAll('Ã¡', 'á')
    .replaceAll('Ã¢', 'â')
    .replaceAll('Ã£', 'ã')
    .replaceAll('Ã§', 'ç')
    .replaceAll('Ã©', 'é')
    .replaceAll('Ãª', 'ê')
    .replaceAll('Ã­', 'í')
    .replaceAll('Ã³', 'ó')
    .replaceAll('Ã´', 'ô')
    .replaceAll('Ãµ', 'õ')
    .replaceAll('Ãº', 'ú')
    .replaceAll('Ã ', 'à')
    .replaceAll('Ã§Ã£o', 'ção')
    .replaceAll('Ãµes', 'ões')
    .replaceAll('Ã§Ãµes', 'ções')
    .replaceAll('Â·', '·')
    .replaceAll('Â', '')
    .replaceAll('â€“', '—')
    .replaceAll('â€”', '—')
    .replaceAll('Ã ', 'à')
    .replaceAll('âœ•', '✕')
    .replaceAll('â† ', '←')
    .replaceAll('â†’', '→')
    .replaceAll('âŸ³', '⟳')
    .replaceAll('â†—', '↗')
    .replaceAll('ðŸ“…', '')
    .replaceAll('ðŸ’°', '')
    .replaceAll('ðŸŽ‰', '')
    .replaceAll('âš ï¸', '')
    .replaceAll('ðŸ—‘ï¸', '')
    .replaceAll('âœ‚ï¸', '')
    .replaceAll('â ³', '')
    .replaceAll('â­', '')
    .replaceAll('ðŸ“„', '')
    .replaceAll('âœ…', '')
    .replaceAll('ðŸ—‘', '')
    .replaceAll('⚙️', '')
    .replaceAll('💸', '')
    .replaceAll('🗓️', '')
    .replaceAll('⚡', '')
    .replaceAll('📋', '')
    .replaceAll('🚀', '')
    .replaceAll('⏰', '')
    .replaceAll('🔄', '')
    .replaceAll('🗑️', '')
    .replaceAll('✂️', '')
    .replaceAll('⚠️', '')
    .replaceAll('✅', '')
    .replaceAll('⭐', '')
    .replaceAll('🎉', '')
    .replaceAll('🔁', '')
    .replaceAll('🏠', '')
    .replaceAll('➕', '')
    .replaceAll('▶️', '')
    .replaceAll('⏹️', '')
    .replaceAll('💵', '')
    .replaceAll('🔒', '')
    .replaceAll('⏳', '')
    .replaceAll('👇', '');
  
  // also regular regex to remove emojis and odd surrogate halves
  fixed = fixed.replace(/[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{1F000}-\u{1FAFF}\u{2300}-\u{23FF}\u{2500}-\u{25FF}\u{200D}\u{FE0F}]/gu, '');
  
  return fixed;
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
    content = fixText(content);
    fs.writeFileSync(p, content, 'utf8');
  }
}
console.log('Fixed encoding and removed emojis.');

