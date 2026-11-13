// Enemigos y dificultad: los stats de cada tipo y cómo los cambia cada nivel.
const DEG = Math.PI / 180;

// Velocidades ×1.5 y alcances ×1.15 respecto de la demo, para acompañar a las naves del planeta grande.
// punteria: 1 = la de la dificultad; más alto apunta mejor.

export const ENEMY_DEF = {
  caza: { name: 'Caza', hp: 3, patrol: 72, attack: 99, turn: 1.05, hit: 3.6, range: 480, cone: Math.cos(7 * DEG), burstN: 3, coolA: 1.7, coolB: 1.2, dmg: 9, punteria: 1, breakDist: 90, score: 100, drop: .35, boom: 9, scale: 1 },
  pesada: { name: 'Pesada', hp: 12, patrol: 54, attack: 69, turn: .55, hit: 7.4, range: 550, cone: Math.cos(8.5 * DEG), burstN: 4, coolA: 2.4, coolB: 1.2, dmg: 16, punteria: .7, breakDist: 150, score: 400, drop: 1, boom: 20, scale: 2.1 },
  interceptor: { name: 'Interceptor', hp: 2, patrol: 93, attack: 147, turn: 1.35, hit: 3.2, range: 440, cone: Math.cos(6 * DEG), burstN: 2, coolA: 1.3, coolB: .8, dmg: 7, punteria: 1.3, breakDist: 175, breakTime: 2.6, score: 150, drop: .3, boom: 8, scale: .9 },
  dron: { name: 'Dron', hp: 1, patrol: 87, attack: 129, turn: 1.9, hit: 2.6, range: 0, cone: 2, burstN: 0, coolA: 99, coolB: 0, dmg: 0, breakDist: 0, ram: 12, score: 40, drop: .06, boom: 6, scale: .6 },
  torreta: { name: 'Torreta', hp: 7, patrol: 0, attack: 0, turn: 1.1, hit: 7.5, range: 780, radar: 900, cone: Math.cos(5 * DEG), burstN: 3, coolA: 2.2, coolB: 1.4, dmg: 10, punteria: 1.2, breakDist: 0, ground: true, score: 250, drop: .5, boom: 16, scale: 2.2 },
  // Lanzamisiles: te fija con línea de vista y tira un misil que te persigue (ver Misiles enemigos)
  lanzamisiles: { name: 'Lanzamisiles', hp: 6, patrol: 0, attack: 0, turn: .9, hit: 7, range: 1250, radar: 1050, cone: -1, burstN: 0, coolA: 99, coolB: 0, dmg: 0, breakDist: 0, ground: true, launcher: true, lockTime: 2.5, reload: 9, score: 300, drop: .6, boom: 18, scale: 2 },
  nodriza: { name: 'Nodriza', hp: 60, patrol: 45, attack: 45, turn: .22, hit: 16, range: 640, cone: -1, gimbal: Math.PI, burstN: 5, coolA: 2.6, coolB: 1.6, dmg: 10, punteria: .8, breakDist: 0, carrier: true, score: 2000, drop: 1, boom: 46, scale: 5.2 }
};

// Puntería enemiga activa. La dificultad le copia encima la suya al empezar cada partida.
export const AIM = {
  lag: .3,          // s: ven tu rumbo con este retraso, así que maniobrar les hace errar
  errMin: 1.6,      // m: desvío de cada tiro aunque estén encima
  errK: .01,        // m por metro de distancia: de lejos se abren más
  gimbal: 3 * DEG   // el cañón corrige como mucho esto respecto de la trompa: la bala sale derecha
};

// ventaja: cuánto más aguantan, pegan y apuntan los enemigos (1 = parejo).
// En Extremo además tenés menos misiles y una sola reparación por partida.
const AIM_BASE = { lag: .3, errMin: 1.6, errK: .01 };
const apuntar = v => ({ lag: AIM_BASE.lag / v, errMin: AIM_BASE.errMin / v, errK: AIM_BASE.errK / v });
export const DIFF = {
  facil: { name: 'Fácil', lives: Infinity, ventaja: .7, aim: apuntar(.7), assist: true, note: 'Vidas infinitas. Los enemigos aguantan, pegan y apuntan un 30 % menos.' },
  medio: { name: 'Medio', lives: 5, ventaja: 1, aim: apuntar(1), assist: true, note: '5 vidas. Enemigos parejos con vos.' },
  dificil: { name: 'Difícil', lives: 3, ventaja: 1.3, aim: apuntar(1.3), assist: true, note: '3 vidas. Los enemigos aguantan, pegan y apuntan un 30 % más.' },
  extremo: { name: 'Extremo', lives: 1, ventaja: 1.5, aim: apuntar(1.5), assist: false, misiles: 2, reparaciones: 1, note: '1 vida. Enemigos un 50 % más fuertes, 2 misiles, una sola reparación y sin ayudas para apuntar.' }
};

// Lo mismo, dicho para la Historia, donde no se cuentan vidas
export const NOTA_HISTORIA = {
  facil: 'Los enemigos aguantan, pegan y apuntan un 30 % menos.',
  medio: 'Enemigos parejos con vos.',
  dificil: 'Los enemigos aguantan, pegan y apuntan un 30 % más.',
  extremo: 'Enemigos un 50 % más fuertes, 2 misiles, una sola reparación y sin ayudas para apuntar.'
};
