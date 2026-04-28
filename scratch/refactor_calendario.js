
const fs = require('fs');
const path = 'src/app/calendario/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Imports
content = content.replace("import jsPDF from 'jspdf';", "import { ShareAgendaModal } from '../../components/ShareAgendaModal';");

// 2. States
const stateTarget = /const \[isPro, setIsPro\] = useState<boolean \| null>\(null\); \/\/ null = ainda carregando/;
const stateReplacement = `const [isPro, setIsPro] = useState<boolean | null>(null);
  const [userName, setUserName] = useState('Médico');
  const [totalGanhos, setTotalGanhos] = useState(0);`;
content = content.replace(stateTarget, stateReplacement);

// 3. checkPro effect
const checkProTarget = /const checkPro = async \(\) => \{[\s\S]*?setIsPro\(isUserPro\(user\.email\) \|\| \(profile\?\.is_pro === true\)\);[\s\S]*?\};/;
const checkProReplacement = `const checkPro = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('is_pro, nome').eq('id', user.id).single();
      setIsPro(isUserPro(user.email) || (profile?.is_pro === true));

      const getShortName = (fullName: string) => {
        const parts = fullName?.trim().split(/\\s+/) || [];
        if (parts.length <= 1) return parts[0] || 'Médico';
        return \`\${parts[0]} \${parts[parts.length - 1]}\`;
      };
      setUserName(getShortName(profile?.nome || user.user_metadata?.full_name || user.user_metadata?.name || 'Médico'));
    };`;
content = content.replace(checkProTarget, checkProReplacement);

// 4. totalGanhos effect
const effectInsertTarget = /\/\/ Fetch ao montar e quando o mês\/ano muda/;
const effectInsert = `useEffect(() => {
    const total = plantoes.reduce((acc, p) => {
      if (!p.notas) return acc;
      const match = p.notas.match(/R\\$\\s*([\\d.,]+)/);
      if (match) {
        let valStr = match[1];
        if (valStr.includes(',')) {
          valStr = valStr.replace(/\\./g, '').replace(',', '.');
        } else if (valStr.includes('.') && valStr.split('.').pop()?.length === 2) {
          // OK
        } else {
          valStr = valStr.replace(/\\./g, '');
        }
        return acc + parseFloat(valStr || '0');
      }
      return acc;
    }, 0);
    setTotalGanhos(total);
  }, [plantoes]);

  `;
content = content.replace(effectInsertTarget, effectInsert + effectInsertTarget);

// 5. Menu Buttons
const menuTarget = /<button onClick=\{\(\) => \{ setMenuAberto\(false\); router\.push\('\/dashboard'\); \}\} style=\{[\s\S]*?Resumo dos Ganhos 💰[\s\S]*?<\/button>[\s\S]*?<button[\s\S]*?onClick=\{\(\) => \{ setMenuAberto\(false\); setShowExportModal\(true\); \}\}[\s\S]*?Compartilhar Escala Pro[\s\S]*?<\/button>/;
const menuReplacement = `<button onClick={() => { setMenuAberto(false); setShowExportModal(true); }} style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', fontWeight: 700, display:'flex', alignItems:'center', gap:10, color:'var(--text-primary)' }}>
                         Resumo dos Ganhos 💰
                     </button>
                     <button
                       onClick={() => { setMenuAberto(false); setShowExportModal(true); }}
                       style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', textAlign: 'left', fontWeight: 700, display:'flex', alignItems:'center', gap:10, color:'var(--text-primary)' }}
                     >
                       Compartilhar Escala Pro
                     </button>`;
content = content.replace(menuTarget, menuReplacement);

// 6. Remove Old Modals
// Remove showProModal (Paywall)
const proModalTarget = /\{\/\* MODAL PRO PAYWALL - PDF \*\/\}[\s\S]*?\{showProModal && \([\s\S]*?<\/div>\s+\)\}/;
content = content.replace(proModalTarget, '');

// Remove showExportModal (Old PDF)
const exportModalTarget = /\{\/\* MODAL EXPORTAÇÃƒO PRO \*\/\}[\s\S]*?\{showExportModal && \([\s\S]*?<\/div>\s+\)\}/;
// Wait, the regex might be tricky if it has many nested divs. 
// I'll just look for the end of the file part.

const startExport = content.indexOf('{/* MODAL EXPORTAÇÃƒO PRO */}');
const endFile = content.lastIndexOf('</>\n  );\n}');

if (startExport !== -1 && endFile !== -1) {
    const finalReplacement = `
      <ShareAgendaModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        initialShifts={plantoes}
        userName={userName}
        initialTotalGanhos={totalGanhos}
        isPro={!!isPro}
      />
`;
    content = content.slice(0, startExport) + finalReplacement + content.slice(endFile);
}

// 7. Cleanup unused functions and states
content = content.replace(/const \[exportMes, setExportMes\] = useState<number \| null>\(null\);/, '');
content = content.replace(/const \[exportAno, setExportAno\] = useState\(new Date\(\)\.getFullYear\(\)\);/, '');
content = content.replace(/const \[exportLoading, setExportLoading\] = useState\(false\);/, '');
content = content.replace(/const \[exportPreview, setExportPreview\] = useState<PlantaoComLocal\[\]>\(\[\]\);/, '');
content = content.replace(/const \[showProModal, setShowProModal\] = useState\(false\);/, '');

// Delete function generateExportPDF and fetchExportPreview
const functionsTarget = /const fetchExportPreview = async \([\s\S]*?const generateExportPDF = \(\) => \{[\s\S]*?\};/;
content = content.replace(functionsTarget, '');

fs.writeFileSync(path, content, 'utf8');
console.log('CalendarioPage refactored');
