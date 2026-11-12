// Intro de Cebado Producciones: pantalla "Comenzar", reproducción, saltar, silencio y paso único al menú.
// Se corre con: npm test -- intro
const H = require('../helpers');
const { launch, open, check, sleep, f, path, dir } = H;
H.autostart = false;

const KEY = `window.DELTA_UNO_STATS={key:'phc_prueba',host:'https://ph.test'};`;
const abrir = async (browser, vp, opts) => {
  const o = Object.assign({ intro: true }, opts);
  o.init = o.init ? [KEY, '(' + o.init.toString() + ')();'].join('\n') : KEY;
  const L = await open(browser, vp, o);
  L.reqs = [];
  await L.page.route('https://ph.test/**', r => { L.reqs.push(r.request().postData()); r.abort(); }); // no sale a internet
  return L;
};
// Los eventos salen en un formulario "data=<base64 de un JSON>", como los manda la librería oficial
async function guardados(L) {
  await L.page.evaluate(() => window.DeltaUno.stats.flush());
  await sleep(300);
  return L.reqs.flatMap(b => { const m = /^data=(.*)$/.exec(b || ''); if (!m) return []; try { return JSON.parse(Buffer.from(decodeURIComponent(m[1]), 'base64').toString('utf8')).batch; } catch (e) { return []; } }).filter(e => e.event === 'intro');
}
const estado = page => page.evaluate(() => ({
  intro: !document.querySelector('#intro').hidden,
  start: !document.querySelector('#introStart').hidden,
  skip: !document.querySelector('#introSkip').hidden,
  menu: !document.querySelector('#menu').hidden,
  t: document.querySelector('#introVideo').currentTime,
  dur: document.querySelector('#introVideo').duration,
  muted: document.querySelector('#introVideo').muted,
  src: (document.querySelector('#introVideo').getAttribute('src') || '').slice(0, 5)
}));

