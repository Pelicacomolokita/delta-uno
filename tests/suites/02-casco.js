// Zona de impacto con la forma real de la nave
// Se corre con: npm test (todas) o node tests/suites/02-casco.js (solo esta, después de npm run build:test)
const H = require('../helpers');
const { chromium, fs, path, dir, check, sleep, open, center, setRender, st, f, simWait, place, pinAlt, faceOut, waitGrace } = H;
H.autostart = true;
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const L = await open(browser, { width: 844, height: 390 });
  await sleep(800); await setRender(L.page, false);
  const r = await L.page.evaluate(() => {
    const D = window.DeltaUno, s = D.ship, V = s.pos.constructor;
    // segmentos en coordenadas de la nave: de (x,y,z0) a (x,y,z1)
    const seg = (a, b) => { const A = new V(...a).applyQuaternion(s.q).add(s.pos), B = new V(...b).applyQuaternion(s.q).add(s.pos); return D.boltHitsShip(A, B); };
    return {
      'atraviesa el centro de atrás hacia adelante': seg([0, 0, 20], [0, 0, -20]),
      'pasa 1,5 m por arriba': seg([0, 1.5, 20], [0, 1.5, -20]),
      // La frontera de arriba y de abajo está en 1,035 m (silueta del Caza A más el grosor de la bala,
      // medido con bisección). El casco llega a 1,04 m por debajo del centro, así que a 1 m hay metal.
      // Se cuida de los dos lados: a 0,9 m tiene que pegar y a 1,3 m no. Si la silueta cambia, esto avisa.
      'roza 0,9 m por abajo: pega': seg([0, -.9, 20], [0, -.9, -20]),
      'pasa 1,3 m por abajo: no pega': seg([0, -1.3, 20], [0, -1.3, -20]),
      'roza 0,9 m por arriba: pega': seg([0, .9, 20], [0, .9, -20]),
      'atraviesa el ala derecha (x 2)': seg([2, 0, 20], [2, 0, -20]),
      'pasa al costado del ala (x 3,2)': seg([3.2, 0, 20], [3.2, 0, -20]),
      'de arriba hacia abajo por el centro': seg([0, 20, 0], [0, -20, 0]),
      'de arriba hacia abajo junto a la punta (x 1,8 z -2)': seg([1.8, 20, -2], [1.8, -20, -2]),
      'de costado por el medio': seg([20, 0, .5], [-20, 0, .5]),
    };
  });
  const want = {'atraviesa el centro de atrás hacia adelante': true, 'pasa 1,5 m por arriba': false, 'roza 0,9 m por abajo: pega': true, 'pasa 1,3 m por abajo: no pega': false, 'roza 0,9 m por arriba: pega': true, 'atraviesa el ala derecha (x 2)': true, 'pasa al costado del ala (x 3,2)': false, 'de arriba hacia abajo por el centro': true, 'de arriba hacia abajo junto a la punta (x 1,8 z -2)': false, 'de costado por el medio': true};
  for (const k of Object.keys(want)) check('bala que ' + k + (want[k] ? ': pega' : ': no pega'), r[k] === want[k], String(r[k]));
  check('sin errores', L.errs.length === 0, L.errs.join(' | '));
  await browser.close();
})().catch(e => { console.error('EXC', e); process.exit(1); });
