// Mide la puntería enemiga: cuántos tiros pegan según cómo volás. No es una prueba de sí o no: imprime números.
// Se corre con: npm test (todas) o node tests/herramientas/medir-punteria.js (solo esta, después de npm run build:test)
const H = require('../helpers');
const { chromium, fs, path, dir, check, sleep, open, center, setRender, st, f, simWait, place, pinAlt, faceOut, waitGrace } = H;
H.autostart = true;
H.transform = s => s.replace('b.on=false;damage(b.dmg,b.v);', 'b.on=false;(window.__H||(window.__H=[])).push(b.d0);if(!window.__noDmg)damage(b.dmg,b.v);').replace('const ang=Math.acos(clamp(e.fwd.dot(_eA),-1,1));', 'const ang=Math.acos(clamp(e.fwd.dot(_eA),-1,1));(window.__G||(window.__G=[])).push([dP,ang*57.3]);').replace('b.life=1.7;b.dmg=e.def.dmg;b.on=true;', 'b.life=1.7;b.dmg=e.def.dmg;b.on=true;b.d0=dP;(window.__S||(window.__S=[])).push(dP);');
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const L = await open(browser, { width: 844, height: 390 });
  await sleep(1000);
  await setRender(L.page, false);
  const ok = await L.page.evaluate(() => typeof window.__S === 'undefined');
  await L.page.evaluate(() => { window.__noDmg = true; });
  const res = {};
  const runs0 = [
    ['recto', async () => {}],
    ['curva constante', async () => { await L.touch('touchStart', [[150, 270, 0]]); await L.touch('touchMove', [[105, 270, 0]]); }],
    ['zigzag cada 1,5 s', null],
    ['recto con turbo', async () => { await L.page.evaluate(() => { window.DeltaUno.input.throttle = 1; }); }],
  ];
  const runs = (process.env.ONLY ? runs0.filter(r => process.env.ONLY.split(',').includes(r[0])) : runs0);
  for (const [name, start] of runs) {
    let S = 0, H = 0, bands = {};
    for (let rep = 0; rep < (+process.env.REPS || 4); rep++) {
      await place(L.page, rep % 2 ? 2 : 0, .35, 140); await pinAlt(L.page, 110);
      await L.page.evaluate(() => { const D = window.DeltaUno; D.ship.throttle = .5; });
      await waitGrace(L.page);
      await simWait(L.page, 2.5); // que se despierten y vengan
      await L.page.evaluate(() => { window.__S = []; window.__H = []; window.__pinA2 = setInterval(() => window.DeltaUno.groups.forEach(g => { g.alert = true; g.lostT = 0; if (g.zone) g.zone.alert = true; }), 50); });
      if (start) await start();
      if (name === 'recto con turbo') await L.page.evaluate(() => { window.__thr = setInterval(() => { window.DeltaUno.ship.throttle = 1; }, 10); });
      if (name.startsWith('zigzag')) {
        for (let i = 0; i < 6; i++) { const x = i % 2 ? 195 : 105; await L.touch('touchStart', [[150, 270, 0]]); await L.touch('touchMove', [[x, 270, 0]]); await simWait(L.page, 1.5); await L.touch('touchEnd', []); }
      } else await simWait(L.page, 9);
      await L.touch('touchEnd', []).catch(() => {});
      await L.page.evaluate(() => { clearInterval(window.__thr); clearInterval(window.__pinA2); });
      const r = await L.page.evaluate(() => ({ S: window.__S || [], H: window.__H || [], G: (window.__G || []).splice(0) }));
      for (const [d, a] of r.G) { if (d < 150) (res.__ang = res.__ang || []).push(+a.toFixed(1)); }
      S += r.S.length; H += r.H.length;
      for (const d of r.S) { const k = d < 150 ? 'a <150 m' : d < 300 ? 'b 150-300 m' : 'c >300 m'; (bands[k] = bands[k] || [0, 0])[0]++; }
      for (const d of r.H) { const k = d < 150 ? 'a <150 m' : d < 300 ? 'b 150-300 m' : 'c >300 m'; (bands[k] = bands[k] || [0, 0])[1]++; }
    }
    res[name] = { tiros: S, pegan: H, pct: S ? Math.round(100 * H / S) : 0, porDistancia: Object.fromEntries(Object.entries(bands).sort().map(([k, v]) => [k.slice(2), v[0] + ' tiros, ' + Math.round(100 * v[1] / v[0]) + '%'])) };
    console.log(name, JSON.stringify(res[name]));
  }
  if (res.__ang) { const a = res.__ang.sort((x, y) => x - y); console.log('ángulo trompa-mira de cerca (°): mediana', a[a.length >> 1], 'p25', a[a.length >> 2], 'p75', a[(a.length * 3) >> 2], 'n', a.length); }
  console.log('errores', L.errs.length, L.errs.join(' | '));
  await browser.close();
})().catch(e => { console.error('EXC', e); process.exit(1); });