(async () => {
  const browser = await launch();

  /* ---------- Arranque: pantalla "Comenzar" antes del menú ---------- */
  let L = await abrir(browser, { width: 844, height: 390 });
  let r = await estado(L.page);
  check('al abrir el juego se ve "Comenzar", no el menú', r.intro && r.start && !r.skip && !r.menu, f(r));
  await L.page.screenshot({ path: path.join(dir, 'intro-comenzar.png') });

  await L.page.evaluate(() => document.querySelector('#introStart').click());
  await sleep(1200);
  r = await estado(L.page);
  check('al tocar "Comenzar" arranca el video, con sonido y con "Saltar"', r.intro && !r.start && r.skip && r.t > 0.2 && !r.muted && r.src === 'blob:', f(r));
  check('el video es el de la productora: 8 segundos', Math.abs(r.dur - 8) < 0.2, String(r.dur));
  await L.page.waitForFunction(() => document.querySelector('#introVideo').videoWidth > 0, null, { timeout: 5000 }).catch(() => {});
  r = await L.page.evaluate(() => {
    const v = document.querySelector('#introVideo').getBoundingClientRect(), i = document.querySelector('#intro').getBoundingClientRect();
    return { desborde: Math.round(Math.max(v.width - i.width, v.height - i.height)), vid: document.querySelector('#introVideo').videoWidth };
  });
  check('el video entra entero en la pantalla, sin recortarse', r.desborde <= 1 && r.vid === 1920, f(r));
  await L.page.screenshot({ path: path.join(dir, 'intro-video.png') });

  /* ---------- Saltar ---------- */
  await L.page.evaluate(() => document.querySelector('#introSkip').click());
  await sleep(200);
  r = await estado(L.page);
  check('"Saltar" cierra la intro y abre el menú', !r.intro && r.menu && r.src === '', f(r));
  let ev = await guardados(L);
  check('queda anotado que la intro se saltó', ev.length === 1 && ev[0].properties.saltada === true && ev[0].properties.vista_s > 0, JSON.stringify(ev));

  /* ---------- No se repite al volver al menú ---------- */
  await L.page.evaluate(() => { const D = window.DeltaUno; D.startRun('conquista', 'medio'); });
  await sleep(600);
  await L.page.evaluate(() => window.DeltaUno.openMenu());
  await sleep(300);
  r = await estado(L.page);
  check('no vuelve a aparecer al jugar y volver al menú', !r.intro && r.menu, f(r));
  await L.ctx.close();

  /* ---------- Con el sonido apagado ---------- */
  L = await abrir(browser, { width: 844, height: 390 }, { init: () => { try { localStorage.setItem('delta-uno-ajustes-v3', JSON.stringify({ sound: false })); } catch (e) { } } });
  await L.page.evaluate(() => document.querySelector('#introStart').click());
  await sleep(800);
  r = await estado(L.page);
  check('con el sonido apagado, la intro va muda', r.intro && r.muted && r.t > 0.1, f(r));
  await L.ctx.close();

  /* ---------- Escape y teclado ---------- */
  L = await abrir(browser, { width: 844, height: 390 });
  await L.page.keyboard.press('Enter');
  await sleep(600);
  r = await estado(L.page);
  check('una tecla también arranca la intro', !r.start && r.t > 0.1, f(r));
  await L.page.keyboard.press('Escape');
  await sleep(200);
  r = await estado(L.page);
  check('Escape la salta', !r.intro && r.menu, f(r));
  await L.ctx.close();

  /* ---------- Se puede apagar en Ajustes ---------- */
  L = await abrir(browser, { width: 844, height: 390 }, { init: () => { try { localStorage.setItem('delta-uno-ajustes-v3', JSON.stringify({ intro: false })); } catch (e) { } } });
  r = await estado(L.page);
  check('apagada en Ajustes, el juego abre directo en el menú', !r.intro && r.menu, f(r));
  await L.ctx.close();

  /* ---------- Si el video falla, igual se entra al juego ---------- */
  L = await abrir(browser, { width: 844, height: 390 }, { init: () => { HTMLMediaElement.prototype.play = () => Promise.reject(new Error('sin permiso')); } });
  await L.page.evaluate(() => document.querySelector('#introStart').click());
  await sleep(700);
  r = await estado(L.page);
  check('si el video no puede reproducirse, se abre el menú igual', !r.intro && r.menu, f(r));
  ev = await guardados(L);
  check('y queda anotado el fallo', ev.length === 1 && ev[0].properties.fallo === true, JSON.stringify(ev));
  const errs = L.errs;
  await L.ctx.close();

  /* ---------- Teléfono en vertical: la intro no se deforma ---------- */
  L = await abrir(browser, { width: 390, height: 844 });
  await L.page.evaluate(() => document.querySelector('#introStart').click());
  // esperar a que haya imagen dibujada, no solo medidas, para que la captura sirva
  await L.page.waitForFunction(() => document.querySelector('#introVideo').currentTime > 1.5, null, { timeout: 8000 }).catch(() => {});
  r = await L.page.evaluate(() => {
    const v = document.querySelector('#introVideo'), b = v.getBoundingClientRect();
    const i = document.querySelector('#intro').getBoundingClientRect();
    return { fit: getComputedStyle(v).objectFit, bg: getComputedStyle(document.querySelector('#intro')).backgroundColor, w: Math.round(b.width), h: Math.round(b.height), gw: Math.round(i.width), gh: Math.round(i.height) };
  });
  check('en vertical mantiene la proporción y rellena con el fondo de la marca', r.fit === 'contain' && r.bg === 'rgb(32, 30, 27)' && r.w <= r.gw + 1 && r.h <= r.gh + 1, f(r));
  await L.page.screenshot({ path: path.join(dir, 'intro-vertical.png') });

  check('sin errores en la página', errs.length === 0 && L.errs.length === 0, (errs.concat(L.errs)).join(' | '));
  await browser.close();
})();
