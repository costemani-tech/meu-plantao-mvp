
const fs = require('fs');

// 1. Update src/app/page.tsx (Home)
let homePath = 'src/app/page.tsx';
let home = fs.readFileSync(homePath, 'utf8');

// Update StatsSection padding/margin to match new system
home = home.replace(
    /className="card" style=\{\{[\s\S]*?padding: '24px', borderRadius: '24px', background: 'var\(--bg-secondary\)',[\s\S]*?border: '1px solid var\(--border-subtle\)', boxShadow: 'var\(--shadow-md\)',[\s\S]*?marginBottom: 32, position: 'relative', overflow: 'hidden'[\s\S]*?\}\}/,
    'className="card" style={{ marginBottom: 24, position: "relative", overflow: "hidden" }}'
);

// Update main container padding
home = home.replace(
    /style=\{\{ padding: '24px 16px 100px 16px', maxWidth: '600px', margin: '0 auto' \}\}/,
    'style={{ padding: "16px 16px 120px 16px", maxWidth: "600px", margin: "0 auto" }}'
);

// Update Header margin
home = home.replace(
    'style={{ marginBottom: 24 }}',
    'style={{ marginBottom: 20 }}'
);

fs.writeFileSync(homePath, home, 'utf8');
console.log('page.tsx updated');

// 2. Update src/components/AppShell.tsx
let shellPath = 'src/components/AppShell.tsx';
let shell = fs.readFileSync(shellPath, 'utf8');

// Update Bottom Nav style
shell = shell.replace(
    /background: var\(--bg-primary\);[\s\S]*?border-top: 1px solid var\(--border-subtle\);[\s\S]*?z-index: 1000;[\s\S]*?padding: 8px 12px;/,
    'background: rgba(255, 255, 255, 0.85); backdropFilter: "blur(12px)", borderTop: "1px solid var(--border-subtle)", zIndex: 1000, padding: "8px 12px",'
);

// Update active icon scale (handled in CSS but ensuring classes are correct)
// Already using .active in CSS, will add transition and scale there.

fs.writeFileSync(shellPath, shell, 'utf8');
console.log('AppShell.tsx updated');

// 3. Update DashboardInteractive.tsx for UpcomingShiftsClient cards
let diPath = 'src/app/DashboardInteractive.tsx';
let di = fs.readFileSync(diPath, 'utf8');

di = di.replace(
    /className="shift-item" style=\{\{[\s\S]*?border: '1px solid var\(--border-subtle\)',[\s\S]*?borderRadius: '16px',[\s\S]*?display: 'flex',[\s\S]*?alignItems: 'center',[\s\S]*?background: 'var\(--bg-secondary\)',[\s\S]*?transition: 'transform 0.1s'[\s\S]*?\}\}/g,
    'className="shift-item card" style={{ display: "flex", alignItems: "center", padding: 0, borderRadius: "18px", marginBottom: 0, border: "1px solid var(--border-subtle)" }}'
);

// Fix color bar height and radius
di = di.replace(
    /height: '64px',[\s\S]*?borderRadius: '16px 0 0 16px'/,
    'height: "64px", borderRadius: "18px 0 0 18px"'
);

fs.writeFileSync(diPath, di, 'utf8');
console.log('DashboardInteractive.tsx updated');
