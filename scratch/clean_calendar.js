
const fs = require('fs');
const path = 'src/app/calendario/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const brokenBlock = /<\/div>\s+<\/div>\s+className="input-field"[\s\S]*?\)\}/;
const replacement = `</div>
             </div>`;

content = content.replace(brokenBlock, replacement);

fs.writeFileSync(path, content, 'utf8');
console.log('File cleaned successfully');
