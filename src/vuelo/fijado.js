// Fijado: qué enemigo marca el botón Blanco y a cuál se engancha el misil.
// Funciones puras: reciben la lista de enemigos, la posición y la trompa de la nave,
// y devuelven el elegido. El juego decide qué hacer con él.

export const FIJADO = {
  lockTime: .55,   // s para fijar el misil. Bajado de 1 a 0,55: con el ritmo del juego, un segundo entero fijando
                   // llega tarde a casi todo pase. Se vuelve a mirar cuando se trabajen las armas.
  lockRange: 1300, // m (antes 900)
  lockCone: .92,   // coseno: qué tan centrado tiene que estar para el misil
  tgtRange: 1800,  // m: hasta dónde llega el botón Blanco
  tgtCone: .94,    // coseno (unos 20°): el botón Blanco solo marca lo que tenés adelante
  cerca: 250,      // m: tan cerca se puede fijar también a los costados, nunca atrás
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
    if (d > R || d < 5 || !(c > C || (d < FIJADO.cerca && c > 0)) || !vale(e)) continue;
    if (e === actual) curOk = true;
    if (c > bestC) { bestC = c; best = e; }
  }
  if (preferido && preferido.on && actual !== preferido) { // el misil prefiere el blanco elegido si entra en el cono
    const { d, c } = mirar(preferido, pos, fwd);
    if (d <= R && d >= 5 && (c > C || (d < FIJADO.cerca && c > 0)) && vale(preferido)) return { blanco: preferido, reinicia: true };
  }
  if (!curOk) return { blanco: best, reinicia: true };
  return { blanco: actual, reinicia: false };
}

// Los que puede marcar el botón Blanco: adelante (o muy cerca y no atrás), al alcance y que valgan
export function candidatosBlanco(enemies, pos, fwd, vale = siempre) {
  return enemies.filter(e => {
    if (!e.on) return false;
    const { d, c } = mirar(e, pos, fwd);
    return d < FIJADO.tgtRange && (c > FIJADO.tgtCone || (d < FIJADO.cerca && c > 0)) && vale(e);
  });
}

// Qué tan bueno es como blanco: lo más centrado en la trompa, con un poco de preferencia por los cercanos y los que te atacan
function puntaje(e, pos, fwd) {
  const { d, c } = mirar(e, pos, fwd);
  return c * 4 - d / FIJADO.tgtRange * .3 + (e.group && e.group.state === 'attack' ? .05 : 0);
}

export function mejorBlanco(enemies, pos, fwd, vale = siempre) {
  let best = null, bs = -1e9;
  for (const e of candidatosBlanco(enemies, pos, fwd, vale)) {
    const s = puntaje(e, pos, fwd);
    if (s > bs) { bs = s; best = e; }
  }
  return best;
}

// Los siguientes: del más centrado al menos centrado, y vuelve a empezar
export function siguienteBlanco(enemies, pos, fwd, actual, vale = siempre) {
  const list = candidatosBlanco(enemies, pos, fwd, vale).sort((a, b) => puntaje(b, pos, fwd) - puntaje(a, pos, fwd));
  if (!list.length) return null;
  return list[(list.indexOf(actual) + 1) % list.length];
}

// ¿Sigue valiendo el blanco elegido o se perdió?
export function blancoPerdido(e, pos) {
  const x = e.pos.x - pos.x, y = e.pos.y - pos.y, z = e.pos.z - pos.z;
  return Math.sqrt(x * x + y * y + z * z) > FIJADO.tgtRange * FIJADO.tgtLose;
}
