const fs = require('fs');
let content = fs.readFileSync('src/app/plantao-extra/page.tsx', 'utf-8');

// Replace the parsing logic to handle R$ and dots
const oldParsing = /const valorNumerico = tipoExtra === 'Remunerado' \? \(parseFloat\(valorGanho\.replace\(',', '\.'\)\) \|\| 0\) : 0;/;
const newParsing = "const valorNumerico = tipoExtra === 'Remunerado' ? (parseFloat(valorGanho.replace('R$ ', '').replace(/\\./g, '').replace(',', '.')) || 0) : 0;";

content = content.replace(oldParsing, newParsing);

fs.writeFileSync('src/app/plantao-extra/page.tsx', content, 'utf-8');
console.log('Patch Plantão Extra Parse completed.');
