/* ---------- Diseños de naves como listas de piezas ----------
   Mismos números que los planos (docs: lienzo "Delta Uno · Planos de naves"), en escala 1.
   La escala de la clase se aplica al armar la malla (ESCALA_CLASE).
   Por ahora están los 6 que usa la prueba de rendimiento; los 44 se pasan en el paso 5. */

export const ESCALA_CLASE = { interceptor: 1.25, caza: 1.3, infiltracion: 1.3, ataque: 1.6 };

// aleta vertical: base del borde de ataque, alto h, barrido, inclinación hacia afuera (grados)
function timon(base, cr, h, ct, barrido, cant = 0, extra = {}) {
  const a = cant * Math.PI / 180;
  return { tipo: 'superficie', rle: base, cr, tle: [base[0] + h * Math.sin(a), base[1] + h * Math.cos(a), base[2] + barrido], ct,
    t: 0.07, fill: 'acento', mov: [0.05, 0.98, 0.32], canal: 1, marca: 0.38, ...extra };
}
const ala = (rle, cr, tle, ct, mov = [0.45, 0.95, 0.25], extra = {}) => ({ tipo: 'superficie', rle, cr, tle, ct, mov, canal: 0, marca: 0.2, ...extra });

export const DISENOS = {
  A: {
    nombre: 'Delta compacto', clase: 'caza', bando: 'guardia', pintura: 'guardia', pinturas: ['guardia', 'guardiaNoche'],
    piezas: [
      { tipo: 'fuselaje', anillo: [-2.45, -2.2], est: [[-2.9, 0, 0.02, -0.02], [-2.3, 0.28, 0.18, -0.15], [-1.5, 0.42, 0.32, -0.35], [-0.7, 0.55, 0.44, -0.45], [0.4, 0.62, 0.45, -0.45], [1.9, 0.62, 0.4, -0.32]], lomo: [-0.6, 1.9, 0.7] },
      { tipo: 'cabina', z0: -2.1, z1: -0.9, w: 0.22, yb: 0.3, yt: 0.72 },
      { tipo: 'toma', x0: 0.52, x1: 0.74, y0: -0.28, y1: 0.18, z0: -1.05, z1: -0.3 },
      ala([0.6, -0.06, -0.6], 2.3, [1.95, -0.06, 1.0], 0.45, [0.4, 0.95, 0.28], { canal: 7, extra: [[[0.02, 0.35, 0.28], 7]] }),
      timon([0.5, 0.4, 0.95], 1.0, 0.8, 0.5, 0.6, 20),
      { tipo: 'motor', x: 0.3, y: 0.03, z0: 0.6, z1: 1.9, r: 0.26, tobera: 0.3, visible: false },
      { tipo: 'freno', x0: 0.06, x1: 0.34, z0: 0.05, z1: 0.7, y: 0.45 },
      { tipo: 'canon', x: 0.8, y: -0.06, z0: -1.0, z1: -0.35 },
      // detalle del piloto: armas a la vista, antena, sensor, rejillas y cercos de ala
      { tipo: 'carga', x: 1.25, y: -0.22, z0: -0.35, z1: 0.95, r: 0.075, misil: true },
      { tipo: 'caja', x0: -0.015, x1: 0.015, y0: 0.44, y1: 0.72, z0: -0.5, z1: -0.32, fill: 'oscuro', espejo: false },
      { tipo: 'caja', x0: -0.13, x1: 0.13, y0: 0.42, y1: 0.5, z0: -0.85, z1: -0.05, fill: 'base2', espejo: false },
      { tipo: 'caja', x0: -0.08, x1: 0.08, y0: -0.24, y1: -0.13, z0: -2.15, z1: -1.65, fill: 'oscuro', espejo: false },
      { tipo: 'caja', x0: 0.6, x1: 0.645, y0: -0.05, y1: 0.22, z0: 1.0, z1: 1.55, fill: 'oscuro' },
      { tipo: 'caja', x0: 1.15, x1: 1.17, y0: -0.03, y1: 0.09, z0: 0.15, z1: 1.25, fill: 'base2' }
    ]
  },
  I2: {
    nombre: 'Flecha doble', clase: 'interceptor', bando: 'guardia', pintura: 'guardia',
    piezas: [
      { tipo: 'fuselaje', anillo: [-2.65, -2.4], est: [[-3.1, 0, 0.02, -0.02], [-2.5, 0.18, 0.2, -0.16], [-1.6, 0.32, 0.34, -0.28], [-0.6, 0.5, 0.4, -0.32], [1.4, 0.55, 0.38, -0.3], [1.8, 0.5, 0.32, -0.26]], lomo: [-0.8, 1.8, 0.35] },
      { tipo: 'cabina', z0: -2.3, z1: -1.1, w: 0.2, yb: 0.3, yt: 0.66 },
      { tipo: 'toma', x0: 0.48, x1: 0.68, y0: -0.25, y1: 0.2, z0: -1.1, z1: 0.1 },
      ala([0.5, 0, -0.4], 1.5, [1.75, 0, 0.95], 0.45, [0.5, 0.95, 0.26]),
      { tipo: 'superficie', rle: [0.5, 0, 1.25], cr: 0.6, tle: [1.15, 0, 1.75], ct: 0.3, mov: 'todo', canal: 7, fill: 'base2' },
      timon([0.36, 0.38, 0.6], 0.9, 0.8, 0.4, 0.75, 12),
      { tipo: 'motor', x: 0.26, y: 0.02, z0: 0.5, z1: 1.8, r: 0.22, tobera: 0.28, visible: false },
      { tipo: 'canon', x: 0.3, y: -0.12, z0: -2.0, z1: -1.3 },
      { tipo: 'freno', x0: -0.2, x1: 0.2, z0: 0.9, z1: 1.4, lateral: 0.55 }
    ]
  },
  P1: {
    nombre: 'Mula', clase: 'ataque', bando: 'guardia', pintura: 'guardia',
    piezas: [
      { tipo: 'fuselaje', anillo: [-2.85, -2.6], est: [[-3.2, 0, 0.05, -0.05], [-2.6, 0.3, 0.3, -0.3], [-1.6, 0.55, 0.55, -0.5], [-0.2, 0.7, 0.62, -0.58], [1.8, 0.66, 0.58, -0.52], [2.6, 0.45, 0.42, -0.36]], lomo: [-1.0, 2.6, 0.45] },
      { tipo: 'cabina', z0: -2.5, z1: -1.3, w: 0.3, yb: 0.48, yt: 0.88 },
      ala([0.68, 0.2, -0.4], 1.6, [2.6, 0.12, 0.0], 1.0, [0.5, 0.95, 0.26], { t: 0.16 }),
      { tipo: 'motor', x: 1.35, y: -0.1, z0: -0.9, z1: 1.6, r: 0.34, tobera: 0.32 },
      timon([0.45, 0.55, 1.4], 1.1, 1.0, 0.55, 0.75, 15),
      { tipo: 'superficie', rle: [0.6, 0.15, 1.8], cr: 0.7, tle: [1.4, 0.15, 2.15], ct: 0.4, mov: [0.05, 0.98, 0.35], canal: 2 },
      { tipo: 'carga', x: 2.05, y: -0.12, z0: -0.2, z1: 0.9, r: 0.13 },
      { tipo: 'compuertas', x0: 0.05, x1: 0.45, z0: -0.5, z1: 1.0, y: -0.58 },
      { tipo: 'canon', x: 0, y: -0.38, z0: -2.95, z1: -2.3, r: 0.07, espejo: false },
      { tipo: 'canon', x: 0.75, y: 0.05, z0: -1.0, z1: -0.4 },
      { tipo: 'freno', x0: -0.2, x1: 0.25, z0: 1.6, z1: 2.2, lateral: 0.66 },
      { tipo: 'caja', x0: 0.25, x1: 0.55, y0: 0.6, y1: 0.66, z0: -0.9, z1: 0.5 }
    ]
  },
  S4: {
    nombre: 'Copia', clase: 'infiltracion', bando: 'guardia', pintura: 'guardia',
    piezas: [
      { tipo: 'fuselaje', anillo: [-2.75, -2.5], est: [[-3.4, 0.02, 0.04, -0.02], [-2.5, 0.24, 0.18, -0.12], [-1.0, 0.42, 0.28, -0.18], [1.3, 0.44, 0.28, -0.18], [1.85, 0.34, 0.2, -0.14]], lomo: [-1.0, 1.85, 0.35] },
      { tipo: 'cabina', z0: -2.5, z1: -1.5, w: 0.17, yb: 0.2, yt: 0.46 },
      ala([0.42, 0, -0.9], 2.4, [1.7, -0.02, 1.2], 0.35, [0.5, 0.95, 0.3], { t: 0.05, canal: 7, extra: [[[0.05, 0.42, 0.3], 7]] }),
      timon([0.28, 0.26, 0.9], 0.8, 0.6, 0.35, 0.7, 42),
      { tipo: 'motor', x: 0.16, y: 0.02, z0: 0.8, z1: 1.85, r: 0.16, tobera: 0.18, visible: false, plana: [0.3, 0.12] },
      { tipo: 'toma', x0: 0.42, x1: 0.56, y0: -0.04, y1: 0.2, z0: -1.0, z1: -0.3 },
      { tipo: 'compuertas', x0: 0.05, x1: 0.36, z0: -1.0, z1: 0.5, y: -0.18 },
      { tipo: 'placas', x0: 0.7, x1: 1.15, z0: 0.0, z1: 0.7, y: 0.03 },
      { tipo: 'canon', x: 0.22, y: -0.08, z0: -2.3, z1: -1.8, r: 0.03 },
      { tipo: 'freno', x0: 0.08, x1: 0.3, z0: 0.4, z1: 0.9, y: 0.28 }
    ]
  },
  R1: {
    nombre: 'Escuadra', clase: 'caza', bando: 'directorio', pintura: 'directorio',
    piezas: [
      { tipo: 'fuselaje', anillo: [-2.45, -2.2], seccion: 'box', est: [[-2.9, 0.1, 0.12, -0.1], [-2.2, 0.38, 0.32, -0.3], [-0.8, 0.55, 0.42, -0.4], [1.7, 0.55, 0.42, -0.4], [2.0, 0.5, 0.36, -0.34]], lomo: [-0.8, 2.0, 0.3] },
      { tipo: 'cabina', z0: -2.1, z1: -1.0, w: 0.24, yb: 0.34, yt: 0.66 },
      ala([0.55, 0, -0.5], 1.9, [2.0, 0, 0.5], 0.9, [0.45, 0.95, 0.26]),
      timon([0.42, 0.42, 0.9], 1.0, 0.75, 0.85, 0.2, 0),
      { tipo: 'superficie', rle: [0.55, 0, 1.5], cr: 0.6, tle: [1.2, 0, 1.55], ct: 0.55, mov: 'todo', canal: 7, fill: 'base2' },
      { tipo: 'motor', x: 0.27, y: 0, z0: 0.6, z1: 2.0, r: 0.24, tobera: 0.25, visible: false, plana: [0.42, 0.42] },
      { tipo: 'toma', x0: 0.55, x1: 0.75, y0: -0.3, y1: 0.25, z0: -1.2, z1: -0.2 },
      { tipo: 'canon', x: 0.3, y: -0.32, z0: -2.3, z1: -1.7 },
      { tipo: 'freno', x0: 0.1, x1: 0.4, z0: 0.3, z1: 0.9, y: 0.43 }
    ]
  },
  I4: {
    nombre: 'Riel', clase: 'interceptor', bando: 'directorio', pintura: 'directorio',
    piezas: [
      { tipo: 'fuselaje', seccion: 'box', anillo: [-2.6, -2.35], est: [[-3.0, 0.06, 0.1, -0.08], [-2.2, 0.3, 0.28, -0.26], [-0.8, 0.42, 0.36, -0.3], [1.6, 0.42, 0.36, -0.3], [1.8, 0.4, 0.3, -0.26]], lomo: [-0.8, 1.8, 0.25] },
      { tipo: 'cabina', z0: -2.1, z1: -1.2, w: 0.22, yb: 0.28, yt: 0.56 },
      ala([0.42, 0, -0.1], 1.3, [1.7, 0, 0.15], 1.0, [0.4, 0.95, 0.28]),
      { tipo: 'superficie', rle: [0.42, 0.1, -2.0], cr: 0.45, tle: [0.95, 0.1, -2.0], ct: 0.45, mov: 'todo', canal: 2, invertir: true, fill: 'acento' },
      { tipo: 'motor', x: 0.64, y: 0.12, z0: -0.6, z1: 1.7, r: 0.22, tobera: 0.28, plana: [0.4, 0.32] },
      timon([0, 0.36, 0.6], 1.1, 0.75, 1.0, 0.15, 0, { espejo: false }),
      { tipo: 'canon', x: 0.15, y: -0.2, z0: -2.6, z1: -1.8 },
      { tipo: 'freno', x0: 0.1, x1: 0.3, z0: 0.1, z1: 0.6, y: 0.37 }
    ]
  },
  P3: {
    nombre: 'Bloque', clase: 'ataque', bando: 'directorio', pintura: 'directorio',
    piezas: [
      { tipo: 'fuselaje', seccion: 'box', anillo: [-2.75, -2.5], est: [[-3.0, 0.15, 0.2, -0.15], [-2.4, 0.45, 0.45, -0.42], [-0.5, 0.62, 0.6, -0.55], [2.2, 0.62, 0.6, -0.55], [2.6, 0.55, 0.5, -0.45]], lomo: [-1.6, 2.6, 0.3] },
      { tipo: 'cabina', z0: -2.5, z1: -1.4, w: 0.32, yb: 0.45, yt: 0.82 },
      ala([0.6, 0.5, -0.5], 1.7, [2.6, 0.45, -0.3], 1.4, [0.5, 0.95, 0.26], { t: 0.16 }),
      { tipo: 'motor', x: 1.2, y: 0.18, z0: -0.6, z1: 1.5, r: 0.26, tobera: 0.28, plana: [0.44, 0.36] },
      { tipo: 'motor', x: 1.95, y: 0.2, z0: -0.4, z1: 1.3, r: 0.24, tobera: 0.28, plana: [0.4, 0.34] },
      { tipo: 'superficie', rle: [0.6, 0.3, 2.0], cr: 0.65, tle: [1.5, 0.3, 2.0], ct: 0.65, mov: [0.05, 0.98, 0.4], canal: 7 },
      timon([1.5, 0.3, 1.95], 0.75, 0.8, 0.6, 0.15, 0),
      { tipo: 'carga', x: 2.45, y: 0.32, z0: -0.2, z1: 0.8, r: 0.09, misil: true },
      { tipo: 'compuertas', x0: 0.1, x1: 0.55, z0: -0.8, z1: 1.4, y: -0.55 },
      { tipo: 'canon', x: 0.12, y: -0.2, z0: -2.85, z1: -2.1 },
      { tipo: 'caja', x0: 0.62, x1: 0.68, y0: -0.3, y1: 0.3, z0: -1.6, z1: 1.4, grande: true },
      { tipo: 'freno', x0: 0.15, x1: 0.5, z0: 0.4, z1: 1.0, y: 0.6 }
    ]
  },
  X1: {
    nombre: 'Remiendo', clase: 'caza', bando: 'desligados', pintura: 'desligados',
    piezas: [
      { tipo: 'fuselaje', anillo: [-2.45, -2.2], est: [[-2.8, 0, 0.02, -0.02], [-2.3, 0.26, 0.2, -0.18], [-1.4, 0.42, 0.34, -0.32], [-0.4, 0.55, 0.44, -0.42], [1.6, 0.58, 0.4, -0.36], [1.9, 0.5, 0.34, -0.3]], lomo: [-0.6, 1.9, 0.4] },
      { tipo: 'cabina', z0: -2.0, z1: -0.9, w: 0.22, yb: 0.32, yt: 0.7 },
      { tipo: 'superficie', rle: [-0.55, -0.02, -0.5], cr: 2.1, tle: [-1.95, -0.04, 1.0], ct: 0.45, mov: [0.45, 0.95, 0.24], canal: 0, marca: 0.2, espejo: false, lado: -1, extra: [[[0.05, 0.38, 0.24], 2]] },
      { tipo: 'superficie', rle: [0.55, 0, -0.1], cr: 1.5, tle: [2.1, -0.06, 0.3], ct: 0.8, mov: [0.4, 0.95, 0.26], canal: 0, marca: 0.2, espejo: false, fill: 'base2', extra: [[[0.05, 0.35, 0.26], 2]] },
      { tipo: 'motor', x: -0.3, y: 0.02, z0: 0.6, z1: 1.9, r: 0.24, tobera: 0.28, visible: false, espejo: false },
      { tipo: 'motor', x: 0.95, y: 0.28, z0: -0.4, z1: 1.5, r: 0.3, tobera: 0.3, espejo: false, fill: 'parche' },
      timon([-0.5, 0.4, 0.95], 0.95, 0.8, 0.4, 0.6, -20, { espejo: false, lado: -1 }),
      timon([0.42, 0.42, 1.2], 0.6, 0.55, 0.4, 0.35, 0, { espejo: false, fill: 'parche' }),
      { tipo: 'caja', x0: 0.6, x1: 0.9, y0: 0.0, y1: 0.06, z0: -1.2, z1: -0.4, fill: 'parche', espejo: false },
      { tipo: 'caja', x0: 1.48, x1: 1.72, y0: -0.24, y1: 0.0, z0: -0.9, z1: 0.2, espejo: false, grande: true },
      { tipo: 'canon', x: -0.75, y: -0.06, z0: -0.9, z1: -0.3, espejo: false },
      { tipo: 'canon', x: 1.6, y: -0.12, z0: -1.3, z1: -0.9, r: 0.07, espejo: false },
      { tipo: 'freno', x0: 0.08, x1: 0.3, z0: 0.0, z1: 0.6, y: 0.44, espejo: false }
    ]
  }
};

