/* ---------- Intro de Cebado Producciones ----------
   El video viaja adentro del HTML (en base64) para que el juego siga siendo un solo archivo.
   Antes de reproducirlo se pasa a Blob: así anda igual en el navegador y en el APK, y se libera al terminar.

   Reglas, del pedido de la productora (docs/intro-cebado.md):
   - Primero una pantalla con "Comenzar": el navegador solo deja sonar después de un toque.
   - Respeta el ajuste de sonido del juego.
   - "Saltar" siempre disponible: botón, toque, Escape, cualquier tecla o botón del mando.
   - Si el video no puede reproducirse, se va al menú igual. Nunca deja al jugador trabado.
   - Se muestra una sola vez por sesión; el juego no la repite al volver al menú.
   - Proporción intacta, con fondo #201e1b en los costados. Nunca recorta ni estira. */

import introSrc from './intro/intro.mp4';

const DATA = /^data:/;
// Si el video tarda más que esto en arrancar, se sigue al menú sin esperarlo
const ESPERA_MS = 5000;

function blobUrl(src) {
  if (!DATA.test(src)) return { url: src, revoke: false }; // en desarrollo es una ruta común
  try {
    const bin = atob(src.slice(src.indexOf(',') + 1)), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return { url: URL.createObjectURL(new Blob([u8], { type: 'video/mp4' })), revoke: true };
  } catch (e) { return { url: src, revoke: false }; }
}

/* Muestra la intro dentro de `root` y llama a `done` una sola vez, pase lo que pase.
   sound: si el video arranca con sonido. unlock: lo que hace el juego al primer toque (audio y pantalla).
   done({ saltada, vista_s, fallo }) */
export function runIntro({ root, sound, unlock, done }) {
  const box = root.querySelector('#intro'), video = root.querySelector('#introVideo');
  const start = root.querySelector('#introStart'), skip = root.querySelector('#introSkip');
  let src = null, fin = false, t0 = 0, pads = false, raf = 0, espera = 0;

  const off = [];
  const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); off.push(() => el.removeEventListener(ev, fn, opt)); };

  function terminar(motivo) {
    if (fin) return; fin = true;
    cancelAnimationFrame(raf); clearTimeout(espera);
    off.forEach(f => f()); off.length = 0;
    try { video.pause(); } catch (e) { /* ya estaba parado */ }
    video.removeAttribute('src'); try { video.load(); } catch (e) { /* nada que cargar */ }
    if (src && src.revoke) URL.revokeObjectURL(src.url);
    box.hidden = true;
    done({ saltada: motivo === 'saltada', fallo: motivo === 'fallo', vista_s: t0 ? +((performance.now() - t0) / 1000).toFixed(1) : 0 });
  }

  // El mando no manda eventos: hay que preguntarle a cada rato si tiene un botón apretado
  function mirarMando() {
    raf = requestAnimationFrame(mirarMando);
    let g = null;
    try { g = navigator.getGamepads ? navigator.getGamepads() : null; } catch (e) { return; }
    if (!g) return;
    let apretado = false;
    for (const p of g) if (p) for (const b of p.buttons) if (b && (b.pressed || b.value > 0.5)) apretado = true;
    if (apretado && !pads) { pads = true; if (start.hidden) terminar('saltada'); else arrancar(); }
    else if (!apretado) pads = false;
  }

  function arrancar() {
    if (fin || start.hidden) return;
    start.hidden = true; skip.hidden = false; video.hidden = false;
    try { unlock(); } catch (e) { /* el juego sigue igual */ }
    t0 = performance.now();
    src = blobUrl(introSrc);
    video.muted = !sound; video.src = src.url;
    espera = setTimeout(() => { if (video.paused || !video.currentTime) terminar('fallo'); }, ESPERA_MS);
    on(video, 'playing', () => clearTimeout(espera));
    const p = video.play();
    if (p && p.catch) p.catch(() => {
      // Sin permiso para sonar: se intenta en silencio antes de darse por vencido
      video.muted = true;
      const p2 = video.play();
      if (p2 && p2.catch) p2.catch(() => terminar('fallo'));
    });
  }

  on(start, 'click', arrancar);
  on(skip, 'click', () => terminar('saltada'));
  on(video, 'ended', () => terminar('fin'));
  on(video, 'error', () => terminar('fallo'));
  on(box, 'pointerdown', e => { if (e.target === skip || e.target === start) return; if (start.hidden) terminar('saltada'); else arrancar(); });
  on(window, 'keydown', e => {
    if (e.key === 'Tab') return; // dejar que el teclado siga navegando
    e.preventDefault();
    if (start.hidden) terminar('saltada'); else arrancar();
  });
  raf = requestAnimationFrame(mirarMando);

  box.hidden = false; video.hidden = true; skip.hidden = true; start.hidden = false;
  try { start.focus({ preventScroll: true }); } catch (e) { /* da igual */ }
  return { terminar };
}
