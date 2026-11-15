// Batalla campal: tres bandos peleando entre sí, que el jugador los vea y los pueda fijar, y que no se ahogue
// Se corre con: npm test (todas) o node tests/suites/18-batalla-campal.js (solo esta, después de npm run build:test)
//
// Esta suite no existía cuando el modo salió, y esa fue la falla: probé la batalla con guiones sueltos
// —cantidades, distancias, costo de la inteligencia— pero nunca entrando por el menú ni volando un rato.
// Santiago lo jugó y se le congelaba la pantalla. Todo lo que se comprueba acá sale de eso.
const H = require('../helpers');
const { check, sleep, launch, open, center, setRender, f, simWait } = H;

(async () => {
  const browser = await launch();
  const L = await open(browser, { width: 844, height: 390 });
  const P = L.page;
  await sleep(800);

  /* ---- Se entra por el menú, como un jugador ---- */
  await P.evaluate(() => window.DeltaUno.openMenu());
  await sleep(250);
  const tap = async sel => { const c = await center(P, sel); await P.touchscreen.tap(c[0], c[1]); await sleep(160); };
  const hayBoton = await P.evaluate(() => !!document.querySelector('.mode[data-mode="batalla"]'));
  check('hay botón de Batalla campal en el menú', hayBoton, '');
  await tap('.mode[data-mode="batalla"]');
  const elegido = await P.evaluate(() => ({ titulo: document.querySelector('#modeTitle').textContent, dif: !document.querySelector('#diffBox').hidden }));
  check('al elegirlo muestra su nombre y no pide dificultad', /Batalla/.test(elegido.titulo) && !elegido.dif, JSON.stringify(elegido));
  await tap('#goBtn');
  await simWait(P, 4);

  /* ---- Están los tres bandos y pelean ---- */
  let r = await P.evaluate(() => {
    const D = window.DeltaUno, B = D.batalla();
    return { modo: D.run.mode, vivos: B.vivos(), total: B.combatientes.filter(c => !c.esJugador).length };
  });
  check('arrancan los tres bandos con sus naves', r.modo === 'batalla' && r.total >= 55 &&
    r.vivos.guardia > 0 && r.vivos.directorio > 0 && r.vivos.desligados > 0, JSON.stringify(r));

  /* El dibujo queda PRENDIDO para esta parte: las marcas se actualizan dentro del dibujo, y apagarlo daba
     cero marcas sin que nada estuviera mal. Y se mira durante unos segundos, no en un instante: en un revoleo
     hay momentos en que no tenés a nadie adelante, y eso no es una falla. */
  await simWait(P, 12);
  /* Antes de mirar, se encara el combate. Volando derecho la nave se va del revoleo en veinte segundos —está
     medido— y entonces no hay nadie adelante y parece que el fijado no anda. Un jugador vira; la prueba
     también tiene que virar. */
  await P.evaluate(() => {
    const D = window.DeltaUno, T = window.THREE, s = D.ship;
    const o = D.batalla().combatientes.filter(c => !c.esJugador && c.muerto <= 0 && c.bando !== 'guardia');
    const cen = o.reduce((a, c) => a.add(c.pos), new s.pos.constructor()).divideScalar(o.length);
    const up = s.pos.clone().normalize(), fw = cen.clone().sub(s.pos).normalize();
    const rg = new T.Vector3().crossVectors(fw, up).normalize(), u2 = new T.Vector3().crossVectors(rg, fw).normalize();
    s.q.setFromRotationMatrix(new T.Matrix4().makeBasis(rg, u2, fw.clone().negate()));
    s.pos.copy(cen).addScaledVector(fw, -600);
  });
  await simWait(P, 1.5);
  r = await P.evaluate(async () => {
    const D = window.DeltaUno, B = D.batalla(), s = D.ship;
    let marcas = 0, fija = false;
    for (let i = 0; i < 100; i++) {
      marcas = Math.max(marcas, [...document.querySelectorAll('.mk')].filter(m => !m.hidden).length);
      if (D.tgtBestForTest()) fija = true;
      if (marcas > 0 && fija) break;
      await new Promise(r => setTimeout(r, 50));
    }
    const d = B.combatientes.filter(c => !c.esJugador && c.muerto <= 0 && c.bando !== 'guardia')
      .map(c => c.pos.distanceTo(s.pos)).sort((a, b) => a - b);
    return { cerca: Math.round(d[0]), mediana: Math.round(d[d.length >> 1]), balas: B.balas.length, marcas, fija };
  });
  // El reporte fue "los enemigos están muy dispersos y lejanos": nacen en tres frentes que se cruzan
  check('a los 12 s hay rivales encima, no a un kilómetro', r.cerca < 700, JSON.stringify(r));
  check('se están disparando', r.balas > 0, 'balas en el aire: ' + r.balas);
  /* El reporte fue "recibe daño de objetos invisibles que no detecta el marcador": los combatientes vivían en
     un sistema aparte y no existían para el HUD. Tienen que tener marca y poderse fijar. */
  check('los rivales tienen marca en pantalla', r.marcas > 0, 'marcas: ' + r.marcas);
  check('se los puede elegir como blanco', r.fija, '');

  /* ---- Elegir un blanco de verdad y volar con él, disparando ---- */
  /* Esta parte es la que faltaba, y es la que dejó pasar dos congelamientos. La versión anterior comprobaba
     que un rival "se puede elegir" pero nunca tocaba el botón Blanco, así que la variable target jamás
     contenía un combatiente de la batalla. Y el punto adelantado de la puntería —que lee target.fwd y
     target.speed— solo se calcula cuando hay blanco ELEGIDO. Faltaban esos dos campos en el adaptador: el
     cuadro moría antes de dibujar y la pantalla quedaba congelada mientras la partida seguía.
     Con el dibujo PRENDIDO, porque es el HUD el que se cae. */
  const tb = await center(P, '#tgtBtn');
  await L.touch('touchStart', [[tb[0], tb[1], 0]]); await simWait(P, .08);
  await L.touch('touchEnd', []); await simWait(P, .1);
  const elegido2 = await P.evaluate(() => {
    const D = window.DeltaUno, t = D.tgt();
    return { hay: !!t, esDeLaBatalla: !!(t && t.bat), tieneRumbo: !!(t && t.fwd), tieneVel: !!(t && typeof t.speed === 'number'),
             tieneVida: !!(t && typeof t.hp === 'number' && t.hpMax) };
  });
  check('se puede elegir un rival de la batalla con el botón Blanco', elegido2.hay && elegido2.esDeLaBatalla, JSON.stringify(elegido2));
  check('el rival elegido trae todo lo que el juego le lee: vida, rumbo y velocidad',
    elegido2.tieneVida && elegido2.tieneRumbo && elegido2.tieneVel, JSON.stringify(elegido2));

  // volar 8 s con el blanco puesto y disparando, que es cuando se caía
  const fb = await center(P, '#fire');
  await L.touch('touchStart', [[fb[0], fb[1], 0]]);
  await simWait(P, 8);
  await L.touch('touchEnd', []);
  const vivo = await P.evaluate(() => ({ errs: 0, modo: window.DeltaUno.run.mode, tgt: !!window.DeltaUno.tgt() }));
  check('volar 8 s con un rival elegido y disparando no rompe nada', L.errs.length === 0 && vivo.modo === 'batalla',
    L.errs.slice(0, 2).join(' | ') || JSON.stringify(vivo));

  // y un misil al rival elegido
  await P.evaluate(() => { const D = window.DeltaUno, t = D.tgt(); if (t) D.launchMissileForTest(t); });
  await simWait(P, 5);
  check('un misil contra un rival de la batalla no rompe nada', L.errs.length === 0, L.errs.slice(0, 2).join(' | '));

  await setRender(P, false);   // de acá en adelante no hace falta dibujar

  /* ---- Tus tiros les pegan y los derriban ---- */
  r = await P.evaluate(() => {
    const D = window.DeltaUno, B = D.batalla();
    const o = B.combatientes.find(c => !c.esJugador && c.muerto <= 0 && c.bando !== 'guardia');
    const antes = { vida: o.vida, kills: D.ship.kills };
    for (let i = 0; i < 10 && o.muerto <= 0; i++) B.golpeDelJugador(o.pos, 'guardia');
    return { cayo: o.muerto > 0, antes };
  });
  check('un rival se derriba a tiros', r.cayo, JSON.stringify(r));

  /* ---- Las explosiones lejanas no ahogan el dibujo ---- */
  /* Medido antes del arreglo: 1,5 explosiones por segundo con mediana de 1.822 m, cada una con su onda
     expansiva a tamaño completo. Las ondas son transparencias aditivas grandes y es lo que congelaba la
     pantalla en el teléfono. De cerca tienen que seguir enteras. */
  r = await P.evaluate(() => {
    const D = window.DeltaUno, V = D.ship.pos.constructor;
    const u = D.ship.pos.clone().normalize();
    const lejos = u.clone().multiplyScalar(D.ship.pos.length()).addScaledVector(new V(1, 0, 0).cross(u).normalize(), 5000);
    const antes = D.fxCuenta ? D.fxCuenta() : null;
    return { tieneCuenta: !!antes, lejos: Math.round(D.ship.pos.distanceTo(lejos)) };
  });
  const ondas = await P.evaluate(() => {
    const D = window.DeltaUno, V = D.ship.pos.constructor, u = D.ship.pos.clone().normalize();
    const lado = new V(1, 0, 0).cross(u).normalize();
    const mk = d => u.clone().multiplyScalar(D.ship.pos.length()).addScaledVector(lado, d);
    return { a5000: D.explosionAForTest(mk(5000), 9), a1800: D.explosionAForTest(mk(1800), 9), a200: D.explosionAForTest(mk(200), 9) };
  });
  check('a 5 km no se dibuja explosión', ondas.a5000 === 'nada', JSON.stringify(ondas));
  check('a 1,8 km es solo un destello, sin onda expansiva', ondas.a1800 === 'destello', JSON.stringify(ondas));
  check('a 200 m la explosión sigue entera', ondas.a200 === 'entera', JSON.stringify(ondas));

  /* ---- Nada crece con el tiempo ---- */
  const t0 = await P.evaluate(() => {
    const R = window.DeltaUno.renderer, e = window.DeltaUno.hitos().malla.parent;
    let o = 0; e.traverse(() => o++);
    return { objs: o, geo: R.info.memory.geometries, tex: R.info.memory.textures };
  });
  await simWait(P, 45);
  const t1 = await P.evaluate(() => {
    const R = window.DeltaUno, e = R.hitos().malla.parent;
    let o = 0; e.traverse(() => o++);
    return { objs: o, geo: R.renderer.info.memory.geometries, tex: R.renderer.info.memory.textures,
             calls: R.renderer.info.render.calls, tri: R.renderer.info.render.triangles };
  });
  /* Los primeros segundos suman unos pocos objetos, porque las mallas de cada diseño y nivel de detalle se
     arman cuando aparece la primera nave que las usa. Lo que no puede pasar es que siga creciendo: se mide
     otra vez 45 s después y entre las dos tomas tiene que quedar igual. */
  await simWait(P, 45);
  const t2 = await P.evaluate(() => {
    const R = window.DeltaUno, e = R.hitos().malla.parent;
    let o = 0; e.traverse(() => o++);
    return { objs: o, geo: R.renderer.info.memory.geometries, tex: R.renderer.info.memory.textures };
  });
  check('entre los 45 y los 90 s no crece nada: ni objetos, ni geometrías, ni texturas',
    t2.objs <= t1.objs && t2.geo <= t1.geo && t2.tex <= t1.tex, JSON.stringify({ t0, t1, t2 }));
  check('el dibujo se mantiene dentro del presupuesto (150 llamadas, 400.000 triángulos)',
    t1.calls < 150 && t1.tri < 400000, JSON.stringify({ calls: t1.calls, tri: t1.tri }));

  /* ---- Al salir y volver, el mundo queda entero ---- */
  r = await P.evaluate(() => {
    const D = window.DeltaUno;
    D.startRun('libre', 'facil');
    let vivas = 0, total = 0;
    for (const c of D.hitos().centros.values()) { vivas += c.cajas.filter(x => x.viva).length; total += c.total; }
    return { vivas, total, modo: D.run.mode, batallaVacia: D.batalla().combatientes.filter(c => !c.esJugador).length };
  });
  check('al cambiar de modo se desarma la batalla y las construcciones vuelven a estar en pie',
    r.modo === 'libre' && r.vivas === r.total && r.batallaVacia === 0, JSON.stringify(r));

  await P.screenshot({ path: H.dir + '/batalla.png' });
  check('sin errores', L.errs.length === 0, L.errs.join(' | '));
  await browser.close();
})().catch(e => { console.error('EXC', e); process.exit(1); });
