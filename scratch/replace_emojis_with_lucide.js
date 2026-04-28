
const fs = require('fs');

// 1. Update locais/page.tsx
let locaisPath = 'src/app/locais/page.tsx';
let locais = fs.readFileSync(locaisPath, 'utf8');

// Add Lucide imports
if (!locais.includes('import { Plus, Trash2, Home, MapPin, Edit3, Star } from \'lucide-react\'')) {
    locais = "import { Plus, Trash2, Home, MapPin, Edit3, Star } from 'lucide-react';\n" + locais;
}

// Replace emojis
locais = locais.replace('Locais de Trabalho 🏥', 'Locais de Trabalho <span style={{ marginLeft: 8 }}><Plus size={24} /></span>');
locais = locais.replace('Este local é de atendimento <strong>Home Care</strong> 🏠', 'Este local é de atendimento <strong>Home Care</strong>');
locais = locais.replace('🏠 Home Care', '<span style={{ display: "flex", alignItems: "center", gap: 4 }}><Home size={12} /> Home Care</span>');
locais = locais.replace('📍', '<MapPin size={14} />');
locais = locais.replace('🗑️', '<Trash2 size={16} />');
locais = locais.replace('➕ Adicionar Local', '<Plus size={18} /> Adicionar Local');
locais = locais.replace('Upgrade para o Pro ⭐', 'Upgrade para o Pro <Star size={24} fill="currentColor" />');

fs.writeFileSync(locaisPath, locais, 'utf8');
console.log('locais/page.tsx updated with Lucide icons');

// 2. Update page.tsx (Home)
let homePath = 'src/app/page.tsx';
let home = fs.readFileSync(homePath, 'utf8');

// Replace emojis in Home
home = home.replace('Meu Plantão 👋', 'Meu Plantão');
home = home.replace('📅 {totalMes || 0} <span style={{ fontSize: 18, color: \'var\(--text-secondary\)\', fontWeight: 600 }}>plantões este mês</span>', '<div style={{ display: "flex", alignItems: "center", gap: 12 }}>{totalMes || 0} <span style={{ fontSize: 18, color: "var(--text-secondary)", fontWeight: 600 }}>plantões este mês</span></div>');
home = home.replace('🏥</span>', '<Plus size={16} color="var(--accent-blue)" /></span>');

fs.writeFileSync(homePath, home, 'utf8');
console.log('page.tsx updated with Lucide icons');
