// Menú de inicio, ajustes deslizables, modos de juego y enemigos nuevos
// Se corre con: npm test (todas) o node tests/suites/08-modos-y-enemigos.js (solo esta, después de npm run build:test)
const H = require('../helpers');
const { chromium, fs, path, dir, check, sleep, open, center, setRender, st, f, simWait, place, pinAlt, faceOut, waitGrace } = H;
H.autostart = false;
H.transform = s => s.replace('b.life=1.7;b.dmg=e.def.dmg*(e.dmgK||1);b.on=true;', 'b.life=1.7;b.dmg=e.def.dmg*(e.dmgK||1);b.on=true;(window.__FK||(window.__FK={}))[e.kind]=(window.__FK[e.kind]||0)+1;').replace('function onZoneCleared(){', 'window.__ozc=()=>onZoneCleared();function onZoneCleared(){');
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const L = await open(browser, { width: 844, height: 390 });
  await sleep(1200);
  const tapEl = async (sel, P = L) => { const c = await center(P.page, sel); await P.page.touchscreen.tap(c[0], c[1]); await sleep(120); };
  const toasts = P => P.page.evaluate(() => window.__toasts.slice());
  const watchToasts = P => P.page.evaluate(() => { window.__toasts = []; const el = document.querySelector('#toast'); new MutationObserver(() => { const t = el.textContent; if (t && window.__toasts[window.__toasts.length - 1] !== t) window.__toasts.push(t); }).observe(el, { childList: true, characterData: true, subtree: true }); });
  await watchToasts(L);

  /* ---- Menú de inicio ---- */
  const m0 = await L.page.evaluate(() => { const D = window.DeltaUno; return { open: !document.querySelector('#menu').hidden, modes: [...document.querySelectorAll('.mode')].map(b => b.textContent.trim().split('\n')[0] + (b.disabled ? ' (off)' : '')), t: D.ship.t }; });
  await sleep(800);
  const t1 = await L.page.evaluate(() => window.DeltaUno.ship.t);
  console.log('menú', JSON.stringify(m0.modes));
  check('al abrir aparece el menú de inicio, con el juego en pausa', m0.open && Math.abs(t1 - m0.t) < .01, '');
  check('cinco modos, con Historia habilitada', m0.modes.length === 5 && /^Historia/.test(m0.modes[4]) && !/\(off\)/.test(m0.modes[4]), m0.modes.join(' | '));
  await setRender(L.page, true); await sleep(300);
  await L.page.screenshot({ path: path.join(dir, 'j-menu.png') });
  await tapEl('.mode[data-mode="conquista"]');
  await tapEl('.seg[data-key="diff"] button[data-val="dificil"]');
  const m1 = await L.page.evaluate(() => ({ diffShown: !document.querySelector('#diffBox').hidden, note: document.querySelector('#diffNote').textContent, title: document.querySelector('#modeTitle').textContent }));
  check('Conquista muestra la dificultad y Difícil dice 3 vidas', m1.diffShown && /3 vidas/.test(m1.note) && m1.title === 'Conquista', JSON.stringify(m1));
  await tapEl('.mode[data-mode="carrera"]');
  const m2 = await L.page.evaluate(() => ({ diffShown: !document.querySelector('#diffBox').hidden }));
  check('Carrera no pide dificultad', !m2.diffShown, '');
  await tapEl('.mode[data-mode="historia"]');
  const m3 = await L.page.evaluate(() => window.DeltaUno.settings.lastMode);
  check('Historia se puede elegir', m3 === 'historia', m3);
  await tapEl('.mode[data-mode="conquista"]');
  await tapEl('#goBtn');
  await setRender(L.page, false);
  let r = await L.page.evaluate(() => { const D = window.DeltaUno; return { menu: !document.querySelector('#menu').hidden, mode: D.run.mode, diff: D.run.diff, lives: D.run.lives, err: D.AIM.errMin, kinds: D.enemies.map(e => e.kind) }; });
  check('Despegar arranca Conquista en Difícil con 3 vidas y mejor puntería enemiga', !r.menu && r.mode === 'conquista' && r.diff === 'dificil' && r.lives === 3 && Math.abs(r.err - 1.6 / 1.3) < .01, JSON.stringify(r)); // la puntería del medio, un 30 % mejor
  check('en Conquista hay una nodriza', r.kinds.includes('nodriza'), r.kinds.join());
  await simWait(L.page, 1);

  /* ---- Ajustes: se pueden recorrer deslizando ---- */
  const scrollTest = async (P, label, swipe) => {
    await tapEl('#gear', P);
    await sleep(250);
    const a = await P.page.evaluate(() => { const b = document.querySelector('#sheetBody'); return { sh: b.scrollHeight, ch: b.clientHeight, top: b.scrollTop, hint: !document.querySelector('#sheetBody .scrollHint').hidden }; });
    await swipe();
    await sleep(700);
    const b = await P.page.evaluate(() => { const b = document.querySelector('#sheetBody'), foot = document.querySelector('#toMenu').getBoundingClientRect(), vw = innerWidth, vh = innerHeight; return { top: b.scrollTop, max: b.scrollHeight - b.clientHeight, footVisible: foot.bottom <= vh + 1 && foot.top >= -1 && foot.right <= vw + 1 && foot.left >= -1, sound: window.DeltaUno.settings.sound }; });
    console.log(label, JSON.stringify(a), JSON.stringify(b));
    check(label + ': hay más de lo que entra y el aviso lo dice', a.sh > a.ch + 20 && a.hint, JSON.stringify(a));
    check(label + ': deslizando se llega al final del menú', b.top > a.top + 40 && b.footVisible, JSON.stringify(b));
    return b;
  };
  await L.page.setViewportSize({ width: 568, height: 320 }); await sleep(300);
  await scrollTest(L, 'ajustes a 568×320', async () => {
    await L.touch('touchStart', [[284, 270, 0]]);
    for (let i = 1; i <= 10; i++) { await L.touch('touchMove', [[284, 270 - i * 24, 0]]); await sleep(16); }
    await L.touch('touchEnd', []);
  });
  // un toque sobre un botón después de deslizar sigue funcionando
  await tapEl('#optSndN');
  check('después de deslizar, los botones responden', (await L.page.evaluate(() => window.DeltaUno.settings.sound)) === false, '');
  await tapEl('#optSndY');
  await L.page.setViewportSize({ width: 844, height: 390 }); await sleep(300);
  await tapEl('#resume');

  /* ---- Torretas ---- */
  await setRender(L.page, false);
  const tur = await L.page.evaluate(() => { const D = window.DeltaUno; return D.zones.map(z => z.kind.name + ':' + z.sites.filter(s => s.kind === 'torreta').length).join(' '); });
  console.log('torretas por zona', tur);
  check('cada zona tiene torretas (dispersa 2, normal 3, densa 4)', /Dispersa:2/.test(tur) && /Normal:3/.test(tur) && /Densa:4/.test(tur), tur);
  // sobre una torreta de la zona 1, a 350 m de altura y quieto
  await L.page.evaluate(() => {
    const D = window.DeltaUno, z = D.zones[1], s = z.sites[0], R = D.PLANET_R;
    const at = s.dir.clone().multiplyScalar(R + D.heightAt(s.dir.x, s.dir.y, s.dir.z, 0) + 380);
    window.__FK = {}; window.__pin = setInterval(() => { D.ship.pos.copy(at); }, 3); D.ship.pos.copy(at); D.straighten();
  });
  await simWait(L.page, 6);
  r = await L.page.evaluate(() => { const D = window.DeltaUno; const t = D.enemies.filter(e => e.kind === 'torreta'); return { n: t.length, alert: t.filter(e => e.group.alert).length, fired: (window.__FK || {}).torreta || 0 }; });
  check('al acercarte aparecen las torretas de la zona, te ven y disparan', r.n >= 3 && r.alert >= 1 && r.fired > 0, JSON.stringify(r));
  // despejar: sin escuadrones pero con torretas no alcanza
  r = await L.page.evaluate(() => {
    const D = window.DeltaUno, z = D.zones[1];
    z.reserve = 0; z.spawned = Math.max(1, z.spawned);
    D.enemies.filter(e => e.group.zone === z && e.kind !== 'torreta').forEach(e => { e.hp = 1; });
    return true;
  });
  await L.page.evaluate(() => { const D = window.DeltaUno, z = D.zones[1]; D.enemies.filter(e => e.group.zone === z && e.kind !== 'torreta').forEach(e => { e.group.members.slice(); }); });
  await L.page.evaluate(() => { const D = window.DeltaUno, z = D.zones[1]; for (const e of D.enemies.slice()) if (e.group.zone === z && e.kind !== 'torreta') { e.hp = 0; } });
  // los saco con el mismo camino que un derribo: un tiro de 99
  const hitAll = (cond) => L.page.evaluate(c => { const D = window.DeltaUno, f = new Function('e', 'D', 'return ' + c); let n = 0; for (const e of D.enemies.slice()) if (f(e, D)) { D.__hit(e); n++; } return n; }, cond);
  await L.page.evaluate(() => { const D = window.DeltaUno; D.__hit = e => { e.hp = 1; D.hitEnemyForTest(e); }; });
  r = await L.page.evaluate(() => typeof window.DeltaUno.hitEnemyForTest);
  check('(prueba) acceso para derribar', r === 'function', r);
  await hitAll("e.group.zone===D.zones[1]&&e.kind!=='torreta'");
  await simWait(L.page, 1);
  r = await L.page.evaluate(() => { const D = window.DeltaUno, z = D.zones[1]; return { state: z.state, turrets: z.sites.filter(s => s.alive).length }; });
  check('sin escuadrones pero con torretas en pie, la zona sigue enemiga', r.state === 'hostil' && r.turrets > 0, JSON.stringify(r));
  await hitAll("e.group.zone===D.zones[1]");
  await simWait(L.page, 1);
  r = await L.page.evaluate(() => { const D = window.DeltaUno, z = D.zones[1]; return { state: z.state, turrets: z.sites.filter(s => s.alive).length }; });
  check('destruidas las torretas, la zona queda despejada', r.state === 'libre' && r.turrets === 0, JSON.stringify(r));
  await L.page.evaluate(() => clearInterval(window.__pin));

  /* ---- Nodriza ---- */
  await L.page.evaluate(() => window.DeltaUno.setInv(999));
  r = await L.page.evaluate(() => { const D = window.DeltaUno, c = D.carrier(); const at = c.pos.clone().addScaledVector(c.pos.clone().normalize(), -40).addScaledVector(c.fwd, 500); window.__pin = setInterval(() => { D.ship.pos.copy(at); }, 3); D.ship.pos.copy(at); return { alt: Math.round(c.pos.length() - D.PLANET_R) }; });
  await simWait(L.page, 6);
  r = await L.page.evaluate(() => { const D = window.DeltaUno, c = D.carrier(); return { alert: c.group.alert, drones: D.enemies.filter(e => e.kind === 'dron' && e.group.zone === D.carrierZone).length, fired: (window.__FK || {}).nodriza || 0, mark: [...document.querySelectorAll('.mk')].some(m => !m.hidden) }; });
  check('la nodriza te ve con radar, dispara y larga drones', r.alert && r.drones >= 2 && r.fired > 0 && r.mark, JSON.stringify(r));
  const before = await L.page.evaluate(() => { const D = window.DeltaUno; return { lives: D.run.lives, res: D.zones.map(z => z.state === 'hostil' ? z.reserve + '/' + z.sites.filter(s => s.alive).length : '-').join(' ') }; });
  await hitAll("e.kind==='nodriza'");
  await L.page.evaluate(() => { const D = window.DeltaUno; for (const e of D.enemies.slice()) if (e.kind === 'nodriza') { e.hp = 1; D.hitEnemyForTest(e); } });
  const after = await L.page.evaluate(() => { const D = window.DeltaUno; return { lives: D.run.lives, carrier: !!D.carrier(), res: D.zones.map(z => z.state === 'hostil' ? z.reserve + '/' + z.sites.filter(s => s.alive).length : '-').join(' ') }; });
  console.log('nodriza', JSON.stringify(before), JSON.stringify(after));
  check('derribar la nodriza: +1 vida y cada zona pierde un escuadrón y una torreta', after.lives === before.lives + 1 && !after.carrier && after.res !== before.res, JSON.stringify({ before, after }));
  await L.page.evaluate(() => clearInterval(window.__pin));

  /* ---- Vidas y fin de partida ---- */
  await L.page.evaluate(() => { window.DeltaUno.startRun('conquista', 'extremo'); });
  await setRender(L.page, false);
  await waitGrace(L.page);
  r = await L.page.evaluate(() => { const D = window.DeltaUno; return { lives: D.run.lives, assist: D.run.assist }; });
  check('Extremo: 1 vida y sin ayudas para apuntar', r.lives === 1 && r.assist === false, JSON.stringify(r));
  await L.page.evaluate(() => { const D = window.DeltaUno, s = D.ship; for (let i = 0; i < 12; i++) D.damage(60, s.pos.clone().normalize()); });
  await simWait(L.page, .2);
  await sleep(3500);
  r = await L.page.evaluate(() => ({ end: !document.querySelector('#end').hidden, title: document.querySelector('#endTitle').textContent, stats: document.querySelector('#endStats').textContent }));
  check('sin vidas aparece el fin de partida', r.end && /Sin vidas/.test(r.title), JSON.stringify(r));
  await tapEl('#againBtn');
  r = await L.page.evaluate(() => { const D = window.DeltaUno; return { end: !document.querySelector('#end').hidden, mode: D.run.mode, diff: D.run.diff, lives: D.run.lives }; });
  check('"Jugar de nuevo" repite el mismo modo y dificultad', !r.end && r.mode === 'conquista' && r.diff === 'extremo' && r.lives === 1, JSON.stringify(r));
  await L.page.evaluate(() => { const D = window.DeltaUno; D.zones.forEach(z => { z.state = 'libre'; }); window.__ozc(); });
  await sleep(3200);
  r = await L.page.evaluate(() => ({ end: !document.querySelector('#end').hidden, title: document.querySelector('#endTitle').textContent }));
  check('con las seis zonas libres se gana', r.end && /liberado/.test(r.title), JSON.stringify(r));
  await tapEl('#endMenu');
  r = await L.page.evaluate(() => !document.querySelector('#menu').hidden);
  check('"Menú" vuelve al menú de inicio', r, '');

  /* ---- Supervivencia ---- */
  await tapEl('.mode[data-mode="supervivencia"]');
  await tapEl('.seg[data-key="diff"] button[data-val="medio"]');
  await tapEl('#goBtn');
  await setRender(L.page, false);
  await L.page.evaluate(() => { const D = window.DeltaUno; window.__pinS = setInterval(() => { const s = D.ship; const h = D.heightAt(s.pos.x / s.pos.length(), s.pos.y / s.pos.length(), s.pos.z / s.pos.length(), 0); if (s.pos.length() - D.PLANET_R - h < 250) s.pos.setLength(D.PLANET_R + h + 250); }, 5); });
  await simWait(L.page, 4);
  r = await L.page.evaluate(() => { const D = window.DeltaUno; return { wave: D.run.wave, n: D.enemies.length, attack: D.groups.every(g => g.alert), zonesOff: D.zones.every(z => z.state === 'off' && !z.wall.visible) }; });
  check('Supervivencia: llega la oleada 1, te busca, y no hay zonas', r.wave === 1 && r.n > 0 && r.attack && r.zonesOff, JSON.stringify(r));
  await L.page.evaluate(() => { const D = window.DeltaUno; for (const e of D.enemies.slice()) { e.hp = 1; D.hitEnemyForTest(e); } });
  await simWait(L.page, 5.5);
  r = await L.page.evaluate(() => { const D = window.DeltaUno; return { wave: D.run.wave, n: D.enemies.length + D.run.queue.length }; });
  check('al terminar una oleada llega la siguiente, más grande', r.wave === 2 && r.n >= 2, JSON.stringify(r));
  await L.page.evaluate(() => { const D = window.DeltaUno; D.run.wave = 4; D.run.queue = []; for (const e of D.enemies.slice()) { e.hp = 1; D.hitEnemyForTest(e); } D.run.waveT = .1; });
  await simWait(L.page, 3);
  r = await L.page.evaluate(() => { const D = window.DeltaUno; return { wave: D.run.wave, carrier: !!D.carrier(), kinds: [...new Set(D.enemies.map(e => e.kind))] }; });
  check('la oleada 5 trae una nodriza', r.wave === 5 && r.carrier, JSON.stringify(r));
  await L.page.evaluate(() => { clearInterval(window.__pinS); const D = window.DeltaUno, s = D.ship; for (let i = 0; i < 12; i++) D.damage(60, s.pos.clone().normalize()); });
  await sleep(3500);
  r = await L.page.evaluate(() => ({ end: !document.querySelector('#end').hidden, title: document.querySelector('#endTitle').textContent }));
  check('en Supervivencia, una sola vida', r.end && /oleada 5/.test(r.title), JSON.stringify(r));
  await tapEl('#endMenu');

  /* ---- Vuelo libre ---- */
  await tapEl('.mode[data-mode="libre"]');
  await tapEl('#goBtn');
  await setRender(L.page, false);
  await L.page.evaluate(() => { window.DeltaUno.run.randT = 0; });
  await simWait(L.page, .6);
  r = await L.page.evaluate(() => { const D = window.DeltaUno, g = D.groups.filter(g => g.zone === D.roamZone); return { n: g.length, alert: g.some(x => x.alert), dist: g.length ? Math.round(g[0].leader.pos.distanceTo(D.ship.pos)) : 0, zonesOff: D.zones.every(z => z.state === 'off'), kinds: g.length ? g[0].members.map(e => e.kind).join() : '' }; });
  check('Vuelo libre: aparece un escuadrón al azar lejos, sin verte todavía', r.n === 1 && !r.alert && r.dist > 1100 && r.zonesOff, JSON.stringify(r));

  /* ---- Variedad en las zonas ---- */
  await L.page.evaluate(() => { window.DeltaUno.startRun('conquista', 'medio'); });
  await setRender(L.page, false);
  await L.page.evaluate(() => { const D = window.DeltaUno, z = D.zones[2], R = D.PLANET_R; const at = z.dir.clone().multiplyScalar(R + D.heightAt(z.dir.x, z.dir.y, z.dir.z, 0) + 900); window.__pin = setInterval(() => { D.ship.pos.copy(at); }, 3); D.ship.pos.copy(at); });
  await simWait(L.page, 10);
  r = await L.page.evaluate(() => { const D = window.DeltaUno, z = D.zones[2]; const mine = D.enemies.filter(e => e.group.zone === z); const k = {}; mine.forEach(e => { k[e.kind] = (k[e.kind] || 0) + 1; }); return { total: D.enemies.length, zona: mine.length, k, slots: D.enemies.length }; });
  console.log('zona densa', JSON.stringify(r));
  check('una zona densa junta varios tipos de enemigos a la vez', Object.keys(r.k).length >= 3 && r.zona >= 10, JSON.stringify(r));
  await L.page.evaluate(() => clearInterval(window.__pin));
  // un dron se te tira encima: daño chico y no da puntos
  await L.page.evaluate(() => { window.DeltaUno.startRun('libre'); });
  await setRender(L.page, false);
  await waitGrace(L.page);
  r = await L.page.evaluate(() => {
    const D = window.DeltaUno, s = D.ship, u = s.pos.clone().normalize(), f = new s.pos.constructor(0, 0, -1).applyQuaternion(s.q);
    const g = D.makeGroup(D.roamZone, ['dron'], s.pos.clone().addScaledVector(f, 160), u, 1, true);
    const e = g.leader; e.fwd.copy(f).negate(); window.__h0 = D.vit(); window.__s0 = D.vit().score; return true;
  });
  await simWait(L.page, 2.5);
  r = await L.page.evaluate(() => { const D = window.DeltaUno, v = D.vit(); return { drones: D.enemies.filter(e => e.kind === 'dron').length, lost: Math.round(window.__h0.shield + window.__h0.hull - v.shield - v.hull), score: v.score - window.__s0 }; });
  check('un dron se te tira encima: te saca 12 y no da puntos', r.drones === 0 && r.lost >= 10 && r.lost <= 14 && r.score === 0, JSON.stringify(r));

  /* ---- Carrera ---- */
  await L.page.evaluate(() => { window.DeltaUno.openMenu(); });
  await tapEl('.mode[data-mode="carrera"]');
  await tapEl('#goBtn');
  await setRender(L.page, false);
  r = await L.page.evaluate(() => { const D = window.DeltaUno; return { n: D.course.length, vis: D.course.filter(c => c.mesh.visible).length, alts: D.course.map(c => Math.round(c.pos.length() - D.PLANET_R - D.heightAt(c.u.x, c.u.y, c.u.z, 0))) }; });
  console.log('anillos', JSON.stringify(r.alts));
  check('Carrera: doce anillos a la vista, todos sobre el terreno', r.n === 12 && r.vis === 12 && r.alts.every(a => a > 50), JSON.stringify(r));
  // atravesar el primero
  const through = i => L.page.evaluate(i => { const D = window.DeltaUno, c = D.course[i], s = D.ship; s.pos.copy(c.pos).addScaledVector(c.n, -30); D.run.prev.copy(s.pos); s.pos.addScaledVector(c.n, 0); s.q.setFromUnitVectors(new s.pos.constructor(0, 0, -1), c.n); s.vel.copy(c.n).multiplyScalar(80); }, i);
  await through(0); await simWait(L.page, .6);
  r = await L.page.evaluate(() => ({ ring: window.DeltaUno.run.ring, t: window.DeltaUno.run.raceT }));
  check('pasar por el anillo lo cuenta', r.ring === 1, JSON.stringify(r));
  await waitGrace(L.page);
  const t0 = await L.page.evaluate(() => window.DeltaUno.run.raceT);
  await L.page.evaluate(() => { const D = window.DeltaUno, s = D.ship; for (let i = 0; i < 12; i++) D.damage(60, s.pos.clone().normalize()); });
  await sleep(3400);
  r = await L.page.evaluate(() => { const D = window.DeltaUno, c = D.course[0]; return { t: D.run.raceT, d: Math.round(D.ship.pos.clone().normalize().angleTo(c.u) * D.PLANET_R) }; });
  check('al estrellarte volvés al último anillo con 5 s de castigo', r.t >= t0 + 5 && r.d < 130, // a 130 m/s de crucero ya se alejó un poco del anillo
    JSON.stringify({ ...r, t0 }));
  for (let i = 1; i < 12; i++) { await through(i); await simWait(L.page, .45); }
  await sleep(2000);
  r = await L.page.evaluate(() => ({ end: !document.querySelector('#end').hidden, title: document.querySelector('#endTitle').textContent, rec: window.DeltaUno.records.carrera, stats: document.querySelector('#endStats').textContent }));
  check('al pasar el último anillo termina la carrera y guarda el récord', r.end && /Carrera terminada/.test(r.title) && r.rec > 0, JSON.stringify(r));
  await setRender(L.page, true);
  await tapEl('#endMenu'); await sleep(400);
  await L.page.screenshot({ path: path.join(dir, 'j-menu2.png') });
  check('sin errores', L.errs.length === 0, L.errs.join(' | '));
  await L.ctx.close();

  /* ---- Pantalla girada (teléfono en vertical): menú y ajustes ---- */
  const P = await open(browser, { width: 390, height: 844 });
  await sleep(1000);
  await watchToasts(P);
  await setRender(P.page, true);
  await sleep(300);
  await P.page.screenshot({ path: path.join(dir, 'j-menu-vertical.png') });
  await tapEl('#goBtn', P);
  await setRender(P.page, false);
  r = await P.page.evaluate(() => window.DeltaUno.run.mode);
  check('en vertical, Despegar responde', r === 'conquista', r);
  await scrollTest(P, 'ajustes con la pantalla girada', async () => {
    // en pantalla girada, "hacia arriba" del juego es hacia la derecha... se desliza en el eje del juego
    const rot = await P.page.evaluate(() => getComputedStyle(document.querySelector('#game')).transform);
    // el juego está girado 90°: subir en el juego = mover el dedo hacia la derecha en la pantalla
    await P.touch('touchStart', [[120, 420, 0]]);
    for (let i = 1; i <= 10; i++) { await P.touch('touchMove', [[120 + i * 22, 420, 0]]); await sleep(16); }
    await P.touch('touchEnd', []);
  });
  check('sin errores en vertical', P.errs.length === 0, P.errs.join(' | '));
  await browser.close();
})().catch(e => { console.error('EXC', e); process.exit(1); });
