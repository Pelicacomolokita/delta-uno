/* ---------- Naves por piezas en el juego: lo único que necesita src/main.js ----------
   main.js crea un NavesJuego por misión, agrega una nave por cada entidad (jugador, compañeros, enemigos,
   escoltados) y en cada cuadro copia posición, rotación y mandos, y llama a actualizar().
   Todo lo demás (mallas, niveles de detalle, piezas que se mueven, pinturas, balizas de enemigos, siluetas de
   choque) queda acá adentro. Ver docs/naves/integracion-arco1.md. */
import * as T from 'three';
import { Flota } from './flota.js';
import { DISENOS, ESCALA_CLASE, BANDOS } from './disenos.js';
import { crearMandos, actualizarMandos } from './mandos.js';
import { siluetaDiseno, golpea } from './silueta.js';

// Primer arco: qué diseño usa cada tipo de nave que ya existe en el juego (ENEMY_DEF de main.js)
export const TIPO_ENEMIGO = { caza: 'R1', interceptor: 'I4', pesada: 'P3' };
export const NAVE_PROPIA = 'A';      // jugador y compañeros (escuadrón Delta)
export const ESCOLTADO = 'P1';       // las misiones de escolta cuidan un bombardero de la Guardia
export const DISENOS_ARCO1 = [NAVE_PROPIA, ESCOLTADO, ...Object.values(TIPO_ENEMIGO)];

const _inv = new T.Quaternion(), _p = new T.Vector3();

export class NavesJuego {
  /* scene: la escena del juego. ids: diseños que usa la misión. detalleTex: textura de paneles (null en calidad Baja).
     bandoPropio: el del jugador (sus naves no llevan baliza). max: naves por diseño a la vez. */
  constructor(scene, { ids = DISENOS_ARCO1, detalleTex = null, bandoPropio = 'guardia', max = 40 } = {}) {
    this.flota = new Flota(scene, ids, { max, detalleTex, bandoPropio });
    this.naves = [];
  }
  /* Agrega una nave y la devuelve. Después, en cada cuadro: copiar nave.pos y nave.quat (en el mismo sistema
     que la escena) y cargar nave.mandos (roll, pitch, yaw de -1 a 1; empuje de 0 a 1; turbo, freno: sí o no;
     velocidad en m/s). propia: la del jugador (siempre con todo el detalle). */
  agregar({ id, bando, pintura, propia = false }) {
    const D = DISENOS[id];
    if (!D) throw new Error('Diseño de nave desconocido: ' + id);
    const n = {
      id, bando: bando || D.bando, pintura: pintura || D.pintura, propia, visible: true,
      pos: new T.Vector3(), quat: new T.Quaternion(), mandos: crearMandos(), lod: 0
    };
    n.anim = n.mandos.anim;
    this.naves.push(n);
    return n;
  }
  quitar(n) { const i = this.naves.indexOf(n); if (i >= 0) this.naves.splice(i, 1); }
  limpiar() { this.naves.length = 0; }
  // qué bandos son aliados en esta misión (sin baliza). Ej.: en la campaña 3, ['guardia', 'desligados'].
  setAliados(bandos) { this.flota.setAliados(bandos); }
  actualizar(dt, camera) {
    for (const n of this.naves) actualizarMandos(n.mandos, dt);
    this.flota.actualizar(this.naves.filter(n => n.visible), camera);
  }
  setVisible(v) { this.flota.setVisible(v); }
  // salida de llamas, de tiros y luces de navegación, en coordenadas de la nave y ya escaladas
  puntos(id) { return this.flota.dis[id].puntos; }
  escala(id) { return ESCALA_CLASE[DISENOS[id].clase] || 1; }
  silueta(id) { return siluetaDiseno(id); }
  // ¿un punto del mundo está adentro de la nave? (para los tiros; reemplaza al triángulo de boltHitsShip)
  golpea(n, punto, margen = 0.45) {
    _inv.copy(n.quat).invert();
    _p.copy(punto).sub(n.pos).applyQuaternion(_inv);
    return golpea(siluetaDiseno(n.id), _p.x, _p.y, _p.z, margen);
  }
}

/* Mandos de una nave que maneja la IA, a partir de cómo giró en el último cuadro (para que sus piezas se muevan
   como las de un piloto). qPrev: la rotación del cuadro anterior. Ritmos máximos, en rad/s, parecidos a los del juego. */
const _dq = new T.Quaternion(), _e = new T.Euler(0, 0, 0, 'YXZ');
export function mandosDesdeGiro(n, qPrev, dt, { empuje = 0.6, turbo = false, freno = false, velocidad = 120, roll = 3.3, pitch = 1.35, yaw = 0.85 } = {}) {
  _dq.copy(qPrev).invert().multiply(n.quat); _e.setFromQuaternion(_dq);
  const m = n.mandos, k = 1 / Math.max(dt, 1e-3);
  m.roll = Math.max(-1, Math.min(1, -_e.z * k / roll));
  m.pitch = Math.max(-1, Math.min(1, _e.x * k / pitch));
  m.yaw = Math.max(-1, Math.min(1, -_e.y * k / yaw));
  m.empuje = empuje; m.turbo = turbo; m.freno = freno; m.velocidad = velocidad;
  return m;
}
export { BANDOS };
