/* Prepara las texturas descargadas para el juego.
   Entrada: una carpeta con los .zip de ambientCG (o carpetas ya descomprimidas).
   Salida: assets/texturas/<Nombre>-<color|normal>-<512|1024>.webp

   De cada material se guardan solo dos mapas: Color y NormalGL. Los demás (rugosidad,
   desplazamiento, oclusión) no los usa el juego: ver docs/texturas.md.
   De los HDRI se guarda el JPG ya revelado (TONEMAPPED), que es lo que se puede mostrar sin
   convertir nada, como fondo del lado nocturno.

   Uso:  node scripts/texturas.mjs <carpeta-con-los-zips>
*/
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';

const SRC = process.argv[2];
if (!SRC) { console.error('Falta la carpeta con los zips.\n  node scripts/texturas.mjs <carpeta>'); process.exit(1); }
const OUT = 'assets/texturas';
const TAMANOS = [1024, 512]; // Alta y Media. En Baja el juego no usa texturas.
mkdirSync(OUT, { recursive: true });

// Nombre del material a partir del archivo: "a1b2-Grass006_1K-JPG.zip" -> "Grass006"
const nombreDe = f => basename(f).replace(/^[0-9a-f]{6,}-/, '').replace(/_1K.*$/, '').replace(/\.zip$/, '');

function carpetas() {
  const out = [];
  for (const f of readdirSync(SRC).sort()) {
    const p = join(SRC, f);
    if (f.toLowerCase().endsWith('.zip')) {
      const d = mkdtempSync(join(tmpdir(), 'tex-'));
      execFileSync('unzip', ['-o', '-q', p, '-d', d]);
      out.push({ nombre: nombreDe(f), dir: d, borrar: true });
    } else if (statSync(p).isDirectory()) out.push({ nombre: nombreDe(f), dir: p, borrar: false });
  }
  return out;
}

async function guardar(src, destino, tam) {
  await sharp(src).resize(tam, tam, { fit: 'fill' }).webp({ quality: 86, effort: 5 }).toFile(destino);
  return Math.round(statSync(destino).size / 1024);
}

let total = 0;
for (const { nombre, dir, borrar } of carpetas()) {
  const files = readdirSync(dir);
  const color = files.find(f => /_Color\.(jpg|png)$/i.test(f));
  const normal = files.find(f => /_NormalGL\.(jpg|png)$/i.test(f));
  const cielo = files.find(f => /TONEMAPPED\.(jpg|png)$/i.test(f));
  const linea = [];
  if (cielo) {
    // el cielo no se repite: se deja apaisado 2:1 y en un solo tamaño
    const d = join(OUT, `${nombre}-cielo.webp`);
    await sharp(join(dir, cielo)).webp({ quality: 88, effort: 5 }).toFile(d);
    linea.push(`cielo ${Math.round(statSync(d).size / 1024)} KB`);
  }
  for (const [tipo, archivo] of [['color', color], ['normal', normal]]) {
    if (!archivo) continue;
    for (const tam of TAMANOS) {
      const d = join(OUT, `${nombre}-${tipo}-${tam}.webp`);
      linea.push(`${tipo} ${tam}: ${await guardar(join(dir, archivo), d, tam)} KB`);
    }
  }
  if (borrar) rmSync(dir, { recursive: true, force: true });
  if (!linea.length) { console.log(`${nombre}: sin Color ni NormalGL, salteado`); continue; }
  console.log(`${nombre}: ${linea.join(' · ')}`);
  total++;
}
const kb = readdirSync(OUT).reduce((a, f) => a + statSync(join(OUT, f)).size, 0) / 1024;
console.log(`\n${total} materiales listos en ${OUT}. Total: ${(kb / 1024).toFixed(1)} MB`);
