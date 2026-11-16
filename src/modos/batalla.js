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
const BANDA_BAJA = 260, BANDA_ALTA = 820;   // entre estas alturas pelean; ver la franja en paso()

export const BANDOS_BATALLA = [
  { id: 'guardia', nombre: 'Guardia de Nácar', diseno: 'A', pintura: 'guardia', color: 0x8fe8ff },
  { id: 'directorio', nombre: 'Directorio', diseno: 'R1', pintura: null, color: 0xff9a6a },
  { id: 'desligados', nombre: 'Desligados', diseno: 'I4', pintura: null, color: 0xc9a6ff }
];

/* radio 2.200 y no 3.200: con los frentes a 120° y el sector grande, el rival más cercano quedaba a 1,8 km,
   fuera del alcance de fijado (1.300 m), y no había combate. Con este radio los tres frentes arrancan a unos
   1,6 km entre sí y se cruzan en los primeros segundos. */
/* techo: el mismo que tiene el jugador (CEIL_WARN). Sin esto las naves de la batalla subían sin límite
   persiguiendo blancos y se quedaban arriba del techo del jugador, disparándole desde donde él no puede
   llegar ni ver. Santiago lo reportó: "los enemigos siguen superando la altura de 1200 que alcanza mi nave". */
export function crearBatalla(T, { naves, PLANET_R, heightAt, alturaVuelo = 420, radio = 2200, techo = 1200 }) {
  const combatientes = [];
  const balas = [];
  let centro = new T.Vector3(0, PLANET_R, 0), t = 0;

  const _a = new T.Vector3(), _b = new T.Vector3(), _up = new T.Vector3(), _fw = new T.Vector3();
  const _q = new T.Quaternion(), _m = new T.Matrix4(), _r = new T.Vector3(), _u2 = new T.Vector3();
  /* Temporales reutilizados. Antes el paso de cada nave creaba dos Vector3 por cuadro: con 60 naves son
     7.200 por segundo, y esa basura la tiene que limpiar el recolector justo mientras estás volando. */
  const _nz = new T.Vector3(), _cenU = new T.Vector3();

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

  /* Dónde nace cada bando. No repartidos por todo el sector —así el rival más cercano quedaba a 894 m y la
     mediana a 2,3 km, y no había combate— sino en tres frentes separados 120° que entran hacia el centro y se
     cruzan de frente. El jugador sale con los suyos. */
  /* En formación, no desparramados. Medido con la versión anterior: el aliado más cercano quedaba a 504 m y
     la mediana a 762 m, y a esa distancia una nave son unos pocos píxeles en un teléfono. Santiago decía que
     no veía a los aliados cargar con él, y tenía razón: cada uno nacía en un punto al azar de su cuña.
     Ahora cada bando sale en una cuña cerrada —filas de cinco, 70 m entre naves— y el jugador sale en el
     medio de la suya. Al reaparecer se usa un lugar suelto, porque la formación ya se deshizo. */
  const FILA = 5, SEP = 70, FONDO = 55;
  function lugarEnFormacion(out, bando, fila, col) {
    const B = BANDOS_BATALLA.findIndex(x => x.id === bando);
    const base = B * Math.PI * 2 / 3;
    _up.copy(centro).normalize();
    _r.set(0, 1, 0).cross(_up); if (_r.lengthSq() < 1e-6) _r.set(1, 0, 0);
    _r.normalize(); _u2.crossVectors(_up, _r).normalize();
    // el centro de la formación, y los ejes "al costado" y "hacia atrás" vistos desde ahí
    const d0 = radio * .62, a0 = d0 / PLANET_R;
    const cx = Math.cos(base), cz = Math.sin(base);
    const lado = col * SEP, atras = fila * FONDO;
    // desplazamiento en metros sobre el plano tangente: "atrás" es alejarse del centro
    const ex = cx * (d0 + atras) - cz * lado, ez = cz * (d0 + atras) + cx * lado;
    const dd = Math.hypot(ex, ez), ang = dd / PLANET_R;
    out.copy(_up).multiplyScalar(Math.cos(ang))
       .addScaledVector(_r, Math.sin(ang) * ex / dd)
       .addScaledVector(_u2, Math.sin(ang) * ez / dd).normalize();
    const h = Math.max(heightAt(out.x, out.y, out.z, 0), 0);
    out.multiplyScalar(PLANET_R + h + alturaVuelo + (fila % 2 ? 40 : 0) + col * 12);
    return out;
  }
  function puntoDeFrente(out, bando, apretado) {
    const B = BANDOS_BATALLA.findIndex(x => x.id === bando);
    const base = B * Math.PI * 2 / 3;
    const a = base + (Math.random() - .5) * .55;           // el frente abre unos 30°
    const d = radio * (apretado ? .34 : .42) * (.82 + Math.random() * .3);
    _up.copy(centro).normalize();
    _r.set(0, 1, 0).cross(_up); if (_r.lengthSq() < 1e-6) _r.set(1, 0, 0);
    _r.normalize(); _u2.crossVectors(_up, _r).normalize();
    const ang = d / PLANET_R;
    out.copy(_up).multiplyScalar(Math.cos(ang)).addScaledVector(_r, Math.sin(ang) * Math.cos(a)).addScaledVector(_u2, Math.sin(ang) * Math.sin(a)).normalize();
    const h = Math.max(heightAt(out.x, out.y, out.z, 0), 0);
    out.multiplyScalar(PLANET_R + h + alturaVuelo * (.75 + Math.random() * .5));
    return out;
  }
  function nacer(c, borde, formado) {
    if (formado && c.bando) lugarEnFormacion(c.pos, c.bando, Math.floor(c.idx / FILA), c.idx % FILA - (FILA - 1) / 2);
    else if (c.bando) puntoDeFrente(c.pos, c.bando, !borde);
    else punto(c.pos, borde ? radio : radio * .8);
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
        c.idx = i;
        if (naves) c.nave = naves.agregar({ id: B.diseno, bando: B.id, pintura: B.pintura || undefined });
        /* Adaptador con forma de enemigo del juego. Sin esto los combatientes no existen para el HUD: no
           tienen marca, no se los puede elegir como blanco y el misil no los fija. Es lo que pasó en la
           primera prueba de Santiago: le disparaban desde lejos cosas que el marcador no veía. */
        /* hp, hpMax y def no son adorno: el HUD dibuja la barra de vida con e.hp/(e.hpMax||e.def.hp), y sin
           ellos tiraba "Cannot read properties of undefined" en CADA CUADRO. Ese error cortaba el cuadro
           antes de renderer.render(), así que la nave seguía volando y la pantalla quedaba congelada: es lo
           que Santiago reportó. La barra ahora además muestra el daño de verdad. */
        /* El adaptador tiene que traer TODO lo que el juego le lee a un enemigo, porque un campo que falte
           tira una excepción en el cuadro y la pantalla se congela mientras la partida sigue. Ya pasó dos
           veces: primero con hp/hpMax/def (la barra de vida de la marca) y después con fwd/speed (el punto
           adelantado de la puntería, que se calcula solo cuando el blanco está ELEGIDO, y por eso no saltó
           hasta que el fijado empezó a funcionar). fwd y speed además hacen que la mira adelante bien. */
        c.ent = { pos: c.pos, on: true, bat: c, kind: 'caza', bando: B.id,
                  hp: c.vidaMax, hpMax: c.vidaMax, def: { hp: c.vidaMax, name: B.nombre, scale: 1, hit: 9 },
                  fwd: new T.Vector3(0, 0, -1), speed: c.velBase, practice: false,
                  group: { state: 'attack', zone: null, alert: true, members: [] } };
        nacer(c, true, true);   // la primera salida es en formación
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
  const salida = { muertes: [], impactosJugador: 0, impactoDir: new T.Vector3() };
  function paso(dt, jugador) {
    t += dt;
    _cenU.copy(centro).normalize();   // una vez por cuadro, no una por nave
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
      if (c.muerto > 0) { c.muerto -= dt; if (c.muerto <= 0) nacer(c, true); else { if (c.ent) c.ent.on = false; continue; } }
      if (c.ent) { c.ent.on = true; c.ent.hp = c.vida; }   // fwd y speed se actualizan más abajo, con el vuelo

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
      else if (dB > 900) {
        /* Lejos del rival todos van al mismo punto —el centro— en vez de cada uno a su blanco. Así el bando
           avanza junto y la carga se ve; si cada nave encara a su enemigo desde el principio, la formación se
           deshace en los primeros segundos y el jugador vuela solo. */
        _b.copy(centro).normalize().multiplyScalar(PLANET_R + alturaVuelo).sub(c.pos).normalize();
      } else {
        if (dB < 70) c.quiebre = 1.4;                       // pasó encima: se abre y vuelve
        _b.copy(_a).divideScalar(Math.max(dB, 1));
      }
      // si se fue del sector o bajó demasiado, vuelve al centro
      const alturaSuelo = c.pos.length() - PLANET_R - Math.max(heightAt(_up.x, _up.y, _up.z, 64), 0);
      /* La correa del sector. Antes el límite estaba en radio*1.15 (2.530 m) y las naves giran despacio, así
         que se escapaban bastante más lejos: Santiago las vio volando fuera de la zona. Ahora empiezan a
         volver en radio*0.92, giran al doble mientras vuelven —una nave que se va del combate no está
         maniobrando, está yendo a algún lado— y hay un tope duro: pasado radio*1.4 reaparece en el borde de
         su frente, como si hubiera rodeado. Es un modo de prueba: la zona cerrada importa más que el detalle. */
      /* El techo. Arriba del techo del jugador no se vuela: por encima de techo-150 ya apunta hacia abajo, y
         hay un tope duro, porque una nave que dispara desde donde no podés llegar no es un rival, es un
         fastidio. */
      const altMar = c.pos.length() - PLANET_R;
      if (altMar > techo) c.pos.setLength(PLANET_R + techo);
      const delCentro = Math.acos(Math.min(1, _up.dot(_cenU))) * PLANET_R;
      const fuera = delCentro > radio * .92;
      if (delCentro > radio * 1.4) { nacer(c, true); continue; }
      if (fuera || alturaSuelo < 140) {
        _b.copy(centro).normalize().multiplyScalar(PLANET_R + alturaVuelo + 200).sub(c.pos).normalize();
      } else if (altMar > BANDA_ALTA || altMar < BANDA_BAJA) {
        /* La franja de pelea. Con solo el techo duro medí que la mediana se iba a 1.071 m: un combate aéreo
           trepa solo, porque cada uno busca quedar arriba del otro, y sin nada que lo empuje para abajo toda
           la batalla termina apoyada contra el techo y el jugador abajo recibiendo desde arriba. Con la
           franja la pelea se queda donde el jugador vuela. */
        const fuera2 = altMar > BANDA_ALTA ? -(altMar - BANDA_ALTA) : (BANDA_BAJA - altMar);
        _b.addScaledVector(_up, Math.max(-.85, Math.min(.85, fuera2 / 260))).normalize();
      }

      // girar hacia ahí, con un límite de giro por segundo (al doble si está volviendo al sector)
      const cosA = Math.max(-1, Math.min(1, _fw.dot(_b)));
      const ang = Math.acos(cosA), paso2 = Math.min(ang, c.giro * (fuera ? 2.2 : 1) * dt);
      if (paso2 > 1e-4) {
        _r.crossVectors(_fw, _b);
        if (_r.lengthSq() > 1e-9) { _q.setFromAxisAngle(_r.normalize(), paso2); c.quat.premultiply(_q).normalize(); }
        _fw.set(0, 0, -1).applyQuaternion(c.quat);
      }
      // mantener las alas más o menos niveladas con el horizonte local
      _r.crossVectors(_fw, _up).normalize(); _u2.crossVectors(_r, _fw).normalize();
      _nz.copy(_fw).negate();
      _q.setFromRotationMatrix(_m.makeBasis(_r, _u2, _nz));
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

      if (c.ent) { c.ent.fwd.copy(_fw); c.ent.speed = c.vel; }   // la puntería del jugador adelanta con esto
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
        // la dirección del tiro, para que el HUD dibuje el arco que dice de dónde te pegaron
        if (o.esJugador) { salida.impactosJugador++; salida.impactoDir.copy(z.v); }
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

  /* Los que el jugador puede marcar y fijar: los de otros bandos, vivos. Se arma una sola vez por cuadro
     y se reutiliza el arreglo, porque el HUD lo recorre seguido. */
  const _blancos = [];
  function blancos(bandoJugador) {
    _blancos.length = 0;
    for (const c of combatientes) if (!c.esJugador && c.ent && c.ent.on && c.bando !== bandoJugador) _blancos.push(c.ent);
    return _blancos;
  }
  /* Le pega a un combatiente a través de su adaptador (desde el misil o los tiros del jugador).
     Devuelve el combatiente si cayó, null si solo se dañó. */
  function pegarEnt(ent, dano = 1) {
    const c = ent.bat;
    if (!c || c.muerto > 0) return null;
    c.vida -= dano;
    ent.hp = c.vida;
    if (c.vida > 0) return null;
    c.muerto = T_REENTRA; ent.on = false; ent.hp = 0;
    if (c.nave) c.nave.visible = false;
    return c;
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

  // dónde tiene que salir el jugador para estar con los suyos
  /* Dónde sale el jugador: en el medio de la formación de los suyos, una fila adelante, para que los vea
     a los costados y atrás cuando mira al frente. */
  function salidaDe(bando) { return lugarEnFormacion(new T.Vector3(), bando, -1, 0).clone(); }
  return { armar, limpiar, paso, vivos, golpeDelJugador, blancos, pegarEnt, salidaDe, combatientes, balas, BANDOS: BANDOS_BATALLA,
           info: () => ({ naves: combatientes.filter(c => !c.esJugador).length, balas: balas.length, vivos: vivos() }) };
}
