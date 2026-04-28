
const fs = require('fs');
const path = 'src/app/calendario/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = /<option value="12x36">12h Trabalhadas \/ 36h Descanso \(Plantonista\)<\/option>\s+<option value="24x48">24h Trabalhadas \/ 48h Descanso \(Plantonista\)<\/option>\s+<option value="24x72">24h Trabalhadas \/ 72h Descanso \(Plantonista\)<\/option>\s+<option value="5x2">Diarista \(Segunda a Sexta\)<\/option>\s+<option value="6x1">Diarista \(6x1\)<\/option>\s+<option value="Outro">Outro \(Personalizado\)<\/option>/;

const replacement = `<option value="12x36">12x36 (Trabalha 12h, folga 36h)</option>
                   <option value="24x48">24x48 (Trabalha 24h, folga 48h)</option>
                   <option value="24x72">24x72 (Trabalha 24h, folga 72h)</option>
                   <option value="5x2">Diarista (Segunda a Sexta)</option>
                   <option value="6x1">Diarista (6x1)</option>
                   <option value="Outro">Outro (Personalizado)</option>`;

content = content.replace(target, replacement);

fs.writeFileSync(path, content, 'utf8');
console.log('Calendar options updated');
