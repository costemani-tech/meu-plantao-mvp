
const fs = require('fs');

// 1. Update AppShell.tsx
let shellPath = 'src/components/AppShell.tsx';
let shell = fs.readFileSync(shellPath, 'utf8');

// Replace emojis in block screen
shell = shell.replace('<span style={{ fontSize: 48, display: \'block\', marginBottom: 16 }}>⚠️</span>', '<div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><AlertTriangle size={64} color="#EF4444" /></div>');
shell = shell.replace('⭐ Assinar Versão Pro', '<Star size={18} fill="currentColor" /> Assinar Versão Pro');

fs.writeFileSync(shellPath, shell, 'utf8');
console.log('AppShell.tsx block screen updated');
