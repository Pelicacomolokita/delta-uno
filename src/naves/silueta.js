/* ---------- Silueta de choque por diseño ----------
   Reemplaza al triángulo único de boltHitsShip (punta (0,-3), alas (±2,4, 1,6), medio espesor 0,62).
   Cada diseño tiene 2 formas vistas desde arriba, sacadas de su propia malla (nivel 2, ya escalada):
   - "cuerpo": el fuselaje (y las góndolas pegadas), con el medio espesor del fuselaje.
   - "planta": todo lo demás que se ve desde arriba (alas, estabilizadores), finita.
   Cada forma es un polígono convexo en X-Z (coordenadas de la nave: -Z adelante) con su altura central y medio espesor.
   El chequeo: primero una esfera (como hoy), después un punto adentro de alguna forma, con margen por el grosor de la bala. */
import { armarDiseno } from './generador.js';
import { DISENOS, ESCALA_CLASE } from './disenos.js';

function envolvente(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1)); // sentido antihorario en (x, z)
}
const area = h => Math.abs(h.reduce((s, p, i) => { const q = h[(i + 1) % h.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;

const cache = {};
export function siluetaDiseno(id) {
  if (cache[id]) return cache[id];
  const base = DISENOS[id], k = ESCALA_CLASE[base.clase] || 1, d = armarDiseno({ ...base, escala: k }, 2);
  // ancho del cuerpo: el fuselaje más ancho (y sus góndolas) del diseño
  const fus = base.piezas.filter(p => p.tipo === 'fuselaje');
  const wCuerpo = Math.max(...fus.map(f => Math.abs(f.x || 0) + Math.max(...f.est.map(e => e[1])))) * k;
  const yt = Math.max(...fus.flatMap(f => f.est.map(e => e[2]))) * k, yb = Math.min(...fus.flatMap(f => f.est.map(e => e[3]))) * k;
  const cuerpo = [], planta = [];
  let r = 0;
  for (let i = 0; i < d.pos.length; i += 3) {
    const x = d.pos[i], y = d.pos[i + 1], z = d.pos[i + 2];
    r = Math.max(r, Math.hypot(x, y, z));
    if (Math.abs(x) <= wCuerpo + 0.05 && y <= yt + 0.05 && y >= yb - 0.05) cuerpo.push([x, z]);
    planta.push([x, z]);
  }
  const formas = [
    { nombre: 'cuerpo', poly: envolvente(cuerpo), yc: (yt + yb) / 2, h: (yt - yb) / 2 },
    { nombre: 'planta', poly: envolvente(planta), yc: 0, h: Math.max(0.3, 0.14 * k) }
  ];
  for (const f of formas) f.area = area(f.poly);
  return (cache[id] = { id, radio: r, formas, area: formas[1].area });
}

// punto en coordenadas de la nave (sin girar): ¿pega? margen: medio grosor de la bala (el juego usa 0,45 m)
export function golpea(sil, x, y, z, margen = 0.45) {
  if (x * x + y * y + z * z > (sil.radio + margen) ** 2) return false;
  for (const f of sil.formas) {
    if (Math.abs(y - f.yc) > f.h + margen) continue;
    const P = f.poly; let dentro = true;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez) || 1;
      // distancia con signo al borde (positiva hacia adentro, en sentido antihorario)
      if ((ex * (z - a[1]) - ez * (x - a[0])) / L < -margen) { dentro = false; break; }
    }
    if (dentro) return true;
  }
  return false;
}
