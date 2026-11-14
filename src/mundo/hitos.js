/* ---------- Los 37 hitos del plano, en bloques ----------
   Primera pasada del encargo P0.1: cada lugar con nombre aparece como un volumen reconocible desde
   el aire, no como un modelo terminado. Lo que importa ahora es la escala, dónde están y que se
   distingan entre sí; el arte viene después.

   Todo se dibuja con una sola malla instanciada, así que los 37 lugares cuestan una llamada de dibujo.
   Las formas salen del tipo que el plano le da a cada lugar (ciudad, base, nodo, puente…). */

import { LUGARES } from './lugares.js';

// Cada entrada: [ancho, alto, largo, x, y (desde el suelo), z] en metros, en el marco del lugar.
// y se mide desde el suelo hacia arriba, así que una caja de alto h va centrada en h/2.
const FORMAS = {
  // Hangares bajos, plataformas y una antena
  base: [[70, 14, 34, -40, 0, 0], [70, 14, 34, 40, 0, 0], [52, 8, 52, 0, 0, 58], [8, 46, 8, 0, 0, -44], [26, 20, 26, 0, 0, -10]],
  // Manzanas de distinta altura: una ciudad se lee por el escalonado
  ciudad: [[46, 30, 46, -62, 0, -34], [40, 44, 40, -14, 0, -58], [52, 22, 52, 36, 0, -30], [44, 36, 44, 64, 0, 26],
           [38, 52, 38, 6, 0, 10], [50, 26, 50, -52, 0, 52], [42, 34, 42, 26, 0, 68], [30, 18, 76, 0, 0, -104]],
  // Núcleo, tres soportes y el anillo de luces
  nodo: [[24, 56, 24, 0, 0, 0], [10, 34, 10, -30, 0, 18], [10, 34, 10, 30, 0, 18], [10, 34, 10, 0, 0, -34], [56, 6, 56, 0, 58, 0]],
  // Tablero largo sobre dos pilas
  puente: [[320, 10, 26, 0, 44, 0], [22, 46, 22, -110, 0, 0], [22, 46, 22, 110, 0, 0], [34, 16, 34, -170, 0, 0], [34, 16, 34, 170, 0, 0]],
  deposito: [[64, 18, 36, -46, 0, -26], [64, 18, 36, -46, 0, 26], [64, 18, 36, 46, 0, -26], [64, 18, 36, 46, 0, 26], [40, 26, 40, 0, 0, 72]],
  // Muralla baja en cuatro tramos y una torre
  fortaleza: [[180, 16, 14, 0, 0, -86], [180, 16, 14, 0, 0, 86], [14, 16, 172, -86, 0, 0], [14, 16, 172, 86, 0, 0],
              [40, 48, 40, 0, 0, 0], [26, 24, 26, -62, 0, -62]],
  industria: [[70, 24, 70, -40, 0, 0], [46, 60, 46, 36, 0, -24], [18, 76, 18, 58, 0, 34], [18, 76, 18, 76, 0, 34], [96, 10, 30, 0, 0, 70]],
  // Losa sobre patas
  plataforma: [[130, 8, 90, 0, 26, 0], [12, 26, 12, -52, 0, -34], [12, 26, 12, 52, 0, -34], [12, 26, 12, -52, 0, 34], [12, 26, 12, 52, 0, 34], [26, 22, 26, 0, 34, 0]],
  // Lo mismo que una ciudad pero chico y desordenado: se arma con lo que hay
  asentamiento: [[28, 12, 24, -34, 0, -18], [22, 16, 20, 8, 0, -36], [30, 10, 30, 30, 0, 12], [20, 14, 26, -16, 0, 30], [36, 8, 36, 0, 0, 0], [10, 22, 10, 44, 0, -30]],
  // Montaña con anillo industrial y tres conductos
  central: [[150, 70, 150, 0, 0, 0], [210, 12, 210, 0, 76, 0], [26, 120, 26, -56, 0, 40], [26, 120, 26, 56, 0, 40], [26, 120, 26, 0, 0, -68]],
  misil: [[34, 96, 34, 0, 0, 0], [70, 14, 70, 0, 0, 0], [16, 40, 16, -44, 0, 30], [16, 40, 16, 44, 0, 30]],
  /* Los lugares de puro vuelo, reunión o arena no tienen qué construir, pero igual hay que poder encontrarlos
     desde el aire: van con mástiles altos a propósito. Es una marca de trabajo, no arquitectura. */
  vuelo: [[60, 4, 60, 0, 0, 0], [7, 110, 7, -70, 0, -70], [7, 110, 7, 70, 0, -70], [7, 110, 7, -70, 0, 70], [7, 110, 7, 70, 0, 70]],
  reunion: [[50, 4, 50, 0, 0, 0], [9, 130, 9, 0, 0, 0], [30, 5, 30, 0, 130, 0]],
  jefe: [[70, 4, 70, 0, 0, 0], [10, 150, 10, -90, 0, 0], [10, 150, 10, 90, 0, 0], [10, 150, 10, 0, 0, -90], [10, 150, 10, 0, 0, 90]]
};

