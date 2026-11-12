/* ---------- Sonido: todo sintetizado en el momento (sin archivos) ----------
   Motor según empuje, velocidad y turbo; viento según velocidad; cañón, misil y explosiones en capas;
   golpes distintos para escudo y casco; radio con estática y "clic" al abrir y cerrar.
   Las explosiones y los tiros enemigos suenan según dónde pasan: más lejos, más bajo, más apagado,
   con un poco de demora y del lado que corresponde (izquierda o derecha).
   Cuando lleguen los packs de sonido, cada función se puede reemplazar por un archivo sin tocar el resto. */

export function createSound(T, camera, isOn) {
  const S = {
    ctx: null, master: null,
    counts: {}, // cuántas veces sonó cada cosa (para las pruebas)
  };
  let comp, verb, verbIn, noise, eng = null, wind = null, radioBed = null, active = 0, lastBoomT = 0, boomsNow = 0;
  const MAX_VOICES = 40;
  const _rel = new T.Vector3(), _right = new T.Vector3();
  const count = k => { S.counts[k] = (S.counts[k] || 0) + 1; };

  // Respuesta de una sala grande hecha con ruido que se apaga: le da cola a las explosiones lejanas
  function makeImpulse(c, secs) {
    const n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) { const x = i / n; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - x, 2.6) * (x < 0.01 ? x / 0.01 : 1); }
    }
    return b;
  }

  S.init = () => {
    if (S.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      const c = new AC(); S.ctx = c;
      comp = c.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.25;
      S.master = c.createGain(); S.master.gain.value = isOn() ? 0.85 : 0;
      S.master.connect(comp); comp.connect(c.destination);
      verb = c.createConvolver(); verb.buffer = makeImpulse(c, 1.8);
      verbIn = c.createGain(); verbIn.gain.value = 0.5; verbIn.connect(verb); verb.connect(S.master);
      noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      makeEngine(c); makeWind(c);
      if (c.state === 'suspended') c.resume();
    } catch (e) { S.ctx = null; }
  };
  S.apply = () => { if (S.master) S.master.gain.value = isOn() ? 0.85 : 0; };

  /* ---- Piezas ---- */
  // Una voz: se cuenta mientras suena, para no saturar el teléfono
  const voice = (node, t0, t1) => { active++; node.onended = () => { active--; }; node.start(t0); node.stop(t1); };
  const busy = prio => active > (prio ? MAX_VOICES + 12 : MAX_VOICES);
  function env(g, t, a, peak, dec) { // sube en "a" segundos y se apaga en "dec"
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function tone(out, type, f0, f1, t, a, peak, dec) {
    const c = S.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + a + dec);
    env(g, t, a, peak, dec); o.connect(g); g.connect(out); voice(o, t, t + a + dec + 0.03);
    return o;
  }
  function hiss(out, ftype, f0, f1, q, t, a, peak, dec) {
    const c = S.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noise; s.loop = true; f.type = ftype; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + a + dec);
    env(g, t, a, peak, dec); s.connect(f); f.connect(g); g.connect(out);
    active++; s.onended = () => { active--; }; s.start(t, Math.random() * 1.5); s.stop(t + a + dec + 0.03);
  }
  // Salida ubicada en el espacio: volumen, brillo, demora y lado según dónde está "at" respecto de la cámara
  function placed(at, near, far) {
    const c = S.ctx, t = c.currentTime;
    if (!at) return { out: S.master, t, k: 1, cut: 18000, d: 0 };
    _rel.copy(at).sub(camera.position); const d = _rel.length();
    _right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    const pan = d > 1 ? Math.max(-1, Math.min(1, _rel.dot(_right) / d)) * 0.8 : 0;
    const k = 1 / (1 + d / near), cut = 400 + 16000 / (1 + d / far);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut;
    let last = f;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; f.connect(p); last = p; }
    last.connect(S.master);
    return { out: f, t: t + Math.min(0.45, d / 700), k, cut, d };
  }

  /* ---- Motor y viento: suenan todo el tiempo ---- */
  function makeEngine(c) {
    const out = c.createGain(); out.gain.value = 0; out.connect(S.master);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 2.2; lp.connect(out);
    const a = c.createOscillator(), b = c.createOscillator(), sub = c.createOscillator();
    a.type = 'sawtooth'; b.type = 'sawtooth'; sub.type = 'sine';
    const subG = c.createGain(); subG.gain.value = 0.9;
    a.connect(lp); b.connect(lp); sub.connect(subG); subG.connect(lp);
    // silbido de turbina: agudo y bajito, sube con el empuje
    const whine = c.createOscillator(), whG = c.createGain(); whine.type = 'sine'; whG.gain.value = 0; whine.connect(whG); whG.connect(S.master);
    // rugido del turbo: ruido grave que aparece con el turbo
    const roar = c.createBufferSource(); roar.buffer = noise; roar.loop = true;
    const roF = c.createBiquadFilter(); roF.type = 'lowpass'; roF.frequency.value = 300;
    const roG = c.createGain(); roG.gain.value = 0; roar.connect(roF); roF.connect(roG); roG.connect(S.master);
    [a, b, sub, whine, roar].forEach(n => n.start());
    eng = { out, lp, a, b, sub, whine, whG, roF, roG };
  }
  function makeWind(c) {
    const s = c.createBufferSource(); s.buffer = noise; s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.6; f.frequency.value = 500;
    const g = c.createGain(); g.gain.value = 0;
    s.connect(f); f.connect(g); g.connect(S.master); s.start(0, 0.7);
    wind = { f, g };
  }
  // Cada cuadro: thr = empuje pedido (0..1), sp = velocidad (0..1), turbo (0..1), off = sin motor (caído o en el menú)
  S.engine = (thr, sp, turbo, off) => {
    if (!S.ctx || !eng) return;
    const t = S.ctx.currentTime, f0 = 34 + thr * 26 + sp * 22 + turbo * 10;
    eng.a.frequency.setTargetAtTime(f0, t, 0.12); eng.b.frequency.setTargetAtTime(f0 * 1.012, t, 0.12); eng.sub.frequency.setTargetAtTime(f0 * 0.5, t, 0.12);
    eng.lp.frequency.setTargetAtTime(160 + thr * 420 + sp * 300 + turbo * 900, t, 0.12);
    eng.out.gain.setTargetAtTime(off ? 0 : 0.018 + thr * 0.022 + turbo * 0.02, t, off ? 0.08 : 0.2);
    eng.whine.frequency.setTargetAtTime(700 + thr * 1500 + turbo * 600, t, 0.25);
    eng.whG.gain.setTargetAtTime(off ? 0 : 0.0015 + thr * 0.004 + turbo * 0.003, t, 0.25);
    eng.roF.frequency.setTargetAtTime(260 + turbo * 900, t, 0.15);
    eng.roG.gain.setTargetAtTime(off ? 0 : turbo * 0.09, t, 0.15);
    wind.f.frequency.setTargetAtTime(300 + sp * 1500, t, 0.3);
    wind.g.gain.setTargetAtTime(off ? 0 : sp * sp * 0.06, t, 0.3);
  };

  /* ---- Golpes y disparos ---- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  S.blip = (from, to, dur, vol, type) => { if (!S.ctx || busy(true)) return; count('blip'); tone(S.master, type, from, to, S.ctx.currentTime, 0.004, vol, dur); };
  // Cañón: chasquido, cuerpo y golpe grave; cada tiro un poco distinto
  S.shot = () => {
    if (!S.ctx || busy()) return; count('shot');
    const t = S.ctx.currentTime, k = rnd(0.94, 1.06);
    hiss(S.master, 'highpass', 2400, 1800, 0.7, t, 0.002, 0.07, 0.03);
    tone(S.master, 'square', 1000 * k, 170 * k, t, 0.002, 0.03, 0.075);
    tone(S.master, 'sine', 150 * k, 52, t, 0.002, 0.11, 0.07);
  };
  // Tiro que pegó en un enemigo: tic metálico
  S.tick = () => {
    if (!S.ctx || busy()) return; count('tick');
    const t = S.ctx.currentTime;
    tone(S.master, 'triangle', rnd(2200, 2600), 1300, t, 0.002, 0.03, 0.05);
    hiss(S.master, 'bandpass', 5200, 3000, 2, t, 0.002, 0.04, 0.03);
  };
  S.enemyShot = at => {
    if (!S.ctx || busy()) return; count('enemyShot');
    const P = placed(at, 260, 500); if (P.k < 0.08) return;
    tone(P.out, 'sawtooth', 560, 170, P.t, 0.003, 0.05 * P.k, 0.1);
    hiss(P.out, 'bandpass', 1400, 600, 1.2, P.t, 0.002, 0.08 * P.k, 0.06);
  };
  // Escudo: zumbido eléctrico que baja, con un chispazo agudo
  S.shieldHit = () => {
    if (!S.ctx) return; count('shieldHit');
    const t = S.ctx.currentTime;
    tone(S.master, 'sine', 1480, 820, t, 0.003, 0.04, 0.2);
    tone(S.master, 'sine', 1497, 836, t, 0.003, 0.035, 0.2);
    tone(S.master, 'sine', 230, 120, t, 0.004, 0.05, 0.14);
    hiss(S.master, 'bandpass', 4200, 2600, 3, t, 0.002, 0.06, 0.05);
  };
  // Casco: chapa golpeada (varios tonos que no "afinan" entre sí) y un golpe seco
  S.hullHit = () => {
    if (!S.ctx) return; count('hullHit');
    const t = S.ctx.currentTime, k = rnd(0.93, 1.07);
    [[210, 0.05, 0.5], [547, 0.035, 0.38], [1163, 0.022, 0.26], [1709, 0.014, 0.18]].forEach(([f, g, d]) => tone(S.master, 'sine', f * k, f * k * 0.97, t, 0.002, g, d));
    tone(S.master, 'sine', 120, 42, t, 0.003, 0.16, 0.16);
    hiss(S.master, 'lowpass', 1400, 300, 0.8, t, 0.002, 0.12, 0.08);
  };
  S.pickup = () => {
    if (!S.ctx) return; count('pickup');
    const t = S.ctx.currentTime;
    tone(S.master, 'triangle', 660, 660, t, 0.004, 0.045, 0.12);
    tone(S.master, 'triangle', 990, 990, t + 0.07, 0.004, 0.045, 0.18);
  };
  S.dodge = () => {
    if (!S.ctx) return; count('dodge');
    const t = S.ctx.currentTime;
    tone(S.master, 'sine', 280, 1100, t, 0.01, 0.03, 0.2);
    hiss(S.master, 'bandpass', 500, 2400, 0.9, t, 0.06, 0.12, 0.2);
  };
  // Misil: golpe del lanzador, silbido que se aleja y zumbido del cohete
  S.missile = () => {
    if (!S.ctx) return; count('missile');
    const t = S.ctx.currentTime;
    tone(S.master, 'sine', 95, 38, t, 0.003, 0.14, 0.22);
    hiss(S.master, 'bandpass', 700, 2600, 1, t, 0.01, 0.17, 0.55);
    tone(S.master, 'sawtooth', 180, 620, t, 0.01, 0.035, 0.36);
  };
  // Entrada al turbo: golpe de aire y estampido grave
  S.whoosh = () => {
    if (!S.ctx) return; count('whoosh');
    const t = S.ctx.currentTime;
    hiss(S.master, 'bandpass', 240, 2600, 0.8, t, 0.2, 0.2, 0.55);
    tone(S.master, 'sine', 72, 36, t, 0.01, 0.1, 0.45);
  };
  // Explosión en capas: estruendo grave, cuerpo de ruido, chasquido (si está cerca) y restos que repiquetean
  S.boom = (r, at) => {
    if (!S.ctx) return;
    const now = S.ctx.currentTime;
    if (now - lastBoomT < 0.12) { if (++boomsNow > 3) return; } else boomsNow = 0; // varias juntas: no más de 4 a la vez
    lastBoomT = now; count('boom');
    const P = placed(at, 220, 320), t = P.t, big = Math.min(1, r / 30);
    const g = Math.min(0.55, 0.22 + r * 0.012) * P.k;
    if (g < 0.008) return;
    const len = 0.7 + big * 1.1;
    tone(P.out, 'sine', 64 - big * 20, 26, t, 0.006, g * 0.9, len);
    hiss(P.out, 'lowpass', Math.min(P.cut, 3200), 110, 0.7, t, 0.004, g * 0.85, len * 1.1);
    if (P.d < 300) hiss(P.out, 'highpass', 1600, 900, 0.7, t, 0.002, g * 0.45, 0.07);
    const n = 2 + Math.round(big * 4);
    for (let i = 0; i < n; i++) hiss(P.out, 'bandpass', rnd(1800, 4200), 1500, 3, t + rnd(0.15, 0.7 + big * 0.6), 0.002, g * 0.13, rnd(0.03, 0.07));
    // la cola de sala crece con la distancia
    const s = S.ctx.createGain(); s.gain.value = 0.25 + Math.min(0.6, P.d / 900); P.out.connect(s); s.connect(verbIn);
  };

  /* ---- Radio ---- */
  // Al abrir: clic y un golpe de estática; mientras dura el mensaje, un siseo muy bajo que cruje
  S.radioOpen = () => {
    if (!S.ctx) return; count('radioOpen');
    const c = S.ctx, t = c.currentTime;
    S.radioClose(true);
    tone(S.master, 'square', 2400, 2400, t, 0.001, 0.025, 0.012);
    hiss(S.master, 'bandpass', 2200, 1600, 1.4, t + 0.01, 0.01, 0.06, 0.16);
    tone(S.master, 'sine', 1500, 1150, t + 0.03, 0.004, 0.02, 0.05);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noise; s.loop = true; f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 1.6;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.008, t + 0.2);
    for (let i = 1; i < 26; i++) { const tt = t + 0.2 + i * 0.27 + Math.random() * 0.1; g.gain.linearRampToValueAtTime(Math.random() < 0.18 ? 0.02 : 0.006, tt); } // crujidos
    s.connect(f); f.connect(g); g.connect(S.master);
    s.start(t, Math.random()); s.stop(t + 7.5); // por las dudas: nunca queda sonando
    radioBed = { s, g };
  };
  // Al cerrar: el "chsss" corto del final de transmisión
  S.radioClose = quiet => {
    if (!S.ctx || !radioBed) return;
    const t = S.ctx.currentTime, b = radioBed; radioBed = null;
    b.g.gain.cancelScheduledValues(t); b.g.gain.setValueAtTime(b.g.gain.value, t); b.g.gain.linearRampToValueAtTime(0, t + 0.05);
    try { b.s.stop(t + 0.08); } catch (e) { /* ya estaba parado */ }
    if (quiet) return;
    count('radioClose');
    hiss(S.master, 'highpass', 2600, 2600, 0.7, t, 0.004, 0.05, 0.11);
    tone(S.master, 'square', 1900, 1900, t + 0.1, 0.001, 0.018, 0.01);
  };

  S.debug = () => ({ voces: active, ...S.counts, estado: S.ctx ? S.ctx.state : 'sin iniciar' });
  return S;
}
