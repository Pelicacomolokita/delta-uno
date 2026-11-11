// Saca las capturas de la página de descarga (pagina/img/) jugando el juego de verdad, en pantalla de teléfono.
// Uso: npm run build:test && node scripts/capturas.cjs
const H = require('../tests/helpers');
const { fs, path, ROOT, sleep, launch, open, setRender, simWait, place, pinAlt } = H;
H.autostart = true;

const OUT = path.join(ROOT, 'pagina/img');
fs.mkdirSync(OUT, { recursive: true });
const shot = (page, name) => page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 82 });

(async () => {
  const browser = await launch();
  // Pantalla de teléfono con densidad 2, para que se vean nítidas
  const orig = browser.newContext.bind(browser);
  browser.newContext = o => orig(Object.assign({}, o, { deviceScaleFactor: 2 }));
  const L = await open(browser, { width: 844, height: 390 });
  const { page } = L;
  await page.evaluate(() => window.DeltaUno.setInv(9999));

  // 1. Despegue: el volcán y la primera zona
  await sleep(4000);
  await shot(page, 'despegue');

  // 2. Combate: escuadrones que vienen de frente (se prueba en varios momentos y se queda la que tiene más naves a la vista)
  const zi = await page.evaluate(() => { const Z = window.DeltaUno.zones; const i = Z.findIndex(z => z.kind.name === 'Normal'); return i < 0 ? 0 : i; });
  await setRender(page, false);
  await place(page, zi, 0.95, 220);
  await pinAlt(page, 150);
  let best = -1;
  for (let k = 0; k < 8; k++) {
    await simWait(page, 1.2);
    const n = await page.evaluate(() => {
      const D = window.DeltaUno, cam = D.camera, V = cam.position.constructor, v = new V();
      return D.enemies.filter(e => !e.def.ground && e.pos && (v.copy(e.pos).project(cam), v.z < 1 && Math.abs(v.x) < .8 && Math.abs(v.y) < .8)).length;
    });
    if (n > best) {
      best = n;
      await setRender(page, true); await sleep(700);
      await shot(page, 'combate');
      await setRender(page, false);
    }
  }
  console.log('naves a la vista en la captura de combate:', best);

  // 3. Una zona densa: torretas y lanzamisiles sobre sus torres
  const zd = await page.evaluate(() => { const Z = window.DeltaUno.zones; const i = Z.findIndex(z => z.kind.name === 'Densa'); return i < 0 ? 1 : i; });
  await setRender(page, false);
  await place(page, zd, 1.15, 110);
  await pinAlt(page, 70);
  await simWait(page, 3);
  await setRender(page, true);
  await sleep(1500);
  await shot(page, 'defensas');
  await pinAlt(page, null);

  console.log('errores:', L.errs.length ? L.errs.join(' | ') : 'ninguno');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