// Color por quién lo controla al empezar: se lee de un vistazo de qué lado está cada cosa
const COLOR = {
  'Guardia': [0.52, 0.56, 0.50],
  'Directorio': [0.46, 0.44, 0.47],
  'Desligados': [0.54, 0.44, 0.34],
  'Disidentes': [0.50, 0.42, 0.38],
  'Comunidades': [0.48, 0.50, 0.46],
  'Disputado': [0.50, 0.47, 0.42],
  'Sin control estable': [0.46, 0.46, 0.46]
};

/* El plano propone el lugar; el relieve decide si ahí se puede construir. Catorce de los 37 caen en laderas
   donde el suelo cambia más de 25 m cada 60 m, y ahí los bloques flotarían o quedarían enterrados.
   Así que cada hito se corre hasta "radio" metros buscando el terreno más parejo, con una penalización por
   moverse: si el lugar del plano ya es plano, no se mueve nada. Los corrimientos se registran y se informan.
   Son cientos de metros contra conexiones de 0,85 a 7,5 km, así que la geometría del plano se mantiene. */
function asentar(T, u0, { PLANET_R, heightAt, radio = 420 }) {
  const e1 = new T.Vector3(0, 1, 0).cross(u0);
  if (e1.lengthSq() < 1e-6) e1.set(1, 0, 0).addScaledVector(u0, -u0.x);
  e1.normalize();
  const e2 = new T.Vector3().crossVectors(u0, e1).normalize();
  const cand = new T.Vector3(), q = new T.Vector3();
  // cuánto sube y baja el suelo en los 70 m de alrededor: es el ancho de una manzana
  const desnivel = (u) => {
    const h0 = Math.max(heightAt(u.x, u.y, u.z, 0), 0);
    let lo = h0, hi = h0;
    for (let k = 0; k < 8; k++) {
      const t = k / 8 * Math.PI * 2, a = 70 / PLANET_R;
      q.copy(u).multiplyScalar(Math.cos(a)).addScaledVector(e1, Math.sin(a) * Math.cos(t)).addScaledVector(e2, Math.sin(a) * Math.sin(t)).normalize();
      const h = Math.max(heightAt(q.x, q.y, q.z, 0), 0);
      if (h < lo) lo = h; if (h > hi) hi = h;
    }
    return { h: h0, d: hi - lo };
  };
  const base = desnivel(u0);
  let mejor = { u: u0.clone(), h: base.h, d: base.d, corrido: 0 };
  if (base.d <= 18) return mejor;                   // ya es parejo: no se toca
  let puntaje = -base.d;
  // espiral de candidatos: ocho rumbos por cada uno de cinco radios
  for (let r = 1; r <= 5; r++) {
    const dist = radio * r / 5, a = dist / PLANET_R;
    for (let k = 0; k < 8; k++) {
      const t = (k / 8 + r * 0.06) * Math.PI * 2;
      cand.copy(u0).multiplyScalar(Math.cos(a)).addScaledVector(e1, Math.sin(a) * Math.cos(t)).addScaledVector(e2, Math.sin(a) * Math.sin(t)).normalize();
      const m = desnivel(cand);
      const p = -m.d - dist * 0.055;                // moverse cuesta: ~23 m de desnivel por cada 420 m
      if (p > puntaje) { puntaje = p; mejor = { u: cand.clone(), h: m.h, d: m.d, corrido: Math.round(dist) }; }
    }
  }
  return mejor;
}

