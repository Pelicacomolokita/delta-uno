// Ayudas comunes de las pruebas. Abren el juego en un Chromium con pantalla táctil simulada,
// igual que la página publicada (el juego va como fragmento dentro de un esqueleto HTML).
// Las pruebas usan la versión sin comprimir: npm run build:test → dist-test/delta-uno-artifact.html
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const dir = path.join(__dirname, 'capturas'); // capturas de pantalla de las pruebas (no se suben)
fs.mkdirSync(dir, { recursive: true });

const H = {
  // Cambia el código del juego antes de abrirlo (para contar disparos, etc.). Recibe y devuelve el texto.
  transform: s => s,
  // true: arranca Conquista en Medio, con vidas infinitas, apenas abre (las pruebas viejas lo necesitan)
  autostart: !!process.env.AUTOSTART
};

function pageHtml() {
  const file = path.join(ROOT, 'dist-test', 'delta-uno-artifact.html');
  if (!fs.existsSync(file)) throw new Error('Falta ' + file + '. Corré antes: npm run build:test');
  const src = H.transform(fs.readFileSync(file, 'utf8'));
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${src}</body></html>`;
}

const check = (name, ok, extra = '') => console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${extra}`);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const launch = () => chromium.launch({ args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });

async function open(browser, viewport) {
  const ctx = await browser.newContext({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'error' || /THREE\.WebGL|GLSL|shader/i.test(m.text())) && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 500)); });
  const html = pageHtml();
  await page.route('**/fonts.g*/**', r => r.abort());
  await page.route('http://game.test/', r => r.fulfill({ body: html, contentType: 'text/html' }));
  await page.goto('http://game.test/');
  await page.waitForFunction(() => window.DeltaUno, null, { timeout: 40000 }).catch(e => { console.log('ERRS', errs); throw e; });
  if (H.autostart) await page.evaluate(() => { const D = window.DeltaUno; D.startRun('conquista', 'medio'); D.run.lives = Infinity; });
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(p => ({ x: p[0], y: p[1], id: p[2] })) });
  return { ctx, page, errs, touch };
}
const center = (page, sel) => page.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
// Sin dibujar, la simulación corre mucho más rápido (el cálculo sigue igual)
const setRender = (page, on) => page.evaluate(on => { const R = window.DeltaUno.renderer; if (!R.__orig) R.__orig = R.render.bind(R); R.render = on ? R.__orig : () => {}; }, on);
const st = page => page.evaluate(() => { const D = window.DeltaUno, s = D.ship; return { ...D.vit(), ...D.flags(), speed: s.speed, thr: s.throttle, alt: s.alt, bank: s.bank * 57.3, pitch: s.pitchA * 57.3, t: s.t, kills: s.kills, nEn: D.enemies.length, nGr: D.groups.length }; });
const f = o => JSON.stringify(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? +v.toFixed(2) : v])));
// Espera "secs" segundos del juego (no del reloj)
const simWait = (page, secs) => page.evaluate(sec => new Promise(r => { const D = window.DeltaUno, t0 = D.ship.t, i = setInterval(() => { if (D.ship.t - t0 >= sec) { clearInterval(i); r(); } }, 15); }), secs);
// Coloca la nave en un punto (fracción del radio de una zona), mirando al centro
const place = (page, zi, frac, alt) => page.evaluate(([zi, frac, alt]) => {
  const D = window.DeltaUno, s = D.ship, z = D.zones[zi], R = D.PLANET_R, a = frac * z.r / R;
  const u = z.dir.clone().multiplyScalar(Math.cos(a)).addScaledVector(z.e1, Math.sin(a)).normalize();
  const tang = z.dir.clone().multiplyScalar(Math.cos(a)).sub(u.clone().multiplyScalar(z.dir.dot(u))).normalize();
  const h = D.heightAt(u.x, u.y, u.z, 0);
  const rgt = new s.pos.constructor().crossVectors(tang, u).normalize(), back = tang.clone().negate();
  s.q.setFromRotationMatrix(new window.THREE.Matrix4().makeBasis(rgt, u, back));
  s.pos.copy(u).multiplyScalar(R + Math.max(h, 0) + alt);
  s.vel.copy(tang).multiplyScalar(s.speed);
  D.straighten();
  s.pos.copy(u).multiplyScalar(R + Math.max(h, 0) + alt);
}, [zi, frac, alt]);
// No deja que la nave baje de "alt" metros sobre el suelo (null lo suelta)
const pinAlt = (page, alt) => page.evaluate(alt => { clearInterval(window.__pinA); if (alt == null) return; const D = window.DeltaUno, s = D.ship; window.__pinA = setInterval(() => { const u = s.pos.clone().normalize(), h = D.heightAt(u.x, u.y, u.z, 0); if (s.pos.length() - D.PLANET_R - h < alt) s.pos.setLength(D.PLANET_R + h + alt); }, 4); }, alt);
const faceOut = (page, zi) => page.evaluate(zi => { const D = window.DeltaUno, s = D.ship, z = D.zones[zi], u = s.pos.clone().normalize(), V = s.pos.constructor; const out = u.clone().sub(z.dir.clone().multiplyScalar(u.dot(z.dir))).normalize(), rgt = new V().crossVectors(out, u).normalize(), back = out.clone().negate(); s.q.setFromRotationMatrix(new window.THREE.Matrix4().makeBasis(rgt, u, back)); s.vel.copy(out).multiplyScalar(s.speed); }, zi);
// Espera a que termine la invulnerabilidad del comienzo o de reaparecer
const waitGrace = page => page.waitForFunction(() => window.DeltaUno.flags().inv <= 0 && window.DeltaUno.flags().dead <= 0, null, { timeout: 30000 });

module.exports = Object.assign(H, { chromium, fs, path, dir, ROOT, check, sleep, launch, open, center, setRender, st, f, simWait, place, pinAlt, faceOut, waitGrace });
