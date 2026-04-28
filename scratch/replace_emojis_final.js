
const fs = require('fs');

// 1. Update DashboardInteractive.tsx (Paywall benefits & Share button)
let diPath = 'src/app/DashboardInteractive.tsx';
let di = fs.readFileSync(diPath, 'utf8');

// Add Lucide icons to benefits minicards
di = di.replace(
    /\{ icon: '💰', title: 'Previsão Financeira'/,
    '{ icon: <TrendingUp size={18} />, title: \'Previsão Financeira\''
);
di = di.replace(
    /\{ icon: '📄', title: 'Escalas Premium'/,
    '{ icon: <FileText size={18} />, title: \'Escalas Premium\''
);
di = di.replace(
    /\{ icon: '⚡', title: 'Controle Ilimitado'/,
    '{ icon: <Activity size={18} />, title: \'Controle Ilimitado\''
);

// Update map render to use icon component
di = di.replace(
    /<div style=\{\{ fontSize: 18, marginTop: 2 \}\}>\{b\.icon\}<\/div>/,
    '<div style={{ color: "var(--accent-blue)", marginTop: 2 }}>{b.icon}</div>'
);

// Remove rocket emoji from paywall
di = di.replace('🚀 Usado por profissionais', 'Utilizado por profissionais');
di = di.replace('🚀 Desbloquear agora', 'Desbloquear agora');

// Update Share buttons
di = di.replace(
    /\[ Compartilhar \]/,
    '<span style={{ display: "flex", alignItems: "center", gap: 4 }}><Share2 size={12} /> Compartilhar</span>'
);
di = di.replace(
    /\[ Ver agenda \]/,
    '<span style={{ display: "flex", alignItems: "center", gap: 4 }}><CalendarIcon size={12} /> Ver agenda</span>'
);

fs.writeFileSync(diPath, di, 'utf8');
console.log('DashboardInteractive.tsx updated with Lucide icons');

// 2. Update escalas/page.tsx
let escalasPath = 'src/app/escalas/page.tsx';
let escalas = fs.readFileSync(escalasPath, 'utf8');

escalas = escalas.replace('Escalas</h1>', 'Escalas <ClipboardList size={24} style={{ marginLeft: 8, display: "inline" }} /></h1>');
escalas = escalas.replace('<span>+</span> Criar Escala', '<Plus size={16} /> Criar Escala');
escalas = escalas.replace('+ Novo local', '<Plus size={14} /> Novo local');
escalas = escalas.replace('🚀 Criar Escala', 'Criar Escala'); // Remove rocket
escalas = escalas.replace('⏳ Salvando...', 'Salvando...'); // Remove hourglass
escalas = escalas.replace('⭐</span>', '<Star size={48} fill="currentColor" /></span>');

fs.writeFileSync(escalasPath, escalas, 'utf8');
console.log('escalas/page.tsx updated with Lucide icons');

// 3. Update plantao-extra/page.tsx
let extraPath = 'src/app/plantao-extra/page.tsx';
if (fs.existsSync(extraPath)) {
    let extra = fs.readFileSync(extraPath, 'utf8');
    extra = extra.replace('Plantão Extra</h1>', 'Plantão Extra <PlusCircle size={24} style={{ marginLeft: 8, display: "inline" }} /></h1>');
    extra = extra.replace('🚀 Salvar Plantão Extra', 'Salvar Plantão Extra');
    extra = extra.replace('⏳ Salvando...', 'Salvando...');
    fs.writeFileSync(extraPath, extra, 'utf8');
    console.log('plantao-extra/page.tsx updated');
}
