/* ---------- Batalla campal: tres bandos peleando entre sí ----------

   Para qué existe. El juego nunca tuvo combate entre inteligencias: los enemigos apuntan siempre al jugador
   y los compañeros vuelan en formación sin pelear de verdad. Así que no sabíamos dos cosas: cómo se ve una
   batalla con muchas naves, y cuánto cuesta. Dibujarlas ya se midió y es barato (60 naves son 10 llamadas de
   dibujo más); lo que faltaba medir es la inteligencia, que es JavaScript por cuadro.

   Por qué vive acá y no en main.js. La IA de enemigos (ENEMY_DEF, grupos, zonas, oleadas) la mantiene el chat
   de naves. Meterle tres bandos adentro era pisarnos justo donde más duele. Esto es un sistema aparte, con su
   propia lista de combatientes y su propia IA, que solo pide prestado el dibujo (NavesJuego) y los efectos.
   Si la batalla gusta, esto es la base de la que puede salir el combate entre IA del juego de verdad.

   Cómo pelea cada nave. Busca el enemigo vivo más cercano de otro bando, vuela hacia donde va a estar, y
   dispara cuando lo tiene en la trompa. Si se le acerca demasiado se abre y vuelve a encarar. Nada más: el
   objetivo es medir, no ganar un premio de inteligencia artificial.

   Las naves caídas vuelven a entrar a los pocos segundos por el borde del sector. Es a propósito: para medir
   rendimiento hace falta que la pelea se sostenga, no que se vacíe en un minuto. */

const T_BUSCA = .45;      // s entre búsquedas de blanco: buscar en cada cuadro es lo caro y no hace falta
const T_REENTRA = 4;      // s hasta que una nave caída vuelve a entrar
const BALA_V = 520, BALA_VIDA = 1.6, BALA_R = 2.8;

export const BANDOS_BATALLA = [
  { id: 'guardia', nombre: 'Guardia de Nácar', diseno: 'A', pintura: 'guardia', color: 0x8fe8ff },
  { id: 'directorio', nombre: 'Directorio', diseno: 'R1', pintura: null, color: 0xff9a6a },
  { id: 'desligados', nombre: 'Desligados', diseno: 'I4', pintura: null, color: 0xc9a6ff }
];

