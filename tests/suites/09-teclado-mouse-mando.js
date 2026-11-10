// Controles de PC: teclado y mouse con el esquema de fábrica, mando, elegir teclas en Ajustes y botones en pantalla
// Se corre con: npm test (todas) o node tests/suites/09-teclado-mouse-mando.js (solo esta, después de npm run build:test)
const H = require('../helpers');
const { check, sleep, launch, open, center, setRender, st, f, simWait, waitGrace } = H;

// Un mando de mentira: el juego lo lee con navigator.getGamepads()
const FAKE_PAD = () => {
  window.__pad = { id: 'Mando de prueba (STANDARD GAMEPAD)', connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
  window.__padOn = false;
  Object.defineProperty(navigator, 'getGamepads', { value: () => (window.__padOn ? [window.__pad] : []), configurable: true });
  window.__vib = 0;
  Object.defineProperty(navigator, 'vibrate', { value: () => { window.__vib++; return true; }, configurable: true });
};

(async () => {
  const browser = await launch();
  const L = await open(browser, { width: 1280, height: 720 }, { pc: true, init: FAKE_PAD });
  const P = L.page;
  await sleep(800);
  const key = async (code, ms) => { await P.keyboard.down(code); if (ms) await simWait(P, ms); await P.keyboard.up(code); };
  const tap = async code => { await P.keyboard.down(code); await sleep(30); await P.keyboard.up(code); };
  const click = async sel => { const c = await center(P, sel); await P.mouse.click(c[0], c[1]); await sleep(120); };
  // lejos de las zonas, alto y nivelado
  const safe = () => P.evaluate(() => {
    const D = window.DeltaUno, s = D.ship, V = s.pos.constructor; let best = null, bs = -1, seed = 77;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 800; i++) { const z = rnd() * 2 - 1, t = rnd() * 6.283, r = Math.sqrt(1 - z * z), u = new V(Math.cos(t) * r, z, Math.sin(t) * r); const m = Math.min(...D.zones.map(q => Math.acos(u.dot(q.dir)))); if (m > bs) { bs = m; best = u; } }
    s.pos.copy(best).multiplyScalar(D.PLANET_R + 950); D.straighten();
  });
  const lvl = async () => { await safe(); await waitGrace(P); await P.evaluate(() => { const D = window.DeltaUno; D.straighten(); D.ship.pos.setLength(D.PLANET_R + 950); D.ship.throttle = .5; }); await simWait(P, .3); };
  const hd = (a, b) => ((b - a + 540) % 360) - 180;
  const heading = () => P.evaluate(() => window.DeltaUno.ship.heading);

  /* ---- Entrar con el mouse y ver la pantalla de PC ---- */
  await click('#goBtn');
  await setRender(P, false);
  let r = await P.evaluate(() => {
    const vis = s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && !e.closest('[hidden]'); };
    return { dev: window.DeltaUno.inputDev(), fire: vis('#fire'), roll: vis('#rollL'), stick: vis('#stickZone'), missile: vis('#missile'), kbMissile: document.querySelector('#kbMissile').textContent, keys: vis('#keys'), keysTxt: document.querySelector('#keys').textContent, mode: window.DeltaUno.run.mode };
  });
  console.log('pantalla PC', JSON.stringify(r));
  check('en PC no hay palanca ni botones táctiles', r.dev === 'kbd' && !r.fire && !r.roll && !r.stick, JSON.stringify(r));
  check('los indicadores que quedan muestran su tecla', r.missile && r.kbMissile === 'Clic der.', r.kbMissile);
  check('abajo se ven las teclas del esquema nuevo', r.keys && /W S: trompa/.test(r.keysTxt) && /Q E: doblar/.test(r.keysTxt) && /A D: rotar/.test(r.keysTxt) && /Clic izq\.: disparar/.test(r.keysTxt) && /Espacio: blanco/.test(r.keysTxt), r.keysTxt);

  /* ---- Teclado: W S trompa, Q E doblar, A D rotar ---- */
  await lvl();
  let a = await st(P);
  await key('KeyW', .5); let b = await st(P);
  check('W baja la trompa (palanca como avión)', b.pitch < a.pitch - 5, f({ antes: a.pitch, despues: b.pitch }));
  await lvl();
  a = await st(P);
  await key('KeyS', .5); b = await st(P);
  check('S sube la trompa', b.pitch > a.pitch + 5, f({ antes: a.pitch, despues: b.pitch }));
  await lvl();
  let h0 = await heading(); await key('KeyQ', 1.2); let h1 = await heading(); b = await st(P);
  check('Q inclina y dobla a la izquierda', hd(h0, h1) < -20 && b.bank > 15, f({ rumbo: hd(h0, h1), bank: b.bank }));
  await lvl();
  h0 = await heading(); await key('KeyE', 1.2); h1 = await heading();
  check('E dobla a la derecha', hd(h0, h1) > 20, f({ rumbo: hd(h0, h1) }));
  await lvl();
  await key('KeyA', .5); b = await st(P);
  check('A gira la nave sobre su eje a la izquierda', b.bank > 40, f({ bank: b.bank }));
  await lvl();
  await simWait(P, 3.2);
  await tap('KeyD'); await tap('KeyD');
  await simWait(P, .2);
  check('dos toques en D esquivan', await P.evaluate(() => window.DeltaUno.dodge.cool > 0), '');

  /* ---- Mouse: clic izquierdo dispara, rueda cambia el empuje ---- */
  await lvl();
  await P.mouse.move(640, 300);
  await P.mouse.down({ button: 'left' }); await simWait(P, .3);
  const firing = await P.evaluate(() => window.DeltaUno.input.fire);
  await P.mouse.up({ button: 'left' }); await simWait(P, .1);
  const stopped = await P.evaluate(() => !window.DeltaUno.input.fire);
  check('clic izquierdo dispara mientras lo mantenés', firing && stopped, f({ firing, stopped }));
  const t0 = await P.evaluate(() => window.DeltaUno.ship.throttle);
  await P.mouse.wheel(0, -100); await sleep(60); await P.mouse.wheel(0, -100); await sleep(60);
  const t1 = await P.evaluate(() => window.DeltaUno.ship.throttle);
  await P.mouse.wheel(0, 100); await sleep(60);
  const t2 = await P.evaluate(() => window.DeltaUno.ship.throttle);
  check('la rueda sube y baja el empuje de a 10 %', Math.abs(t1 - t0 - .2) < .01 && Math.abs(t2 - t1 + .1) < .01, f({ t0, t1, t2 }));

  /* ---- Shift turbo ---- */
  await P.evaluate(() => { window.DeltaUno.ship.throttle = .5; });
  await P.keyboard.down('ShiftLeft'); await simWait(P, .3);
  const tt = await P.evaluate(() => window.DeltaUno.ship.throttle);
  await P.keyboard.up('ShiftLeft'); await simWait(P, .1);
  const tb = await P.evaluate(() => window.DeltaUno.ship.throttle);
  check('Shift: turbo mientras lo mantenés, y al soltar vuelve', tt === 1 && Math.abs(tb - .5) < .02, f({ tt, tb }));

  /* ---- Clic derecho misil y Espacio blanco, con un enemigo adelante ---- */
  await lvl();
  await P.evaluate(() => {
    const D = window.DeltaUno, s = D.ship, u = s.pos.clone().normalize(), fw = new s.pos.constructor(0, 0, -1).applyQuaternion(s.q);
    const g = D.makeGroup(D.roamZone, ['pesada'], s.pos.clone().addScaledVector(fw, 330), u, 1, false);
    g.leader.fwd.copy(fw); g.leader.speed = 0; window.__e = g.leader;
    window.__hold = setInterval(() => { const e = window.__e; if (e && e.on) { e.pos.copy(s.pos).addScaledVector(new s.pos.constructor(0, 0, -1).applyQuaternion(s.q), 330); } }, 4);
  });
  await simWait(P, .3);
  await tap('Space'); await simWait(P, .2);
  check('Espacio elige el blanco', await P.evaluate(() => !!window.DeltaUno.tgt()), '');
  const m0 = await P.evaluate(() => window.DeltaUno.vit().missiles);
  await P.mouse.down({ button: 'right' }); await simWait(P, 1.4);
  const lk = await P.evaluate(() => ({ lockOn: window.DeltaUno.vit().lockOn, hasLock: window.DeltaUno.vit().hasLock }));
  await P.mouse.up({ button: 'right' }); await simWait(P, .2);
  const m1 = await P.evaluate(() => window.DeltaUno.vit().missiles);
  check('clic derecho mantenido fija el misil y al soltar lo dispara', lk.lockOn && lk.hasLock && m1 === m0 - 1, f({ ...lk, m0, m1 }));
  await P.evaluate(() => clearInterval(window.__hold));

  /* ---- C cámara, R reparar ---- */
  const c0 = await P.evaluate(() => window.DeltaUno.settings.tgtCam);
  await tap('KeyC'); const c1 = await P.evaluate(() => window.DeltaUno.settings.tgtCam);
  await tap('KeyC'); const c2 = await P.evaluate(() => window.DeltaUno.settings.tgtCam);
  check('C alterna la cámara', c0 === 'camara' && c1 === 'marca' && c2 === 'camara', [c0, c1, c2].join(' → '));
  await P.evaluate(() => { const D = window.DeltaUno; D.damage(150, D.ship.pos.clone().normalize()); });
  await tap('KeyR'); await simWait(P, .1);
  check('R repara', await P.evaluate(() => window.DeltaUno.vit().repairT > 0), '');
  check('al recibir daño vibra (si el teléfono lo permite)', await P.evaluate(() => window.__vib > 0), '');

  /* ---- Ajustes: elegir teclas ---- */
  await tap('Escape'); await sleep(200);
  check('Esc pausa y abre ajustes', await P.evaluate(() => !document.querySelector('#sheet').hidden), '');
  await P.mouse.down({ button: 'left' }); await P.mouse.up({ button: 'left' });
  check('con los ajustes abiertos, el clic no dispara', await P.evaluate(() => !window.DeltaUno.input.fire), '');
  await click('.tab[data-tab="kb"]');
  r = await P.evaluate(() => ({ rows: document.querySelectorAll('#bindsKb .bind').length, up: document.querySelector('#bindsKb .slot[data-act="up"][data-i="0"]').textContent, fire: document.querySelector('#bindsKb .slot[data-act="fire"][data-i="0"]').textContent }));
  check('la pestaña Teclado y mouse lista las 14 acciones', r.rows === 14 && r.up === 'W' && r.fire === 'Clic izq.', JSON.stringify(r));
  await click('#bindsKb .slot[data-act="up"][data-i="0"]');
  await sleep(200);
  await tap('KeyI'); await sleep(100);
  r = await P.evaluate(() => ({ up: window.DeltaUno.binds.kb.up[0], txt: document.querySelector('#bindsKb .slot[data-act="up"][data-i="0"]').textContent }));
  check('tocar un casillero y apretar I la asigna', r.up === 'KeyI' && r.txt === 'I', JSON.stringify(r));
  await click('#bindsKb .slot[data-act="fire"][data-i="1"]'); await sleep(200);
  await tap('KeyA'); await sleep(100);
  r = await P.evaluate(() => ({ fire: window.DeltaUno.binds.kb.fire[1], btnL: window.DeltaUno.binds.kb.btnL[0], toast: document.querySelector('#toast').textContent }));
  check('una tecla ya usada se saca de su lugar anterior y avisa', r.fire === 'KeyA' && r.btnL === '' && /estaba en/.test(r.toast), JSON.stringify(r));
  await click('#bindsKb .slot[data-act="camera"][data-i="1"]'); await sleep(200);
  await P.mouse.move(640, 700); await P.mouse.down({ button: 'middle' }); await P.mouse.up({ button: 'middle' }); await sleep(100);
  check('también se puede asignar un botón del mouse', await P.evaluate(() => window.DeltaUno.binds.kb.camera[1] === 'Mouse1'), '');
  await click('#bindsKb .slot[data-act="repair"][data-i="1"]'); await sleep(200);
  await tap('Escape'); await sleep(100);
  r = await P.evaluate(() => ({ sheet: !document.querySelector('#sheet').hidden, rep: window.DeltaUno.binds.kb.repair[1] }));
  check('Esc cancela la espera sin cerrar los ajustes', r.sheet && r.rep === '', JSON.stringify(r));
  await tap('Escape'); await sleep(150);
  await lvl();
  a = await st(P); await key('KeyI', .5); b = await st(P);
  check('la tecla nueva funciona en vuelo', b.pitch < a.pitch - 5, f({ antes: a.pitch, despues: b.pitch }));
  // queda guardado al recargar
  await P.reload(); await P.waitForFunction(() => window.DeltaUno, null, { timeout: 40000 });
  r = await P.evaluate(() => window.DeltaUno.binds.kb.up[0]);
  check('las teclas elegidas quedan guardadas', r === 'KeyI', r);
  await P.evaluate(() => window.DeltaUno.startRun('libre'));
  await setRender(P, false);
  await tap('Escape'); await sleep(150);
  await click('.tab[data-tab="kb"]');
  await click('.resetBinds[data-dev="kb"]');
  r = await P.evaluate(() => ({ up: window.DeltaUno.binds.kb.up[0], btnL: window.DeltaUno.binds.kb.btnL[0], fire: window.DeltaUno.binds.kb.fire[1] }));
  check('"Volver a las teclas de fábrica" restablece todo', r.up === 'KeyW' && r.btnL === 'KeyA' && r.fire === '', JSON.stringify(r));
  await tap('Escape'); await sleep(150);

  /* ---- Mando ---- */
  await P.evaluate(() => { window.__padOn = true; });
  await lvl();
  await P.evaluate(() => { window.__pad.axes[1] = -1; });
  await simWait(P, .4);
  r = await P.evaluate(() => ({ y: window.DeltaUno.input.y, dev: window.DeltaUno.inputDev(), badge: document.querySelector('#kbMissile').textContent }));
  check('mando: el stick izquierdo mueve la palanca', r.y > .8 && r.dev === 'pad', JSON.stringify(r));
  check('mando: los indicadores muestran el botón del mando', r.badge === 'LT', r.badge);
  await P.evaluate(() => { window.__pad.axes[1] = -.4; });
  await simWait(P, .5);
  r = await P.evaluate(() => window.DeltaUno.input.y);
  check('mando: el stick a medias da palanca a medias', r > .2 && r < .5, r.toFixed(2));
  await P.evaluate(() => { window.__pad.axes[1] = 0; window.__pad.buttons[7] = { pressed: true, value: 1 }; });
  await simWait(P, .2);
  const pf = await P.evaluate(() => window.DeltaUno.input.fire);
  await P.evaluate(() => { window.__pad.buttons[7] = { pressed: false, value: 0 }; });
  check('mando: RT dispara', pf, '');
  await simWait(P, 3.2);
  const press = async (i, ms = 60) => { await P.evaluate(i => { window.__pad.buttons[i] = { pressed: true, value: 1 }; }, i); await sleep(ms); await P.evaluate(i => { window.__pad.buttons[i] = { pressed: false, value: 0 }; }, i); await sleep(ms); };
  await press(4); await press(4);
  await simWait(P, .2);
  check('mando: dos toques en LB esquivan', await P.evaluate(() => window.DeltaUno.dodge.cool > 0), '');
  await press(9, 80);
  check('mando: Start abre la pausa', await P.evaluate(() => !document.querySelector('#sheet').hidden), '');
  await click('.tab[data-tab="pad"]');
  r = await P.evaluate(() => ({ status: document.querySelector('#padStatus').textContent, rows: document.querySelectorAll('#bindsPad .bind').length, fire: document.querySelector('#bindsPad .slot[data-act="fire"][data-i="0"]').textContent }));
  check('la pestaña Mando ve el mando y lista las acciones', /Mando conectado/.test(r.status) && r.rows === 14 && r.fire === 'RT', JSON.stringify(r));
  await click('#bindsPad .slot[data-act="fire"][data-i="0"]'); await sleep(200);
  await press(10, 120);
  check('mando: se puede asignar otro botón', await P.evaluate(() => window.DeltaUno.binds.pad.fire[0] === 'b10'), '');
  await click('.resetBinds[data-dev="pad"]');
  await press(9, 80);
  check('mando: Start cierra la pausa', await P.evaluate(() => document.querySelector('#sheet').hidden), '');
  await P.evaluate(() => { window.__padOn = false; });

  /* ---- Botones en pantalla: Siempre y Nunca ---- */
  await P.evaluate(() => { const D = window.DeltaUno; D.settings.touchUI = 'siempre'; });
  await tap('Escape'); await sleep(150); await tap('Escape'); await sleep(150);
  check('"Siempre" muestra los botones táctiles también en PC', await P.evaluate(() => getComputedStyle(document.querySelector('#fire')).display !== 'none'), '');
  check('sin errores en PC', L.errs.length === 0, L.errs.join(' | '));
  await L.ctx.close();

  /* ---- Teléfono: el teclado no esconde los botones; "Nunca" sí ---- */
  const T = await open(browser, { width: 844, height: 390 });
  await sleep(600);
  await T.page.evaluate(() => window.DeltaUno.startRun('libre'));
  await setRender(T.page, false);
  await T.page.keyboard.down('KeyW'); await sleep(100); await T.page.keyboard.up('KeyW');
  r = await T.page.evaluate(() => ({ fire: getComputedStyle(document.querySelector('#fire')).display !== 'none', dev: window.DeltaUno.inputDev() }));
  check('en el teléfono, el teclado no esconde los botones', r.fire && r.dev === 'touch', JSON.stringify(r));
  await T.page.evaluate(() => { const D = window.DeltaUno; D.settings.touchUI = 'nunca'; });
  const g = await center(T.page, '#gear'); await T.page.touchscreen.tap(g[0], g[1]); await sleep(200);
  const rs = await center(T.page, '#resume'); await T.page.touchscreen.tap(rs[0], rs[1]); await sleep(200);
  check('"Nunca" esconde los botones táctiles', await T.page.evaluate(() => getComputedStyle(document.querySelector('#fire')).display === 'none'), '');
  check('sin errores en el teléfono', T.errs.length === 0, T.errs.join(' | '));
  await browser.close();
})().catch(e => { console.error('EXC', e); process.exit(1); });
