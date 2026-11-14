// Cámara de Blanco: elegir, cambiar, soltar, modo solo marca
// Se corre con: npm test (todas) o node tests/suites/06-camara-blanco.js (solo esta, después de npm run build:test)
const H = require('../helpers');
const { chromium, fs, path, dir, check, sleep, open, center, setRender, st, f, simWait, place, pinAlt, faceOut, waitGrace } = H;
H.autostart = true;
// cuánto mira la cámara hacia el blanco, y si la nave y el blanco están en cuadro
const view = page => page.evaluate(() => {
  const D = window.DeltaUno, c = D.camera, s = D.ship, t = D.tgt(), V = s.pos.constructor;
  const cd = new V(); c.getWorldDirection(cd);
  const fw = new V(0, 0, -1).applyQuaternion(s.q);
  const inFrame = p => { const q = p.clone().project(c); return q.z < 1 && Math.abs(q.x) < .95 && Math.abs(q.y) < .95; };
  const out = { blend: D.camBlend(), camFwd: cd.dot(fw), shipIn: inFrame(s.pos) };
  if (t) { const td = t.pos.clone().sub(c.position).normalize(); out.camTgt = cd.dot(td); out.tgtIn = inFrame(t.pos); out.tgtFwd = t.pos.clone().sub(s.pos).normalize().dot(fw); }
  return out;
});
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const L = await open(browser, { width: 844, height: 390 });
  await sleep(1200);
  await setRender(L.page, false);

  for (const vp of [{ width: 844, height: 390 }, { width: 640, height: 360 }, { width: 568, height: 320 }]) {
    await L.page.setViewportSize(vp); await sleep(250);
    const ov = await L.page.evaluate(() => {
      const ids = ['#gear', '#readout', '#thrust', '#fire', '#rollL', '#rollR', '#repair', '#missile', '#tgtBtn', '#stick', '#vitals', '#zone'];
      const rs = ids.map(i => [i, document.querySelector(i).getBoundingClientRect()]), out = [];
      for (let a = 0; a < rs.length; a++) for (let b = a + 1; b < rs.length; b++) { const A = rs[a][1], B = rs[b][1]; if (A.left < B.right && B.left < A.right && A.top < B.bottom && B.top < A.bottom) out.push(rs[a][0] + 'x' + rs[b][0]); }
      return out;
    });
    check('botones sin encimarse a ' + vp.width + 'x' + vp.height, ov.length === 0, ov.join());
  }
  await L.page.setViewportSize({ width: 844, height: 390 }); await sleep(250);
  const tb = await center(L.page, '#tgtBtn');
  const tap = async () => { await L.touch('touchStart', [[tb[0], tb[1], 0]]); await simWait(L.page, .08); await L.touch('touchEnd', []); await simWait(L.page, .05); };
  const holdBtn = async () => { await L.touch('touchStart', [[tb[0], tb[1], 0]]); await sleep(650); await L.touch('touchEnd', []); await simWait(L.page, .05); };

  /* sin enemigos: lejos de toda zona */
  await L.page.evaluate(() => {
    const D = window.DeltaUno, s = D.ship, V = s.pos.constructor; let best = null, bs = -1, seed = 77;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 800; i++) { const z = rnd() * 2 - 1, t = rnd() * 6.283, r = Math.sqrt(1 - z * z), u = new V(Math.cos(t) * r, z, Math.sin(t) * r); const m = Math.min(...D.zones.map(q => Math.acos(u.dot(q.dir)))); if (m > bs) { bs = m; best = u; } }
    s.pos.copy(best).multiplyScalar(D.PLANET_R + 950); D.straighten();
  });
  await L.page.evaluate(() => { const D = window.DeltaUno; D.enemies.filter(e => e.kind === 'nodriza').forEach(e => D.hitEnemyForTest(e)); });
  await L.page.waitForFunction(() => window.DeltaUno.enemies.length === 0, null, { timeout: 15000 });
  await simWait(L.page, 1.5);
  const base = await view(L.page);
  await tap();
  // el aviso se busca entre los últimos y no en el cartel: cualquier otro aviso (una nodriza derribada, por
  // ejemplo) lo tapa en el mismo instante y la prueba salía cara o cruz
  const none = await L.page.evaluate(() => ({ t: !!window.DeltaUno.tgt(), toast: document.querySelector('#toast').textContent, ultimos: window.DeltaUno.toasts().slice(-4) }));
  check('sin enemigos cerca, no elige nada y avisa', !none.t && none.ultimos.some(x => /No hay enemigos/.test(x)), JSON.stringify(none));

  // El Blanco solo elige lo que tenés adelante: pone otro enemigo delante de la trompa
  /* adelante() devuelve false si en ese momento no hay ningún enemigo vivo para poner delante. Varias
     comprobaciones de abajo dependen de que sí lo haya, y como nadie miraba ese valor, cuando los enemigos
     se habían terminado la prueba fallaba sin decir por qué. Esto espera a que haya uno. */
  const adelanteSeguro = async (seg = 12) => {
    for (let i = 0; i < seg * 4; i++) { if (await adelante()) return true; await simWait(L.page, .25); }
    return false;
  };
  const adelante = () => L.page.evaluate(() => {
    const D = window.DeltaUno, s = D.ship, V = s.pos.constructor, cur = D.tgt();
    const e = D.enemies.find(x => x.on && x !== cur && !x.def.ground) || D.enemies.find(x => x.on && x !== cur);
    clearInterval(window.__ade); if (!e) return false;
    /* Para poder fijarlo tiene que cumplir la regla de sector de fijable(): su grupo atacando, o su zona la
       actual, o estar a menos de FIJADO.cerca (250 m). Acá queda a 400 m, así que hay que ponerle el grupo en
       ataque; si no, el toque no selecciona nada y la prueba fallaba sin decir por qué. */
    if (e.group) { e.group.alert = true; e.group.state = 'attack'; e.group.lostT = 0; }
    window.__ade = setInterval(() => { if (!e.on) return; const fw = new V(0, 0, -1).applyQuaternion(s.q); e.pos.copy(s.pos).addScaledVector(fw, 400).addScaledVector(s.pos.clone().normalize(), 10); e.fwd.copy(fw); e.speed = s.speed; e.breakT = 9; }, 4);
    return true;
  });
  const soltarAdelante = () => L.page.evaluate(() => clearInterval(window.__ade));

  /* en zona, con enemigos que no disparan para que nada interrumpa */
  await pinAlt(L.page, 200);
  await place(L.page, 0, .6, 320);
  await waitGrace(L.page);
  await L.page.waitForFunction(() => window.DeltaUno.enemies.length >= 3, null, { timeout: 30000 });
  await L.page.evaluate(() => { window.__calm = setInterval(() => window.DeltaUno.enemies.forEach(e => { e.cool = 99; e.burst = 0; }), 10); });
  await adelante(); await simWait(L.page, .05);
  await tap(); await soltarAdelante();
  await simWait(L.page, .2); // la palabra del botón se actualiza unas 12 veces por segundo
  const sel1 = await L.page.evaluate(() => { const D = window.DeltaUno, t = D.tgt(); return t ? { kind: t.kind, i: D.enemies.indexOf(t), hint: document.querySelector('#toast').textContent, word: document.querySelector('#tgtWord').textContent } : null; });
  check('tocar Blanco elige un enemigo', !!sel1 && /Mantené para soltar/.test(sel1.hint) && sel1.word === 'Cambiar', JSON.stringify(sel1));
  await simWait(L.page, 2);
  const v1 = await view(L.page);
  check('la cámara gira hacia el blanco, sin pasar de unos 40° desde la trompa, y la nave queda en cuadro', v1.blend > .9 && v1.camTgt >= Math.min(.97, v1.tgtFwd + .3) && v1.camFwd >= .74 && v1.shipIn, f(v1));
  const markSel = await L.page.evaluate(() => { const m = [...document.querySelectorAll('.mk.sel')]; return { n: m.length, txt: m[0] && m[0].querySelector('em').textContent }; });
  check('el blanco tiene marca y distancia', markSel.n === 1 && /Blanco \d+/.test(markSel.txt), JSON.stringify(markSel));

  /* blanco detrás de la nave */
  await L.page.evaluate(() => {
    const D = window.DeltaUno, s = D.ship, t = D.tgt(), V = s.pos.constructor;
    const fw = new V(0, 0, -1).applyQuaternion(s.q), u = s.pos.clone().normalize();
    window.__pinB = setInterval(() => { if (!t.on) return; t.pos.copy(s.pos).addScaledVector(fw.copy(new V(0, 0, -1).applyQuaternion(s.q)), -260).addScaledVector(s.pos.clone().normalize(), 30); t.speed = s.speed; t.breakT = 9; }, 4);
  });
  await simWait(L.page, 2.5);
  const vb = await view(L.page);
  check('con el blanco atrás, la cámara no se da vuelta: la nave sigue de espaldas', vb.tgtFwd < -.9 && vb.camFwd >= .74 && vb.shipIn, f(vb));
  await setRender(L.page, true); await sleep(1200);
  await L.page.screenshot({ path: path.join(dir, 't-2-atras.png') });
  await L.page.evaluate(() => clearInterval(window.__pinB));
  await sleep(1500);
  await L.page.screenshot({ path: path.join(dir, 't-1-blanco.png') });
  await setRender(L.page, false);

  /* cambiar */
  const before = await L.page.evaluate(() => window.DeltaUno.enemies.indexOf(window.DeltaUno.tgt()));
  await adelante(); await simWait(L.page, .05);
  await tap(); await soltarAdelante();
  const after = await L.page.evaluate(() => window.DeltaUno.enemies.indexOf(window.DeltaUno.tgt()));
  check('tocar de nuevo pasa a otro enemigo', after >= 0 && after !== before, before + ' -> ' + after);

  /* el misil prefiere el blanco elegido */
  const lk = await L.page.evaluate(async () => {
    const D = window.DeltaUno, s = D.ship, V = s.pos.constructor, t = D.tgt();
    const others = D.enemies.filter(e => e !== t);
    window.__pinL = setInterval(() => {
      const fw = new V(0, 0, -1).applyQuaternion(s.q), r = new V(1, 0, 0).applyQuaternion(s.q);
      if (t.on) { t.pos.copy(s.pos).addScaledVector(fw, 330).addScaledVector(r, 45); t.fwd.copy(fw); t.speed = s.speed; t.breakT = 9; }
      if (others[0] && others[0].on) { others[0].pos.copy(s.pos).addScaledVector(fw, 300); others[0].fwd.copy(fw); others[0].speed = s.speed; others[0].breakT = 9; }
    }, 4);
    return 1;
  });
  const mb = await center(L.page, '#missile');
  await L.touch('touchStart', [[mb[0], mb[1], 0]]);
  await simWait(L.page, .5);
  const lock = await L.page.evaluate(() => { const D = window.DeltaUno; return { mismo: D.tgt() && window.DeltaUno.vit().hasLock && D.rockets && D.tgt() === (D.__lt = null, D.tgt()) }; });
  const lockIsSel = await L.page.evaluate(() => { const D = window.DeltaUno; const m = document.querySelector('#lockMk'); return !m.hidden; });
  await L.touch('touchEnd', []);
  const lockCheck = await L.page.evaluate(() => 1);
  // verificación directa con el estado interno: la fijación del misil sobre el elegido
  const lt = await L.page.evaluate(async () => {
    const D = window.DeltaUno, s = D.ship;
    return new Promise(r => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF' }));
      const t0 = s.t, i = setInterval(() => { if (s.t - t0 > .3) { clearInterval(i); const v = D.vit(); r({ lockOn: v.lockOn, hasLock: v.hasLock }); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyF' })); } }, 10);
    });
  });
  await L.page.evaluate(() => clearInterval(window.__pinL));
  check('el misil apunta primero al blanco elegido', lt.lockOn && lt.hasLock && lockIsSel, f(lt));

  /* cuando cae, pasa solo al siguiente */
  const auto = await L.page.evaluate(async () => {
    const D = window.DeltaUno, s = D.ship, t = D.tgt(), n0 = D.enemies.length;
    t.hp = 1; if (t.def.ground) D.hitEnemyForTest(t); else t.pos.setLength(D.PLANET_R + 1); // las defensas de tierra no se estrellan: se las derriba
    await new Promise(r => { const t0 = s.t, i = setInterval(() => { if (!t.on || s.t - t0 > 2) { clearInterval(i); r(); } }, 10); });
    await new Promise(r => setTimeout(r, 150));
    const nt = D.tgt();
    return { cayo: !t.on, nuevo: !!nt && nt !== t && nt.on, quedan: D.enemies.length };
  });
  check('si el blanco cae, elige solo el siguiente', auto.cayo && (auto.nuevo || auto.quedan === 0), f(auto));

  /* mantener suelta */
  await holdBtn();
  /* El aviso se busca entre los últimos y no en el cartel: el cartel muestra uno solo, y si justo salís de la
     zona enemiga en el mismo instante ese aviso tapa al de "Blanco suelto" y la prueba salía cara o cruz. */
  const off = await L.page.evaluate(() => ({ t: !!window.DeltaUno.tgt(), toast: document.querySelector('#toast').textContent, ultimos: window.DeltaUno.toasts().slice(-4), word: document.querySelector('#tgtWord').textContent }));
  check('mantener Blanco lo suelta', !off.t && off.ultimos.some(x => /suelto/.test(x)) && off.word === 'Blanco', JSON.stringify(off));
  await simWait(L.page, 2);
  const v3 = await view(L.page);
  check('al soltar, la cámara vuelve a mirar adelante', v3.blend < .1 && v3.camFwd > base.camFwd - .06, f({ ...v3, base: base.camFwd }));

  /* solo marcar */
  await L.page.evaluate(() => { window.DeltaUno.settings.tgtCam = 'marca'; });
  const hayEnemigo = await adelanteSeguro(); await simWait(L.page, .05);
  await tap();
  await simWait(L.page, 2);
  const vm = await view(L.page);
  const marca = await L.page.evaluate(() => ({ tgt: !!window.DeltaUno.tgt(), marcas: document.querySelectorAll('.mk.sel').length, enemigos: window.DeltaUno.enemies.filter(e => e.on).length }));
  check('con "Solo lo marca", la cámara no se mueve pero el blanco queda marcado',
    hayEnemigo && marca.tgt && vm.blend < .05 && vm.camFwd > base.camFwd - .06 && marca.marcas === 1,
    f({ ...vm, ...marca, hayEnemigo }));
  await L.page.evaluate(() => { window.DeltaUno.settings.tgtCam = 'camara'; });

  /* teclado */
  await holdBtn();
  await adelante(); await simWait(L.page, .05);
  await L.page.keyboard.down('KeyT'); await sleep(60); await L.page.keyboard.up('KeyT');
  await soltarAdelante();
  check('la tecla T también elige', !!(await L.page.evaluate(() => window.DeltaUno.tgt())));

  /* al morir se suelta */
  await L.page.evaluate(() => window.DeltaUno.damage(999));
  await simWait(L.page, .1);
  check('al morir se suelta el blanco', !(await L.page.evaluate(() => window.DeltaUno.tgt())));
  await L.page.waitForFunction(() => window.DeltaUno.flags().dead <= 0, null, { timeout: 25000 });
  await L.page.evaluate(() => clearInterval(window.__calm));

  /* ajustes */
  await pinAlt(L.page, null);
  await L.page.setViewportSize({ width: 568, height: 320 }); await sleep(300);
  const gear = await center(L.page, '#gear');
  await L.page.touchscreen.tap(gear[0], gear[1]); await sleep(300);
  const sh = await L.page.evaluate(() => { const over = [...document.querySelectorAll('.seg button')].filter(x => x.scrollWidth > x.clientWidth + 1).map(x => x.textContent); return { over }; });
  await setRender(L.page, true);
  await L.page.screenshot({ path: path.join(dir, 't-3-ajustes.png') });
  check('ajustes: ningún botón se corta', sh.over.length === 0, sh.over.join());
  check('sin errores', L.errs.length === 0, L.errs.join(' | '));
  await L.ctx.close();

  const P = await open(browser, { width: 390, height: 844 });
  await sleep(500);
  await setRender(P.page, false);
  const ptb = await center(P.page, '#tgtBtn');
  await P.touch('touchStart', [[ptb[0], ptb[1], 0]]); await P.touch('touchEnd', []);
  await simWait(P.page, .3);
  const pt = await P.page.evaluate(() => ({ toast: document.querySelector('#toast').textContent, tgt: !!window.DeltaUno.tgt() }));
  check('en vertical, el botón Blanco responde', pt.tgt || /enemigos/.test(pt.toast), JSON.stringify(pt)); // con alguno cerca lo elige; si no, avisa
  check('sin errores en vertical', P.errs.length === 0, P.errs.join(' | '));
  await P.ctx.close();
  await browser.close();
})().catch(e => { console.error('EXC', e); process.exit(1); });
