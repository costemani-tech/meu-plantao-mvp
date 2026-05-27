const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Regex para achar as tags <button ...> que não tem 'type='
      // Funciona na maioria dos casos simples
      let modified = false;

      content = content.replace(/<button([^>]*)>/g, (match, p1) => {
        if (!p1.includes('type=')) {
          modified = true;
          return `<button type="button"${p1}>`;
        }
        return match;
      });

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir('./src');
