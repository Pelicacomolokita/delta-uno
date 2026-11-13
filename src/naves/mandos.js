/* ---------- Mandos: de la palanca a las piezas ----------
   Las piezas no se mueven solas: siguen a los mandos, como en un avión.
   - Palanca a los costados (roll): alerones opuestos; en las alas delta y en los estabilizadores
     de cola, la misma superficie hace de alerón y de elevador (elevón).
   - Palanca adelante/atrás (pitch): elevadores. Tirar = trompa arriba = borde de fuga arriba.
   - Pedales (yaw): timones, que además acompañan un poco los giros (vuelo coordinado).
   - Empuje y turbo: toberas. Cortar empuje o frenar: frenos de aire.
   Cada pieza tiene una velocidad máxima de movimiento (como un mando hidráulico) y a mucha velocidad
   se mueve menos, porque el aire empuja más.
   Usado por el Hangar (simulador) y, cuando se integre, por el juego: una sola función para los dos. */

// tiempo para recorrer todo el recorrido, en segundos
const RECORRIDO = { aleron: 0.32, timon: 0.4, elevador: 0.35, freno: 0.9, tobera: 0.6, compuertas: 1.6, camuflaje: 1.1 };

export function crearMandos() {
  return {
    // entrada (lo que hace el piloto o la IA)
    roll: 0, pitch: 0, yaw: 0, empuje: 0.5, turbo: false, freno: false, compuertas: false, camuflaje: false, velocidad: 130,
    // salida: deflexión de cada pieza, de -1 a 1 (o de 0 a 1), lista para la flota
    anim: [0, 0, 0, 0, 0, 0, 0]
  };
}

const lim = (v, a, b) => Math.max(a, Math.min(b, v));
function hacia(actual, objetivo, tiempo, dt) {
  const paso = dt / tiempo * 2; // de -1 a 1 son 2 unidades
  return actual + lim(objetivo - actual, -paso, paso);
}

/* Avanza un cuadro. m: mandos. dt: segundos. Devuelve m.anim con
   [alerón, timón, elevador, freno, tobera, compuertas, camuflaje]. */
export function actualizarMandos(m, dt) {
  const a = m.anim;
  // a mucha velocidad las superficies se mueven menos (la presión del aire)
  const q = lim(1.25 - m.velocidad / 260, 0.55, 1);
  const roll = lim(m.roll, -1, 1), pitch = lim(m.pitch, -1, 1), yaw = lim(m.yaw, -1, 1);
  const obj = [
    -roll * q,                                      // palanca a la derecha: alerón derecho arriba
    lim(yaw + roll * 0.25, -1, 1) * q,              // timón coordinado con el alabeo
    lim(-pitch * q - 0.04, -1, 1),                 // tirar: borde de fuga arriba; un poco de compensación
    m.freno || m.empuje < 0.05 ? 1 : 0,
    m.turbo ? 1 : lim((m.empuje - 0.5) * 0.6, 0, 0.3),
    m.compuertas ? 1 : 0,
    m.camuflaje ? 1 : 0
  ];
  const tiempos = [RECORRIDO.aleron, RECORRIDO.timon, RECORRIDO.elevador, RECORRIDO.freno, RECORRIDO.tobera, RECORRIDO.compuertas, RECORRIDO.camuflaje];
  for (let i = 0; i < 7; i++) a[i] = hacia(a[i], obj[i], tiempos[i], dt);
  return a;
}

/* Maniobras de demostración para el Hangar: devuelven la entrada del piloto y la actitud de la nave
   (alabeo, cabeceo, guiñada, en radianes) en el segundo t. Duran lo que dice "dur". */
export const MANIOBRAS = {
  viraje: { nombre: 'Viraje', dur: 6, paso(t) {
    // entra en el giro, lo sostiene tirando, y sale
    const entra = t < 1 ? 1 : t < 4.5 ? 0.15 : t < 5.5 ? -1 : 0;
    const bank = Math.min(1, t / 1) * (t < 4.5 ? 1 : Math.max(0, 1 - (t - 4.5)));
    return { roll: entra, pitch: t > 1 && t < 4.5 ? 0.6 : 0, yaw: 0, empuje: 0.7, actitud: [bank * 1.05, 0.05 * bank, 0] };
  } },
  tonel: { nombre: 'Tonel', dur: 3.2, paso(t) {
    const r = t < 2.6 ? 1 : t < 3.0 ? -0.6 : 0;
    const ang = Math.min(1, t / 2.8) * Math.PI * 2;
    return { roll: r, pitch: 0.1, yaw: 0, empuje: 0.7, actitud: [ang, 0, 0] };
  } },
  looping: { nombre: 'Looping', dur: 6, paso(t) {
    const p = t < 5 ? 1 : 0;
    const ang = Math.min(1, t / 5.2) * Math.PI * 2;
    return { roll: 0, pitch: p, yaw: 0, empuje: 1, turbo: t > 0.4 && t < 2.6, actitud: [0, ang, 0] };
  } },
  derrape: { nombre: 'Derrape', dur: 4, paso(t) {
    const y = t < 1.6 ? 1 : t < 3.2 ? -1 : 0;
    return { roll: -y * 0.15, pitch: 0, yaw: y, empuje: 0.5, actitud: [-y * 0.08, 0, Math.sin(t / 3.2 * Math.PI * 2) * 0.35] };
  } },
  frenada: { nombre: 'Frenada y turbo', dur: 5, paso(t) {
    return { roll: 0, pitch: t < 2 ? 0.2 : 0, yaw: 0, empuje: t < 2 ? 0 : 1, freno: t < 2, turbo: t >= 2.4 && t < 4.4, actitud: [0, t < 2 ? 0.08 : 0, 0] };
  } },
  bodega: { nombre: 'Bodega y camuflaje', dur: 6, paso(t) {
    return { roll: 0, pitch: 0, yaw: 0, empuje: 0.5, compuertas: t > 0.3 && t < 3, camuflaje: t > 3.2 && t < 5.6, actitud: [0, 0, 0] };
  } }
};