// Pinturas: una fila por pintura, 8 zonas (base, base 2, acento, panza, marca, oscuro, vidrio, parche)
export const PINTURAS = {
  guardia: { nombre: 'Guardia', zonas: ['#a2a9ae', '#8a949b', '#1f5869', '#1a4252', '#efeee6', '#34393e', '#10283a', '#7e878d'] },
  guardiaNoche: { nombre: 'Guardia nocturna', zonas: ['#3c4651', '#2f3842', '#7d8b96', '#1d242c', '#d8dde2', '#1a1d21', '#0b1d2a', '#4a545e'] },
  directorio: { nombre: 'Directorio', zonas: ['#545961', '#454a51', '#d8d0bc', '#2c2f34', '#e8a33a', '#26292d', '#3a2a10', '#5e636b'] },
  desligados: { nombre: 'Desligados', zonas: ['#b8a887', '#9a8868', '#2e9c9a', '#6e4a34', '#5fcfc6', '#3b332b', '#123234', '#9c5a36'] },
  capturada: { nombre: 'Capturada', zonas: ['#545961', '#9c5a36', '#2e9c9a', '#2c2f34', '#5fcfc6', '#26292d', '#3a2a10', '#b8a887'] },
  clasica: { nombre: 'Clásica', zonas: ['#f5ebd6', '#d6ccbd', '#b8ada3', '#29478f', '#ff6638', '#42424d', '#0f2938', '#c9bfb0'] }
};

// Marca de bando: la llevan todas las naves (timones, anillo de la trompa, puntas de ala) y su luz de
// identificación. Es del bando que vuela la nave, no del diseño: un R1 capturado por los Desligados lleva
// la marca de los Desligados. Color y forma distintos, para no depender solo del color (daltonismo).
// Propuesta: cian, ámbar y magenta se separan bien entre sí y contra el cielo y el terreno.
export const BANDOS = {
  guardia: { nombre: 'Guardia', color: [0.15, 0.78, 1], forma: 'circulo' },
  directorio: { nombre: 'Directorio', color: [1, 0.62, 0.05], forma: 'cuadrado' },
  desligados: { nombre: 'Desligados', color: [0.95, 0.25, 0.75], forma: 'rombo' }
};

// Escuadrones: cada uno define su pintura (camuflaje) y qué diseño vuela en cada clase.
// Los nombres y en qué misión aparece cada uno los define la historia; por ahora está solo Delta.
export const ESCUADRONES = {
  delta: { nombre: 'Delta', bando: 'guardia', pintura: 'guardia', disenos: { caza: 'A' }, desde: 'C1-01' }
};
