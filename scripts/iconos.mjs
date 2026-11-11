// Arma el ícono y la pantalla de carga de la app Android a partir de la nave del juego, vista desde arriba.
// Uso: node scripts/iconos.mjs   (necesita "sharp": npm i -g sharp, o npm i -D sharp)
// Escribe en android/app/src/main/res/ y deja una vista previa en scripts/icono.svg.
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import path from 'node:path';

const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch (e) {
  sharp = require(path.join(execSync('npm root -g').toString().trim(), 'sharp'));
}

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const RES = path.join(ROOT, 'android/app/src/main/res');

// Puntos de la nave (x, z) como en buildShip() de src/main.js, vista desde arriba con la trompa hacia arriba
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const N = [0, -3], L = [-2.4, 1.6], R = [2.4, 1.6], TL = [-0.85, 1.35], TR = [0.85, 1.35], Sp = [0, 0.55];
const P1 = lerp(N, L, 0.74), Q1 = lerp(L, Sp, 0.28), P2 = lerp(L, TL, 0.4);
const P3 = lerp(N, R, 0.74), Q2 = lerp(R, Sp, 0.28), P4 = lerp(R, TR, 0.4);
const C = { ivoryL: '#eadfc9', ivoryR: '#f8f0de', coral: '#ff6a3a', coralD: '#e2532a', shade: '#b4aa9f', shadeD: '#9a9088', glass: '#10303f', glassHi: '#3f7f8f' };
const poly = (pts, fill) => `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${fill}"/>`;

function ship() {
  return [
    `<g stroke="#0a1022" stroke-width=".07" stroke-linejoin="round">`,
    poly([N, L, TL, Sp], C.ivoryL), poly([N, Sp, TR, R], C.ivoryR), // silueta de base, sin huecos
    poly([N, P1, Q1], C.ivoryL), poly([N, Q1, Sp], C.ivoryL), poly([P1, L, Q1], C.coralD), poly([L, P2, Q1], C.coralD),
    poly([P2, TL, Sp], C.shadeD), poly([P2, Sp, Q1], C.shadeD),
    poly([N, Sp, Q2], C.ivoryR), poly([N, Q2, P3], C.ivoryR), poly([Q2, R, P3], C.coral), poly([P4, R, Q2], C.coral),
    poly([TR, P4, Q2], C.shade), poly([TR, Q2, Sp], C.shade),
    poly([TL, TR, Sp], C.shade),
    `</g>`,
    // cabina
    poly([[0, -1.15], [-0.38, 0.1], [0, 0.35], [0.38, 0.1]], C.glass),
    poly([[0, -1.05], [0.3, 0.05], [0.08, 0.05]], C.glassHi),
    // toberas
    `<circle cx="-.45" cy="1.45" r=".62" fill="url(#jet)"/><circle cx=".45" cy="1.45" r=".62" fill="url(#jet)"/>`,
    // luces de navegación: rojo a babor, verde a estribor
    `<circle cx="-2.33" cy="1.55" r=".16" fill="#ff3b30"/><circle cx="2.33" cy="1.55" r=".16" fill="#3dff8b"/>`
  ].join('');
}
const defs = `<defs>
  <radialGradient id="jet"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#7ff0e1"/><stop offset="1" stop-color="#7ff0e1" stop-opacity="0"/></radialGradient>
  <radialGradient id="sky" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#1a2d5c"/><stop offset=".7" stop-color="#0d1530"/><stop offset="1" stop-color="#0a1022"/></radialGradient>
  <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4ff" stop-opacity=".55"/><stop offset="1" stop-color="#5fb4ff" stop-opacity="0"/></linearGradient>
</defs>`;

// La nave centrada en (cx, cy) con escala s. El centro óptico queda un poco por debajo del medio de la caja.
const shipAt = (cx, cy, s) => `<g transform="translate(${cx} ${cy + 0.074 * s}) scale(${s})">${ship()}</g>`;
// Fondo: azul noche con el borde de un planeta abajo
const sky = (w, h) => `<rect width="${w}" height="${h}" fill="url(#sky)"/>` +
  `<ellipse cx="${w / 2}" cy="${h * 1.62}" rx="${w * 0.95}" ry="${h * 0.8}" fill="#0f1f45" stroke="url(#rim)" stroke-width="${Math.max(w, h) * 0.012}"/>`;

const svgForeground = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">${defs}${shipAt(54, 54, 9.3)}</svg>`;
const svgLegacy = round => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">${defs}
  <clipPath id="c">${round ? '<circle cx="54" cy="54" r="54"/>' : '<rect width="108" height="108" rx="18"/>'}</clipPath>
  <g clip-path="url(#c)">${sky(108, 108)}${shipAt(54, 52, 14.5)}</g></svg>`;
const svgSplash = (w, h) => {
  const m = Math.min(w, h), s = m * 0.07;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${defs}${sky(w, h)}${shipAt(w / 2, h / 2 - m * 0.06, s)}
  <text x="${w / 2}" y="${h / 2 + m * 0.3}" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="${m * 0.075}" letter-spacing="${m * 0.02}" fill="#f5ebd6">DELTA UNO</text></svg>`;
};

const png = (svg, w, h, file) => sharp(Buffer.from(svg), { density: 300 }).resize(w, h).png({ compressionLevel: 9 }).toFile(file);

const DPI = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const jobs = [];
for (const [d, k] of Object.entries(DPI)) {
  const dir = path.join(RES, 'mipmap-' + d);
  mkdirSync(dir, { recursive: true });
  jobs.push(png(svgForeground(), 108 * k, 108 * k, path.join(dir, 'ic_launcher_foreground.png')));
  jobs.push(png(svgLegacy(false), 48 * k, 48 * k, path.join(dir, 'ic_launcher.png')));
  jobs.push(png(svgLegacy(true), 48 * k, 48 * k, path.join(dir, 'ic_launcher_round.png')));
}
// Pantallas de carga (Android 11 o anterior): mismos tamaños que dejó Capacitor
const SPLASH = {
  'drawable': [480, 320], 'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280], 'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800],
  'drawable-port-xhdpi': [720, 1280], 'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920]
};
for (const [d, [w, h]] of Object.entries(SPLASH)) jobs.push(png(svgSplash(w, h), w, h, path.join(RES, d, 'splash.png')));
// Vista previa y favicon
writeFileSync(path.join(ROOT, 'scripts/icono.svg'), svgLegacy(false));
await Promise.all(jobs);
console.log('Listo: ' + jobs.length + ' imágenes en android/app/src/main/res');
