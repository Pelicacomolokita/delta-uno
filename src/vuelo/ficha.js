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
