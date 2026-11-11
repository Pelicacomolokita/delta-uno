// Balas rectas por la trompa, tipos de zona, aviso entre escuadrones
// Se corre con: npm test (todas) o node tests/suites/03-punteria-y-zonas.js (solo esta, después de npm run build:test)
const H = require('../helpers');
const { chromium, fs, path, dir, check, sleep, open, center, setRender, st, f, simWait, place, pinAlt, faceOut, waitGrace } = H;
H.autostart = true;
H.transform = s => s.replace('b.life=1.7;b.dmg=e.def.dmg*(e.dmgK||1);b.on=true;', 'b.life=1.7;b.dmg=e.def.dmg*(e.dmgK||1);b.on=true;(window.__F||(window.__F=[])).push(Math.acos(Math.min(1,e.fwd.dot(_eA)))*57.2958);');
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const L = await open(browser, { width: 844, height: 390 });
  await sleep(1000);
  await setRender(L.page, false);
  await L.page.evaluate(() => { const o = window.DeltaUno; window.__toasts = []; const el = document.querySelector('#toast'); new MutationObserver(() => { const t = el.textContent; if (t && window.__toasts[window.__toasts.length - 1] !== t) window.__toasts.push(t); }).observe(el, { childList: true, characterData: true, subtree: true }); });

  const kinds = await L.page.evaluate(() => window.DeltaUno.zones.map(z => z.kind.name + ' ' + z.r));
  console.log('zonas', kinds.join(', '));
  check('seis zonas de tres tipos', kinds.length === 6 && kinds.filter(k => /Dispersa/.test(k)).length === 2 && kinds.filter(k => /Densa/.test(k)).length === 2, '');
  const mk = await L.page.evaluate(() => document.querySelector('#zoneDist').textContent);
  check('la marca de la zona más cercana dice el tipo', /Dispersa|Normal|Densa/.test(mk), mk);

  // fija la nave en un punto (sin que avance), mirando a donde se le diga
  const pin = (fn, arg) => L.page.evaluate(([fs, arg]) => { clearInterval(window.__pin); const f = new Function('D', 'zi', fs); const D = window.DeltaUno; const at = f(D, arg); window.__pin = setInterval(() => { D.ship.pos.copy(at); }, 3); D.ship.pos.copy(at); }, [fn.toString().replace(/^[^{]*{|}$/g, ''), arg]);
  const unpin = () => L.page.evaluate(() => clearInterval(window.__pin));
  const zonePrep = async (zi) => {
    await L.page.evaluate(() => window.DeltaUno.setInv(0));
    // a 250 m afuera del borde de la zona, que vayan naciendo los grupos sin verte
    await pin((D, zi) => { const z = D.zones[zi], R = D.PLANET_R, a = (z.r + 250) / R; const u = z.dir.clone().multiplyScalar(Math.cos(a)).addScaledVector(z.e1, Math.sin(a)).normalize(); return u.multiplyScalar(R + D.heightAt(u.x, u.y, u.z, 0) + 700); }, zi);
    await waitGrace(L.page);
    await L.page.evaluate(() => window.DeltaUno.setInv(999)); // quieta y a tiro de las torretas: que no la derriben a mitad de la prueba
    await L.page.evaluate(zi => { const D = window.DeltaUno; D.groups.filter(g => g.zone === D.zones[zi]).forEach(g => { g.alert = false; }); }, zi);
    await simWait(L.page, 9);
  };
  const zinfo = zi => L.page.evaluate(zi => { const D = window.DeltaUno, z = D.zones[zi], mine = D.groups.filter(g => g.zone === z && !g.ground); let minSep = 1e9; for (let i = 0; i < mine.length; i++) for (let j = i + 1; j < mine.length; j++) minSep = Math.min(minSep, mine[i].leader.pos.distanceTo(mine[j].leader.pos)); return { kind: z.kind.name, groups: mine.length, naves: mine.reduce((n, g) => n + g.members.length, 0), alert: mine.filter(g => g.alert).length, minSep: Math.round(minSep), form: Math.round(Math.max(...mine.map(g => Math.max(...g.members.map(m => m.pos.distanceTo(g.leader.pos)))))) }; }, zi);

  /* zona dispersa (0) */
  await zonePrep(0);
  let zi0 = await zinfo(0);
  console.log('dispersa', JSON.stringify(zi0));
  check('dispersa: tres escuadrones chicos, sin verte todavía', zi0.groups === 3 && zi0.naves >= 6 && zi0.alert === 0, JSON.stringify(zi0));
  await L.page.evaluate(() => { const D = window.DeltaUno, g = D.groups.find(g => g.zone === D.zones[0]); g.alert = true; g.lostT = 0; window.__toasts = []; });
  await simWait(L.page, 1);
  zi0 = await zinfo(0);
  check('dispersa: si un grupo te ve, los lejanos no se enteran', zi0.alert < zi0.groups || zi0.minSep < 450, JSON.stringify(zi0));
  await unpin();

  /* zona densa (2) */
  await zonePrep(2);
  let zi2 = await zinfo(2);
  console.log('densa', JSON.stringify(zi2));
  check('densa: tres escuadrones a la vez, con varias naves', zi2.groups === 3 && zi2.naves >= 8, JSON.stringify(zi2));
  check('densa: grupos más juntos que en la dispersa', zi2.minSep < zi0.minSep, zi2.minSep + ' m contra ' + zi0.minSep + ' m');
  await L.page.evaluate(() => { const D = window.DeltaUno, g = D.groups.filter(g => g.zone === D.zones[2] && !g.ground).sort((a, b) => a.leader.pos.distanceTo(D.ship.pos) - b.leader.pos.distanceTo(D.ship.pos))[0]; g.alert = true; /* el más cercano: uno que de verdad te tenga a la vista */ g.lostT = 0; D.zones[2].seen = false; window.__toasts = []; });
  await simWait(L.page, 1);
  zi2 = await zinfo(2);
  const t2 = await L.page.evaluate(() => window.__toasts.slice());
  check('densa: si un grupo te ve, avisa a todos', zi2.alert === zi2.groups, JSON.stringify(zi2));
  check('aparece el aviso "Te detectaron"', t2.some(t => /Te detectaron/.test(t)), JSON.stringify(t2));
  // se olvidan si te alejás
  await pin((D, zi) => { const z = D.zones[zi], R = D.PLANET_R, a = (z.r + 900) / R; const u = z.dir.clone().multiplyScalar(Math.cos(a)).addScaledVector(z.e1, Math.sin(a)).normalize(); return u.multiplyScalar(R + D.heightAt(u.x, u.y, u.z, 0) + 700); }, 2);
  await simWait(L.page, 4.5);
  zi2 = await zinfo(2);
  check('si te alejás de la zona, te pierden', zi2.alert === 0, JSON.stringify(zi2));
  await unpin();

  /* balas: rectas y saliendo por la trompa */
  await L.page.evaluate(() => window.DeltaUno.setInv(0));
  await place(L.page, 2, .3, 140); await pinAlt(L.page, 110);
  await waitGrace(L.page);
  await L.page.evaluate(() => { window.__noDmg = true; window.__F = []; window.__al = setInterval(() => window.DeltaUno.groups.forEach(g => { g.alert = true; g.lostT = 0; }), 50);
    const D = window.DeltaUno; window.__cur = new Map(); window.__done = []; window.__trI = setInterval(() => { for (const b of D.eBolts) { let c = window.__cur.get(b); if (!b.on) { if (c) { window.__done.push(c.pts); window.__cur.delete(b); } continue; } if (!c || b.life > c.life + 1e-6) { if (c) window.__done.push(c.pts); c = { life: b.life, pts: [] }; window.__cur.set(b, c); } c.life = b.life; if (c.pts.length < 300) c.pts.push(b.p.clone()); } }, 4); });
  await L.touch('touchStart', [[150, 270, 0]]); await L.touch('touchMove', [[110, 270, 0]]);
  await simWait(L.page, 8);
  await L.touch('touchEnd', []);
  const bt = await L.page.evaluate(() => {
    clearInterval(window.__trI); clearInterval(window.__al);
    let maxDev = 0, n = 0;
    for (const arr of window.__done.concat([...window.__cur.values()].map(c => c.pts))) {
      if (arr.length < 4) continue; n++;
      const a = arr[0], b = arr[arr.length - 1], d = b.clone().sub(a).normalize();
      for (const p of arr) { const v = p.clone().sub(a); const dev = v.clone().addScaledVector(d, -v.dot(d)).length(); maxDev = Math.max(maxDev, dev); }
    }
    const F = window.__F || [];
    return { n, maxDev, disparos: F.length, maxAng: F.length ? Math.max(...F) : 0 };
  });
  check('las balas enemigas viajan en línea recta', bt.n > 5 && bt.maxDev < .05, f(bt));
  check('las balas salen a no más de 3° de la trompa', bt.disparos > 5 && bt.maxAng <= 3.01, f(bt));
  await pinAlt(L.page, null);

  check('sin errores', L.errs.length === 0, L.errs.join(' | '));
  await setRender(L.page, true); await sleep(600);
  await L.page.screenshot({ path: path.join(dir, 'i-zona.png') });
  await browser.close();
})().catch(e => { console.error('EXC', e); process.exit(1); });
