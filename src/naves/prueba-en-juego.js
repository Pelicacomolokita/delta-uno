/* ---------- Prueba de rendimiento dentro del juego ----------
   Con ?flota=40 en la dirección, el juego suma 40 naves decorativas (no pelean ni chocan) volando alrededor del
   jugador, sobre el mundo real. Sirve para medir en el teléfono si las batallas grandes entran.
   Un tercio son compañeros en formación (sin baliza); el resto son enemigos del Directorio (con baliza).
   En main.js: const pf = iniciarPruebaFlota(scene, n, detalleTex);  y en cada cuadro: pf.actualizar(dt, camera, ship.pos, ship.q, U); */
import * as T from 'three';
import { NavesJuego, TIPO_ENEMIGO, NAVE_PROPIA, ESCOLTADO, mandosDesdeGiro } from './juego.js';

export function leerPruebaFlota() {
  // ?flota=40 en la dirección (o window.__pruebaFlota = 40, para las pruebas automáticas)
  const n = +(typeof window !== 'undefined' && window.__pruebaFlota) || +new URLSearchParams(location.search).get('flota');
  return n > 0 ? Math.min(80, Math.round(n)) : 0;
}

export function iniciarPruebaFlota(scene, n, detalleTex = null) {
  const juego = new NavesJuego(scene, { max: Math.max(20, n), detalleTex });
  const enemigos = Object.values(TIPO_ENEMIGO);
  let s = 11; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const naves = [];
  for (let i = 0; i < n; i++) {
    const aliada = i % 3 === 0;
    const id = aliada ? (i % 9 === 0 ? ESCOLTADO : NAVE_PROPIA) : enemigos[i % enemigos.length];
    const nave = juego.agregar({ id });
    naves.push({
      nave, aliada, qPrev: new T.Quaternion(),
      // compañeros: lugar fijo en la formación; enemigos: dan vueltas alrededor de un punto que va adelante tuyo
      lado: (i % 2 ? -1 : 1) * (18 + (i % 7) * 9), atras: 10 + (i % 5) * 12, alto: ((i % 4) - 1.5) * 6,
      dist: 90 + Math.pow(rnd(), 1.3) * 900, lat: (rnd() - 0.5) * 600, altura: 30 + rnd() * 160,
      r: 30 + rnd() * 140, w: (rnd() < 0.5 ? -1 : 1) * (0.25 + rnd() * 0.5), fase: rnd() * 6.28, ok: false
    });
  }
  let t = 0;
  const f = new T.Vector3(), r = new T.Vector3(), u = new T.Vector3(), p = new T.Vector3(), m = new T.Matrix4(), v = new T.Vector3(), prev = new T.Vector3();
  function lugar(o, tt, posJ, fJ, rJ, uJ, out) {
    if (o.aliada) return out.copy(posJ).addScaledVector(rJ, o.lado).addScaledVector(uJ, o.alto + Math.sin(tt * 0.9 + o.fase) * 1.5).addScaledVector(fJ, -o.atras);
    const a = tt * o.w + o.fase;
    return out.copy(posJ).addScaledVector(fJ, o.dist + Math.sin(a) * o.r * 0.6).addScaledVector(rJ, o.lat + Math.cos(a) * o.r).addScaledVector(uJ, o.altura + Math.sin(a * 2) * o.r * 0.25);
  }
  return {
    juego,
    actualizar(dt, camera, posJ, quatJ, arriba) {
      t += dt;
      f.set(0, 0, -1).applyQuaternion(quatJ); u.copy(arriba).normalize(); r.crossVectors(f, u).normalize(); f.crossVectors(u, r).normalize();
      for (const o of naves) {
        lugar(o, t, posJ, f, r, u, o.nave.pos);
        lugar(o, t + 0.05, posJ, f, r, u, p);
        v.copy(p).sub(o.nave.pos).normalize();
        if (v.lengthSq() < 1e-6) v.copy(f);
        // inclinación en las curvas, para que se vea natural
        const lat = o.aliada ? 0 : Math.sin(t * o.w + o.fase) * Math.sign(o.w) * 0.6;
        m.lookAt(o.nave.pos, prev.copy(o.nave.pos).add(v), prev.copy(u).applyAxisAngle(v, lat));
        o.qPrev.copy(o.nave.quat); o.nave.quat.setFromRotationMatrix(m);
        if (o.ok) mandosDesdeGiro(o.nave, o.qPrev, dt, { empuje: 0.6, turbo: !o.aliada && Math.sin(t * 0.3 + o.fase) > 0.85, velocidad: 140 });
        o.ok = true;
      }
      juego.actualizar(dt, camera);
    },
    quitar() { juego.limpiar(); juego.setVisible(false); }
  };
}
