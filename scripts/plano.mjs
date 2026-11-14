/* Pasa el plano maestro (carta solar) al marco del motor y escribe src/mundo/lugares.js.

   QUÉ SE CONSERVA AL GIRAR, Y POR QUÉ ESTE Y NO EL SOL
   El plano viene en carta solar, con el Sol en (-1,0,0) y su polo norte en (0,1,0). El motor tiene
   sus polos en ±X (de ahí sale la temperatura del terreno) y el Sol le da una vuelta al planeta cada
   DIA_S segundos. Entonces el Sol no es un punto fijo del mundo y el eje sí: lo que hay que hacer
   coincidir es el POLO del plano con el polo del motor, no el Sol con el Sol.

   La primera versión de este script conservaba el Sol y repartía el resto con un giro de 328° elegido
   para que Costa Clara no se moviera. Eso le tiraba la franja tropical del plano encima del polo del
   motor, y dejaba a Salinas del Sur, el Paso del Deshielo y Corona Negra en noche polar permanente:
   cero horas de luz, medido. Las siete regiones del plano están entre latitud -15,7° y +18,3°, así que
   ninguna es polar: el polo era un invento de la conversión.

   Ahora: el polo del plano va al +X del motor. El giro que sobra, alrededor de ese eje, no tiene ninguna
   consecuencia geométrica —solo corre el reloj— así que queda en 0, y en cambio se elige la dirección del
   Sol a la hora 0 para que Costa Clara arranque con el Sol a 35°, como estaba antes.

   Uso: node scripts/plano.mjs
*/
import { readFileSync, writeFileSync } from 'node:fs';

const J = JSON.parse(readFileSync('docs/historia/plano-maestro.json', 'utf8'));
const R = J.radio_planeta_m;
const GIRO = 0;                 // el giro sobrante alrededor del eje solo corre el reloj: no cambia nada
const SOL_ALTURA0 = 35;         // grados del Sol sobre Costa Clara a la hora 0 (como venía siendo)

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
/* El polo norte del plano (0,1,0) va al +X del motor: un cuarto de vuelta alrededor de Z.
   Con eso la franja tropical del plano cae sobre la franja tropical del motor, que es lo que corresponde. */
const POLO = mm(rotAxis([0, 0, 1], -Math.PI / 2), [[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
const ROT = mm(rotAxis([1, 0, 0], GIRO), POLO);
const alMotor = (xkm, ykm) => mul(ROT, carta(xkm, ykm)).map(c => +c.toFixed(5));

/* El Sol a la hora 0. Costa Clara está en la latitud 0 del plano, así que cae justo sobre el ecuador del
   motor; el Sol sale de correrla SOL_ALTURA0 grados menos de un cuarto de vuelta alrededor del eje, y
   queda también sobre el ecuador (x = 0), que es lo que hace que el día dure lo mismo en todas las regiones. */
const ccPlano = (() => { const r = J.regiones.find(x => x.id === 'CO'); return mul(ROT, carta(...r.centro_km)); })();
const SOL0 = unit(mul(rotAxis([1, 0, 0], (90 - SOL_ALTURA0) * Math.PI / 180), ccPlano)).map(c => +c.toFixed(5));

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

/* La dirección del Sol a la hora 0, ya en el marco del motor. El Sol gira alrededor del eje ±X del planeta,
   y este vector dice dónde arranca: a esta hora Costa Clara lo tiene a ${SOL_ALTURA0}° sobre el horizonte.
   Está sobre el ecuador (x = 0), así que todas las regiones del plano tienen día y noche parejos. */
export const SOL_HORA0 = [${SOL0.join(',')}];

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
console.log('polo del plano -> motor:', mul(ROT, [0, 1, 0]).map(c => c.toFixed(4)).join(', '), '(tiene que ser 1, 0, 0)');
console.log('Sol a la hora 0:', SOL0.join(', '), '· su x es', SOL0[0].toFixed(4), '(sobre el ecuador si es 0)');
// horas de luz de cada región a lo largo del día, girando el Sol alrededor del eje
const horasLuz = u => { let n = 0; for (let k = 0; k < 480; k++) { if (dot(mul(rotAxis([1, 0, 0], k / 480 * 2 * Math.PI), SOL0), u) > 0) n++; } return n / 480 * 24; };
const solMax = u => { let m = -9; for (let k = 0; k < 480; k++) { const d = dot(mul(rotAxis([1, 0, 0], k / 480 * 2 * Math.PI), SOL0), u); if (d > m) m = d; } return Math.asin(Math.max(-1, Math.min(1, m))) * 180 / Math.PI; };
console.log('\nregión                 lat plano   |x| motor   horas de luz   sol más alto   lugares');
for (const r of regiones) {
  const pr = J.regiones.find(x => x.id === r.id), lat = (pr.centro_km[1] * 1000 / R) * 180 / Math.PI;
  console.log(`${r.nombre.padEnd(22)} ${lat.toFixed(1).padStart(7)}°  ${Math.abs(r.u[0]).toFixed(2).padStart(8)}  ${horasLuz(r.u).toFixed(1).padStart(10)} h  ${solMax(r.u).toFixed(0).padStart(11)}°  ${String(lugares.filter(l => l.region === r.id).length).padStart(8)}`);
}
let peor = 0, cual = '';
for (const c of conexiones) {
  const a = lugares.find(l => l.id === c.de), b = lugares.find(l => l.id === c.a);
  const m = ang(a.u, b.u) / 360 * 2 * Math.PI * R, e = Math.abs(m - c.m);
  if (e > peor) { peor = e; cual = c.de + '-' + c.a; }
}
console.log(`\ndistancias: el peor desvío contra el plano es ${peor.toFixed(0)} m (${cual})`);
