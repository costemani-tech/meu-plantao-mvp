
const fs = require('fs');

// 1. Add Calendar styles back to globals.css
let css = fs.readFileSync('src/app/globals.css', 'utf8');

css += `
/* Calendar Grid System */
.cal-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}

.cal-day-header {
  text-align: center;
  font-size: 11px;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.cal-day {
  aspect-ratio: 1;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  min-height: 50px;
}

.cal-day.other-month {
  opacity: 0.25;
}

.cal-day.today {
  box-shadow: inset 0 0 0 2px var(--accent-blue);
}

.cal-day-num {
  font-size: 14px;
  font-weight: 700;
}

/* Utils */
.text-premium-gradient {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
`;

fs.writeFileSync('src/app/globals.css', css, 'utf8');
console.log('globals.css updated with calendar styles');

// 2. Fix DashboardInteractive.tsx (DarkMode Title and FAB)
let diPath = 'src/app/DashboardInteractive.tsx';
let di = fs.readFileSync(diPath, 'utf8');

// Fix Title color in Paywall
di = di.replace(
    /color: '#001a41'/g,
    'color: "var(--text-primary)"'
);

// Fix FAB style
di = di.replace(
    /className="btn btn-secondary" style=\{\{ padding: '8px 12px' \}\}/,
    'className="btn btn-primary" style={{ position: "fixed", bottom: 100, right: 20, width: 60, height: 60, borderRadius: "50%", boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)", zIndex: 100 }}'
);

fs.writeFileSync(diPath, di, 'utf8');
console.log('DashboardInteractive.tsx fixed');

// 3. Fix calendario/page.tsx (DarkMode Title)
let calPath = 'src/app/calendario/page.tsx';
let cal = fs.readFileSync(calPath, 'utf8');

cal = cal.replace(
    /color: '#001a41'/g,
    'color: "var(--text-primary)"'
);

fs.writeFileSync(calPath, cal, 'utf8');
console.log('calendario/page.tsx fixed');
