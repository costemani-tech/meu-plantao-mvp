
const fs = require('fs');
const path = 'src/app/calendario/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove dead functions
content = content.replace(/const handleIrMetricas = \(\) => \{[\s\S]*?\};/g, '');
content = content.replace(/const handleLinkFamiliar = \(\) => \{[\s\S]*?\};/g, '');

// 2. Remove gate in Editar button (line 380 area)
// Old: if (!isPro) { setShowProModal(true); return; }
content = content.replace(/if \(!isPro\) \{ setShowProModal\(true\); return; \}/g, 'if (!isPro) { alert("Esta é uma funcionalidade Premium. Assine o PRO no Início para desbloquear."); return; }');

// 3. Remove any other remnants of setShowProModal
content = content.replace(/setShowProModal\(true\)/g, 'setShowExportModal(true)'); // Fallback just in case

fs.writeFileSync(path, content, 'utf8');
console.log('CalendarioPage dead code removed');
