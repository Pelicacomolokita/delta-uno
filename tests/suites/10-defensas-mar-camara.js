// Defensas de tierra sobre torres, lanzamisiles que te fijan y misiles que se esquivan, y cámara de Blanco que no pierde la nave
// Se corre con: npm test (todas) o node tests/suites/10-defensas-mar-camara.js (solo esta, después de npm run build:test)
const H = require('../helpers');
const { check, sleep, launch, open, center, setRender, st, f, simWait, waitGrace } = H;

(async () => {
  const browser = await launch();
  const L = await open(browser, { width: 844, height: 390 });
  const P = L.page;
  await sleep(800);
  await P.evaluate(() => window.DeltaUno.startRun('conquista', 'medio'));
  await setRender(P, false);

  /* ---- Dónde quedan las defensas ---- */
  let r = await P.evaluate(() => {
    const D = window.DeltaUno, out = {}, bad = [];
    for (const z of D.zones) {
      const k = z.kind.name;
      out[k] = (out[k] || []);
      out[k].push(z.sites.filter(s => s.kind === 'torreta').length + '+' + z.sites.filter(s => s.kind === 'lanzamisiles').length);
      for (const s of z.sites) { D.terrain(s.dir.x, s.dir.y, s.dir.z, 0, true); if (D.S.biome >= 7) bad.push(k); }
    }
    return { out, bad };
  });
  console.log('defensas', JSON.stringify(r));
  check('cada zona tiene torretas y lanzamisiles (dispersa 2+1, normal 3+1, densa 4+2)', r.out.Dispersa.every(x => x === '2+1') && r.out.Normal.every(x => x === '3+1') && r.out.Densa.every(x => x === '4+2'), JSON.stringify(r.out));
  check('las defensas quedan en terreno abierto (en montaña solo si la zona no tiene otro lugar)', r.bad.length <= 2, r.bad.length + ' en montaña: ' + r.bad.join());

  /* ---- Torres: la cabeza siempre arriba del suelo ---- */
  const pinNear = (zi, kind, dist, up) => P.evaluate(([zi, kind, dist, up]) => {
    clearInterval(window.__pin);
    const D = window.DeltaUno, z = D.zones[zi], s = z.sites.find(q => q.kind === kind), R = D.PLANET_R;
    const u = s.dir, e = z.e1.clone().addScaledVector(u, -z.e1.dot(u)).normalize(), a = dist / R;
    const at = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(e, Math.sin(a)).normalize();
    window.__at = at.multiplyScalar(R + Math.max(D.heightAt(at.x, at.y, at.z, 0), D.heightAt(u.x, u.y, u.z, 0), 0) + up);
    window.__pin = setInterval(() => { D.ship.pos.copy(window.__at); }, 3); D.ship.pos.copy(window.__at);
  }, [zi, kind, dist, up]);
  await pinNear(1, 'lanzamisiles', 700, 300);
  await waitGrace(P);
  await P.evaluate(() => window.DeltaUno.setInv(999));
  await simWait(P, 1);
  r = await P.evaluate(() => {
    const D = window.DeltaUno;
    return D.enemies.filter(e => e.def.ground).map(e => { const u = e.pos.clone().normalize(), g = Math.max(D.heightAt(u.x, u.y, u.z, 0), 0); return { k: e.kind, h: +(e.pos.length() - D.PLANET_R - g).toFixed(1), torre: !!(e.tower && e.tower.g.visible) }; });
  });
  console.log('cabezas', JSON.stringify(r));
  check('torretas y lanzamisiles aparecen sobre una torre, con la cabeza a más de 18 m del suelo', r.length >= 3 && r.every(x => x.torre && x.h >= 18 && x.h < 22), JSON.stringify(r));

  /* ---- Lanzamisiles: aviso, fijado y misil ---- */
  // dejo solo al lanzamisiles para medir su daño sin otros tiros
  await P.evaluate(() => { const D = window.DeltaUno, z = D.zones[1]; z.sites.forEach(s => { if (s.kind !== 'lanzamisiles') s.alive = false; }); z.reserve = 0; for (const e of D.enemies.slice()) if (e.kind !== 'lanzamisiles' && !e.def.carrier) { e.hp = 1; D.hitEnemyForTest(e); } });
  const seq = [];
  for (let i = 0; i < 10; i++) { await simWait(P, .4); seq.push(await P.evaluate(() => { const w = document.querySelector('#warn'); return w.hidden ? '-' : (w.classList.contains('msl') ? 'misil' : 'fijando'); })); }
  console.log('avisos', seq.join(' '));
  const iF = seq.indexOf('fijando'), iM = seq.indexOf('misil');
  check('primero avisa "Te están fijando" y después "¡Misil!"', iF >= 0 && iM > iF, seq.join(' '));
  r = await P.evaluate(() => ({ on: window.DeltaUno.eMsl.filter(m => m.on && m.track).length, beep: window.DeltaUno.threat.incoming }));
  check('el misil sale y te sigue', r.on === 1 && r.beep === 1, JSON.stringify(r));
  // sin esquivar, pega
  await P.evaluate(() => { const D = window.DeltaUno; D.setInv(0); window.__v0 = D.vit(); });
  for (let i = 0; i < 30; i++) { await simWait(P, .4); if (await P.evaluate(() => !window.DeltaUno.eMsl.some(m => m.on))) break; }
  r = await P.evaluate(() => { const D = window.DeltaUno, v = D.vit(); return { lost: Math.round(window.__v0.shield + window.__v0.hull - v.shield - v.hull) }; });
  check('si no lo esquivás, te saca 30', r.lost >= 28 && r.lost <= 40, JSON.stringify(r));
  // con evasión, pierde el rastro
  await P.evaluate(() => { const D = window.DeltaUno, l = D.enemies.find(e => e.kind === 'lanzamisiles'); l.reload = 0; l.lockT = l.def.lockTime - .05; D.setInv(0); });
  await simWait(P, .6);
  await P.evaluate(() => { window.__v1 = window.DeltaUno.vit(); window.DeltaUno.dodge.cool = 0; });
  r = await P.evaluate(() => ({ track: window.DeltaUno.eMsl.some(m => m.on && m.track) }));
  await P.evaluate(() => window.DeltaUno.tryDodge(1));
  await simWait(P, .2);
  const lostTrack = await P.evaluate(() => !window.DeltaUno.eMsl.some(m => m.on && m.track));
  for (let i = 0; i < 30; i++) { await simWait(P, .4); if (await P.evaluate(() => !window.DeltaUno.eMsl.some(m => m.on))) break; }
  const dmg2 = await P.evaluate(() => { const v = window.DeltaUno.vit(); return Math.round(window.__v1.shield + window.__v1.hull - v.shield - v.hull); });
  check('la evasión le hace perder el rastro y no te pega', r.track && lostTrack && dmg2 < 5, f({ seguia: r.track, perdio: lostTrack, daño: dmg2 }));
  r = await P.evaluate(() => ({ em: window.DeltaUno.EM.speed, vmax: window.DeltaUno.TUNE.vmax }));
  check('el misil va más lento que tu velocidad máxima: con turbo se lo deja atrás', r.em < r.vmax, JSON.stringify(r));
  r = await P.evaluate(() => { const D = window.DeltaUno, u = D.ship.pos.clone().normalize(), R = D.PLANET_R, g = Math.max(D.heightAt(u.x, u.y, u.z, 0), 0); const hi = u.clone().multiplyScalar(R + g + 600), low = u.clone().multiplyScalar(R + g - 400), side = hi.clone().add(new D.ship.pos.constructor(300, 0, 0)); return { libre: D.lineOfSight(hi, side), tapada: D.lineOfSight(hi, low) }; });
  check('una montaña o el suelo en el medio cortan el fijado', r.libre === true && r.tapada === false, JSON.stringify(r));
  await P.evaluate(() => clearInterval(window.__pin));

  /* ---- Cámara de Blanco: aunque el enemigo esté atrás, la nave se ve de espaldas ---- */
  await P.evaluate(() => window.DeltaUno.startRun('libre'));
  await setRender(P, false);
  await waitGrace(P);
  await P.evaluate(() => {
    const D = window.DeltaUno, s = D.ship; D.straighten(); s.pos.setLength(D.PLANET_R + 900);
    const u = s.pos.clone().normalize(), fw = new s.pos.constructor(0, 0, -1).applyQuaternion(s.q), rt = new s.pos.constructor(1, 0, 0).applyQuaternion(s.q);
    const g = D.makeGroup(D.roamZone, ['pesada'], s.pos.clone().addScaledVector(fw, -260).addScaledVector(rt, 120), u, 1, false);
    window.__e = g.leader; g.leader.speed = 0;
    // el Blanco solo elige lo que tenés adelante: se lo elige ahí y después se pasa atrás
    window.__atras = -1;
    window.__hold = setInterval(() => { const e = window.__e; if (e && e.on) e.pos.copy(s.pos).addScaledVector(new s.pos.constructor(0, 0, -1).applyQuaternion(s.q), window.__atras < 0 ? 260 : -260).addScaledVector(new s.pos.constructor(1, 0, 0).applyQuaternion(s.q), window.__atras < 0 ? 0 : 120); }, 4);
  });
  await simWait(P, .1);
  const tb = await center(P, '#tgtBtn');
  await L.touch('touchStart', [[tb[0], tb[1], 0]]); await L.touch('touchEnd', []);
  await P.evaluate(() => { window.__atras = 1; });
  await simWait(P, 2.5);
  r = await P.evaluate(() => { const D = window.DeltaUno, s = D.ship, fw = new s.pos.constructor(0, 0, -1).applyQuaternion(s.q); return { sel: !!D.tgt(), ang: Math.acos(Math.max(-1, Math.min(1, D.camFwd.dot(fw)))) * 57.3 }; });
  check('con un blanco atrás, la cámara gira como mucho 35° desde la trompa', r.sel && r.ang <= 36.5, f(r));
  await P.evaluate(() => clearInterval(window.__hold));

  /* ---- El mar se dibuja sin errores (las olas son parte del dibujo del suelo) ---- */
  await setRender(P, true);
  await P.evaluate(() => {
    const D = window.DeltaUno, V = D.ship.pos.constructor; let best = null;
    for (let i = 0; i < 4000 && !best; i++) { const z = Math.random() * 2 - 1, t = Math.random() * 6.283, r = Math.sqrt(1 - z * z), u = new V(Math.cos(t) * r, z, Math.sin(t) * r); D.terrain(u.x, u.y, u.z, 0, true); if (D.S.water > .95) best = u; }
    D.ship.pos.copy(best).multiplyScalar(D.PLANET_R + 80); D.straighten();
  });
  await sleep(1500);
  await P.screenshot({ path: H.dir + '/mar.png' });
  check('sin errores', L.errs.length === 0, L.errs.join(' | '));
  await browser.close();
})().catch(e => { console.error('EXC', e); process.exit(1); });
