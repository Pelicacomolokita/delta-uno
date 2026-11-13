// Enemigos y dificultad: los stats de cada tipo y cómo los cambia cada nivel.
const DEG = Math.PI / 180;

export const ENEMY_DEF = {
  caza: { name: 'Caza', hp: 3, patrol: 48, attack: 66, turn: 1.05, hit: 3.6, range: 420, cone: Math.cos(7 * DEG), burstN: 3, coolA: 1.7, coolB: 1.2, dmg: 8, breakDist: 75, score: 100, drop: .35, boom: 9, scale: 1 },
  pesada: { name: 'Pesada', hp: 12, patrol: 36, attack: 46, turn: .55, hit: 7.4, range: 480, cone: Math.cos(8.5 * DEG), burstN: 4, coolA: 2.4, coolB: 1.2, dmg: 14, breakDist: 130, score: 400, drop: 1, boom: 20, scale: 2.1 },
  interceptor: { name: 'Interceptor', hp: 2, patrol: 62, attack: 98, turn: 1.35, hit: 3.2, range: 380, cone: Math.cos(6 * DEG), burstN: 2, coolA: 1.3, coolB: .8, dmg: 6, breakDist: 150, breakTime: 2.6, score: 150, drop: .3, boom: 8, scale: .9 },
  dron: { name: 'Dron', hp: 1, patrol: 58, attack: 86, turn: 1.9, hit: 2.6, range: 0, cone: 2, burstN: 0, coolA: 99, coolB: 0, dmg: 0, breakDist: 0, ram: 12, score: 40, drop: .06, boom: 6, scale: .6 },
  torreta: { name: 'Torreta', hp: 7, patrol: 0, attack: 0, turn: 1.1, hit: 7.5, range: 680, radar: 800, cone: Math.cos(5 * DEG), burstN: 3, coolA: 2.2, coolB: 1.4, dmg: 9, breakDist: 0, ground: true, score: 250, drop: .5, boom: 16, scale: 2.2 },
  // Lanzamisiles: te fija con línea de vista y tira un misil que te persigue (ver Misiles enemigos)
  lanzamisiles: { name: 'Lanzamisiles', hp: 6, patrol: 0, attack: 0, turn: .9, hit: 7, range: 1100, radar: 900, cone: -1, burstN: 0, coolA: 99, coolB: 0, dmg: 0, breakDist: 0, ground: true, launcher: true, lockTime: 2.5, reload: 9, score: 300, drop: .6, boom: 18, scale: 2 },
  nodriza: { name: 'Nodriza', hp: 60, patrol: 30, attack: 30, turn: .22, hit: 16, range: 560, cone: -1, gimbal: Math.PI, burstN: 5, coolA: 2.6, coolB: 1.6, dmg: 10, breakDist: 0, carrier: true, score: 2000, drop: 1, boom: 46, scale: 5.2 }
};

// Puntería enemiga activa. La dificultad le copia encima la suya al empezar cada partida.
export const AIM = {
  lag: .3,          // s: ven tu rumbo con este retraso, así que maniobrar les hace errar
  errMin: 1.6,      // m: desvío de cada tiro aunque estén encima
  errK: .01,        // m por metro de distancia: de lejos se abren más
  gimbal: 3 * DEG   // el cañón corrige como mucho esto respecto de la trompa: la bala sale derecha
};

export const DIFF = {
  facil: { name: 'Fácil', lives: Infinity, aim: { lag: .45, errMin: 2.6, errK: .014 }, assist: true, note: 'Vidas infinitas. Los enemigos apuntan peor.' },
  medio: { name: 'Medio', lives: 5, aim: { lag: .3, errMin: 1.6, errK: .01 }, assist: true, note: '5 vidas.' },
  dificil: { name: 'Difícil', lives: 3, aim: { lag: .22, errMin: 1.1, errK: .008 }, assist: true, note: '3 vidas. Los enemigos apuntan mejor.' },
  extremo: { name: 'Extremo', lives: 1, aim: { lag: .22, errMin: 1.1, errK: .008 }, assist: false, note: '1 vida y sin ayudas para apuntar: tus tiros no se corrigen solos y no hay marca de impacto.' }
};
