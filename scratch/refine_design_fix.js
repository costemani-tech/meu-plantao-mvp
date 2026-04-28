
const fs = require('fs');

// 1. Refine globals.css (add .fab and fix calendar styles)
let css = fs.readFileSync('src/app/globals.css', 'utf8');

// Remove the previous calendar block if it exists to avoid duplicates
css = css.split('/* Calendar Grid System */')[0];

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
  display: grid !important;
  grid-template-columns: repeat(7, 1fr) !important;
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
  min-width: 0; /* important for grid */
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

/* FAB - Floating Action Button */
.fab {
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #60A5FA 0%, #2563EB 100%);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab:hover {
  transform: scale(1.1) translateY(-5px);
  box-shadow: 0 15px 30px rgba(37, 99, 235, 0.5);
}

.fab:active {
  transform: scale(0.95);
}

/* Dark Mode fixes for hardcoded backgrounds in components */
[data-theme='dark'] .card {
  background: var(--bg-secondary) !important;
}

[data-theme='dark'] .cal-day {
  background: var(--bg-secondary) !important;
}
`;

fs.writeFileSync('src/app/globals.css', css, 'utf8');

// 2. Fix DashboardInteractive.tsx (Hardcoded colors and FAB icon)
let diPath = 'src/app/DashboardInteractive.tsx';
let di = fs.readFileSync(diPath, 'utf8');

// Fix Banner and Locked cards
di = di.replace(/background: '#ffffff'/g, 'background: "var(--bg-secondary)"');
di = di.replace(/background: '#f8fafc'/g, 'background: "var(--bg-primary)"');
di = di.replace(/border: '1px solid #e2e8f0'/g, 'border: "1px solid var(--border-subtle)"');
di = di.replace(/border: '1px solid #dbeafe'/g, 'border: "1px solid var(--border-subtle)"');
di = di.replace(/color: '#1e293b'/g, 'color: "var(--text-primary)"');
di = di.replace(/color: '#64748b'/g, 'color: "var(--text-secondary)"');
di = di.replace(/color: '#94a3b8'/g, 'color: "var(--text-muted)"');

fs.writeFileSync(diPath, di, 'utf8');

// 3. Fix calendario/page.tsx (Calendar layout issues)
let calPath = 'src/app/calendario/page.tsx';
let cal = fs.readFileSync(calPath, 'utf8');

// Remove inline background that might conflict
cal = cal.replace(/background: 'var\(--bg-primary\)'/g, 'background: "transparent"');

fs.writeFileSync(calPath, cal, 'utf8');
