
const fs = require('fs');

// Fix minicards in DashboardInteractive.tsx
let diPath = 'src/app/DashboardInteractive.tsx';
let di = fs.readFileSync(diPath, 'utf8');

di = di.replace(
    /background: '#eff6ff'/,
    'background: "var(--accent-blue-light)"'
);
di = di.replace(
    /color: '#1e3a8a'/,
    'color: "var(--accent-blue)"'
);
di = di.replace(
    /color: '#60a5fa'/,
    'color: "var(--text-secondary)"'
);

fs.writeFileSync(diPath, di, 'utf8');
console.log('DashboardInteractive.tsx minicards fixed');

// Fix minicards in calendario/page.tsx (Paywall)
let calPath = 'src/app/calendario/page.tsx';
let cal = fs.readFileSync(calPath, 'utf8');

cal = cal.replace(
    /background: '#eff6ff'/,
    'background: "var(--accent-blue-light)"'
);
cal = cal.replace(
    /color: '#1e3a8a'/,
    'color: "var(--accent-blue)"'
);
cal = cal.replace(
    /color: '#60a5fa'/,
    'color: "var(--text-secondary)"'
);

fs.writeFileSync(calPath, cal, 'utf8');
console.log('calendario/page.tsx minicards fixed');
