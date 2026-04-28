
const fs = require('fs');

// 1. Update globals.css with .page-header and improved main-content padding
let css = fs.readFileSync('src/app/globals.css', 'utf8');

css += `
.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  margin-bottom: 4px;
}

.page-header p {
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .page-header h1 { font-size: 24px; }
  .page-header p { font-size: 14px; }
}

/* Fix for top overlapping */
.top-actions-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 20px;
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  z-index: 100;
  margin-bottom: 8px;
}
`;

fs.writeFileSync('src/app/globals.css', css, 'utf8');

// 2. Update AppShell.tsx to use the new top-actions-bar
let appShellPath = 'src/components/AppShell.tsx';
let appShell = fs.readFileSync(appShellPath, 'utf8');

// Find the absolute positioned div and replace it with a flow div
const oldDiv = '<div style={{ position: \'absolute\', top: 24, right: 24, zIndex: 50, display: \'flex\', gap: 12 }}>';
const newDiv = '<div className="top-actions-bar">';

appShell = appShell.replace(oldDiv, newDiv);

// Also remove absolute positioning from the main-content if it has any
appShell = appShell.replace('<main className="main-content" style={{ position: \'relative\' }}>', '<main className="main-content">');

fs.writeFileSync(appShellPath, appShell, 'utf8');

// 3. Fix plantao-extra/page.tsx (remove manual margin if any)
// No changes needed yet.

// 4. Fix escalas/page.tsx (ensure header is clean)
let escalasPath = 'src/app/escalas/page.tsx';
let escalas = fs.readFileSync(escalasPath, 'utf8');

// The scale page has a float button "Criar Escala" in the header sometimes.
// Let's check how it's rendered.
// escalas = escalas.replace('justifyContent: \'space-between\'', 'justifyContent: \'space-between\', alignItems: \'center\'');

fs.writeFileSync(escalasPath, escalas, 'utf8');
