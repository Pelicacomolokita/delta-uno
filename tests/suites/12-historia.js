// Modo Historia: misión 1 de la campaña 1 (entrenamiento), radio, aliados, la firma de Rastro,
// reinicio de la parte al caer o al salir del sector, y el resumen con medallas.
// Se corre con: npm test -- historia
const H = require('../helpers');
const { launch, open, check, sleep, setRender, simWait, path, dir, f } = H;
H.autostart = false;

(async () => {
  const browser = await launch();
  const L = await open(browser, { width: 844, height: 390 });
  const { page } = L;
  const click = sel => page.evaluate(s => document.querySelector(s).click(), sel);
  await sleep(500);

  /* ---------- Los textos respetan las reglas del reporte ---------- */
  const data = await page.evaluate(() => {
    const D = window.DeltaUno, out = { long: [], who: [], words: [], parts: 0, medals: 0 };
    for (const m of D.MISIONES) {
      const w = m.instruccion.trim().split(/\s+/).length;
      if (w > 80) out.words.push(m.id + ': ' + w);
      out.parts += m.partes.length; out.medals += m.medallas.length;
      const radios = [m.reinicio, ...m.partes.flatMap(p => p.eventos.map(e => e.radio).filter(Boolean))].filter(Boolean);
      for (const [who, text] of radios) {
        if (text.length > 90) out.long.push(text.length + ' ' + text);
        if (!D.REPARTO[who]) out.who.push(who);
      }
    }
    return out;
  });
  check('cada mensaje de radio tiene 90 caracteres o menos', data.long.length === 0, data.long.join(' | '));
  check('la instrucción previa tiene 80 palabras o menos', data.words.length === 0, data.words.join(' | '));
  check('todos los que hablan están en el reparto', data.who.length === 0, data.who.join(','));
  check('la misión 1 tiene 3 pruebas y 3 medallas', data.parts === 3 && data.medals === 3, f(data));

  /* ---------- Menú e instrucciones ---------- */
  await click('.mode[data-mode="historia"]');
  await sleep(150);
  const menu = await page.evaluate(() => ({ dis: document.querySelector('.mode[data-mode="historia"]').disabled, go: document.querySelector('#goBtn').textContent, title: document.querySelector('#modeTitle').textContent }));
  check('Historia se puede elegir en el menú', !menu.dis && menu.go === 'Ver la misión' && /Entrenamiento/.test(menu.title), f(menu));
  await click('#goBtn');
  await sleep(200);
  const brief = await page.evaluate(() => ({ open: !document.querySelector('#brief').hidden, title: document.querySelector('#briefTitle').textContent, parts: document.querySelectorAll('#briefParts li').length, medals: document.querySelectorAll('#briefMedals li').length, paused: window.DeltaUno.overlayOpen() }));
  check('antes de despegar se ven las instrucciones, las pruebas y las medallas', brief.open && brief.title === 'Entrenamiento' && brief.parts === 3 && brief.medals === 3 && brief.paused, f(brief));
  await page.screenshot({ path: path.join(dir, 'h-instrucciones.png') });
  await click('#briefBack');
  await sleep(100);
  check('"Volver" regresa al menú', await page.evaluate(() => !document.querySelector('#menu').hidden && document.querySelector('#brief').hidden), '');
  await click('#goBtn');
  await click('#briefGo');
  await sleep(300);

  /* ---------- Arranque: sector, anillos y aliados ---------- */
  const st0 = await page.evaluate(() => {
    const D = window.DeltaUno, m = D.mis, u = D.ship.pos.clone().normalize();
    return { state: m.state, part: m.part, rings: D.misCourse.length, allies: D.allies.map(a => a.id), wall: !!m.wall, arc: Math.acos(Math.min(1, u.dot(m.sector.dir))) * D.PLANET_R, r: m.sector.r, biome: D.BIOMES[D.ship.biome] };
  });
  check('la misión arranca en la prueba 1 con 6 anillos', st0.state === 'jugando' && st0.part === 0 && st0.rings === 6, f(st0));
  check('vuelan los 5 del escuadrón y el sector tiene borde', st0.allies.join() === 'FERREYRA,AGUJA,RASTRO,CHISPA,FARO' && st0.wall, st0.allies.join());
  check('la nave arranca adentro del sector', st0.arc < st0.r * .7, Math.round(st0.arc) + ' m de ' + st0.r + ' · ' + st0.biome);

  await page.evaluate(() => window.DeltaUno.setInv(9999));
  await setRender(page, false);
  await simWait(page, 12);
  const rad = await page.evaluate(() => window.DeltaUno.radio.log.map(r => ({ who: r.who, t: r.t })));
  const gaps = rad.slice(1).map((r, i) => r.t - rad[i].t);
  check('la radio habla: primero Mando, después Ferreyra', rad.length >= 2 && rad[0].who === 'MANDO' && rad[1].who === 'FERREYRA', JSON.stringify(rad.map(r => r.who)));
  check('entre un mensaje y otro hay al menos 4 segundos', gaps.every(g => g >= 3.99), JSON.stringify(gaps.map(g => +g.toFixed(2))));
  const al = await page.evaluate(() => { const D = window.DeltaUno; return D.allies.map(a => ({ id: a.id, d: Math.round(a.pos.distanceTo(D.ship.pos)), alt: Math.round(a.pos.length() - D.PLANET_R - D.heightAt(...a.pos.clone().normalize().toArray(), 0)) })); });
  check('los aliados acompañan en formación, sin chocar con el suelo', al.every(a => a.d < 160 && a.alt > 5), JSON.stringify(al));

  /* ---------- Anillos y la firma de Rastro ---------- */
  const passRing = () => page.evaluate(() => {
    const D = window.DeltaUno, c = D.misCourse[D.mis.ring];
    D.run.prev.copy(c.pos).addScaledVector(c.n, -4);
    D.ship.pos.copy(c.pos).addScaledVector(c.n, 3);
  });
  // después de cada salto, la nave mira al centro del sector: así no se sale mientras esperamos
  const faceCenter = () => page.evaluate(() => {
    const D = window.DeltaUno, s = D.ship, z = D.mis.sector, u = s.pos.clone().normalize(), V = s.pos.constructor;
    let f = z.dir.clone().addScaledVector(u, -z.dir.dot(u));
    if (f.lengthSq() < 1e-8) f = z.e1.clone();
    f.normalize();
    const rgt = new V().crossVectors(f, u).normalize(), back = f.clone().negate();
    s.q.setFromRotationMatrix(new window.THREE.Matrix4().makeBasis(rgt, u, back));
    s.vel.copy(f).multiplyScalar(s.speed);
    D.straighten();
  });
  await passRing(); await simWait(page, .3);
  await passRing(); await simWait(page, .3);
  await faceCenter();
  const fr0 = await page.evaluate(() => ({ ring: window.DeltaUno.mis.ring, man: !!window.DeltaUno.allies.find(a => a.id === 'RASTRO').man }));
  check('pasar por un anillo cuenta', fr0.ring === 2, f(fr0));
  check('en el anillo 2 Rastro arranca su maniobra', fr0.man, '');
  await setRender(page, true);
  let seenAt = -1, steps = new Set();
  for (let i = 0; i < 80; i++) {
    const s = await page.evaluate(() => { const a = window.DeltaUno.allies.find(a => a.id === 'RASTRO'); return { step: a.man && a.man.step, seen: a.seen, done: window.DeltaUno.mis.emitted.has('firma_fin') }; });
    if (s.step) steps.add(s.step);
    if (s.step === 'esquiva' && seenAt < 0) { seenAt = s.seen; await page.screenshot({ path: path.join(dir, 'h-firma.png') }); }
    if (s.done) break;
    // a 130 m/s la nave cruza el sector en unos 25 s: de vez en cuando se la vuelve a apuntar al centro
    if (i % 8 === 7 && await page.evaluate(() => { const D = window.DeltaUno; return D.ship.pos.clone().normalize().angleTo(D.mis.sector.dir) * D.PLANET_R > 900; })) await faceCenter();
    await simWait(page, .25);
  }
  await setRender(page, false);
  const fr1 = await page.evaluate(() => ({ done: window.DeltaUno.mis.emitted.has('firma_fin') }));
  check('la firma pasa por todos sus pasos: adelante, amague, esquiva y turbo', ['ir', 'mostrar', 'amague', 'esquiva', 'turbo'].every(x => steps.has(x)) && fr1.done, [...steps].join(','));
  check('la firma se hace a la vista del jugador', seenAt === 1, 'seen=' + seenAt);
  await simWait(page, 9);
  const chispa = await page.evaluate(() => window.DeltaUno.radio.log.some(r => r.who === 'CHISPA' && /firma/.test(r.text)));
  check('después de la firma, Chispa la comenta', chispa, '');
  // la prueba 2 arranca, por historia, con 1 misil que no se recarga y el casco a 60
  await page.evaluate(() => { window.DeltaUno.MISIONES[0].partes[1].inicio = { misiles: 1, casco: 60, recargaMisiles: false }; });
  for (let k = 2; k < 6; k++) { await passRing(); await simWait(page, .3); }
  await faceCenter();
  await simWait(page, 5.5);
  const p2 = await page.evaluate(() => { const D = window.DeltaUno, m = D.mis; const t = D.enemies.filter(e => e.misPart === 1); return { part: m.part, state: m.state, n: t.length, practice: t.every(e => e.practice && e.dmgK === .5 && e.kind === 'torreta'), orbit: D.allies.every(a => a.mode === 'orbita') }; });
  check('con los 6 anillos pasa a la prueba 2: tres torretas de práctica', p2.part === 1 && p2.state === 'jugando' && p2.n === 3 && p2.practice, f(p2));
  check('en la prueba 2 los aliados miran desde arriba', p2.orbit, '');
  const ini = await page.evaluate(() => { const v = window.DeltaUno.vit(); return { m: v.missiles, t: v.missileT, hull: v.hull }; });
  check('la parte puede arrancar con lo que dice la historia: 1 misil sin recarga y casco a 60', ini.m === 1 && ini.t === 0 && ini.hull === 60, f(ini));

  /* ---------- Caer repite la parte ---------- */
  await page.evaluate(() => { const D = window.DeltaUno; D.enemies.filter(e => e.misPart === 1).slice(0, 2).forEach(e => D.hitEnemyForTest(e)); });
  await simWait(page, .3);
  const k2 = await page.evaluate(() => window.DeltaUno.mis.kills);
  check('cada torreta destruida cuenta', k2 === 2, 'kills=' + k2);
  await page.evaluate(() => { const D = window.DeltaUno; D.setInv(0); D.damage(500); });
  await page.waitForFunction(() => window.DeltaUno.flags().dead <= 0, null, { timeout: 20000 });
  await simWait(page, .5);
  const rs = await page.evaluate(() => { const D = window.DeltaUno, m = D.mis, u = D.ship.pos.clone().normalize(); return { part: m.part, kills: m.kills, n: D.enemies.filter(e => e.misPart === 1).length, falls: m.falls, hull: D.vit().hull, msl: D.vit().missiles, arc: Math.round(Math.acos(Math.min(1, u.dot(m.sector.dir))) * D.PLANET_R), r: m.sector.r, alt: Math.round(D.ship.alt), q: D.radio.q.map(x => x.who) }; });
  check('al caer se repite la misma prueba desde el principio', rs.part === 1 && rs.kills === 0 && rs.n === 3 && rs.falls === 1, f(rs));
  check('se reaparece con el estado de inicio de la parte, adentro del sector y con altura', rs.hull === 60 && rs.msl === 1 && rs.arc < rs.r && rs.alt > 40, f(rs));
  check('al repetir, la radio se vacía y Ferreyra avisa', rs.q.length >= 1 && rs.q[0] === 'FERREYRA', rs.q.join(','));

  /* ---------- Salir del sector: aviso y se pierde la parte ---------- */
  await page.evaluate(() => {
    const D = window.DeltaUno, m = D.mis, z = m.sector, T = window.THREE;
    D.setInv(9999);
    const a = (z.r + 250) / D.PLANET_R, u = z.dir.clone().multiplyScalar(Math.cos(a)).addScaledVector(z.e1, Math.sin(a)).normalize();
    const h = Math.max(D.heightAt(u.x, u.y, u.z, 0), 0);
    D.ship.pos.copy(u).multiplyScalar(D.PLANET_R + h + 300);
  });
  await simWait(page, 1);
  const w1 = await page.evaluate(() => ({ warn: window.DeltaUno.mis.warn, shown: document.querySelector('#warn').textContent }));
  check('afuera del sector avisa con cuenta regresiva', /Volvé al sector · \d/.test(w1.warn), f(w1));
  await page.waitForFunction(() => window.DeltaUno.mis.falls >= 2, null, { timeout: 30000 });
  await page.waitForFunction(() => window.DeltaUno.flags().dead <= 0, null, { timeout: 20000 });
  await simWait(page, .5);
  const so = await page.evaluate(() => { const D = window.DeltaUno, m = D.mis, u = D.ship.pos.clone().normalize(); return { part: m.part, falls: m.falls, warn: m.warn, arc: Math.round(Math.acos(Math.min(1, u.dot(m.sector.dir))) * D.PLANET_R), r: m.sector.r }; });
  check(`si te quedás afuera ${8} segundos, se pierde la prueba y se repite`, so.part === 1 && so.falls === 2 && so.arc < so.r && !so.warn, f(so));

  /* ---------- Prueba 3 y final ---------- */
  await page.evaluate(() => { const D = window.DeltaUno; D.setInv(9999); D.enemies.filter(e => e.misPart === 1).forEach(e => D.hitEnemyForTest(e)); });
  await simWait(page, 5.5);
  const p3 = await page.evaluate(() => { const D = window.DeltaUno, t = D.enemies.filter(e => e.misPart === 2); return { part: D.mis.part, n: t.length, kinds: t.map(e => e.kind).join(), practice: t.every(e => e.practice && e.dmgK === .5), alert: t.every(e => e.group.alert) }; });
  check('la prueba 3 trae tres blancos de práctica que vienen a buscarte', p3.part === 2 && p3.n === 3 && p3.practice && p3.alert, f(p3));
  await page.evaluate(() => { const D = window.DeltaUno; D.enemies.filter(e => e.misPart === 2).forEach(e => D.hitEnemyForTest(e)); });
  await simWait(page, 1);
  const fin = await page.evaluate(() => ({ state: window.DeltaUno.mis.state, r: window.DeltaUno.mis.result }));
  check('con los tres blancos abajo, la misión se cumple', fin.state === 'fin' && fin.r && fin.r.medals.includes('completa') && !fin.r.medals.includes('sin_caer'), f(fin));
  await page.waitForFunction(() => !document.querySelector('#end').hidden, null, { timeout: 20000 });
  await setRender(page, true);
  const end = await page.evaluate(() => ({ title: document.querySelector('#endTitle').textContent, text: document.querySelector('#endText').textContent, rows: [...document.querySelectorAll('#endStats div')].map(d => d.textContent), again: document.querySelector('#againBtn').textContent, saved: JSON.parse(localStorage.getItem('delta-uno-historia') || '{}') }));
  await page.screenshot({ path: path.join(dir, 'h-resumen.png') });
  check('el resumen muestra la misión cumplida y las tres medallas', end.title === 'Misión cumplida · Entrenamiento' && end.text.length > 20 && end.rows.filter(r => /[★☆]/.test(r)).length === 3, end.rows.join(' | '));
  check('el progreso queda guardado', end.saved.c1m1 && end.saved.c1m1.done && end.saved.c1m1.medals.includes('completa') && end.saved.c1m1.best > 0, JSON.stringify(end.saved));
  await click('#againBtn');
  await sleep(200);
  const again = await page.evaluate(() => ({ brief: !document.querySelector('#brief').hidden, stars: [...document.querySelectorAll('#briefMedals li')].map(l => l.textContent[0]).join('') }));
  check('"Repetir la misión" vuelve a las instrucciones, con la medalla ganada marcada', again.brief && again.stars.startsWith('★'), f(again));
  await click('#briefBack');
  await sleep(150);
  const rec = await page.evaluate(() => document.querySelector('.mode[data-mode="historia"] small').textContent);
  check('en el menú se ven las medallas ganadas', /Medallas \d\/3/.test(rec), rec);
  check('sin errores', L.errs.length === 0, L.errs.join(' | ').slice(0, 400));
  await browser.close();
})().catch(e => { console.log('FAIL la prueba se cortó: ' + e.message); process.exit(1); });
