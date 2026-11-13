// Ficha de vuelo del jugador: todo lo que define cómo se siente la nave.
// TUNE es la ficha activa. El juego la lee en cada cuadro, así que cambiar de nave
// es copiarle encima otra ficha con aplicarFicha().
export const TUNE = {
  vmax: 130,        // velocidad a empuje 100 %
  pitch: 1.35,      // cabeceo, rad/s
  roll: 3.3,        // rotación con botones o en manual, rad/s
  rudder: .85,      // timón en modo manual, rad/s
  yaw: .4,          // giro directo de la palanca en asistido, rad/s
  bankTurn: .9,     // cuánto dobla la nave por estar inclinada, rad/s a 90°
  maxBank: 72 * Math.PI / 180, // inclinación máxima que pide la palanca en asistido
  level: 4.2,       // fuerza con la que busca esa inclinación
  resp: 5.5,        // inercia de los giros (más alto = más seco)
  pitchResp: 5.5,   // inercia del cabeceo (más alto = la trompa responde antes)
  grip: 4.5,        // agarre: qué tan rápido la velocidad sigue a la nariz
  engine: 1.8,      // respuesta del motor
  // Motor y calor
  cruise: .5,       // empuje de crucero: hasta acá no calienta
  throttleMin: .2,
  heatTime: 6,      // segundos a 100 % hasta recalentar
  coolTime: 8,      // segundos para enfriar del todo
  overheatLock: 3,  // segundos que el motor queda caído al recalentar
  overheatThrust: .3, // empuje mientras está caído
  // Casco y carga
  hull: 100,
  missiles: 4
};

// La ficha tal cual arranca, para poder volver a ella
export const TUNE_BASE = { ...TUNE };

export const SENS = { suave: .72, media: 1, rapida: 1.3 };

// Copia una ficha encima de la activa. Lo que la ficha no trae queda como en la base.
export function aplicarFicha(ficha) {
  Object.assign(TUNE, TUNE_BASE, ficha || {});
  return TUNE;
}

// Fichas por clase, aprobadas el 13/11 para el planeta grande (velocidades en m/s, giros en rad/s).
// El cabeceo es más vivo que la rotación: con el teléfono horizontal se ve poco arriba y abajo,
// así que subir y bajar la trompa tiene que responder rápido.
const G = Math.PI / 180;
export const FICHAS = {
  caza:         { vmax: 200, cruise: 130 / 200, heatTime: 22, coolTime: 5, pitch: 125 * G, roll: 170 * G, bankTurn: .9,  pitchResp: 8,   hull: 100, missiles: 4 },
  interceptor:  { vmax: 235, cruise: 155 / 235, heatTime: 16, coolTime: 4, pitch: 115 * G, roll: 205 * G, bankTurn: .95, pitchResp: 8.5, hull: 75,  missiles: 4 },
  ataque:       { vmax: 170, cruise: 115 / 170, heatTime: 30, coolTime: 6, pitch: 85 * G,  roll: 110 * G, bankTurn: .7,  pitchResp: 6.5, hull: 160, missiles: 4 },
  infiltracion: { vmax: 195, cruise: 120 / 195, heatTime: 26, coolTime: 5, pitch: 110 * G, roll: 160 * G, bankTurn: .9,  pitchResp: 8,   hull: 85,  missiles: 4 }
};

// Cuánto cabecea según la velocidad: menos muy lento (las alas no muerden) y un poco menos a fondo.
export function factorCabeceo(v, vmax) {
  const q = Math.max(0, Math.min(1.2, v / vmax));
  const s = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  return .6 + .4 * s(.1, .45, q) - .15 * s(.75, 1, q);
}

// Velocidades del combate que acompañan a la nave: balas, misil y alcance del fijado
export const COMBATE = {
  balas: 600,      // m/s (antes 430)
  misil: 450,      // m/s (antes 310)
  balasEnemigas: 380, // m/s (antes 270)
  misilEnemigo: 160,  // m/s (antes 118): más lento que cualquier nave a fondo
  enemigos: 2      // los enemigos van al doble que en la demo, igual que tu crucero
};

// Gravedad regulada: crece con la altura y cuando vas muy lento.
export const GRAVEDAD = {
  baja: 600,       // m sobre el mar: hasta acá es normal
  alta: 1300,      // m: desde acá gana aunque vayas a fondo
  tope: 1620,      // m: techo duro
  caida: 10,       // m/s² que te hunde cuando las alas no sostienen
  perdida: .33     // por debajo de esta fracción de vmax las alas dejan de sostener
};

// Hasta dónde puede caer la nave por gravedad (m/s): 0 sostiene; 1 cae con toda la gravedad
export function sustentacion(v, vmax) {
  const q = v / vmax, p = GRAVEDAD.perdida;
  return Math.max(0, Math.min(1, (q - p * .5) / (p * .5)));
}
