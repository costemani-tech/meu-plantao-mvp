const fs = require('fs');
let lines = fs.readFileSync('src/app/calendario/page.tsx', 'utf-8').split('\n');
for(let i = 0; i < lines.length; i++) {
  if(lines[i].includes('onClick={mesAnterior}')) {
    lines[i] = '          <button className="btn btn-secondary" onClick={mesAnterior} style={{ padding: "8px 12px" }}>\n            <ChevronLeft size={20} />\n          </button>';
  }
  if(lines[i].includes('onClick={proximoMes}')) {
    lines[i] = '          <button className="btn btn-secondary" onClick={proximoMes} style={{ padding: "8px 12px" }}>\n            <ChevronRight size={20} />\n          </button>';
  }
}
fs.writeFileSync('src/app/calendario/page.tsx', lines.join('\n'), 'utf-8');