export function crearBatalla(T, { naves, PLANET_R, heightAt, alturaVuelo = 460, radio = 3200 }) {
  const combatientes = [];
  const balas = [];
  let centro = new T.Vector3(0, PLANET_R, 0), t = 0;

  const _a = new T.Vector3(), _b = new T.Vector3(), _up = new T.Vector3(), _fw = new T.Vector3();
  const _q = new T.Quaternion(), _m = new T.Matrix4(), _r = new T.Vector3(), _u2 = new T.Vector3();

  // un punto al azar dentro del sector, a la altura de vuelo
  function punto(out, r = radio) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * r;
    _up.copy(centro).normalize();
    _r.set(0, 1, 0).cross(_up); if (_r.lengthSq() < 1e-6) _r.set(1, 0, 0);
    _r.normalize(); _u2.crossVectors(_up, _r).normalize();
    const ang = d / PLANET_R;
    out.copy(_up).multiplyScalar(Math.cos(ang)).addScaledVector(_r, Math.sin(ang) * Math.cos(a)).addScaledVector(_u2, Math.sin(ang) * Math.sin(a)).normalize();
    const h = Math.max(heightAt(out.x, out.y, out.z, 0), 0);
    out.multiplyScalar(PLANET_R + h + alturaVuelo * (.6 + Math.random() * .8));
    return out;
  }

  function nacer(c, borde) {
    punto(c.pos, borde ? radio : radio * .8);
    c.vida = c.vidaMax; c.muerto = 0; c.blanco = null; c.buscaT = Math.random() * T_BUSCA;
    c.vel = c.velBase;
    // mirando al centro, que es donde está la pelea
    _fw.copy(centro).normalize().multiplyScalar(PLANET_R + alturaVuelo).sub(c.pos).normalize();
    _up.copy(c.pos).normalize();
    _r.crossVectors(_fw, _up).normalize(); _u2.crossVectors(_r, _fw).normalize();
    c.quat.setFromRotationMatrix(_m.makeBasis(_r, _u2, _fw.clone().negate()));
    if (c.nave) { c.nave.visible = true; c.nave.dano = 0; }
  }

  /* Arma la batalla. cuantos: { guardia: 19, directorio: 20, desligados: 20 } */
  function armar(cuantos, dondeU) {
    limpiar();
    centro.copy(dondeU).normalize().multiplyScalar(PLANET_R);
    for (const B of BANDOS_BATALLA) {
      const n = cuantos[B.id] || 0;
      for (let i = 0; i < n; i++) {
        const c = {
          bando: B.id, color: B.color, pos: new T.Vector3(), quat: new T.Quaternion(),
          vidaMax: 3, vida: 3, muerto: 0, blanco: null, buscaT: 0, quiebre: 0,
          velBase: 118 + Math.random() * 26, vel: 0, giro: 1.05 + Math.random() * .5,
          frio: Math.random() * 2, rafaga: 0, hueco: 0, nave: null
        };
        if (naves) c.nave = naves.agregar({ id: B.diseno, bando: B.id, pintura: B.pintura || undefined });
        nacer(c, true);
        combatientes.push(c);
      }
    }
    return combatientes.length;
  }

  function limpiar() {
    if (naves) for (const c of combatientes) if (c.nave) naves.quitar(c.nave);
    combatientes.length = 0; balas.length = 0;
  }

  // el enemigo vivo más cercano de otro bando (incluye al jugador, que entra como un combatiente más)
  function buscarBlanco(c) {
    let mejor = null, dd = Infinity;
    for (const o of combatientes) {
      if (o === c || o.muerto > 0 || o.bando === c.bando) continue;
      const d = c.pos.distanceToSquared(o.pos);
      if (d < dd) { dd = d; mejor = o; }
    }
    return mejor;
  }

  function disparar(c) {
    _a.set(0, 0, -1).applyQuaternion(c.quat);
    balas.push({ p: c.pos.clone().addScaledVector(_a, 8), v: _a.clone().multiplyScalar(BALA_V + c.vel), vida: BALA_VIDA, bando: c.bando, color: c.color, de: c });
  }

  /* dt: el paso. jugador: { pos, quat, bando, vivo } o null. Devuelve lo que pasó en este cuadro para que
     main.js ponga los efectos y el daño: { muertes: [...], impactosJugador: n } */
  const salida = { muertes: [], impactosJugador: 0 };
  function paso(dt, jugador) {
    t += dt;
    salida.muertes.length = 0; salida.impactosJugador = 0;

    // el jugador participa como un combatiente más, para que lo busquen y le tiren
    if (jugador) {
      if (!jugador.c) {
        jugador.c = { bando: jugador.bando, pos: new T.Vector3(), quat: new T.Quaternion(), muerto: 0, esJugador: true, vida: 1, vidaMax: 1 };
        combatientes.push(jugador.c);
      }
      jugador.c.pos.copy(jugador.pos); jugador.c.quat.copy(jugador.quat);
      jugador.c.muerto = jugador.vivo ? 0 : 99;
    }

    for (const c of combatientes) {
      if (c.esJugador) continue;
      if (c.muerto > 0) { c.muerto -= dt; if (c.muerto <= 0) nacer(c, true); else continue; }

      c.buscaT -= dt;
      if (c.buscaT <= 0 || !c.blanco || c.blanco.muerto > 0) { c.buscaT = T_BUSCA; c.blanco = buscarBlanco(c); }
      const b = c.blanco;

      _up.copy(c.pos).normalize();
      _fw.set(0, 0, -1).applyQuaternion(c.quat);
      let dB = Infinity;
      if (b) { _a.copy(b.pos).sub(c.pos); dB = _a.length(); }

      // adónde quiere ir
      if (!b) { _b.copy(centro).normalize().multiplyScalar(PLANET_R + alturaVuelo).sub(c.pos).normalize(); }
      else if (c.quiebre > 0) { c.quiebre -= dt; _b.copy(_fw).addScaledVector(_up, .35).normalize(); }
      else {
        if (dB < 70) c.quiebre = 1.4;                       // pasó encima: se abre y vuelve
        _b.copy(_a).divideScalar(Math.max(dB, 1));
      }
      // si se fue del sector o bajó demasiado, vuelve al centro
      const alturaSuelo = c.pos.length() - PLANET_R - Math.max(heightAt(_up.x, _up.y, _up.z, 64), 0);
      const fuera = Math.acos(Math.min(1, _up.dot(_b.clone().copy(centro).normalize()))) * PLANET_R > radio * 1.15;
      if (fuera || alturaSuelo < 140) {
        _b.copy(centro).normalize().multiplyScalar(PLANET_R + alturaVuelo + 200).sub(c.pos).normalize();
      }

      // girar hacia ahí, con un límite de giro por segundo
      const cosA = Math.max(-1, Math.min(1, _fw.dot(_b)));
      const ang = Math.acos(cosA), paso2 = Math.min(ang, c.giro * dt);
      if (paso2 > 1e-4) {
        _r.crossVectors(_fw, _b);
        if (_r.lengthSq() > 1e-9) { _q.setFromAxisAngle(_r.normalize(), paso2); c.quat.premultiply(_q).normalize(); }
        _fw.set(0, 0, -1).applyQuaternion(c.quat);
      }
      // mantener las alas más o menos niveladas con el horizonte local
      _r.crossVectors(_fw, _up).normalize(); _u2.crossVectors(_r, _fw).normalize();
      _q.setFromRotationMatrix(_m.makeBasis(_r, _u2, _fw.clone().negate()));
      c.quat.slerp(_q, Math.min(1, dt * 1.6));

      c.vel += ((b && dB < 900 ? c.velBase * 1.25 : c.velBase) - c.vel) * Math.min(1, dt * .7);
      c.pos.addScaledVector(_fw, c.vel * dt);

      // disparar: cuando lo tiene en la trompa y a tiro
      c.frio -= dt;
      if (c.rafaga > 0) {
        c.hueco -= dt;
        if (c.hueco <= 0) { disparar(c); c.rafaga--; c.hueco = .11; }
      } else if (c.frio <= 0 && b && dB < 560 && _fw.dot(_a.divideScalar(Math.max(dB, 1))) > .985) {
        c.rafaga = 3; c.hueco = 0; c.frio = 1.5 + Math.random() * 1.2;
      }

      if (c.nave) { c.nave.pos.copy(c.pos); c.nave.quat.copy(c.quat); c.nave.dano = 1 - c.vida / c.vidaMax;
        const m = c.nave.mandos; m.empuje = .75; m.velocidad = c.vel; }
    }

    // balas
    for (let i = balas.length - 1; i >= 0; i--) {
      const z = balas[i];
      z.vida -= dt;
      z.p.addScaledVector(z.v, dt);
      if (z.vida <= 0) { balas.splice(i, 1); continue; }
      let pegó = false;
      for (const o of combatientes) {
        if (o.muerto > 0 || o.bando === z.bando) continue;
        if (z.p.distanceToSquared(o.pos) > BALA_R * BALA_R * 9) continue;
        pegó = true;
        if (o.esJugador) salida.impactosJugador++;
        else {
          o.vida--;
          if (o.vida <= 0) { o.muerto = T_REENTRA; salida.muertes.push({ pos: o.pos.clone(), bando: o.bando }); if (o.nave) o.nave.visible = false; }
        }
        break;
      }
      if (pegó) balas.splice(i, 1);
    }
    return salida;
  }

  function vivos() {
    const r = {};
    for (const B of BANDOS_BATALLA) r[B.id] = 0;
    for (const c of combatientes) if (!c.esJugador && c.muerto <= 0) r[c.bando]++;
    return r;
  }

  // ¿una bala del jugador le pegó a alguien? Devuelve el caído, o null.
  function golpeDelJugador(p, bandoJugador, dano = 1) {
    for (const o of combatientes) {
      if (o.esJugador || o.muerto > 0 || o.bando === bandoJugador) continue;
      if (p.distanceToSquared(o.pos) > 36) continue;
      o.vida -= dano;
      if (o.vida <= 0) { o.muerto = T_REENTRA; if (o.nave) o.nave.visible = false; return o; }
      return null;
    }
    return undefined;   // no le pegó a nadie
  }

  return { armar, limpiar, paso, vivos, golpeDelJugador, combatientes, balas, BANDOS: BANDOS_BATALLA,
           info: () => ({ naves: combatientes.filter(c => !c.esJugador).length, balas: balas.length, vivos: vivos() }) };
}
