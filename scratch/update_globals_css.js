
const fs = require('fs');

// 1. Update globals.css
let css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  --bg-primary: #F8FAFC;
  --bg-secondary: #FFFFFF;
  --text-primary: #0F172A;
  --text-secondary: #64748B;
  --text-muted: #94A3B8;
  --border-subtle: #F1F5F9;
  
  --accent-blue: #3B82F6;
  --accent-blue-hover: #2563EB;
  --accent-blue-light: #EFF6FF;
  
  --accent-teal: #10B981;
  --accent-green: #22C55E;
  --accent-violet: #8B5CF6;
  
  --radius-sm: 12px;
  --radius-md: 18px;
  --radius-lg: 22px;
  --radius-xl: 24px;
  
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

[data-theme='dark'] {
  color-scheme: dark;
  --bg-primary: #020617;
  --bg-secondary: #0F172A;
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #475569;
  --border-subtle: #1E293B;

  --accent-blue: #60A5FA;
  --accent-blue-hover: #93C5FD;
  --accent-blue-light: rgba(59, 130, 246, 0.1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow-x: hidden;
  position: relative;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 {
  color: var(--text-primary);
  font-weight: 800;
  letter-spacing: -0.025em;
}

.card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-subtle);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 800;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, #60A5FA 0%, #2563EB 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.2);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
  opacity: 0.95;
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
}

.form-group { margin-bottom: 20px; }
.form-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  padding-left: 4px;
}

.form-input, .form-select {
  width: 100%;
  height: 56px;
  padding: 0 16px;
  background: #F1F5F9;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
  outline: none;
  transition: all 0.2s;
}

[data-theme='dark'] .form-input, [data-theme='dark'] .form-select {
  background: #1E293B;
}

.form-input:focus, .form-select:focus {
  background: var(--bg-secondary);
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 1px var(--accent-blue);
}

/* Bottom Nav */
.mobile-nav {
  display: none;
}

@media (max-width: 768px) {
  .mobile-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid var(--border-subtle);
    z-index: 1000;
    padding: 8px 12px;
    justify-content: space-around;
    align-items: center;
  }

  [data-theme='dark'] .mobile-nav {
    background: rgba(15, 23, 42, 0.85);
  }

  .mobile-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-decoration: none;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 700;
    transition: all 0.2s ease;
  }

  .mobile-nav-item.active {
    color: var(--accent-blue);
  }

  .mobile-nav-item .nav-icon {
    transition: transform 0.2s;
  }

  .mobile-nav-item.active .nav-icon {
    transform: scale(1.1);
  }
}

/* Animations */
@keyframes cardEntrance {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.app-shell { display: flex; min-height: 100vh; }
.main-content { flex: 1; padding: 40px; overflow-y: auto; }

@media (max-width: 768px) {
  .sidebar { display: none !important; }
  .main-content { padding: 24px 20px 100px 20px; }
}
`;

fs.writeFileSync('src/app/globals.css', css, 'utf8');
console.log('globals.css updated');
