// Controles: palanca, botones, evasión, modo Manual, opción de palanca a los costados
// Se corre con: npm test (todas) o node tests/suites/01-controles.js (solo esta, después de npm run build:test)
const H = require('../helpers');
const { chromium, fs, path, dir, check, sleep, open, center, setRender, st, f, simWait, place, pinAlt, faceOut, waitGrace } = H;
H.autostart = true;
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const L = await open(browser, { width: 844, height: 390 });
  await sleep(1200);
  await setRender(L.page, false);
  const safe = () => L.page.evaluate(() => {
    const D = window.DeltaUno, s = D.ship, V = s.pos.constructor; let best = null, bs = -1, seed = 77;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 800; i++) { const z = rnd() * 2 - 1, t = rnd() * 6.283, r = Math.sqrt(1 - z * z), u = new V(Math.cos(t) * r, z, Math.sin(t) * r); const m = Math.min(...D.zones.map(q => Math.acos(u.dot(q.dir)))); if (m > bs) { bs = m; best = u; } }
    s.pos.copy(best).multiplyScalar(D.PLANET_R + 950); D.straighten();
  });
  const lvl = async () => { await safe(); await waitGrace(L.page); await L.page.evaluate(() => { const D = window.DeltaUno; D.straighten(); D.ship.pos.setLength(D.PLANET_R + 950); }); await waitGrace(L.page); };
  const hd = (a, b) => ((b - a + 540) % 360) - 180;
  const heading = () => L.page.evaluate(() => window.DeltaUno.ship.heading);
  const ui = () => L.page.evaluate(() => { const vis = sel => getComputedStyle(document.querySelector(sel)).display !== 'none'; return { word: document.querySelector('#rollL .rollWord').textContent, icon: vis('#rollL .i-roll') ? 'rotar' : vis('#rollL .i-rudder') ? 'timon' : vis('#rollL .i-turn') ? 'doblar' : '?', tag: document.querySelector('#stickTag').textContent.split(' · ')[0], keys: document.querySelector('#keys').textContent.split(' · ').slice(0, 2).join(' · '), lat: window.DeltaUno.settings.lateral, mode: window.DeltaUno.settings.mode }; });
  const setMode = async (mode, lateral) => { await L.page.evaluate(([m, l]) => { const D = window.DeltaUno; D.settings.mode = m; D.settings.lateral = l; }, [mode, lateral]); const g = await center(L.page, '#gear'); await L.page.touchscreen.tap(g[0], g[1]); await sleep(150); const r = await center(L.page, '#resume'); await L.page.touchscreen.tap(r[0], r[1]); await sleep(150); };
  const rl = await center(L.page, '#rollL');
  const stickLeft = async secs => { await L.touch('touchStart', [[150, 270, 0]]); await L.touch('touchMove', [[95, 270, 0]]); await simWait(L.page, secs); const b = await st(L.page); await L.touch('touchEnd', []); return b; };
  const button = async secs => { await L.touch('touchStart', [[rl[0], rl[1], 0]]); await simWait(L.page, secs); const b = await st(L.page); await L.touch('touchEnd', []); return b; };

  let u = await ui();
  console.log('UI asistido por defecto', JSON.stringify(u));
  check('por defecto: palanca Doblar, botones Rotar', u.lat === 'dobla' && u.mode === 'asistido' && u.tag === 'Doblar' && u.word === 'Rotar' && u.icon === 'rotar', '');

  /* ---- Asistido ---- */
  await lvl();
  let h0 = await heading(); let b = await stickLeft(1.2); let h1 = await heading();
  check('asistido: palanca a la izquierda inclina y dobla a la izquierda', b.bank > 20 && b.bank < 80 && hd(h0, h1) < -30, f({ bank: b.bank, rumbo: hd(h0, h1) }));
  await lvl();
  b = await button(.6);
  check('asistido: botón izquierdo gira la nave sobre su eje', b.bank > 60, 'alabeo ' + b.bank.toFixed(1));
  await simWait(L.page, 2.5); b = await st(L.page);
  check('asistido: al soltar se nivela', Math.abs(b.bank) < 6, 'alabeo ' + b.bank.toFixed(1));

  /* ---- Manual ---- */
  await setMode('manual', 'dobla');
  u = await ui();
  console.log('UI manual', JSON.stringify(u));
  check('manual: palanca Timón, botones Rotar', u.tag === 'Timón' && u.word === 'Rotar' && u.icon === 'rotar' && /Flechas: timón/.test(u.keys) && /A D: rotar/.test(u.keys), '');
  await lvl();
  h0 = await heading(); b = await stickLeft(1.5); h1 = await heading();
  check('manual: palanca a la izquierda mueve la trompa a la izquierda', hd(h0, h1) < -40, 'rumbo ' + hd(h0, h1).toFixed(1) + '°');
  check('manual: con la palanca la nave casi no se inclina', Math.abs(b.bank) < 12, 'alabeo ' + b.bank.toFixed(1));
  await lvl();
  b = await button(.5);
  check('manual: botón izquierdo gira la nave sobre su eje', b.bank > 35, 'alabeo ' + b.bank.toFixed(1));
  await simWait(L.page, 1.5); const b2 = await st(L.page);
  check('manual: al soltar queda inclinada', b2.bank > 35, 'alabeo ' + b2.bank.toFixed(1));
  await L.page.keyboard.down('KeyD'); await simWait(L.page, .5); await L.page.keyboard.up('KeyD'); await simWait(L.page, .4);
  b = await st(L.page);
  check('manual: el botón derecho la corrige', b.bank < b2.bank - 25, 'alabeo ' + b.bank.toFixed(1));
  await lvl();
  b = await button(.12); await simWait(L.page, .5); b = await st(L.page);
  check('manual: un toque corto inclina poco', b.bank > 2 && b.bank < 35, 'alabeo ' + b.bank.toFixed(1));
  await lvl();
  const rr = await center(L.page, '#rollR');
  await simWait(L.page, 3.2);
  await L.page.evaluate(() => { const s = window.DeltaUno.ship; window.__r0 = s.pos.clone(); window.__right = new s.pos.constructor(1, 0, 0).applyQuaternion(s.q); });
  await L.touch('touchStart', [[rr[0], rr[1], 0]]); await L.touch('touchEnd', []); await sleep(40);
  await L.touch('touchStart', [[rr[0], rr[1], 0]]); await L.touch('touchEnd', []);
  await simWait(L.page, .55);
  const dg = await L.page.evaluate(() => { const s = window.DeltaUno.ship; return { lateral: s.pos.clone().sub(window.__r0).dot(window.__right), cool: window.DeltaUno.dodge.cool }; });
  check('manual: dos toques en un botón esquivan', dg.cool > 0 && dg.lateral > 20 && dg.lateral < 55, f(dg));

  /* ---- Opción "Gira sobre su eje" en los dos modos ---- */
  await setMode('manual', 'rota');
  u = await ui();
  check('manual + gira sobre su eje: botones Timón (como antes)', u.tag === 'Girar sobre el eje' && u.word === 'Timón' && u.icon === 'timon', JSON.stringify(u));
  await lvl();
  b = await stickLeft(.45); await simWait(L.page, 1.2); b = await st(L.page);
  check('manual + gira sobre su eje: la palanca inclina y queda inclinada', b.bank > 30, 'alabeo ' + b.bank.toFixed(1));
  await setMode('asistido', 'rota');
  u = await ui();
  check('asistido + gira sobre su eje: botones Doblar', u.tag === 'Girar sobre el eje' && u.word === 'Doblar' && u.icon === 'doblar', JSON.stringify(u));
  await lvl();
  h0 = await heading(); b = await button(1.6); h1 = await heading();
  check('asistido + gira sobre su eje: el botón dobla', b.bank > 45 && b.bank < 80 && hd(h0, h1) < -40, f({ bank: b.bank, rumbo: hd(h0, h1) }));
  await setMode('asistido', 'dobla');

  /* ---- Ajustes ---- */
  for (const vp of [{ width: 844, height: 390 }, { width: 568, height: 320 }]) {
    await L.page.setViewportSize(vp); await sleep(250);
    const gear = await center(L.page, '#gear');
    await L.page.touchscreen.tap(gear[0], gear[1]); await sleep(300);
    const sh = await L.page.evaluate(() => ({ over: [...document.querySelectorAll('.seg button')].filter(x => x.scrollWidth > x.clientWidth + 1).map(x => x.textContent), n: document.querySelectorAll('#sheetGrid .opt').length }));
    check('ajustes sin textos cortados a ' + vp.width, sh.over.length === 0 && sh.n === 7, sh.over.join());
    const m = await center(L.page, '#optModeM'); await L.page.touchscreen.tap(m[0], m[1]);
    const note = await L.page.evaluate(() => document.querySelector('#modeNote').textContent);
    check('al elegir Manual la explicación habla del timón en la palanca', /palanca a los costados es el timón/.test(note), note);
    if (vp.width === 568) { await setRender(L.page, true); await sleep(300); await L.page.screenshot({ path: path.join(dir, 'h-ajustes.png') }); await setRender(L.page, false); }
    const a = await center(L.page, '#optModeA'); await L.page.touchscreen.tap(a[0], a[1]);
    const res = await center(L.page, '#resume'); await L.page.touchscreen.tap(res[0], res[1]); await sleep(200);
  }
  await L.page.setViewportSize({ width: 844, height: 390 }); await sleep(250);
  await setRender(L.page, true); await sleep(800);
  await L.page.screenshot({ path: path.join(dir, 'h-botones.png') });
  check('sin errores', L.errs.length === 0, L.errs.join(' | '));
  await L.ctx.close();

  /* ---- Ajustes guardados de la versión anterior ---- */
  const M = await open(browser, { width: 844, height: 390 });
  await M.page.evaluate(() => { localStorage.removeItem('delta-uno-ajustes-v3'); localStorage.setItem('delta-uno-ajustes-v2', JSON.stringify({ mode: 'manual', invert: false, invertX: false, lateral: 'rota', sens: 'rapida', sound: true, flip: false, tgtCam: 'marca' })); });
  await M.page.reload();
  await M.page.waitForFunction(() => window.DeltaUno, null, { timeout: 40000 });
  const ms = await M.page.evaluate(() => { const s = window.DeltaUno.settings; return { mode: s.mode, invert: s.invert, sens: s.sens, tgtCam: s.tgtCam, lateral: s.lateral }; });
  check('ajustes viejos: conserva modo, palanca y sensibilidad, y la palanca pasa a doblar', ms.mode === 'manual' && ms.invert === false && ms.sens === 'rapida' && ms.tgtCam === 'marca' && ms.lateral === 'dobla', JSON.stringify(ms));
  check('sin errores al cargar ajustes viejos', M.errs.length === 0, M.errs.join(' | '));
  await M.ctx.close();
  await browser.close();
})().catch(e => { console.error('EXC', e); process.exit(1); });
