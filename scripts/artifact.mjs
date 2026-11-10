// Arma la versión "fragmento" del juego: lo mismo que dist/index.html pero sin <html>, <head> ni <body>,
// que es el formato que usa la página publicada en claude.ai (ella pone el esqueleto).
// Uso: node scripts/artifact.mjs dist   →   dist/delta-uno-artifact.html
import fs from 'node:fs';
import path from 'node:path';

const outDir = process.argv[2] || 'dist';
const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');

const head = (html.match(/<head>([\s\S]*?)<\/head>/i) || [])[1];
const body = (html.match(/<body>([\s\S]*?)<\/body>/i) || [])[1];
if (head == null || body == null) {
  console.error('No encontré <head> o <body> en ' + outDir + '/index.html');
  process.exit(1);
}

const keepHead = head
  .replace(/<meta charset[^>]*>\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '<meta name="claude:viewport-fit-sides" content="cover">\n');

const fragment = keepHead.trim() + '\n' + body.trim() + '\n';
fs.writeFileSync(path.join(outDir, 'delta-uno-artifact.html'), fragment);
console.log('Listo: ' + path.join(outDir, 'delta-uno-artifact.html') + ' (' + Math.round(fragment.length / 1024) + ' KB)');
