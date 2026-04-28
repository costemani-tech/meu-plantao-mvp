
const fs = require('fs');
const path = 'src/app/calendario/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const marker = '{showExportModal && (';
const startIndex = content.lastIndexOf(marker);
const endFile = content.lastIndexOf('</>\n  );\n}');

if (startIndex !== -1 && endFile !== -1) {
    const replacement = `
      <ShareAgendaModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        initialShifts={plantoes}
        userName={userName}
        initialTotalGanhos={totalGanhos}
        isPro={!!isPro}
      />
`;
    content = content.slice(0, startIndex) + replacement + content.slice(endFile);
    fs.writeFileSync(path, content, 'utf8');
    console.log('CalendarioPage final cleanup done');
} else {
    console.log('Markers not found', startIndex, endFile);
}
