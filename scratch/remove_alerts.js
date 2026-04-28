
const fs = require('fs');

// 1. Update DashboardInteractive.tsx
let diPath = 'src/app/DashboardInteractive.tsx';
let diContent = fs.readFileSync(diPath, 'utf8');

if (!diContent.includes("import { toast } from 'sonner';")) {
    diContent = "import { toast } from 'sonner';\n" + diContent;
}

diContent = diContent.replace(
    'alert("Ops! Primeiro você precisa cadastrar um Hospital ou Clínica em \'Início\'.");',
    'toast.error("Ops! Primeiro você precisa cadastrar um local em \'Início\'.");'
);

fs.writeFileSync(diPath, diContent, 'utf8');
console.log('DashboardInteractive updated with toast');

// 2. Update relatorio/page.tsx
let relPath = 'src/app/relatorio/page.tsx';
let relContent = fs.readFileSync(relPath, 'utf8');

relContent = relContent.replace(
    "alert('Este recurso é exclusivo para assinantes PRO.');",
    "// Redirecting without alert"
);

fs.writeFileSync(relPath, relContent, 'utf8');
console.log('Relatorio updated');

// 3. Update demo/page.tsx (just in case)
let demoPath = 'src/app/demo/page.tsx';
if (fs.existsSync(demoPath)) {
    let demoContent = fs.readFileSync(demoPath, 'utf8');
    demoContent = demoContent.replace(/alert\(/g, '// alert(');
    fs.writeFileSync(demoPath, demoContent, 'utf8');
    console.log('Demo alerts disabled');
}
