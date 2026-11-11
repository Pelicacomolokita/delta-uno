/* ---------- Datos anónimos de uso (PostHog) ----------
   Para medir cómo anda la demo: qué modos se juegan, cuánto duran las partidas, dónde se cae la gente,
   cuántos cuadros por segundo da cada equipo y qué errores aparecen.
   - Sin clave configurada (src/config.js) no hace nada.
   - Sin cookies ni datos personales: cada equipo tiene un número al azar guardado en este navegador.
   - No crea perfiles de persona en PostHog ($process_person_profile: false).
   - El jugador lo puede apagar en Ajustes; apagado, no se manda nada y se borra lo pendiente.
   Los eventos se juntan y se mandan cada 15 segundos, y al salir o pasar la app a segundo plano.
   Se mandan como formulario (igual que la librería oficial al cerrar la página) para que el navegador
   no tenga que pedir permiso antes: así funciona también abriendo el archivo sin servidor. */
import { APP_VERSION, POSTHOG_KEY, POSTHOG_HOST } from './config.js';

const ID_KEY = 'delta-uno-id', QUEUE_KEY = 'delta-uno-cola';
const MAX_QUEUE = 200, CHUNK = 50, FLUSH_MS = 15000, RETRY_MS = 60000, MAX_ERRORS = 5;

// Las pruebas pueden poner otra clave y otro destino antes de cargar el juego
const over = (typeof window !== 'undefined' && window.DELTA_UNO_STATS) || {};
const KEY = over.key !== undefined ? String(over.key) : POSTHOG_KEY;
const HOST = String(over.host || POSTHOG_HOST).replace(/\/+$/, '');
const URL_E = HOST + '/e/?compression=base64';

const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const uuid = () => { try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {} return ''; };
const rid = () => uuid() || 'x' + Math.random().toString(36).slice(2) + Date.now().toString(36);

let id = store.get(ID_KEY);
const firstTime = !id;
if (!id) { id = rid(); store.set(ID_KEY, id); }
const session = rid();
const t0 = Date.now();

// Lo que no se pudo mandar en la sesión anterior (por ejemplo, sin conexión)
let queue = [];
try { const old = JSON.parse(store.get(QUEUE_KEY) || '[]'); if (Array.isArray(old)) queue = old.slice(-MAX_QUEUE); } catch (e) {}
store.del(QUEUE_KEY);

let allowed = () => true, ctx = () => ({});
let timer = 0, sending = false, errors = 0, sent = 0;
const seenErrors = new Set();

/* ---------- Equipo ---------- */
const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
const native = () => { try { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); } catch (e) { return false; } };
const platform = () => native() ? 'android-app' : location.protocol === 'file:' ? 'pc-archivo' : 'web';
const OS = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows'
  : /CrOS/i.test(ua) ? 'Chrome OS' : /Mac OS X|Macintosh/i.test(ua) ? 'Mac OS X' : /Linux/i.test(ua) ? 'Linux' : 'Otro';
const BROWSER = /; wv\)/.test(ua) ? 'Android WebView' : /EdgA?\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera'
  : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome'
  : /Safari\//.test(ua) ? 'Safari' : 'Otro';
const MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

function common() {
  return {
    token: KEY, distinct_id: id, $process_person_profile: false,
    $lib: 'delta-uno', $lib_version: APP_VERSION, version: APP_VERSION,
    sesion: session, plataforma: platform(),
    $os: OS, $browser: BROWSER, $device_type: MOBILE ? 'Mobile' : 'Desktop',
    $screen_width: screen.width, $screen_height: screen.height
  };
}

/* ---------- Cola y envío ---------- */
const b64 = s => btoa(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16))));
const bodyOf = batch => 'data=' + encodeURIComponent(b64(JSON.stringify({ api_key: KEY, batch, sent_at: new Date().toISOString() })));
const persist = () => { if (queue.length && allowed()) store.set(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE))); };
const requeue = batch => { queue = batch.concat(queue).slice(-MAX_QUEUE); persist(); };
function schedule(ms) { if (!timer) timer = setTimeout(() => { timer = 0; flush(false); }, ms || FLUSH_MS); }

function track(event, props) {
  if (!KEY || !allowed()) return;
  let c = {};
  try { c = ctx() || {}; } catch (e) {} // si el juego todavía no terminó de arrancar
  const ev = { event, properties: Object.assign(common(), c, props || {}), timestamp: new Date().toISOString() };
  const u = uuid(); if (u) ev.uuid = u;
  queue.push(ev);
  if (queue.length > MAX_QUEUE) queue.shift();
  schedule();
}

// beacon: al salir o pasar a segundo plano; usa sendBeacon, que el navegador termina aunque se cierre la página
function flush(beacon) {
  if (timer) { clearTimeout(timer); timer = 0; }
  if (!KEY || !queue.length) return;
  if (!allowed()) { queue = []; store.del(QUEUE_KEY); return; }
  if (beacon) {
    while (queue.length) {
      const batch = queue.splice(0, CHUNK);
      let ok = false;
      try { ok = navigator.sendBeacon(URL_E, new Blob([bodyOf(batch)], { type: 'application/x-www-form-urlencoded' })); } catch (e) {}
      if (!ok) { requeue(batch); return; }
      sent += batch.length;
    }
    store.del(QUEUE_KEY);
    return;
  }
  if (sending) { schedule(); return; }
  const batch = queue.splice(0, CHUNK);
  sending = true;
  let req;
  try {
    req = fetch(URL_E, { method: 'POST', body: bodyOf(batch), keepalive: true, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  } catch (e) { req = Promise.reject(e); }
  req.then(r => {
    sending = false;
    if (r.status >= 500 || r.status === 429) { requeue(batch); schedule(RETRY_MS); return; } // el servidor no pudo: se reintenta
    sent += batch.length; // 2xx, o 4xx que no se arregla reintentando
    store.del(QUEUE_KEY);
    if (queue.length) schedule(1000);
  }).catch(() => { sending = false; requeue(batch); schedule(RETRY_MS); }); // sin conexión
}

/* ---------- Errores del juego ---------- */
function watchErrors() {
  const report = (msg, where) => {
    msg = String(msg || 'Error').slice(0, 200);
    if (errors >= MAX_ERRORS || seenErrors.has(msg)) return;
    errors++; seenErrors.add(msg);
    track('error', { mensaje: msg, donde: String(where || '').slice(0, 120) });
  };
  window.addEventListener('error', e => report(e.message, (e.filename || '').split('/').pop() + ':' + e.lineno + ':' + e.colno));
  window.addEventListener('unhandledrejection', e => { const r = e.reason; report(r && r.message ? r.message : r, 'promesa'); });
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(true); });
}

export const stats = {
  configured: !!KEY,
  firstTime,
  track,
  flush,
  watchErrors,
  // quién decide si se puede mandar (el ajuste del jugador) y qué datos de la partida van en cada evento
  allow(fn) { allowed = fn; if (!fn()) { queue = []; store.del(QUEUE_KEY); } },
  context(fn) { ctx = fn; },
  // al apagar el ajuste: se borra lo pendiente
  optOut() { queue = []; store.del(QUEUE_KEY); if (timer) { clearTimeout(timer); timer = 0; } },
  sessionSecs: () => Math.round((Date.now() - t0) / 1000),
  native,
  platform,
  debug: () => ({ id, session, key: KEY, host: HOST, queued: queue.length, sent, url: URL_E })
};
