// Gráficos y sonido: calidad Baja / Media / Alta, diseños de la nave, explosiones (fuego, humo, restos, onda),
// ondulación del escudo y los sonidos sintetizados (motor, cañón, explosiones ubicadas, radio).
// Se corre con: npm test -- graficos
const H = require('../helpers');
const { launch, open, check, sleep, f } = H;
H.autostart = true;

(async () => {
  const browser = await launch();
  const L = await open(browser, { width: 844, height: 390 });
  const { page } = L;
  const click = sel => page.evaluate(s => document.querySelector(s).click(), sel);
  await H.waitGrace(page);
  await H.pinAlt(page, 150);

  /* ---------- Pestaña Gráficos ---------- */
  const gear = await H.center(page, '#gear');
  await page.touchscreen.tap(gear[0], gear[1]);
  await sleep(250);
  await click('.tab[data-tab="gfx"]');
  await sleep(150);
  let r = await page.evaluate(() => {
    const p = document.querySelector('[data-panel="gfx"]');
    return { visible: !p.hidden, q: [...p.querySelectorAll('.seg[data-key="quality"] button')].map(b => b.dataset.val).join(','), on: p.querySelector('.seg[data-key="quality"] [aria-pressed="true"]')?.dataset.val, note: document.querySelector('#qualityNote').textContent, models: p.querySelectorAll('.seg[data-key="shipModel"] button').length };
  });
  check('la pestaña Gráficos muestra calidad, diseño y colores de la nave', r.visible && r.q === 'auto,baja,media,alta' && r.models === 4, f(r));
  check('la calidad arranca en Automática y dice cuál eligió', r.on === 'auto' && /^Automática: en este equipo usa (Baja|Media|Alta)\.$/.test(r.note), r.note);

  /* ---------- Calidad ---------- */
  await click('.seg[data-key="quality"] button[data-val="baja"]'); await sleep(150);
  r = await page.evaluate(() => { const D = window.DeltaUno, m = D.shipMesh(); return { q: D.quality().name, mat: m.material.type, pr: D.renderer.getPixelRatio(), saved: JSON.parse(localStorage.getItem('delta-uno-ajustes-v3') || '{}').quality }; });
  check('Baja: resolución 1, nave lisa y queda guardada', r.q === 'baja' && r.mat === 'MeshLambertMaterial' && r.pr === 1 && r.saved === 'baja', f(r));
  await click('.seg[data-key="quality"] button[data-val="alta"]'); await sleep(150);
  r = await page.evaluate(() => { const D = window.DeltaUno, m = D.shipMesh(); return { q: D.quality().name, mat: m.material.type, map: !!m.material.map, note: document.querySelector('#qualityNote').textContent }; });
  check('Alta: nave con paneles (textura) y aviso "Elegida a mano"', r.q === 'alta' && r.mat === 'MeshPhongMaterial' && r.map && /Elegida a mano: Alta/.test(r.note), f(r));
  await click('#resume'); await sleep(200);

  /* ---------- Diseños de la nave ---------- */
  r = await page.evaluate(() => {
    const D = window.DeltaUno, out = [];
    for (const m of ['actual', 'guardia', 'interceptor', 'blindado']) {
      D.settings.shipModel = m; D.buildPlayerShip();
      const mesh = D.shipMesh(), n = D.NAVES[m];
      const okFlames = D.flames.every((fl, i) => fl.cone.position.distanceTo(new window.THREE.Vector3(...n.engines[i])) < 0.3);
      out.push({ m, verts: mesh.geometry.attributes.position.count, inGroup: !!mesh.parent, okFlames });
    }
    D.settings.shipModel = 'actual'; D.buildPlayerShip();
    return out;
  });
  check('los 4 diseños se arman, quedan en la nave y las llamas van en sus motores', r.every(x => x.verts > 30 && x.inGroup && x.okFlames), f(r.map(x => x.m + ':' + x.verts + (x.okFlames ? '' : ' llamas mal')).join(' ')));

  /* ---------- Explosiones ---------- */
  const boom = q => page.evaluate(q => {
    const D = window.DeltaUno, T = window.THREE;
    D.settings.quality = q; D.applyQuality(); D.FX.clear();
    const p = D.ship.pos.clone().add(new T.Vector3(0, 0, -1).applyQuaternion(D.ship.q).multiplyScalar(150));
    D.explodeForTest(p, 9);
    const dbg = D.FX.debug();
    return { ...dbg };
  }, q);
  const alta = await boom('alta'), baja = await boom('baja');
  check('Alta: la explosión suelta restos y onda expansiva', alta.debris >= 6 && alta.waves === 1, f(alta));
  check('Baja: menos restos y sin onda', baja.debris < alta.debris && baja.waves === 0, f(baja));
  await H.simWait(page, 3.6); // segundos del juego, no del reloj
  r = await page.evaluate(() => window.DeltaUno.FX.debug());
  check('los restos desaparecen solos', r.debris === 0 && r.waves === 0, f(r));

  /* ---------- Escudo ---------- */
  r = await page.evaluate(() => {
    const D = window.DeltaUno, T = window.THREE;
    D.setInv(0); const sh0 = D.vit().shield;
    D.damage(4, new T.Vector3(1, 0, 0).applyQuaternion(D.ship.q));
    return { shield: D.vit().shield < sh0, glow: D.shieldFx.mesh.visible };
  });
  check('un tiro al escudo lo hace brillar', r.shield && r.glow, f(r));

  /* ---------- Sonido ---------- */
  await page.touchscreen.tap(420, 200); // el navegador deja sonar recién después de un toque
  await sleep(300);
  r = await page.evaluate(async () => {
    const D = window.DeltaUno, S = D.sfx, T = window.THREE;
    S.init();
    const ahead = d => D.ship.pos.clone().add(new T.Vector3(0, 0, -1).applyQuaternion(D.ship.q).multiplyScalar(d));
    S.shot(); S.tick(); S.shieldHit(); S.hullHit(); S.missile(); S.whoosh(); S.dodge(); S.pickup();
    S.enemyShot(ahead(200)); S.boom(9, ahead(120)); S.boom(30, ahead(900));
    S.radioOpen(); await new Promise(r => setTimeout(r, 400)); S.radioClose();
    S.engine(1, 1, 1, false);
    return { state: S.ctx && S.ctx.state, ...S.debug() };
  });
  const names = ['shot', 'tick', 'shieldHit', 'hullHit', 'missile', 'whoosh', 'dodge', 'pickup', 'enemyShot', 'radioOpen', 'radioClose'];
  check('suenan cañón, impactos, misil, turbo, esquive, radio y tiros enemigos', names.every(n => r[n] >= 1), f(r));
  check('las explosiones suenan (cerca y lejos)', r.boom >= 2, f(r));
  // muchas explosiones juntas: no más de 4 a la vez, para no saturar
  r = await page.evaluate(() => { const S = window.DeltaUno.sfx, b0 = S.counts.boom || 0; for (let i = 0; i < 12; i++) S.boom(6, null); return (S.counts.boom || 0) - b0; });
  check('12 explosiones en el mismo instante suenan como 4 como máximo', r <= 4 && r >= 1, String(r));
  await sleep(3000);
  r = await page.evaluate(() => window.DeltaUno.sfx.debug());
  check('los sonidos terminan solos (no quedan voces colgadas)', r.estado !== 'running' || r.voces <= 2, f(r));
  // el cañón real usa el sonido nuevo
  const n0 = await page.evaluate(() => window.DeltaUno.sfx.counts.shot || 0), fb = await H.center(page, '#fire');
  await L.touch('touchStart', [[fb[0], fb[1], 7]]); await H.simWait(page, 1); await L.touch('touchEnd', []);
  r = await page.evaluate(n0 => (window.DeltaUno.sfx.counts.shot || 0) - n0, n0);
  check('disparar en el juego hace sonar el cañón', r >= 2, String(r));

  check('sin errores en la página', L.errs.length === 0, L.errs.join(' | '));
  await browser.close();
})();
