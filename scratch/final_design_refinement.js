
const fs = require('fs');

// 1. Refine globals.css (ensure grid and FAB are solid)
let css = fs.readFileSync('src/app/globals.css', 'utf8');

// Ensure box-sizing is everywhere and fix grid
if (!css.includes('grid-template-columns: repeat(7, 1fr) !important')) {
    css = css.replace('.calendar-grid {', '.calendar-grid {\n  display: grid !important;\n  grid-template-columns: repeat(7, 1fr) !important;');
}

fs.writeFileSync('src/app/globals.css', css, 'utf8');

// 2. Fix DashboardInteractive.tsx (Banner background for darkmode)
let diPath = 'src/app/DashboardInteractive.tsx';
let di = fs.readFileSync(diPath, 'utf8');

// Replace hardcoded white background in Banner
di = di.replace(/background: '#ffffff'/g, 'background: "var(--bg-secondary)"');
di = di.replace(/border: '1px solid #dbeafe'/g, 'border: "1px solid var(--border-subtle)"');

fs.writeFileSync(diPath, di, 'utf8');

// 3. Fix calendario/page.tsx (Grid items size)
let calPath = 'src/app/calendario/page.tsx';
let cal = fs.readFileSync(calPath, 'utf8');

// Ensure cal-day has proper flex/grid properties
cal = cal.replace(/style=\{\{\s*cursor: cell\.mesAtual/g, 'style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60px", cursor: cell.mesAtual');

fs.writeFileSync(calPath, cal, 'utf8');
