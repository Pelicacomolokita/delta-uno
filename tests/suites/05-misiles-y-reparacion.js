// Misiles guiados, fijado, repuestos y reparación
// Se corre con: npm test (todas) o node tests/suites/05-misiles-y-reparacion.js (solo esta, después de npm run build:test)
const H = require('../helpers');
const { chromium, fs, path, dir, check, sleep, open, center, setRender, st, f, simWait, place, pinAlt, faceOut, waitGrace } = H;
H.autostart = true;
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const L = await open(browser, { width: 844, height: 390 });
  await sleep(1400);
  await L.page.screenshot({ path: path.join(dir, 'm-0-inicio.png') });
  await setRender(L.page, false);

  /* botones */
  const layout = async () => L.page.evaluate(() => {
    const box = i => { const r = document.querySelector(i).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2 }; };
    const ids = ['#gear', '#readout', '#thrust', '#fire', '#rollL', '#rollR', '#repair', '#missile', '#stick', '#vitals', '#zone'];
    const rs = ids.map(i => [i, box(i)]), over = [];
    for (let a = 0; a < rs.length; a++) for (let b = a + 1; b < rs.length; b++) { const A = rs[a][1], B = rs[b][1]; if (A.l < B.r && B.l < A.r && A.t < B.b && B.t < A.b) over.push(rs[a][0] + 'x' + rs[b][0]); }
    return { over, rollL: box('#rollL'), rollR: box('#rollR'), repair: box('#repair'), fire: box('#fire'), missile: box('#missile'), thrustH: document.querySelector('#thrustTrack').offsetHeight, W: innerWidth, H: innerHeight };
  });
  for (const vp of [{ width: 844, height: 390 }, { width: 640, height: 360 }, { width: 568, height: 320 }]) {
    await L.page.setViewportSize(vp); await sleep(250);
    const b = await layout();
    check('botones sin encimarse a ' + vp.width + 'x' + vp.height, b.over.length === 0 && b.thrustH > 90, 'empuje ' + b.thrustH + ' ' + b.over.join());
    check('Reparar, los dos Rotar y Fuego en la misma línea', Math.abs(b.rollL.cy - b.rollR.cy) < .5 && Math.abs(b.rollL.cy - b.fire.cy) < 1 && Math.abs(b.repair.cy - b.rollL.cy) < .5 && b.repair.r < b.rollL.l && b.rollL.r < b.rollR.l && b.rollR.r < b.fire.l);
    check('Misil justo arriba de Fuego', Math.abs(b.missile.cx - b.fire.cx) < 1 && b.missile.b <= b.fire.t);
  }
  await L.page.setViewportSize({ width: 844, height: 390 }); await sleep(250);

  /* reparación */
  await L.page.evaluate(() => { const D = window.DeltaUno; D.straighten(); D.ship.pos.setLength(D.PLANET_R + 950); });
  await waitGrace(L.page);
  const rb = await center(L.page, '#repair');
  await L.touch('touchStart', [[rb[0], rb[1], 0]]); await L.touch('touchEnd', []);
  await simWait(L.page, .1);
  let v = await st(L.page);
  check('con la vida llena no gasta la reparación', v.repairT === 0 && v.repairCool === 0, f({ t: v.repairT, c: v.repairCool }));
  await L.page.evaluate(() => { const D = window.DeltaUno; D.damage(150); });
  const h0 = (await st(L.page)).hull;
  await L.touch('touchStart', [[rb[0], rb[1], 0]]); await L.touch('touchEnd', []);
  await simWait(L.page, 4);
  v = await st(L.page);
  check('repara de a poco', v.repairT > 3 && v.hull > h0 + 12 && v.hull < h0 + 18, f({ antes: h0, ahora: v.hull, resto: v.repairT }));
  const fc = await center(L.page, '#fire');
  await L.touch('touchStart', [[fc[0], fc[1], 0]]);
  await simWait(L.page, .5);
  const stillRep = await st(L.page);
  await L.touch('touchEnd', []);
  check('se puede disparar mientras repara', stillRep.repairT > 2);
  await L.page.evaluate(() => window.DeltaUno.damage(4));
  v = await st(L.page);
  const toastCut = await L.page.evaluate(() => document.querySelector('#toast').textContent);
  check('un golpe corta la reparación y arranca la recarga', v.repairT === 0 && v.repairCool > 44 && /cortada/.test(toastCut), f({ c: v.repairCool, toastCut }));
  await L.touch('touchStart', [[rb[0], rb[1], 0]]); await L.touch('touchEnd', []);
  await simWait(L.page, .1);
  v = await st(L.page);
  check('en recarga no se puede volver a reparar', v.repairT === 0);
  const rW = await L.page.evaluate(() => document.querySelector('#repairWord').textContent);
  check('el botón muestra los segundos que faltan', /\d+ s/.test(rW), rW);
  await L.page.evaluate(() => {
    const D = window.DeltaUno, s = D.ship, V = s.pos.constructor; let best = null, bs = -1, seed = 77;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 800; i++) { const z = rnd() * 2 - 1, t = rnd() * 6.283, r = Math.sqrt(1 - z * z), u = new V(Math.cos(t) * r, z, Math.sin(t) * r); const m = Math.min(...D.zones.map(q => Math.acos(u.dot(q.dir)))); if (m > bs) { bs = m; best = u; } }
    s.pos.copy(best).multiplyScalar(D.PLANET_R + 950); s.throttle = .2; s.speed = 26; D.straighten();
  });
  const full = await L.page.evaluate(async () => {
    const D = window.DeltaUno, s = D.ship, t0 = s.t;
    await new Promise(r => { const i = setInterval(() => { if (D.vit().repairCool <= 0 || s.t - t0 > 60) { clearInterval(i); r(); } }, 40); });
    return s.t - t0;
  });
  check('la recarga tarda unos 45 segundos', full > 43 && full < 47, full.toFixed(1) + ' s');
  const hb = (await st(L.page)).hull;
  await L.touch('touchStart', [[rb[0], rb[1], 0]]); await L.touch('touchEnd', []);
  await simWait(L.page, 8.4);
  v = await st(L.page);
  check('una reparación completa da unos 30 de vida', Math.abs(v.hull - hb - 30) < 2 && v.repairT === 0 && v.repairCool > 43, f({ antes: hb, ahora: v.hull, c: v.repairCool }));

  /* misiles */
  await L.page.evaluate(() => { window.DeltaUno.ship.throttle = .5; });
  await pinAlt(L.page, 170);
  await place(L.page, 0, .4, 300);
  await waitGrace(L.page);
  await L.page.waitForFunction(() => window.DeltaUno.enemies.length >= 2, null, { timeout: 25000 });
  // deja un enemigo fijo delante de la nariz y lo aleja un poco del centro de la mira
  const pin = (ang, dist) => L.page.evaluate(([ang, dist]) => {
    const D = window.DeltaUno, s = D.ship, V = s.pos.constructor; clearInterval(window.__pin);
    window.__pinned = D.enemies.find(x => x.kind === 'caza') || D.enemies[0];
    D.enemies.forEach(e => { e.cool = 99; });
    window.__pin = setInterval(() => {
      const e = window.__pinned; if (!e || !e.on) return;
      D.enemies.forEach(o => { o.cool = 99; o.burst = 0; });
      const fw = new V(0, 0, -1).applyQuaternion(s.q), r = new V(1, 0, 0).applyQuaternion(s.q);
      e.pos.copy(s.pos).addScaledVector(fw, dist * Math.cos(ang)).addScaledVector(r, dist * Math.sin(ang));
      e.fwd.copy(fw); e.speed = s.speed; e.breakT = 0;
    }, 4);
    const m = window.__pinned; return { kind: m.kind, hp: m.hp };
  }, [ang, dist]);
  const mb = await center(L.page, '#missile');
  const p1 = await pin(.2, 320);
  v = await st(L.page);
  const m0 = v.missiles;
  // suelta antes de tiempo: no gasta
  await L.touch('touchStart', [[mb[0], mb[1], 0]]);
  await simWait(L.page, .4);
  const mid = await st(L.page);
  await L.touch('touchEnd', []);
  await simWait(L.page, .05);
  v = await st(L.page);
  const tEarly = await L.page.evaluate(() => document.querySelector('#toast').textContent);
  check('mantener apretado va fijando', mid.lockOn && mid.hasLock && mid.lockP > .2 && mid.lockP < .8, f({ p: mid.lockP }));
  check('soltar antes de fijar no gasta misil', v.missiles === m0 && /Sin blanco/.test(tEarly), f({ m: v.missiles, tEarly }));
  // fija y dispara
  await L.touch('touchStart', [[mb[0], mb[1], 0]]);
  await simWait(L.page, 1.15);
  const locked = await st(L.page);
  const lockTxt = await L.page.evaluate(() => { const e = document.querySelector('#lockText'); return { t: e.textContent, hidden: document.querySelector('#lockMk').hidden, cls: document.querySelector('#missile').className }; });
  check('al segundo queda fijado', locked.lockP >= 1 && lockTxt.t === 'Fijado' && !lockTxt.hidden && /locked/.test(lockTxt.cls), JSON.stringify(lockTxt));
  const killsB = (await L.page.evaluate(() => window.DeltaUno.ship.kills));
  await L.touch('touchEnd', []);
  await simWait(L.page, .1);
  v = await st(L.page);
  const fl = await L.page.evaluate(() => window.DeltaUno.rockets.filter(r => r.on).length);
  check('al soltar sale el misil y baja la munición', v.missiles === m0 - 1 && fl === 1, f({ m: v.missiles, enVuelo: fl }));
  await L.page.waitForFunction(() => window.DeltaUno.rockets.every(r => !r.on), null, { timeout: 15000 });
  const k1 = await L.page.evaluate(() => { clearInterval(window.__pin); return window.DeltaUno.ship.kills; });
  check('un misil guiado derriba un caza aunque no esté en el centro', k1 > killsB, 'derribos ' + (k1 - killsB));

  /* nave pesada: dos misiles */
  const hv = await L.page.evaluate(() => {
    const D = window.DeltaUno, s = D.ship, V = s.pos.constructor, e = D.enemies.find(x => x.kind === 'pesada');
    if (!e) return null;
    clearInterval(window.__pin); window.__pinned = e;
    window.__pin = setInterval(() => {
      if (!e.on) return;
      D.enemies.forEach(o => { o.cool = 99; o.burst = 0; });
      const fw = new V(0, 0, -1).applyQuaternion(s.q);
      e.pos.copy(s.pos).addScaledVector(fw, 300); e.fwd.copy(fw); e.speed = s.speed; e.breakT = 0;
    }, 4);
    return { hp: e.hp };
  });
  if (hv) {
    const shoot = async () => { await L.touch('touchStart', [[mb[0], mb[1], 0]]); await simWait(L.page, 1.15); await L.touch('touchEnd', []); await simWait(L.page, .1); await L.page.waitForFunction(() => window.DeltaUno.rockets.every(r => !r.on), null, { timeout: 15000 }); };
    await shoot();
    const a1 = await L.page.evaluate(() => window.__pinned.hp);
    await shoot();
    const a2 = await L.page.evaluate(() => window.__pinned.on);
    check('la nave pesada necesita dos misiles', a1 === hv.hp - 6 && a2 === false, f({ tras1: a1, viva: a2 }));
  } else console.log('sin pesada a mano');
  await L.page.evaluate(() => clearInterval(window.__pin));

  /* recarga y repuesto */
  await L.page.evaluate(() => { const D = window.DeltaUno; clearInterval(window.__dropOff); window.__dropOff = setInterval(() => D.drops.forEach(d => { d.on = false; d.mesh.visible = false; }), 10); });
  const r0 = await st(L.page);
  const rc = await L.page.evaluate(async () => {
    const D = window.DeltaUno, s = D.ship, a = D.vit().missiles, t0 = s.t;
    await new Promise(r => { const i = setInterval(() => { if (D.vit().missiles > a || s.t - t0 > 30) { clearInterval(i); r(); } }, 40); });
    return { antes: a, despues: D.vit().missiles, seg: s.t - t0 };
  });
  check('recupera un misil solo', rc.despues === rc.antes + 1 && rc.seg < 21, f(rc));
  await L.page.evaluate(() => clearInterval(window.__dropOff));
  const dp = await L.page.evaluate(async () => {
    const D = window.DeltaUno, s = D.ship, V = s.pos.constructor;
    D.setMissiles(2); // que haya lugar para recibir
    const before = D.vit().missiles, d = D.drops.find(x => !x.on), fw = new V(0, 0, -1).applyQuaternion(s.q);
    D.spawnDrop(d, s.pos.clone().addScaledVector(fw, 25), 'misil');
    await new Promise(r => { const t0 = s.t, i = setInterval(() => { if (!d.on || s.t - t0 > 4) { clearInterval(i); r(); } }, 15); });
    return { tomado: !d.on, antes: before, despues: D.vit().missiles };
  });
  check('el repuesto da misiles', dp.tomado && dp.despues > dp.antes && dp.despues <= 4, f(dp));
  // sin misiles


  /* un corte del sistema no dispara */
  await pin(.1, 300);
  const before = (await st(L.page)).missiles;
  await L.touch('touchStart', [[mb[0], mb[1], 0]]);
  await simWait(L.page, 1.15);
  await L.page.evaluate(() => { window.dispatchEvent(new Event('blur')); });
  await L.touch('touchEnd', []);
  await simWait(L.page, .1);
  const after = await st(L.page);
  check('si el sistema corta el toque no dispara', after.missiles === before && !after.lockOn, f({ a: before, b: after.missiles }));
  await L.page.evaluate(() => clearInterval(window.__pin));

  /* fotos */
  await pin(.16, 230);
  await setRender(L.page, true);
  await L.page.keyboard.down('KeyF');
  await sleep(2600);
  await L.page.screenshot({ path: path.join(dir, 'm-1-fijado.png') });
  await L.page.keyboard.up('KeyF');
  await sleep(1300);
  await L.page.screenshot({ path: path.join(dir, 'm-2-vuelo.png') });
  await L.page.evaluate(() => window.DeltaUno.damage(170));
  await sleep(150);
  const rb2 = await center(L.page, '#repair');
  await L.touch('touchStart', [[rb2[0], rb2[1], 0]]); await L.touch('touchEnd', []);
  await sleep(1200);
  await L.page.screenshot({ path: path.join(dir, 'm-3-reparando.png') });
  await setRender(L.page, false);
  await L.page.evaluate(() => clearInterval(window.__pin));

  /* al morir se reponen */
  await pinAlt(L.page, null);
  await L.page.evaluate(() => window.DeltaUno.damage(999));
  await L.page.waitForFunction(() => window.DeltaUno.flags().dead <= 0, null, { timeout: 25000 });
  await sleep(50);
  const af = await st(L.page);
  check('al reaparecer: 4 misiles y reparación lista', af.missiles === 4 && af.repairCool === 0 && af.repairT === 0, f({ m: af.missiles, c: af.repairCool }));
  check('sin errores', L.errs.length === 0, L.errs.join(' | '));
  await L.ctx.close();

  /* vertical */
  const P = await open(browser, { width: 390, height: 844 });
  await sleep(500);
  await setRender(P.page, false);
  await P.page.evaluate(() => { const D = window.DeltaUno; D.straighten(); D.damage(120); });
  await waitGrace(P.page).catch(() => {});
  await P.page.evaluate(() => window.DeltaUno.damage(120));
  const prb = await center(P.page, '#repair');
  await P.touch('touchStart', [[prb[0], prb[1], 0]]); await P.touch('touchEnd', []);
  await simWait(P.page, .2);
  const pv = await st(P.page);
  check('en vertical, Reparar responde', pv.repairT > 0, f({ t: pv.repairT }));
  check('sin errores en vertical', P.errs.length === 0, P.errs.join(' | '));
  await P.ctx.close();
  await browser.close();
})().catch(e => { console.error('EXC', e); process.exit(1); });
