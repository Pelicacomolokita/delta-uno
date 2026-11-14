// Fichas de vuelo por nave, gravedad regulada, reglas del fijado, dificultad por stats, daño y destrucción,
// misiles colgados y la nave nueva en la pantalla de preparación.
// Se corre con: npm test -- vuelo
const H = require('../helpers');
const { launch, open, check, sleep, setRender, f, simWait, waitGrace, path, dir } = H;
H.autostart = false;

(async () => {
  const browser = await launch();
  const L = await open(browser, { width: 844, height: 390 });
  const { page } = L;
  await sleep(600);

  /* ---------- Ficha del caza y velocidades del combate ---------- */
  await page.evaluate(() => window.DeltaUno.startRun('libre'));
  await setRender(page, false);
  await waitGrace(page);
  let r = await page.evaluate(() => { const D = window.DeltaUno, T = D.TUNE; return { vmax: T.vmax, cruise: +(T.cruise * T.vmax).toFixed(0), heat: T.heatTime, pitch: +(T.pitch * 57.3).toFixed(0), roll: +(T.roll * 57.3).toFixed(0), hull: T.hull, em: D.EM.speed, lock: D.FIJADO.lockRange }; });
  check('el caza vuela con su ficha: 200 m/s, crucero 130, recalienta en 22 s, cabeceo 125°/s', r.vmax === 200 && r.cruise === 130 && r.heat === 22 && r.pitch === 125 && r.roll === 170 && r.hull === 100, f(r));
  check('el misil enemigo sigue siendo más lento que cualquier nave a fondo', Object.values(await page.evaluate(() => window.DeltaUno.FICHAS)).every(F => F.vmax > r.em) && r.lock === 1300, f(r));
  r = await page.evaluate(() => ({ caza: window.DeltaUno.ENEMY_DEF.caza.attack, inter: window.DeltaUno.ENEMY_DEF.interceptor.attack }));
  check('los enemigos atacando van a la par de tu crucero, como antes', r.caza === 132 && r.inter === 196, f(r));

  /* ---------- Gravedad regulada ---------- */
  r = await page.evaluate(async () => {
    const D = window.DeltaUno, s = D.ship, wait = sec => new Promise(res => { const t0 = s.t, i = setInterval(() => { if (s.t - t0 >= sec) { clearInterval(i); res(); } }, 15); });
    D.straighten(); s.pos.setLength(D.PLANET_R + 400); s.throttle = D.TUNE.cruise; s.speed = D.TUNE.cruise * D.TUNE.vmax; s.fall = 0;
    await wait(.3);
    const bajo = { grav: s.grav, fall: s.fall };
    D.straighten(); s.pos.setLength(D.PLANET_R + 1100); s.fall = 0;
    await wait(.3);
    const alto = { grav: s.grav };
    // frenada en seco: casi sin velocidad, la nave se hunde
    D.straighten(); s.pos.setLength(D.PLANET_R + 700); s.throttle = D.TUNE.throttleMin; s.speed = 20; s.vel.setLength(20); s.fall = 0;
    const r0 = s.pos.length();
    await wait(1);
    return { bajo, alto, cae: +(r0 - s.pos.length()).toFixed(1), fall: +s.fall.toFixed(1) };
  });
  check('a poca altura la gravedad no se siente', r.bajo.grav === 0 && r.bajo.fall < .5, f(r.bajo));
  check('más arriba la gravedad se va sintiendo', r.alto.grav > .5, f(r.alto));
  check('al frenar en seco la nave se hunde', r.cae > 3 && r.fall > 3, f(r));

  /* ---------- Fijado: adelante, a la vista y de tu sector ---------- */
  await page.evaluate(() => window.DeltaUno.startRun('conquista', 'medio'));
  await waitGrace(page);
  r = await page.evaluate(() => {
    const D = window.DeltaUno, s = D.ship, V = s.pos.constructor;
    D.straighten(); s.pos.setLength(D.PLANET_R + 1300); s.speed = 0;
    const u = s.pos.clone().normalize(), fw = new V(0, 0, -1).applyQuaternion(s.q), rt = new V(1, 0, 0).applyQuaternion(s.q);
    D.enemies.slice().forEach(e => { e.on = false; }); D.enemies.length = 0;
    const mk = (pos, zone) => { const g = D.makeGroup(zone || D.roamZone, ['caza'], pos, u, 1, false); g.leader.speed = 0; return g.leader; };
    const adelante = mk(s.pos.clone().addScaledVector(fw, 500));
    const atras = mk(s.pos.clone().addScaledVector(fw, -300));
    const costado = mk(s.pos.clone().addScaledVector(rt, 600).addScaledVector(fw, 80));
    const cerca = mk(s.pos.clone().addScaledVector(rt, 150).addScaledVector(fw, 60));
    const z = D.zones.find(z => z !== null), otraZona = mk(s.pos.clone().addScaledVector(fw, 700).addScaledVector(rt, 30), z);
    const tapado = mk(s.pos.clone().normalize().multiplyScalar(D.PLANET_R - 300).addScaledVector(fw, 400));
    const pos = s.pos, fwd = fw, cand = D.enemies.filter(e => e.on);
    const ok = e => D.fijable(e);
    return { adelante: ok(adelante), atras: ok(atras), otraZona: ok(otraZona), tapado: ok(tapado), cerca: ok(cerca),
      zonaActual: D.vit().curZone, mismas: otraZona.group.zone === z };
  });
  check('se puede fijar al que está adelante y a la vista', r.adelante === true, f(r));
  check('no se fija a uno tapado por el planeta', r.tapado === false, f(r));
  check('no se fija a uno de otro sector que no te ataca', r.zonaActual === null ? r.otraZona === false : true, f(r));
  r = await page.evaluate(() => {
    const D = window.DeltaUno;
    D.tgtOffForTest && D.tgtOffForTest();
    const first = D.tgtBestForTest();
    return { primero: first ? first.pos.distanceTo(D.ship.pos).toFixed(0) : null, atras: D.enemies.filter(e => e.on).some(e => e === first && new D.ship.pos.constructor(0, 0, -1).applyQuaternion(D.ship.q).dot(e.pos.clone().sub(D.ship.pos)) < 0) };
  });
  check('el botón Blanco marca lo que tenés adelante, nunca atrás', r.primero !== null && !r.atras, f(r));

  /* ---------- Dificultad por stats ---------- */
  r = await page.evaluate(() => {
    const D = window.DeltaUno, out = {};
    for (const d of ['facil', 'medio', 'dificil', 'extremo']) {
      D.startRun('conquista', d);
      const e = D.enemies.find(x => x.kind === 'caza') || null;
      out[d] = { v: D.run.ventaja, misiles: D.vit().missiles, rep: D.run.reparaciones, hp: e ? +e.hpMax.toFixed(2) : null };
    }
    return out;
  });
  check('fácil: enemigos un 30 % más flojos; difícil: un 30 % más fuertes; extremo: 50 %', r.facil.v === .7 && r.medio.v === 1 && r.dificil.v === 1.3 && r.extremo.v === 1.5, f({ f: r.facil.v, m: r.medio.v, d: r.dificil.v, x: r.extremo.v }));
  check('extremo: 2 misiles y una sola reparación', r.extremo.misiles === 2 && r.extremo.rep === 1 && r.medio.misiles === 4, f(r.extremo));
  r = await page.evaluate(() => ({ diff: window.DeltaUno.MODES.historia.diff }));
  check('la Historia también tiene dificultad', r.diff === true, f(r));

  /* ---------- Daño, destrucción y misiles colgados ---------- */
  await page.evaluate(() => window.DeltaUno.startRun('libre'));
  await waitGrace(page);
  r = await page.evaluate(async () => {
    const D = window.DeltaUno, s = D.ship, V = s.pos.constructor, wait = sec => new Promise(res => { const t0 = s.t, i = setInterval(() => { if (s.t - t0 >= sec) { clearInterval(i); res(); } }, 15); });
    D.straighten(); s.pos.setLength(D.PLANET_R + 900); D.setInv(99);
    const u = s.pos.clone().normalize(), fw = new V(0, 0, -1).applyQuaternion(s.q);
    const g = D.makeGroup(D.roamZone, ['caza'], s.pos.clone().addScaledVector(fw, 200), u, 1, false), e = g.leader;
    e.hp = e.hpMax * .2;
    await wait(.6);
    const dano = e.nueva && e.nueva.dano, humo = D.naves().danos.resumen().humo;
    D.hitEnemyForTest(e);
    await wait(.1);
    const rot = D.naves().danos.resumen();
    // misiles: tirar uno y ver que el colgado desaparece
    D.setMissiles(4); await wait(.05);
    const antes = D.navePropia().disparados;
    const g2 = D.makeGroup(D.roamZone, ['caza'], s.pos.clone().addScaledVector(fw, 600), u, 1, false);
    D.launchMissileForTest(g2.leader); await wait(.05);
    const despues = D.navePropia().disparados;
    return { dano: +(dano || 0).toFixed(2), humo, pedazos: rot.pedazos, antes, despues, lugares: D.naves().puntos('A').misiles.length };
  });
  check('un enemigo con poca vida larga humo', r.dano >= .75 && r.humo > 0, f(r));
  check('al caer se parte en sus piezas', r.pedazos >= 3, f(r));
  check('el caza lleva 4 misiles colgados y se van gastando', r.lugares === 4 && r.antes === 0 && r.despues === 1, f(r));

  /* ---------- Compañeros: simulan los golpes y esquivan, pero no caen ---------- */
  await page.evaluate(() => { const D = window.DeltaUno; D.startRun('historia', 'medio', D.MISIONES[0].id); });
  await waitGrace(page);
  r = await page.evaluate(async () => {
    const D = window.DeltaUno, s = D.ship, wait = sec => new Promise(res => { const t0 = s.t, i = setInterval(() => { if (s.t - t0 >= sec) { clearInterval(i); res(); } }, 15); });
    const a = D.allies[0], b = D.eBolts[0];
    if (!a) return { sinAliados: true };
    // diez tiros que le pegan de lleno
    for (let k = 0; k < 10; k++) {
      b.on = true; b.life = 1; b.dmg = 9; b.area = 0;
      b.v.copy(a.fwd).multiplyScalar(-300); b.p.copy(a.pos).addScaledVector(a.fwd, 2); b.prev.copy(b.p);
      await wait(.05);
    }
    const dano = a.danoSim, nueva = a.nueva && a.nueva.dano, sigue = a.mesh.visible && D.allies.includes(a);
    // un tiro que pasa cerca: esquiva
    const c = D.allies[1]; c.evade = 0;
    b.on = true; b.life = 1; b.dmg = 9; b.p.copy(c.pos).addScaledVector(D.ship.pos.clone().normalize(), 15); b.prev.copy(b.p).addScaledVector(c.fwd, -5); b.v.copy(c.fwd).multiplyScalar(-300);
    await wait(.05);
    return { dano: +(dano || 0).toFixed(2), nueva: +(nueva || 0).toFixed(2), sigue, esquiva: c.evade > 0 };
  });
  check('un compañero alcanzado larga humo pero no cae', r.dano >= .4 && r.dano <= .7 && r.nueva > .3 && r.sigue, f(r));
  check('un tiro que pasa cerca lo hace esquivar', r.esquiva === true, f(r));
  r = await page.evaluate(async () => {
    const D = window.DeltaUno, s = D.ship, b = D.eBolts[1], wait = sec => new Promise(res => { const t0 = s.t, i = setInterval(() => { if (s.t - t0 >= sec) { clearInterval(i); res(); } }, 15); });
    D.setInv(0); D.allies.forEach(a => { a.mesh.visible = false; }); D.eBolts.forEach(x => { x.on = false; }); D.enemies.forEach(e => { e.cool = 99; });
    const v0 = D.vit(), side = new s.pos.constructor(1, 0, 0).applyQuaternion(s.q);
    b.on = true; b.life = 1; b.dmg = 16; b.area = 9; b.p.copy(s.pos).addScaledVector(side, 6); b.prev.copy(b.p); b.v.set(0, 0, 0);
    await wait(.05);
    const v1 = D.vit(); D.allies.forEach(a => { a.mesh.visible = true; });
    return { antes: v0.shield + v0.hull, despues: v1.shield + v1.hull, sigue: b.on };
  });
  check('la pesada hace parte del daño aunque el tiro pase a unos metros', Math.abs(r.antes - r.despues - 16 * .4) < .5 && !r.sigue, f(r));

  /* ---------- Preparar la salida: la nave nueva, con su pintura ---------- */
  await page.evaluate(() => window.DeltaUno.openMenu()); await sleep(200);
  await page.evaluate(() => document.querySelector('.mode[data-mode="libre"]').click()); await sleep(100);
  await page.evaluate(() => document.querySelector('#loadoutBtn').click()); await sleep(300);
  await page.evaluate(() => document.querySelector('#prepTabs [data-step="nave"]').click());
  await setRender(page, true);
  // con la máquina cargada el primer cuadro de la vitrina puede tardar: se espera hasta 4 s a que aparezca la nave
  await page.waitForFunction(() => { const c = document.querySelector('#classShip'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 16) if (d[i] > 0) return true; return false; }, null, { timeout: 4000 }).catch(() => {});
  r = await page.evaluate(() => {
    const c = document.querySelector('#classShip'), ctx = c.getContext('2d'), d = ctx.getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return { pix: n, total: c.width * c.height, bars: [...document.querySelectorAll('#classStats i')].map(i => i.getAttribute('aria-label')[0]).join('') };
  });
  check('la pestaña Nave muestra la nave nueva girando', r.pix > r.total * .02, f(r));
  check('las barras salen de la ficha real del caza', r.bars === '3433', f(r));
  await page.evaluate(() => document.querySelector('#prepTabs [data-step="diseno"]').click()); await sleep(200);
  r = await page.evaluate(() => ({ cuerpos: document.querySelectorAll('#bodyList .pick').length, bloqueadas: document.querySelectorAll('#bodyList .pick.locked').length, pinturas: [...document.querySelectorAll('#paintSeg button')].map(b => b.dataset.val).join(',') }));
  check('Diseño: las pinturas del escuadrón y cuatro carrocerías, tres bloqueadas', r.cuerpos === 4 && r.bloqueadas === 3 && r.pinturas === 'guardia,guardiaNoche', f(r));
  await page.evaluate(() => document.querySelector('#paintSeg button[data-val="guardiaNoche"]').click()); await sleep(200);
  r = await page.evaluate(() => ({ propia: window.DeltaUno.navePropia().pintura }));
  check('cambiar la pintura cambia la nave nueva', r.propia === 'guardiaNoche', f(r));
  await page.screenshot({ path: path.join(dir, 'prep-diseno-nueva.png') });

  /* ---------- Novedades de la versión, desde el menú ---------- */
  await page.evaluate(() => { document.querySelector('#brief') && (document.querySelector('#brief').hidden = true); window.DeltaUno.openMenu(); });
  await sleep(200);
  await page.evaluate(() => document.querySelector('#novBtn').click()); await sleep(200);
  r = await page.evaluate(() => ({ abierto: !document.querySelector('#nov').hidden, secciones: [...document.querySelectorAll('#novText h3')].map(h => h.textContent), items: document.querySelectorAll('#novText li').length, titulo: document.querySelector('#novHead h2').textContent }));
  check('el menú muestra las novedades de la versión', r.abierto && r.secciones.includes('Qué probar en el teléfono') && r.items > 15 && /Novedades de la \d/.test(r.titulo), f(r));
  await page.screenshot({ path: path.join(dir, 'novedades.png') });
  await page.evaluate(() => document.querySelector('#novClose').click());
  r = await page.evaluate(() => document.querySelector('#nov').hidden);
  check('Cerrar vuelve al menú', r === true, f(r));

  check('sin errores en la página', L.errs.length === 0, L.errs.join(' | '));
  await browser.close();
})();
