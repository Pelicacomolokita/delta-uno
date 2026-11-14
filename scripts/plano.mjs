/* Pasa el plano maestro (carta solar) al marco del motor y escribe src/mundo/lugares.js.
   La carta del plano tiene el Sol en (-1,0,0); el motor lo tiene en otra dirección, así que hace
   falta una rotación rígida. El eje queda fijado por el Sol; el giro que sobra alrededor de ese eje
   se eligió para que Costa Clara quede lo más cerca posible de donde ya estaba, y así la misión 1
   se mueva poco. Ver docs/historia/encargo-P0.1.md.

   Uso: node scripts/plano.mjs
*/
import { readFileSync, writeFileSync } from 'node:fs';

const J = JSON.parse(readFileSync('docs/historia/plano-maestro.json', 'utf8'));
const R = J.radio_planeta_m;
const GIRO = 328 * Math.PI / 180;        // elegido midiendo: ver el comentario de arriba
const SUN = unit([0.55, 0.45, -0.7]);

function unit(v) { const l = Math.hypot(...v); return v.map(c => c / l); }
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mul = (M, v) => [dot(M[0], v), dot(M[1], v), dot(M[2], v)];
const mm = (A, B) => A.map(r => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
function rotAxis([x, y, z], a) {
  const c = Math.cos(a), s = Math.sin(a), C = 1 - c;
  return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s],
          [y * x * C + z * s, c + y * y * C, y * z * C - x * s],
          [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
}
// Carta solar -> vector unitario, tal como lo define el JSON
function carta(xkm, ykm) {
  const lon = xkm * 1000 / R, lat = ykm * 1000 / R, c = Math.cos(lat);
  return [Math.sin(lon) * c, Math.sin(lat), Math.cos(lon) * c];
}
const ejeSol = unit(cross([-1, 0, 0], SUN));
const R0 = rotAxis(ejeSol, Math.atan2(Math.hypot(...cross([-1, 0, 0], SUN)), dot([-1, 0, 0], SUN)));
const ROT = mm(rotAxis(SUN, GIRO), R0);
const alMotor = (xkm, ykm) => mul(ROT, carta(xkm, ykm)).map(c => +c.toFixed(5));

const regiones = J.regiones.map(r => ({ id: r.id, nombre: r.nombre, u: alMotor(...r.centro_km), ext: r.extension_visual_km }));
const lugares = J.lugares.map(l => ({ id: l.id, nombre: l.nombre, region: l.region, tipo: l.tipo, control: l.control_inicial, que: l.funcion, u: alMotor(l.x_km, l.y_km) }));
const conexiones = J.conexiones.map(c => ({ de: c.desde, a: c.hasta, tipo: c.tipo, m: c.distancia_geodesica_m }));
const misiones = J.misiones.map(m => ({ id: m.id, titulo: m.titulo, ruta: m.itinerario, min: m.duracion_min, nota: m.nota }));

const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const uno = o => `  { id:'${o.id}', nombre:'${esc(o.nombre)}', region:'${o.region}', tipo:'${o.tipo}', control:'${esc(o.control)}', u:[${o.u.join(',')}],\n    que:'${esc(o.que)}' }`;

writeFileSync('src/mundo/lugares.js', `/* ---------- Los lugares de Nácar ----------
   GENERADO POR scripts/plano.mjs A PARTIR DE docs/historia/plano-maestro.json. No editar a mano:
   volvé a correr el script. El plano viene en carta solar y acá ya está girado al marco del motor.

   u: dirección unitaria sobre la esfera. La posición en metros es u * (PLANET_R + altura del terreno).
   Los IDs son los del plano (CO01, AG03…) y no cambian: las misiones los nombran.
*/

export const PLANO = { version: '${J.version}', radio: ${R}, giroGrados: ${(GIRO * 180 / Math.PI).toFixed(1)} };

export const REGIONES_PLANO = [
${regiones.map(r => `  { id:'${r.id}', nombre:'${esc(r.nombre)}', u:[${r.u.join(',')}], ext:[${r.ext.join(',')}] }`).join(',\n')}
];

// 37 lugares con nombre. tipo: base, ciudad, puerto, nodo, puente, deposito, fortaleza,
// industria, plataforma, asentamiento, reunion, vuelo, jefe, central, misil.
export const LUGARES = [
${lugares.map(uno).join(',\n')}
];

export const CONEXIONES = [
${conexiones.map(c => `  { de:'${c.de}', a:'${c.a}', tipo:'${c.tipo}', m:${c.m} }`).join(',\n')}
];

// Itinerario de cada misión: por qué lugares pasa, en orden.
export const ITINERARIOS = [
${misiones.map(m => `  { id:'${m.id}', titulo:'${esc(m.titulo)}', ruta:[${m.ruta.map(r => `'${r}'`).join(',')}], min:[${m.min[0] ?? 'null'},${m.min[1] ?? 'null'}],\n    nota:'${esc(m.nota)}' }`).join(',\n')}
];

export const porId = id => LUGARES.find(l => l.id === id) || null;
export const deRegion = r => LUGARES.filter(l => l.region === r);
`);

// Informe para el registro
const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) * 180 / Math.PI;
console.log(`${lugares.length} lugares, ${conexiones.length} conexiones, ${misiones.length} misiones.`);
console.log('comprobación del Sol:', mul(ROT, [-1, 0, 0]).map(c => c.toFixed(4)).join(', '), 'contra', SUN.map(c => c.toFixed(4)).join(', '));
console.log('\nregión                 sol    polo   lugares');
for (const r of regiones) console.log(`${r.nombre.padEnd(22)} ${dot(r.u, SUN).toFixed(2).padStart(5)}  ${Math.abs(r.u[0]).toFixed(2)}   ${lugares.filter(l => l.region === r.id).length}`);
let peor = 0, cual = '';
for (const c of conexiones) {
  const a = lugares.find(l => l.id === c.de), b = lugares.find(l => l.id === c.a);
  const m = ang(a.u, b.u) / 360 * 2 * Math.PI * R, e = Math.abs(m - c.m);
  if (e > peor) { peor = e; cual = c.de + '-' + c.a; }
}
console.log(`\ndistancias: el peor desvío contra el plano es ${peor.toFixed(0)} m (${cual})`);
