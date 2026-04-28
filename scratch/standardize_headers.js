
const fs = require('fs');

// 1. Add page-header to plantao-extra/page.tsx
let extraPath = 'src/app/plantao-extra/page.tsx';
let extra = fs.readFileSync(extraPath, 'utf8');

extra = extra.replace(
    'return (',
    'return (\n    <>\n      <div className="page-header">\n        <h1>Plantão Extra <PlusCircle size={24} style={{ marginLeft: 8, display: "inline", verticalAlign: "middle" }} /></h1>\n        <p>Registre seus plantões fora da escala regular e gerencie seus ganhos.</p>\n      </div>'
);

// Remove the redundant title inside the card
extra = extra.replace(
    /<div style=\{\{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 \}\}>[\s\S]*?<\/div>[\s\S]*?<\/div>/,
    ''
);

fs.writeFileSync(extraPath, extra, 'utf8');

// 2. Fix page-header in page.tsx (Home)
let homePath = 'src/app/page.tsx';
let home = fs.readFileSync(homePath, 'utf8');

// The home page doesn't have a clear page-header pattern yet.
// Let's add it.
home = home.replace(
    'return (',
    'return (\n    <>\n      <div className="page-header">\n        <h1>Olá, {userName}!</h1>\n        <p>Acompanhe sua escala e ganhos para o mês de {new Date().toLocaleDateString("pt-BR", { month: "long" })}.</p>\n      </div>'
);

fs.writeFileSync(homePath, home, 'utf8');
