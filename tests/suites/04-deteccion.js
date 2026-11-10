// Detección por cercanía (escuadrones y nodriza) y evasión en vertical
// Se corre con: npm test (todas) o node tests/suites/04-deteccion.js (solo esta, después de npm run build:test)
const H = require('../helpers');
const { chromium, fs, path, dir, check, sleep, open, center, setRender, st, f, simWait, place, pinAlt, faceOut, waitGrace } = H;
H.autostart = false;
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const L = await open(browser, { width: 844, height: 390 });
  await sleep(800);
  await L.page.evaluate(() => window.DeltaUno.startRun('libre'));
  await setRender(L.page, false);
  await waitGrace(L.page);
  const det = async (dist, side, kinds) => {
    await L.page.evaluate(([dist, side, kinds]) => {
      const D = window.DeltaUno, s = D.ship;
      D.enemies.slice().forEach(e => { e.hp = 1; D.hitEnemyForTest(e); });
      const u = s.pos.clone().normalize(), f = new s.pos.constructor(0, 0, -1).applyQuaternion(s.q); f.addScaledVector(u, -f.dot(u)).normalize();
      const home = s.pos.clone().addScaledVector(f, 900);
      const g = D.makeGroup(D.roamZone, kinds, home, home.clone().normalize(), 1, false); window.__g = g;
      const Ld = g.leader, lu = Ld.pos.clone().normalize(), lf = Ld.fwd.clone().addScaledVector(lu, -Ld.fwd.dot(lu)).normalize(), rt = lf.clone().cross(lu);
      const at = Ld.pos.clone().addScaledVector(side === 'adelante' ? lf : side === 'atrás' ? lf.clone().negate() : rt, dist);
      clearInterval(window.__pin); window.__pin = setInterval(() => { s.pos.copy(at); }, 3); s.pos.copy(at);
    }, [dist, side, kinds]);
    await simWait(L.page, .4);
    const a = await L.page.evaluate(() => window.__g.alert);
    await L.page.evaluate(() => clearInterval(window.__pin));
    return a;
  };
  const C = ['caza', 'caza'];
  check('escuadrón: de frente te ve a 500 m', await det(500, 'adelante', C) === true, '');
  check('escuadrón: de atrás no te ve a 450 m', await det(450, 'atrás', C) === false, '');
  check('escuadrón: de atrás te ve a 250 m', await det(250, 'atrás', C) === true, '');
  check('escuadrón: de costado no te ve a 700 m', await det(700, 'costado', C) === false, '');
  check('nodriza: con radar te ve de atrás a 600 m', await det(600, 'atrás', ['nodriza']) === true, '');
  check('sin errores', L.errs.length === 0, L.errs.join(' | '));
  // en vertical, la evasión con dos toques (con la nave ya en vuelo)
  const P = await open(browser, { width: 390, height: 844 });
  await sleep(800);
  await P.page.evaluate(() => window.DeltaUno.startRun('libre'));
  await setRender(P.page, false);
  await waitGrace(P.page);
  const prr = await center(P.page, '#rollR');
  await P.touch('touchStart', [[prr[0], prr[1], 0]]); await P.touch('touchEnd', []); await sleep(60);
  await P.touch('touchStart', [[prr[0], prr[1], 0]]); await P.touch('touchEnd', []); await sleep(60);
  await P.touch('touchStart', [[prr[0], prr[1], 0]]); await P.touch('touchEnd', []);
  check('en vertical también funciona la evasión', await P.page.evaluate(() => window.DeltaUno.dodge.cool > 0), '');
  await browser.close();
})().catch(e => { console.error('EXC', e); process.exit(1); });
