
const fs = require('fs');
const path = 'src/app/DashboardInteractive.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = /export function ShareAgendaButton\(\{ proximos: initialProximos, userName, totalGanhos: initialTotal, isPro \}: \{ proximos: any\[\], userName: string, totalGanhos: number, isPro: boolean \}\) \{[\s\S]*?\} \/\* end of ShareAgendaButton \*\//;

// I'll add a comment in the file first to help regex find the end if needed, but I'll try to find the end of the component.
// Actually, I'll just look for the next "export function" or end of file.
// Wait, the component ends at line 627.

const startMarker = 'export function ShareAgendaButton({ proximos: initialProximos, userName, totalGanhos: initialTotal, isPro }: { proximos: any[], userName: string, totalGanhos: number, isPro: boolean }) {';
const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf('export function UpcomingShiftsClient');

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `export function ShareAgendaButton({ proximos: initialProximos, userName, totalGanhos: initialTotal, isPro }: { proximos: any[], userName: string, totalGanhos: number, isPro: boolean }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
        [ Compartilhar ]
      </button>

      <ShareAgendaModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialShifts={initialProximos}
        userName={userName}
        initialTotalGanhos={initialTotal}
        isPro={isPro}
      />
    </>
  );
}

`;
    content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
    fs.writeFileSync(path, content, 'utf8');
    console.log('ShareAgendaButton refactored');
} else {
    console.log('Markers not found', startIndex, endIndex);
}