/* Crea los hitos y los deja en la escena.
   heightAt(x,y,z,lod): altura del terreno en esa dirección. Devuelve { malla, lugares, centros, debug() }. */
export function crearHitos(T, scene, { PLANET_R, heightAt }) {
  const cajas = [];
  for (const l of LUGARES) {
    const forma = FORMAS[l.tipo] || FORMAS.vuelo;
    for (const f of forma) cajas.push({ lugar: l, f });
  }
  // La misma iluminación que las rocas, así los edificios se asientan en el paisaje y no flotan como calcomanías
  const material = new T.MeshLambertMaterial({ emissive: 0x0b0b0e });
  const geo = new T.BoxBufferGeometry(1, 1, 1);
  const malla = new T.InstancedMesh(geo, material, cajas.length);
  malla.frustumCulled = false;

  const m = new T.Matrix4(), q = new T.Quaternion(), base = new T.Matrix4(), c3 = new T.Color();
  const up = new T.Vector3(), este = new T.Vector3(), norte = new T.Vector3(), pos = new T.Vector3(), esc = new T.Vector3();
  const POLO = new T.Vector3(0, 1, 0);
  const centros = new Map(); // id del lugar → { u, pos, suelo } para la lista de misiones y el radar

  cajas.forEach((c, i) => {
    const u = c.lugar.u;
    up.set(u[0], u[1], u[2]).normalize();
    este.crossVectors(POLO, up); if (este.lengthSq() < 1e-6) este.set(1, 0, 0);
    este.normalize(); norte.crossVectors(up, este).normalize();
    let centro = centros.get(c.lugar.id);
    if (!centro) {
      const a = asentar(T, up, { PLANET_R, heightAt });
      centro = { lugar: c.lugar, u: a.u.clone(), suelo: PLANET_R + a.h, desnivel: Math.round(a.d), corrido: a.corrido,
                 pos: a.u.clone().multiplyScalar(PLANET_R + a.h), cajas: [], rotas: 0, total: 0 };
      centros.set(c.lugar.id, centro);
    }
    // el marco se arma sobre el punto asentado, no sobre el del plano
    up.copy(centro.u);
    este.crossVectors(POLO, up); if (este.lengthSq() < 1e-6) este.set(1, 0, 0);
    este.normalize(); norte.crossVectors(up, este).normalize();
    const [ax, ay, az, dx, dy, dz] = c.f;
    /* Cada caja se apoya en su propio terreno, no en el del centro, y se alarga hacia abajo lo que haga falta
       para tapar el desnivel: así en una ladera no queda ninguna flotando ni un edificio colgado del aire. */
    pos.copy(up).addScaledVector(este, dx / PLANET_R).addScaledVector(norte, dz / PLANET_R).normalize();
    const hCaja = Math.max(heightAt(pos.x, pos.y, pos.z, 0), 0);
    const techo = centro.suelo + dy + ay;                               // todas las piezas comparten el nivel del hito
    const piso = dy > 0 ? techo - ay : Math.min(PLANET_R + hCaja - 2, techo - ay);  // lo elevado no lleva falda
    const alto = Math.max(ay, Math.min(techo - piso, ay + 150));
    pos.copy(up).multiplyScalar(techo - alto / 2).addScaledVector(este, dx).addScaledVector(norte, dz);
    base.makeBasis(este, up, norte);
    q.setFromRotationMatrix(base);
    esc.set(ax, alto, az);
    malla.setMatrixAt(i, m.compose(pos, q, esc));
    /* La caja también se guarda del lado de JavaScript, para poder chocarla y romperla sin leer de la placa.
       hp sale del volumen: un galpón cae con dos tiros, una muralla de 180 m aguanta bastante más. */
    const vol = ax * alto * az;
    const caja = {
      i, lugar: c.lugar, centroLugar: centro, viva: true,
      centro: pos.clone(), q: q.clone(), half: new T.Vector3(ax / 2, alto / 2, az / 2),
      radio: Math.sqrt(ax * ax + alto * alto + az * az) / 2,
      hpMax: Math.max(2, Math.min(14, Math.round(Math.cbrt(vol) / 9))), m0: m.clone()
    };
    caja.hp = caja.hpMax;
    centro.cajas.push(caja); centro.total++;
    const k = COLOR[c.lugar.control] || COLOR.Disputado;
    // una pizca de variación por caja para que no se vean todas pintadas igual
    const v = 0.88 + ((i * 2654435761) % 1000) / 1000 * 0.24;
    malla.setColorAt(i, c3.setRGB(k[0] * v, k[1] * v, k[2] * v));
  });
  malla.instanceMatrix.needsUpdate = true;
  if (malla.instanceColor) malla.instanceColor.needsUpdate = true;
  scene.add(malla);

  /* ---------- Choque y destrucción ----------
     Las cajas se guardan también del lado de JavaScript (centro, rotación y medias medidas) para poder
     preguntarles si algo las tocó sin leer nada de la placa de video. Son 189: primero se descarta por el
     centro del hito, que son 37 cuentas, y después se prueban las pocas cajas de ese hito. */
  const _l = new T.Vector3(), _iq = new T.Quaternion();
  const cerca = [];
  // Devuelve las cajas vivas a menos de "radio" del punto. Reutiliza el mismo arreglo: no genera basura.
  function cajasCerca(p, radio) {
    cerca.length = 0;
    for (const c of centros.values()) {
      if (c.rotas === c.total) continue;
      if (p.distanceToSquared(c.pos) > (radio + 260) * (radio + 260)) continue;
      for (const b of c.cajas) if (b.viva && p.distanceToSquared(b.centro) < (radio + b.radio) * (radio + b.radio)) cerca.push(b);
    }
    return cerca;
  }
  /* ¿El punto está dentro de alguna caja? margen es el grosor de lo que choca (la bala, el casco).
     Devuelve la caja o null. */
  function golpea(p, margen = 0) {
    for (const b of cajasCerca(p, margen)) {
      _l.copy(p).sub(b.centro).applyQuaternion(_iq.copy(b.q).invert());
      if (Math.abs(_l.x) < b.half.x + margen && Math.abs(_l.y) < b.half.y + margen && Math.abs(_l.z) < b.half.z + margen) return b;
    }
    return null;
  }
  /* Le pega a una caja. Devuelve 'nada', 'daño' o 'rota'. Una caja aguanta según su tamaño: un galpón
     cae con dos tiros, una muralla aguanta más. Al caer se achica a cero y deja de dibujarse. */
  const _m = new T.Matrix4(), _cero = new T.Vector3(0, 0, 0);
  function pegar(b, dano = 1) {
    if (!b.viva) return 'nada';
    b.hp -= dano;
    if (b.hp > 0) return 'daño';
    b.viva = false;
    b.centroLugar.rotas++;
    malla.setMatrixAt(b.i, _m.compose(b.centro, b.q, _cero));
    malla.instanceMatrix.needsUpdate = true;
    return 'rota';
  }
  // Vuelve a levantar todo: al empezar una partida nueva el mundo tiene que estar entero otra vez
  function reconstruir() {
    let n = 0;
    for (const c of centros.values()) {
      if (!c.rotas) continue;
      for (const b of c.cajas) if (!b.viva) { b.viva = true; b.hp = b.hpMax; malla.setMatrixAt(b.i, b.m0); n++; }
      c.rotas = 0;
    }
    if (n) malla.instanceMatrix.needsUpdate = true;
    return n;
  }

  return {
    malla, lugares: LUGARES, centros, golpea, pegar, reconstruir, cajasCerca,
    debug: () => {
      const cor = [...centros.values()].filter(c => c.corrido > 0);
      return {
        lugares: LUGARES.length, cajas: cajas.length,
        corridos: cor.length, peorCorrimiento: cor.reduce((m, c) => Math.max(m, c.corrido), 0),
        peorDesnivel: [...centros.values()].reduce((m, c) => Math.max(m, c.desnivel), 0),
        detalle: cor.map(c => c.lugar.id + ' ' + c.corrido + ' m').join(', ')
      };
    }
  };
}
