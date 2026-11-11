// Datos anónimos de uso (PostHog), versión en el menú y botón "Dar tu opinión"
// Se corre con: npm test -- datos (o node tests/suites/11-datos-de-uso.js, después de npm run build:test)
// No sale a internet: los envíos van a un destino de prueba que la misma prueba atiende y lee.
const H = require('../helpers');
const { chromium, fs, path, ROOT, check, sleep, open, center, setRender } = H;
H.autostart = false;

const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const FEEDBACK = 'https://formulario.test/opinion';

// El cuerpo es un formulario "data=<base64 de un JSON>", como lo manda la librería oficial al cerrar la página
function decode(body) {
  const m = /^data=(.*)$/.exec(body || '');
  if (!m) return null;
  return JSON.parse(Buffer.from(decodeURIComponent(m[1]), 'base64').toString('utf8'));
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });

  /* ---------- Con clave: se mandan los eventos ---------- */
  const init = `window.DELTA_UNO_STATS={key:'phc_prueba',host:'https://ph.test',feedback:'${FEEDBACK}'};
    window.__opened=[];window.open=(u)=>{window.__opened.push(u);return null;};`;
  const L = await open(browser, { width: 844, height: 390 }, { init });
  const reqs = [];
  let offline = false;
  await L.page.route('https://ph.test/**', r => {
    const q = r.request();
    if (offline) return r.abort('internetdisconnected');
    reqs.push({ url: q.url(), type: q.headers()['content-type'] || '', body: q.postData(), kind: q.resourceType() });
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"status":1}' });
  });
  const events = () => reqs.flatMap(q => { const d = decode(q.body); return d ? d.batch.map(e => Object.assign({ _key: d.api_key }, e)) : []; });
  const named = n => events().filter(e => e.event === n);
  const flush = async () => { await L.page.evaluate(() => window.DeltaUno.stats.flush(false)); await sleep(400); };
  const tapEl = async sel => { await L.page.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await sleep(60); const c = await center(L.page, sel); await L.page.touchscreen.tap(c[0], c[1]); await sleep(150); };
  await sleep(800);

  // Menú: versión, aviso y botón de opinión
  const m = await L.page.evaluate(() => ({
    ver: document.querySelector('#ver').textContent,
    note: !document.querySelector('#statsNote').hidden,
    fb: !document.querySelector('#feedbackBtn').hidden,
    opt: !document.querySelector('#statsOpt').hidden
  }));
  check('el menú muestra la versión del juego', m.ver === 'v' + VERSION, m.ver);
  check('la primera vez avisa que se mandan datos anónimos', m.note, JSON.stringify(m));
  check('con formulario configurado aparece "Dar tu opinión"', m.fb, '');
  check('en Ajustes está la opción de datos de uso', m.opt, '');
  await tapEl('#statsOk');
  const noteGone = await L.page.evaluate(() => ({ hidden: document.querySelector('#statsNote').hidden, seen: window.DeltaUno.settings.statsSeen }));
  check('"Entendido" esconde el aviso y no vuelve a salir', noteGone.hidden && noteGone.seen, JSON.stringify(noteGone));

  // Inicio de sesión
  await flush();
  const s0 = named('sesion_inicio')[0];
  console.log('sesion_inicio', JSON.stringify(s0 && s0.properties).slice(0, 400));
  check('se manda el inicio de sesión al destino configurado, como formulario', !!s0 && reqs[0].url.startsWith('https://ph.test/e/') && /x-www-form-urlencoded/.test(reqs[0].type), reqs[0] && reqs[0].url);
  check('lleva la clave del proyecto, un número de equipo y la versión', !!s0 && s0._key === 'phc_prueba' && s0.properties.token === 'phc_prueba' && s0.properties.distinct_id && s0.properties.version === VERSION, '');
  check('no crea perfiles de persona', !!s0 && s0.properties.$process_person_profile === false, '');
  check('dice la plataforma, la placa de video y si es la primera vez', !!s0 && s0.properties.plataforma === 'web' && typeof s0.properties.gpu === 'string' && s0.properties.gpu.length > 0 && s0.properties.primera_vez === true, s0 && JSON.stringify({ p: s0.properties.plataforma, gpu: s0.properties.gpu }));

  // Partida: inicio, caída, rendimiento, ajustes y abandono
  await tapEl('.mode[data-mode="conquista"]');
  await tapEl('.seg[data-key="diff"] button[data-val="medio"]');
  await tapEl('#goBtn');
  await setRender(L.page, false);
  await sleep(1500);
  await L.page.evaluate(() => { const D = window.DeltaUno; D.setInv(0); D.damage(500); });
  await sleep(300);
  await L.page.evaluate(() => { window.DeltaUno.perf.t = 59.95; });
  await sleep(500);
  await flush();
  const pi = named('partida_inicio')[0], ca = named('caida')[0], re = named('rendimiento')[0];
  check('al despegar se manda el inicio de partida con modo y dificultad', !!pi && pi.properties.modo === 'conquista' && pi.properties.dificultad === 'medio' && pi.properties.numero === 1, pi && JSON.stringify(pi.properties).slice(0, 200));
  check('al caer se manda la causa', !!ca && ca.properties.causa === 'combate' && ca.properties.modo === 'conquista', ca && JSON.stringify({ causa: ca.properties.causa, t: ca.properties.t_partida }));
  check('cada minuto jugado se mandan los cuadros por segundo', !!re && re.properties.fps_prom > 0 && re.properties.fps_min > 0 && re.properties.resolucion > 0, re && JSON.stringify({ fps: re.properties.fps_prom, min: re.properties.fps_min, res: re.properties.resolucion }));

  await L.page.waitForFunction(() => window.DeltaUno.flags().dead <= 0, null, { timeout: 20000 });
  await tapEl('#gear');
  await tapEl('.seg[data-key="sound"] button[data-val="false"]');
  await tapEl('#resume');
  await flush();
  const aj = named('ajustes')[0];
  check('al cerrar los ajustes se manda qué cambió', !!aj && aj.properties.sound === false && aj.properties.teclas_cambiadas === false, aj && JSON.stringify(aj.properties).slice(-80));

  await tapEl('#gear');
  await tapEl('#toMenu');
  await flush();
  const pf = named('partida_fin')[0];
  check('salir al menú manda el fin de partida como abandono, con duración y caídas', !!pf && pf.properties.resultado === 'abandono' && pf.properties.duracion_s >= 1 && pf.properties.caidas === 1 && pf.properties.zonas_libres === 0, pf && JSON.stringify(pf.properties).slice(-160));

  // Opinión
  await tapEl('#feedbackBtn');
  await flush();
  const op = await L.page.evaluate(() => window.__opened.slice());
  check('"Dar tu opinión" abre el formulario y lo cuenta', op[0] === FEEDBACK && named('opinion_click').length === 1, JSON.stringify(op));

  // Errores del juego
  await L.page.evaluate(() => { setTimeout(() => { throw new Error('error de prueba'); }, 0); });
  await sleep(300);
  await flush();
  const er = named('error')[0];
  check('los errores del juego se mandan (sin repetir)', !!er && /error de prueba/.test(er.properties.mensaje), er && er.properties.mensaje);

  // Sin conexión: se guarda y se manda después
  offline = true;
  await L.page.evaluate(() => window.DeltaUno.stats.track('prueba_sin_red'));
  await flush();
  const saved = await L.page.evaluate(() => JSON.parse(localStorage.getItem('delta-uno-cola') || '[]').map(e => e.event));
  offline = false;
  await flush();
  check('sin conexión los eventos se guardan y se mandan cuando vuelve', saved.includes('prueba_sin_red') && named('prueba_sin_red').length === 1, JSON.stringify(saved));

  // Al cerrar la página: fin de sesión con sendBeacon
  const before = reqs.length;
  await L.page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await sleep(600);
  const sf = named('sesion_fin')[0];
  check('al cerrar se manda el fin de sesión', !!sf && sf.properties.duracion_s >= 1 && sf.properties.partidas === 1 && reqs.length > before, sf && JSON.stringify({ d: sf.properties.duracion_s, p: sf.properties.partidas, tipo: reqs[reqs.length - 1].kind }));

  // Apagado: no se manda nada más
  await tapEl('#menuGear');
  await tapEl('.seg[data-key="stats"] button[data-val="false"]');
  await tapEl('#resume');
  const n0 = reqs.length;
  await L.page.evaluate(() => { const D = window.DeltaUno; D.stats.track('no_deberia_salir'); D.startRun('libre'); });
  await sleep(300);
  await flush();
  await L.page.evaluate(() => window.DeltaUno.openMenu());
  await flush();
  const off = await L.page.evaluate(() => ({ s: window.DeltaUno.settings.stats, q: window.DeltaUno.stats.debug().queued, note: document.querySelector('#statsNote').hidden }));
  check('con los datos apagados no se manda nada', off.s === false && reqs.length === n0 && off.q === 0 && named('no_deberia_salir').length === 0, JSON.stringify(off) + ' envíos nuevos: ' + (reqs.length - n0));
  const otherErrs = L.errs.filter(e => !/error de prueba/.test(e));
  check('sin errores del juego en esta parte', otherErrs.length === 0, otherErrs.join(' | ').slice(0, 300));
  await L.ctx.close();

  /* ---------- Sin clave: no hace nada ---------- */
  const N = await open(browser, { width: 844, height: 390 }, { pc: true });
  const any = [];
  await N.page.route(/posthog|ph\.test/, r => { any.push(r.request().url()); r.abort(); });
  await sleep(600);
  const n = await N.page.evaluate(() => {
    const D = window.DeltaUno;
    D.startRun('carrera');
    return { conf: D.stats.configured, q: D.stats.debug().queued, note: document.querySelector('#statsNote').hidden, opt: document.querySelector('#statsOpt').hidden, fb: document.querySelector('#feedbackBtn').hidden, fbEnd: document.querySelector('#endFeedback').hidden, ver: document.querySelector('#ver').textContent };
  });
  await N.page.evaluate(() => window.DeltaUno.stats.flush(false));
  await sleep(400);
  check('sin clave no junta ni manda nada', !n.conf && n.q === 0 && any.length === 0, JSON.stringify(n));
  check('sin clave no hay aviso ni opción de datos, y sin formulario no hay botón de opinión', n.note && n.opt && n.fb && n.fbEnd, '');
  check('la versión se ve igual', n.ver === 'v' + VERSION, n.ver);
  check('sin errores sin clave', N.errs.length === 0, N.errs.join(' | ').slice(0, 300));
  await N.ctx.close();

  await browser.close();
})().catch(e => { console.log('FAIL la prueba se cortó: ' + e.message); process.exit(1); });
