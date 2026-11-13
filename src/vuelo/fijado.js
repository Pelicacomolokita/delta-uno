// Fijado: qué enemigo marca el botón Blanco y a cuál se engancha el misil.
// Funciones puras: reciben la lista de enemigos, la posición y la trompa de la nave,
// y devuelven el elegido. El juego decide qué hacer con él.

export const FIJADO = {
  lockTime: 1,     // s para fijar el misil
  lockRange: 900,  // m
  lockCone: .92,   // coseno: qué tan centrado tiene que estar para el misil
  tgtRange: 1800,  // m: hasta dónde llega el botón Blanco
  tgtLose: 1.25,   // el blanco se suelta pasado tgtRange por esto
  tgtHold: 450     // ms manteniendo el botón para soltar el blanco
};

// Distancia y coseno respecto de la trompa
function mirar(e, pos, fwd) {
  const x = e.pos.x - pos.x, y = e.pos.y - pos.y, z = e.pos.z - pos.z;
  const d = Math.sqrt(x * x + y * y + z * z);
  return { d, c: d > 0 ? (x * fwd.x + y * fwd.y + z * fwd.z) / d : 0 };
}

const siempre = () => true;

// Un cuadro del fijado del misil. Devuelve el blanco que queda y si el conteo vuelve a cero.
// vale(e): filtro extra (línea de vista, sector). preferido: el blanco elegido con el botón Blanco.
export function pasoFijado(enemies, pos, fwd, actual, preferido, vale = siempre) {
  const R = FIJADO.lockRange, C = FIJADO.lockCone;
  let best = null, bestC = C, curOk = false;
  for (const e of enemies) {
    const { d, c } = mirar(e, pos, fwd);
    if (d > R || d < 5 || c <= C || !vale(e)) continue;
    if (e === actual) curOk = true;
    if (c > bestC) { bestC = c; best = e; }
  }
  if (preferido && preferido.on && actual !== preferido) { // el misil prefiere el blanco elegido si entra en el cono
    const { d, c } = mirar(preferido, pos, fwd);
    if (d <= R && d >= 5 && c > C && vale(preferido)) return { blanco: preferido, reinicia: true };
  }
  if (!curOk) return { blanco: best, reinicia: true };
  return { blanco: actual, reinicia: false };
}

// Los que puede marcar el botón Blanco
export function candidatosBlanco(enemies, pos, fwd, vale = siempre) {
  return enemies.filter(e => e.on && mirar(e, pos, fwd).d < FIJADO.tgtRange && vale(e));
}

// El primero: el que está más adelante de la nariz, con preferencia por los cercanos y los que te atacan
export function mejorBlanco(enemies, pos, fwd, vale = siempre) {
  let best = null, bs = -1e9;
  for (const e of candidatosBlanco(enemies, pos, fwd, vale)) {
    const { d, c } = mirar(e, pos, fwd);
    const s = c * 1.2 - d / FIJADO.tgtRange + (e.group && e.group.state === 'attack' ? .3 : 0);
    if (s > bs) { bs = s; best = e; }
  }
  return best;
}

// Los siguientes: de más cerca a más lejos, y vuelve a empezar
export function siguienteBlanco(enemies, pos, fwd, actual, vale = siempre) {
  const list = candidatosBlanco(enemies, pos, fwd, vale).sort((a, b) => mirar(a, pos, fwd).d - mirar(b, pos, fwd).d);
  if (!list.length) return null;
  return list[(list.indexOf(actual) + 1) % list.length];
}

// ¿Sigue valiendo el blanco elegido o se perdió?
export function blancoPerdido(e, pos) {
  const x = e.pos.x - pos.x, y = e.pos.y - pos.y, z = e.pos.z - pos.z;
  return Math.sqrt(x * x + y * y + z * z) > FIJADO.tgtRange * FIJADO.tgtLose;
}
