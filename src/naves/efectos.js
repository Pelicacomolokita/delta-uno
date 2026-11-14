/* ---------- Efectos de las naves: turbo, freno, daño y explosión ----------
   Un solo lugar con los valores que se ajustan a ojo en el Hangar (pestaña Piezas).
   El juego y el Hangar leen de acá. Para dejar fijo un ajuste hecho en el Hangar,
   se copian los valores ("Copiar ajustes") y se pegan como nuevos valores de base. */
import { RECORRIDO } from './mandos.js';

export const EFECTOS_BASE = {
  turbo: { largo: 1, brillo: 1, color: 'cian' },          // llama de los motores: tamaño, intensidad y color con turbo
  freno: { apertura: 0.9 },                                // segundos que tarda el freno de aire en abrirse del todo
  dano: { humoDesde: 0.4, fuegoDesde: 0.75, humo: 1, tamano: 1 }, // desde qué daño humea y se prende, cuánto humo y de qué tamaño
  explosion: { fogonazo: 1, velocidad: 1, duracion: 5, giro: 1 }  // tamaño del fogonazo y cómo salen los pedazos
};

// Colores de la llama con turbo
export const COLORES_TURBO = {
  cian: [0.5, 0.95, 0.9],
  ambar: [1, 0.68, 0.32],
  blanco: [1, 0.97, 0.9],
  violeta: [0.78, 0.55, 1]
};

const copia = o => JSON.parse(JSON.stringify(o));
export const EFECTOS = copia(EFECTOS_BASE);

// Pone valores (todos o algunos) y los aplica a lo que lee de otro lado, como el recorrido del freno
export function ajustarEfectos(v) {
  for (const k of Object.keys(EFECTOS_BASE)) if (v && v[k]) Object.assign(EFECTOS[k], v[k]);
  RECORRIDO.freno = EFECTOS.freno.apertura;
  return EFECTOS;
}
export function restablecerEfectos() {
  for (const k of Object.keys(EFECTOS_BASE)) Object.assign(EFECTOS[k], copia(EFECTOS_BASE[k]));
  return ajustarEfectos(null);
}
export const colorTurbo = () => COLORES_TURBO[EFECTOS.turbo.color] || COLORES_TURBO.cian;
