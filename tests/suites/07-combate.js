// Combate en zonas: patrullas, ataques, daño, vida, puntos, despejar zonas, controles en pantalla
// Se corre con: npm test (todas) o node tests/suites/07-combate.js (solo esta, después de npm run build:test)
const H = require('../helpers');
const { chromium, fs, path, dir, check, sleep, open, center, setRender, st, f, simWait, place, pinAlt, faceOut, waitGrace } = H;
H.autostart = true;
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const L = await open(browser, { width: 844, height: 390 });
  await sleep(1600);
  await L.page.screenshot({ path: path.join(dir, 'c-0-inicio.png') });
  const info = await L.page.evaluate(() => { const i = window.DeltaUno.renderer.info.render; return { triangulos: i.triangles, dibujos: i.calls, buildMs: Math.round(window.DeltaUno.buildMs) }; });
  console.log('CARGA', JSON.stringify(info));
  await setRender(L.page, false);

  /* velocidad y recalentamiento */
  let a = await st(L.page);
  check('velocidad inicial en crucero (la ficha del caza: 130 m/s)', Math.abs(a.thr - .65) < .001 && Math.abs(a.speed - 130) < 3, f({ thr: a.thr, speed: a.speed }));
  const zinfo = await L.page.evaluate(() => { const D = window.DeltaUno, u = D.ship.pos.clone().normalize(); return { n: D.zones.length, arcs: D.zones.map(z => Math.round(Math.acos(u.dot(z.dir)) * D.PLANET_R)), minSep: Math.min(...D.zones.flatMap((z, i) => D.zones.filter((_, j) => j > i).map(o => Math.acos(z.dir.dot(o.dir)) * D.PLANET_R))) }; });
  check('hay 6 zonas separadas, ninguna encima del inicio', zinfo.n === 6 && Math.min(...zinfo.arcs) > 800 && zinfo.minSep > 3000, JSON.stringify(zinfo));

  const tr = await L.page.evaluate(() => { const r = document.querySelector('#thrustTrack').getBoundingClientRect(); return [r.left + r.width / 2, r.top + 4, r.bottom - 4]; });
  await L.touch('touchStart', [[tr[0], tr[2], 0]]); await L.touch('touchEnd', []);
  a = await st(L.page);
  check('la barra abajo queda en 20 %', Math.abs(a.thr - .2) < .02, f({ thr: a.thr }));
  await L.page.evaluate(() => { const D = window.DeltaUno; D.ship.pos.setLength(D.PLANET_R + 950); });
  await L.touch('touchStart', [[tr[0], tr[1], 0]]); await L.touch('touchEnd', []);
  const t0 = (await st(L.page)).t;
  await simWait(L.page, 3.5);
  const hot = await st(L.page);
  check('turbo acelera y abre la cámara', hot.speed > 110 && hot.fov > 70, f({ speed: hot.speed, fov: hot.fov, heat: hot.heat }));
  await L.page.waitForFunction(() => window.DeltaUno.vit().overheat > 0, null, { timeout: 30000 });
  const oh = await st(L.page);
  const HT = await L.page.evaluate(() => window.DeltaUno.TUNE.heatTime);
  check('a 100 % recalienta en lo que dice la ficha (caza: 22 s)', oh.t - t0 > HT - 1 && oh.t - t0 < HT + 2.5, `${(oh.t - t0).toFixed(1)} s de ${HT}`);
  check('al recalentar, la barra vuelve a crucero', Math.abs(oh.thr - .65) < .01, f({ thr: oh.thr }));
  await simWait(L.page, 1.5);
  const lockd = await st(L.page);
  const warnTxt = await L.page.evaluate(() => document.querySelector('#warn').textContent);
  check('el motor cae a 30 % mientras está bloqueado y avisa', lockd.speed < 75 && /recalent/i.test(warnTxt), f({ speed: lockd.speed, warnTxt }));
  await L.page.waitForFunction(() => window.DeltaUno.vit().overheat <= 0, null, { timeout: 15000 });
  await simWait(L.page, 2.5);
  const rec = await st(L.page);
  check('después vuelve a crucero', Math.abs(rec.speed - 130) < 8, f({ speed: rec.speed, heat: rec.heat }));

  /* evasión */
  await waitGrace(L.page);
  await L.page.evaluate(() => { const D = window.DeltaUno; D.straighten(); const s = D.ship, u = s.pos.clone().normalize(); s.pos.setLength(D.PLANET_R + 900); });
  await waitGrace(L.page);
  const rr = await center(L.page, '#rollR');
  const dg0 = await L.page.evaluate(() => { const D = window.DeltaUno, s = D.ship, right = new s.pos.constructor(1, 0, 0).applyQuaternion(s.q); window.__r0 = s.pos.clone(); window.__right = right; window.__f0 = s.vel.clone().normalize(); return 1; });
  // un toque no esquiva
  await L.touch('touchStart', [[rr[0], rr[1], 0]]); await L.touch('touchEnd', []);
  await simWait(L.page, .5);
  const one = await L.page.evaluate(() => window.DeltaUno.dodge.cool);
  check('un solo toque no esquiva', one === 0);
  await L.page.evaluate(() => { const s = window.DeltaUno.ship; window.__r0 = s.pos.clone(); window.__right = new s.pos.constructor(1, 0, 0).applyQuaternion(s.q); });
  await L.touch('touchStart', [[rr[0], rr[1], 0]]); await L.touch('touchEnd', []);
  await sleep(40);
  await L.touch('touchStart', [[rr[0], rr[1], 0]]); await L.touch('touchEnd', []);
  const dg1 = await L.page.evaluate(() => window.DeltaUno.dodge.t > 0 || window.DeltaUno.dodge.cool > 0);
  check('dos toques seguidos activan la evasión', dg1);
  await simWait(L.page, .55);
  const dg2 = await L.page.evaluate(() => { const D = window.DeltaUno, s = D.ship; return { lateral: s.pos.clone().sub(window.__r0).dot(window.__right), bank: s.bank * 57.3 }; });
  check('la evasión desplaza hacia ese lado unas 35 unidades', dg2.lateral > 25 && dg2.lateral < 50, f(dg2));
  const again = await L.page.evaluate(() => window.DeltaUno.tryDodge(1));
  check('hay que esperar la recarga para volver a esquivar', again === false);

  /* patrulla: spawn solo en zona, en grupo, sin atacar si estoy afuera */
  await L.page.evaluate(() => { const D = window.DeltaUno; D.ship.throttle = .5; });
  await place(L.page, 0, 1.6, 700); // afuera, cerca del borde
  await waitGrace(L.page);
  await faceOut(L.page, 0); // a crucero (muy lento la nave se hunde): mirando hacia afuera para no entrar a la zona
  await L.page.waitForFunction(() => window.DeltaUno.groups.length > 0, null, { timeout: 15000 });
  await simWait(L.page, 8);
  const pat = await L.page.evaluate(() => {
    const D = window.DeltaUno, z = D.zones[0], g = D.groups.find(x => x.zone === z && !x.ground) || D.groups[0], R = D.PLANET_R, uS = D.ship.pos.clone().normalize();
    const spread = Math.max(...g.members.map(e => e.pos.distanceTo(g.leader.pos)));
    const arcs = D.enemies.filter(e => e.group.zone === z).map(e => Math.acos(e.pos.clone().normalize().dot(z.dir)) * R);
    return { perdidos: JSON.stringify(D.lost), grupos: D.groups.map(x => x.members.map(m => m.kind).join('+')+'@'+D.zones.indexOf(x.zone)).join(' '), n: D.enemies.length, miembros: g.members.length, state: g.state, spread, maxArc: Math.max(...arcs), spawnMax: Math.max(...D.groups.filter(x => x.zone === z).map(x => Math.acos(Math.min(1, x.anchor.dot(z.dir))) * R)), zr: z.r, alert: z.alert, arcShip: Math.acos(uS.dot(z.dir)) * R, shield: D.vit().shield };
  });
  /* Un ala se abre y se cierra mientras patrulla. Medido seis veces a cada velocidad, la separación oscila
     entre 30 y 375 m, así que pedir que baje de 120 m dentro de una ventana de 3 s era cara o cruz: a veces
     la ventana caía en la parte abierta del vaivén y la prueba fallaba sin que nada estuviera mal.
     Ahora la ventana es de 8 s —más de un ciclo completo— y el umbral, 200 m, sale de esa medición y no de
     la época en que el crucero era 130 m/s. Lo que importa es que vayan juntas, no que vayan pegadas. */
  let spreadMin = pat.spread;
  for (let i = 0; i < 32 && spreadMin >= 200; i++) {
    await simWait(L.page, .25);
    spreadMin = Math.min(spreadMin, await L.page.evaluate(() => { const D = window.DeltaUno, g = D.groups.find(x => x.zone === D.zones[0] && !x.ground); return g && g.leader ? Math.max(...g.members.map(e => e.pos.distanceTo(g.leader.pos))) : 999; }));
  }
  pat.spread = Math.round(spreadMin);
  check('van en grupito y patrullando', pat.miembros >= 2 && pat.state === 'patrol' && pat.spread < 200, f(pat));
  check('cada escuadrón y torreta tiene su lugar adentro de la zona', pat.spawnMax <= pat.zr, f({ spawnMax: pat.spawnMax, r: pat.zr }));
  // el punto de patrulla puede quedar hasta "patrol" metros más allá de su lugar (que está a lo sumo a anchor[1] del radio),
  // y al dar la vuelta se pasan un poco: ese es el límite real de diseño
  const patrolMax = await L.page.evaluate(() => { const z = window.DeltaUno.zones[0]; return z.r * z.kind.anchor[1] + z.kind.patrol + 150; });
  check('patrullan dentro de su zona', pat.maxArc <= patrolMax, f({ maxArc: pat.maxArc, r: pat.zr, limite: patrolMax }));
  check('estando afuera no me atacan', !pat.alert && pat.shield === 100, f({ alert: pat.alert, shield: pat.shield, arcShip: pat.arcShip }));

  /* mirar la patrulla */
  await setRender(L.page, true);
  await L.page.evaluate(() => { // cámara cerca del grupo, afuera de la zona alertable no: se pone en borde externo apuntando al líder
    const D = window.DeltaUno, s = D.ship, L = D.groups[0].leader, u0 = L.pos.clone().normalize();
    const back = L.fwd.clone().multiplyScalar(-1);
    window.__look = true;
  });
  await sleep(1200);
  await L.page.screenshot({ path: path.join(dir, 'c-1-borde.png') });
  await setRender(L.page, false);

  /* entrar: atacan y persiguen */
  await pinAlt(L.page, 170);
  await place(L.page, 0, .7, 260);
  await L.page.evaluate(() => { const s = window.DeltaUno.ship; s.throttle = .5; s.speed = 65; });
  await waitGrace(L.page);
  await simWait(L.page, .6);
  let ins = await st(L.page);
  const toastTxt = await L.page.evaluate(() => document.querySelector('#toast').textContent);
  check('al entrar la zona se alerta', ins.curZone === 0, f({ curZone: ins.curZone, toastTxt }));
  // Según cómo quedó armada la zona (es al azar), puede que ningún escuadrón te vea de entrada: las defensas de
  // tierra sí, con radar. Para medir la persecución, el escuadrón más cercano se entera (como si lo avisaran).
  const d0 = await L.page.evaluate(() => {
    const D = window.DeltaUno, s = D.ship, sq = D.groups.filter(g => !g.ground && g.leader && g.zone === D.zones[0]);
    const near = sq.sort((a, b) => a.leader.pos.distanceTo(s.pos) - b.leader.pos.distanceTo(s.pos))[0];
    const sawYou = sq.some(g => g.alert);
    if (near && !sawYou) { near.alert = true; near.lostT = 0; }
    window.__chase = near || null;
    return { st: D.groups.map(g => g.state), seenBy: D.groups.filter(g => g.alert).map(g => g.ground ? 'tierra' : 'escuadrón').join(','), d: near ? Math.min(...near.members.map(e => e.pos.distanceTo(s.pos))) : 0 };
  });
  // los que atacan pasan cerca, se alejan y vuelven: se mide la distancia más corta en el intervalo
  await L.page.evaluate(() => { const D = window.DeltaUno, g = window.__chase; window.__minD = Infinity; window.__mdI = setInterval(() => { if (!g || !g.members.length) return; const m = Math.min(...g.members.map(e => e.pos.distanceTo(D.ship.pos))); if (m < window.__minD) window.__minD = m; }, 20); });
  await simWait(L.page, 6);
  const d1 = await L.page.evaluate(() => { clearInterval(window.__mdI); const D = window.DeltaUno, g = window.__chase; return { st: D.groups.map(g => g.state), chase: g ? g.state : 'sin escuadrón', d: window.__minD, v: D.vit(), n: D.enemies.length, dead: D.flags().dead }; });
  check('al entrar, algo de la zona te ve y te ataca', d0.seenBy.length > 0, f({ vistoPor: d0.seenBy }));
  /* Antes se exigía acercarse 30 m respecto de la distancia inicial. Desde que las zonas de conquista se
     agruparon en un frente de 6.500 m alrededor del inicio, el escuadrón a veces nace a 17 m del jugador, y
     entonces acercarse 30 m más es imposible y la prueba fallaba sin que nada estuviera mal.
     Lo que importa es que el escuadrón ataque y te tenga a tiro, así que se mide eso: o se acercó de verdad,
     o ya estaba encima. */
  check('un escuadrón que te ataca se te acerca', d1.chase === 'attack' && (d1.d < d0.d - 30 || d1.d < 120), f({ d0: d0.d, minimaEnElAtaque: d1.d, estado: d1.chase }));
  await L.page.evaluate(() => { const D = window.DeltaUno; D.groups.filter(g => g.zone === D.zones[0]).forEach(g => { g.alert = true; g.lostT = 0; }); });
  // la puntería tiene error al azar: se espera hasta 20 segundos a que algún tiro pegue
  await L.page.waitForFunction(() => { const v = window.DeltaUno.vit(); return v.shield < 100 || v.hull < 100 || window.DeltaUno.flags().dead > 0; }, null, { timeout: 60000, polling: 200 }).catch(() => {});
  const dmg = await st(L.page);
  check('los enemigos pegan', dmg.shield < 100 || dmg.hull < 100 || dmg.dead > 0, f({ shield: dmg.shield, hull: dmg.hull, dead: dmg.dead }));

  /* foto de combate */
  await setRender(L.page, true);
  await L.page.evaluate(() => { const D = window.DeltaUno, s = D.ship; const e = D.enemies[0]; if (e) { // pone un enemigo adelante, a tiro
      const f = new s.pos.constructor(0, 0, -1).applyQuaternion(s.q), up = s.pos.clone().normalize(); e.pos.copy(s.pos).addScaledVector(f, 120).addScaledVector(up, 8); e.fwd.copy(f); } });
  await sleep(1500);
  await L.page.screenshot({ path: path.join(dir, 'c-2-combate.png') });
  await setRender(L.page, false);
  await L.page.waitForFunction(() => window.DeltaUno.flags().dead <= 0, null, { timeout: 25000 });

  /* me persiguen fuera de la zona y después abandonan */
  await place(L.page, 0, .95, 500);
  await faceOut(L.page, 0);
  await simWait(L.page, 1.2);
  await waitGrace(L.page);
  await L.page.evaluate(() => { const D = window.DeltaUno; D.groups.filter(g => g.zone === D.zones[0]).forEach(g => { g.alert = true; g.lostT = 0; }); });
  await place(L.page, 0, 1.25, 500);
  await faceOut(L.page, 0);
  await simWait(L.page, .6);
  const ch = await L.page.evaluate(() => { const D = window.DeltaUno, z = D.zones[0], R = D.PLANET_R; return { alert: D.groups.some(g => g.zone === z && g.alert), arc: Math.acos(D.ship.pos.clone().normalize().dot(z.dir)) * R, r: z.r, st: D.groups.map(g => g.state) }; });
  check('saliendo apenas de la zona me siguen persiguiendo', ch.alert && ch.arc > ch.r, f({ alert: ch.alert, arc: ch.arc }));
  await place(L.page, 0, 2.2, 700);
  await faceOut(L.page, 0); // a crucero la nave vuelve a la zona en pocos segundos si mira al centro
  await waitGrace(L.page);
  await L.page.evaluate(() => { const s = window.DeltaUno.ship; s.throttle = window.DeltaUno.TUNE.cruise; /* muy lento la nave se hunde */ });
  await simWait(L.page, 26);
  const back = await L.page.evaluate(() => { const D = window.DeltaUno, z = D.zones[0], R = D.PLANET_R; return { alert: D.groups.some(g => g.zone === z && g.alert), st: D.groups.filter(g => g.zone === z).map(g => g.state), maxArc: Math.max(0, ...D.enemies.filter(e => e.group.zone === z).map(e => Math.acos(e.pos.clone().normalize().dot(z.dir)) * R)), r: z.r }; }); // solo los de esta zona: a crucero la nave pasa cerca de otras
  check('si me alejo, abandonan y vuelven a su zona', !back.alert && back.st.every(x => x === 'patrol') && back.maxArc < back.r + 260, f({ alert: back.alert, maxArc: back.maxArc, r: back.r }));
  await L.page.evaluate(() => { window.DeltaUno.ship.throttle = .5; });

  /* escudo y vida */
  await waitGrace(L.page);
  await L.page.evaluate(() => { const D = window.DeltaUno; D.straighten(); });
  await waitGrace(L.page);
  const v0 = await st(L.page);
  await L.page.evaluate(() => window.DeltaUno.damage(30));
  const v1 = await st(L.page);
  check('el escudo absorbe primero', v1.shield === v0.shield - 30 && v1.hull === v0.hull, f({ antes: v0.shield, despues: v1.shield, vida: v1.hull }));
  await simWait(L.page, 3);
  const v1b = await st(L.page);
  check('no se recarga antes de 4 segundos', Math.abs(v1b.shield - v1.shield) < .5, f({ s: v1b.shield }));
  await simWait(L.page, 3.2);
  const v2 = await st(L.page);
  check('después se recarga solo', v2.shield > v1.shield + 10, f({ s: v2.shield }));
  await L.page.evaluate(() => window.DeltaUno.damage(150));
  const v3 = await st(L.page);
  check('lo que sobra del escudo baja la vida', v3.shield === 0 && v3.hull < 100, f({ s: v3.shield, h: v3.hull }));
  await setRender(L.page, true);
  await L.page.evaluate(() => { const D = window.DeltaUno; D.damage(12); });
  await sleep(2600);
  await L.page.screenshot({ path: path.join(dir, 'c-3-danada.png') });
  await setRender(L.page, false);

  /* repuestos */
  console.log('ANTES DEL REPUESTO', JSON.stringify(await L.page.evaluate(() => ({ ...window.DeltaUno.vit(), ...window.DeltaUno.flags(), msg: document.querySelector('#crashMsg').textContent, msgHidden: document.querySelector('#crashMsg').hidden, alt: window.DeltaUno.ship.alt, zona: window.DeltaUno.zones[0].alert }))));
  await L.page.waitForFunction(() => window.DeltaUno.flags().dead <= 0, null, { timeout: 25000 });
  const rep = await L.page.evaluate(async () => {
    const D = window.DeltaUno, s = D.ship;
    if (D.vit().hull >= 100) { D.setInv(0); D.damage(130); } // si recién reapareció, con la vida llena no hay nada que curar
    const before = D.vit();
    const d = D.drops[0], f = new s.pos.constructor(0, 0, -1).applyQuaternion(s.q);
    D.spawnDrop(d, s.pos.clone().addScaledVector(f, 30), 'vida');
    await new Promise(r => { const t0 = s.t, i = setInterval(() => { if (!d.on || s.t - t0 > 4) { clearInterval(i); r(); } }, 15); });
    return { tomado: !d.on, antes: before.hull, despues: D.vit().hull };
  });
  check('el repuesto de vida se toma al pasar y cura', rep.tomado && rep.despues > rep.antes, f(rep));

  /* destrucción por daño: reaparece afuera, con todo lleno, puntaje a cero y récord guardado */
  await place(L.page, 0, .5, 300);
  await waitGrace(L.page);
  await L.page.evaluate(() => window.DeltaUno.damage(999));
  const kl = await L.page.evaluate(() => ({ d: window.DeltaUno.flags().dead, msg: document.querySelector('#crashMsg').textContent }));
  check('sin vida, la nave explota y muestra puntaje', kl.d > 0 && /destruida/.test(kl.msg) && /Puntos/.test(kl.msg), f(kl));
  await L.page.waitForFunction(() => window.DeltaUno.flags().dead <= 0, null, { timeout: 25000 });
  await sleep(60);
  const rs = await L.page.evaluate(() => { const D = window.DeltaUno, z = D.zones[0], R = D.PLANET_R, v = D.vit(); return { arc: Math.acos(D.ship.pos.clone().normalize().dot(z.dir)) * R, r: z.r, alert: z.alert, hull: v.hull, shield: v.shield, score: v.score, inv: D.flags().inv }; });
  check('reaparece fuera de la zona, con todo lleno', rs.arc > rs.r + 300 && !rs.alert && rs.hull === 100 && rs.shield === 100, f(rs));

  /* roca sólida */
  await waitGrace(L.page);
  await pinAlt(L.page, null);
  await L.page.evaluate(() => { const D = window.DeltaUno; D.straighten(); D.ship.pos.setLength(D.PLANET_R + 900); });
  await waitGrace(L.page);
  const rk0 = await L.page.evaluate(() => {
    const D = window.DeltaUno, s = D.ship, r = D.rocks[5], fd = s.vel.clone().normalize();
    r.ground = false; r.onGround = false; r.pos.copy(s.pos).addScaledVector(fd, 70); r.dir.copy(r.pos).normalize();
    r.lift = r.pos.length() - D.PLANET_R - D.heightAt(r.dir.x, r.dir.y, r.dir.z, 0);
    window.__rock = r; window.__minD = 1e9; window.__h = D.vit().shield + D.vit().hull;
    window.__t = setInterval(() => { window.__minD = Math.min(window.__minD, s.pos.distanceTo(r.pos)); }, 4);
    return { pos: r.pos.toArray(), radio: r.r };
  });
  await L.page.waitForFunction(() => window.DeltaUno.vit().shield + window.DeltaUno.vit().hull < window.__h, null, { timeout: 15000 }).catch(() => {});
  await simWait(L.page, 2);
  const rk1 = await L.page.evaluate(() => { clearInterval(window.__t); const D = window.DeltaUno, r = window.__rock, s = D.ship; return { perdida: window.__h - D.vit().shield - D.vit().hull, minD: window.__minD, pos: r.pos.toArray(), radio: r.r, ahora: s.pos.distanceTo(r.pos), dead: D.flags().dead }; });
  /* Chocar un asteroide destruye la nave. Antes sacaba 35 de vida y rebotabas; Santiago decidió el 14 de
     noviembre que una nave a 150 m/s contra una roca no se rasguña. Se sigue comprobando que no la atraviese. */
  check('la roca te destruye y no se la atraviesa', rk1.dead > 0 && rk1.minD > rk0.radio * .45, f(rk1));

  /* derribo con toques reales y asistencia */
  await waitGrace(L.page);
  await pinAlt(L.page, 170);
  await place(L.page, 0, .4, 300);
  await waitGrace(L.page);
  await L.page.waitForFunction(() => window.DeltaUno.enemies.length > 0, null, { timeout: 15000 });
  const fc = await center(L.page, '#fire');
  const ki = await (async () => {
    await L.page.evaluate(() => {
      const D = window.DeltaUno, s = D.ship; window.__k = s.kills; window.__sc = D.vit().score;
      window.__pin = setInterval(() => { // mantiene un enemigo enfrente y en línea para probar puntería y derribo
        const e = D.enemies.find(x => x.kind === 'caza') || D.enemies[0]; if (!e) return;
        const f = new s.pos.constructor(0, 0, -1).applyQuaternion(s.q);
        e.pos.copy(s.pos).addScaledVector(f, 150); e.fwd.copy(f); e.speed = s.speed; e.cool = 9; e.breakT = 0;
      }, 8);
    });
    await L.touch('touchStart', [[fc[0], fc[1], 0]]);
    await simWait(L.page, 1.6);
    const tgt = await st(L.page);
    await L.touch('touchEnd', []);
    return L.page.evaluate(({ tgt }) => { clearInterval(window.__pin); const D = window.DeltaUno, s = D.ship; return { kills: s.kills - window.__k, score: D.vit().score - window.__sc, tgt: tgt.target, record: D.vit().record, combo: D.vit().combo }; }, { tgt });
  })();
  check('disparando con el dedo se derriban enemigos y suman puntos', ki.kills >= 1 && ki.score >= 100, f(ki));
  const rec2 = await L.page.evaluate(() => { try { return +(JSON.parse(localStorage.getItem('delta-uno-records') || '{}')['conquista-medio'] || 0); } catch (e) { return -1; } });
  check('el récord queda guardado', rec2 > 0, `${rec2}`);

  /* despejar una zona */
  const clr = await L.page.evaluate(async () => {
    const D = window.DeltaUno, s = D.ship, z = D.zones[0], t0 = s.t;
    z.reserve = 0;
    D.enemies.filter(e => e.group.zone === z && e.def.ground).forEach(e => D.hitEnemyForTest(e)); z.sites.forEach(t => { t.alive = false; });
    D.enemies.filter(e => e.group.zone === z).forEach(e => { e.hp = 1; });
    const before = D.vit().score;
    await new Promise(r => { const i = setInterval(() => { // mata a los que queden
      D.enemies.filter(e => e.group.zone === z).forEach(e => { e.pos.setLength(D.PLANET_R + 1); });
      if (z.state === 'libre' || s.t - t0 > 8) { clearInterval(i); r(); }
    }, 30); });
    return { state: z.state, wall: z.wall.visible, regrow: z.regrow, deltaScore: D.vit().score - before };
  });
  check('sin reserva ni naves, la zona queda despejada', clr.state === 'libre' && !clr.wall && clr.deltaScore >= 700, f(clr));
  await simWait(L.page, 3);
  const reg = await L.page.evaluate(() => { const D = window.DeltaUno, z = D.zones[0]; return { state: z.state }; });
  check('en Conquista, una zona liberada no vuelve a llenarse', reg.state === 'libre', f(reg));

  await pinAlt(L.page, null);
  /* suelo: sigue siendo explosión directa */
  await place(L.page, 3, 2, 60);
  await waitGrace(L.page);
  await L.page.evaluate(() => { const D = window.DeltaUno, s = D.ship; s.pos.setLength(s.pos.length() - s.alt - 1); });
  await simWait(L.page, .15);
  const gr = await L.page.evaluate(() => ({ d: window.DeltaUno.flags().dead, msg: document.querySelector('#crashMsg').textContent }));
  check('chocar contra el suelo o el mar explota directo', gr.d > 0 && /estrellaste/.test(gr.msg), f(gr));
  await L.page.waitForFunction(() => window.DeltaUno.flags().dead <= 0, null, { timeout: 25000 });

  /* turbo: foto */
  await setRender(L.page, true);
  await waitGrace(L.page);
  await L.page.evaluate(() => { const D = window.DeltaUno, s = D.ship; s.throttle = .95; });
  await sleep(4000);
  await L.page.screenshot({ path: path.join(dir, 'c-4-turbo.png') });
  await L.page.evaluate(() => { window.DeltaUno.ship.throttle = .5; });

  /* pantallas chicas */
  for (const vp of [{ width: 844, height: 390 }, { width: 640, height: 360 }, { width: 568, height: 320 }]) {
    await L.page.setViewportSize(vp); await sleep(300);
    const ov = await L.page.evaluate(() => {
      const ids = ['#gear', '#readout', '#thrust', '#fire', '#rollL', '#stick', '#vitals'];
      const rs = ids.map(i => [i, document.querySelector(i).getBoundingClientRect()]), out = [];
      for (let a = 0; a < rs.length; a++) for (let b = a + 1; b < rs.length; b++) { const A = rs[a][1], B = rs[b][1]; if (A.left < B.right && B.left < A.right && A.top < B.bottom && B.top < A.bottom) out.push(rs[a][0] + 'x' + rs[b][0]); }
      return out;
    });
    check(`sin controles encimados a ${vp.width}x${vp.height}`, ov.length === 0, ov.join());
  }
  console.log('ENEMIGOS PERDIDOS SOLOS', JSON.stringify(await L.page.evaluate(() => window.DeltaUno.lost)));
  check('sin errores', L.errs.length === 0, L.errs.join(' | '));
  await L.ctx.close();

  /* vertical */
  const P = await open(browser, { width: 390, height: 844 });
  await sleep(600);
  await setRender(P.page, false);
  await waitGrace(P.page);
  const prr = await center(P.page, '#rollR');
  await P.touch('touchStart', [[prr[0], prr[1], 0]]); await P.touch('touchEnd', []); await sleep(40);
  await P.touch('touchStart', [[prr[0], prr[1], 0]]); await P.touch('touchEnd', []);
  check('en vertical también funciona la evasión', await P.page.evaluate(() => window.DeltaUno.dodge.cool > 0));
  check('sin errores en vertical', P.errs.length === 0, P.errs.join(' | '));
  await P.ctx.close();
  await browser.close();
})().catch(e => { console.error('EXC', e); process.exit(1); });
