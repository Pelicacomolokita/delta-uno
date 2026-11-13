/* Prueba de rendimiento de naves (herramienta, no es parte del juego).
   Hasta 40 naves de 6 diseños volando sobre un terreno, con disparos y llamas. Compara la forma nueva
   (instancias + piezas en la placa de video + niveles de detalle) con la vieja (un objeto por pieza).
   La prueba de 3 o 10 minutos da el promedio, el 1 % más lento y un texto para copiar. */
import * as T from 'three';
import { Flota } from '../../src/naves/flota.js';
import { DISENOS, ESCALA_CLASE } from '../../src/naves/disenos.js';
import { naveTextura } from '../../src/nave.js';
import { FlotaVieja } from './vieja.js';

const $ = id => document.getElementById(id);
const IDS = ['A', 'I2', 'P1', 'S4', 'R1', 'X1'];
const CALIDAD = { baja: { pr: 1, aa: false, detalle: false, nombre: 'Baja' }, media: { pr: 1.5, aa: true, detalle: true, nombre: 'Media' }, alta: { pr: 2, aa: true, detalle: true, nombre: 'Alta' } };
const params = new URLSearchParams(location.search);
const st = {
  forma: 'nueva', camara: params.get('cam') || 'persecucion', naves: +(params.get('naves') || 25), calidad: params.get('q') || 'alta', piezas: true, prueba: null, limpio: false, forzar: null
};

/* ---------- Escena (la misma luz y niebla que el juego) ---------- */
const scene = new T.Scene();
scene.background = new T.Color(0xb3c9e0);
scene.fog = new T.Fog(0xb3c9e0, 500, 4200);
scene.add(new T.HemisphereLight(0xa8c8ff, 0xb08a66, 0.72));
const sun = new T.DirectionalLight(0xfff0d8, 0.95); sun.position.set(400, 700, 300); scene.add(sun);
const camera = new T.PerspectiveCamera(62, 1, 0.5, 6000);

// terreno de relleno: unos 65.000 triángulos, para que la placa de video no esté solo con las naves
{
  const g = new T.PlaneGeometry(6000, 6000, 180, 180); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = [];
  const h = (x, z) => Math.sin(x * 0.004) * Math.cos(z * 0.0035) * 60 + Math.sin(x * 0.013 + z * 0.009) * 18 + Math.sin(z * 0.03) * 5;
  const cA = new T.Color(0x5f7a4a), cB = new T.Color(0xb59f78), c = new T.Color();
  for (let i = 0; i < p.count; i++) {
    const y = h(p.getX(i), p.getZ(i)); p.setY(i, y - 40);
    c.copy(cA).lerp(cB, T.MathUtils.clamp((y + 30) / 110, 0, 1)); col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  scene.add(new T.Mesh(g, new T.MeshLambertMaterial({ vertexColors: true })));
}

/* ---------- Renderizador (se rehace si cambia el suavizado de bordes) ---------- */
let renderer = null, flota = null, vieja = null, detalleTex = null;
function crearRenderer() {
  const q = CALIDAD[st.calidad];
  if (renderer) { renderer.dispose(); renderer.forceContextLoss(); const c = $('view').cloneNode(); $('view').replaceWith(c); }
  renderer = new T.WebGLRenderer({ canvas: $('view'), antialias: q.aa, powerPreference: 'high-performance' });
  renderer.info.autoReset = true;
  detalleTex = q.detalle ? naveTextura(T) : null;
  if (detalleTex) { detalleTex.wrapS = detalleTex.wrapT = T.RepeatWrapping; detalleTex.needsUpdate = true; }
  rehacerFlotas();
  resize();
}
function rehacerFlotas() {
  if (flota) for (const id in flota.dis) for (const l of flota.dis[id].lods) { scene.remove(l.mesh); l.mesh.geometry.dispose(); }
  if (flota) for (const b in flota.balizas) scene.remove(flota.balizas[b].pts);
  if (vieja) vieja.limpiar();
  flota = new Flota(scene, IDS, { max: 40, detalleTex });
  vieja = new FlotaVieja(scene, IDS, detalleTex);
  vieja.preparar(naves);
  aplicarForma();
}
function aplicarForma() {
  flota.setVisible(st.forma === 'nueva');
  vieja.setVisible(st.forma === 'vieja');
}

/* ---------- Naves y vuelo ---------- */
let naves = [];
function armarNaves(n) {
  let s = 7;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  naves = [];
  for (let i = 0; i < n; i++) {
    const id = i === 0 ? 'A' : IDS[i % IDS.length];
    const dis = DISENOS[id];
    const ala = i >= 1 && i <= 3; // 3 compañeros en formación cerca tuyo
    naves.push({
      id, pintura: dis.pintura, propia: i === 0,
      pos: new T.Vector3(), quat: new T.Quaternion(), anim: [0, 0, 0, 0, 0, 0, 0], lod: 0,
      ala, offset: new T.Vector3((i % 2 ? -1 : 1) * (14 + i * 4), (i - 2) * 2, 12 + i * 9),
      dist: 60 + Math.pow(rnd(), 1.4) * 900, lat: (rnd() - 0.5) * 500, altOff: (rnd() - 0.5) * 160, r: 30 + rnd() * 160,
      w: (rnd() < 0.5 ? -1 : 1) * (40 + rnd() * 60), fase: rnd() * Math.PI * 2, ph2: rnd() * 6, bank: 0, bankPrev: 0, pitchPrev: 0,
      _p: new T.Vector3(), _v: new T.Vector3(), _vPrev: new T.Vector3()
    });
  }
  naves.forEach(o => { o.w = o.w / (o.r || 1); });
  if (vieja) vieja.preparar(naves);
}

const UP = new T.Vector3(0, 1, 0), _f = new T.Vector3(), _r = new T.Vector3(), _u = new T.Vector3(), _m = new T.Matrix4(), _t = new T.Vector3(), _a = new T.Vector3(), _q = new T.Quaternion();
const R_VUELTA = 1600, V_PROPIA = 150;
function propia(t, out) {
  const a = t * V_PROPIA / R_VUELTA;
  return out.set(Math.cos(a) * R_VUELTA, 140 + Math.sin(t * 0.37) * 40, Math.sin(a) * R_VUELTA * 0.75);
}
const _b = new T.Vector3(), _bf = new T.Vector3(), _br = new T.Vector3();
function trayectoria(o, t, out) {
  propia(t, out);
  if (o.propia) return out;
  // ejes de tu nave en ese momento: los demás vuelan alrededor de puntos que te acompañan adelante
  _bf.copy(propia(t + 0.02, _b)).sub(out).normalize();
  _br.crossVectors(_bf, UP).normalize();
  if (o.ala) return out.addScaledVector(_br, o.offset.x).addScaledVector(UP, o.offset.y + Math.sin(t * 0.9 + o.ph2) * 1.5).addScaledVector(_bf, -o.offset.z);
  const a = t * o.w + o.fase;
  return out.addScaledVector(_bf, o.dist + Math.sin(a) * o.r * 0.6).addScaledVector(_br, o.lat + Math.cos(a) * o.r)
    .addScaledVector(UP, o.altOff + Math.sin(a * 2 + o.ph2) * o.r * 0.3);
}

function volar(t, dt) {
  for (const o of naves) {
    trayectoria(o, t, o.pos);
    trayectoria(o, t + 0.05, o._p);
    o._v.copy(o._p).sub(o.pos).divideScalar(0.05);
    const v = o._v.length() || 1;
    _f.copy(o._v).divideScalar(v);
    // inclinación en las curvas: la aceleración de costado
    _a.copy(o._v).sub(o._vPrev).divideScalar(Math.max(dt, 1e-3)); o._vPrev.copy(o._v);
    _r.crossVectors(_f, UP).normalize();
    const lat = T.MathUtils.clamp(_a.dot(_r), -60, 60);
    const bank = T.MathUtils.lerp(o.bank, Math.atan2(lat, 9.8) * 0.6, 1 - Math.exp(-4 * dt));
    const bankRate = (bank - o.bank) / Math.max(dt, 1e-3); o.bank = bank;
    _u.copy(UP).applyAxisAngle(_f, -bank);
    _m.lookAt(o.pos, _t.copy(o.pos).add(_f), _u); o.quat.setFromRotationMatrix(_m);
    // piezas: alerones según cuánto cambia la inclinación, elevador según la subida, timón suave, turbo y frenos a ratos
    const pitch = _f.y, pitchRate = (pitch - o.pitchPrev) / Math.max(dt, 1e-3); o.pitchPrev = pitch;
    const ciclo = (t * 0.25 + o.ph2) % 6;
    if (st.piezas) {
      o.anim[0] = T.MathUtils.clamp(bankRate * 1.6, -1, 1);
      o.anim[1] = T.MathUtils.clamp(Math.sin(t * 0.8 + o.ph2) * 0.6, -1, 1);
      o.anim[2] = T.MathUtils.clamp(-pitchRate * 6 + Math.sin(t * 1.3 + o.ph2) * 0.3, -1, 1);
      o.anim[3] = ciclo > 5 ? Math.sin((ciclo - 5) * Math.PI) : 0;
      o.anim[4] = ciclo > 1 && ciclo < 2.6 ? 1 : 0.15;
      o.anim[5] = ciclo > 3 && ciclo < 4 ? Math.sin((ciclo - 3) * Math.PI) : 0;
      o.anim[6] = 0;
    } else o.anim.fill(0);
    if (st.forzar) for (let i = 0; i < 7; i++) o.anim[i] = st.forzar[i];
  }
}

/* ---------- Disparos y llamas (una llamada de dibujo cada uno) ---------- */
const BOLTS = 160;
const boltMesh = new T.InstancedMesh(new T.BoxGeometry(0.3, 0.3, 8), new T.MeshBasicMaterial({ color: 0xb4fff4, blending: T.AdditiveBlending, transparent: true, depthWrite: false, fog: false }), BOLTS);
boltMesh.frustumCulled = false; scene.add(boltMesh);
const bolts = Array.from({ length: BOLTS }, () => ({ p: new T.Vector3(), v: new T.Vector3(), life: 0 }));
let boltI = 0;
function disparar(t, dt) {
  for (const o of naves) if (Math.random() < dt * 2.2) {
    const b = bolts[boltI++ % BOLTS]; b.p.copy(o.pos); b.v.set(0, 0, -430).applyQuaternion(o.quat); b.life = 1.1;
  }
  let k = 0;
  for (const b of bolts) {
    if (b.life <= 0) continue;
    b.life -= dt; b.p.addScaledVector(b.v, dt);
    _m.lookAt(b.p, _t.copy(b.p).add(b.v), UP); _q.setFromRotationMatrix(_m);
    _m.compose(b.p, _q, _a.set(1, 1, 1)); boltMesh.setMatrixAt(k++, _m);
  }
  boltMesh.count = k; boltMesh.instanceMatrix.needsUpdate = true;
}
const glow = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(127,240,225,.8)'); gr.addColorStop(1, 'rgba(127,240,225,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c);
})();
const FMAX = 40 * 4;
const fGeo = new T.BufferGeometry(); fGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(FMAX * 3), 3).setUsage(T.DynamicDrawUsage));
const llamas = new T.Points(fGeo, new T.PointsMaterial({ map: glow, color: 0x7ff0e1, size: 2.4, sizeAttenuation: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
llamas.frustumCulled = false; scene.add(llamas);
function actualizarLlamas() {
  const arr = fGeo.attributes.position.array; let k = 0;
  for (const o of naves) {
    if (o.lod > 1 || k >= FMAX) continue;
    for (const m of flota.dis[o.id].puntos.motores) {
      if (k >= FMAX) break;
      _t.set(m[0], m[1], m[2] + 0.2).applyQuaternion(o.quat).add(o.pos);
      arr[k * 3] = _t.x; arr[k * 3 + 1] = _t.y; arr[k * 3 + 2] = _t.z; k++;
    }
  }
  fGeo.setDrawRange(0, k); fGeo.attributes.position.needsUpdate = true;
}

/* ---------- Cámara de persecución, como en el juego (con la escala nueva) ---------- */
const _cf = new T.Vector3(), _cu = new T.Vector3();
function camara(t) {
  const o = naves[0], k = ESCALA_CLASE[DISENOS[o.id].clase] * 0.9;
  if (st.camara === 'cerca') {
    const a = t * 0.35;
    camera.up.set(0, 1, 0);
    camera.position.copy(o.pos).add(_cf.set(Math.cos(a) * 9 * k, 2.6 * k, Math.sin(a) * 9 * k).applyQuaternion(o.quat));
    camera.lookAt(o.pos);
  } else {
    _cf.set(0, 0, -1).applyQuaternion(o.quat); _cu.set(0, 1, 0).applyQuaternion(o.quat).lerp(UP, 0.6).normalize();
    camera.position.copy(o.pos).addScaledVector(_cf, -11.5 * k).addScaledVector(_cu, 5.2 * k);
    camera.up.copy(_cu);
    camera.lookAt(_t.copy(o.pos).addScaledVector(_cf, 20).addScaledVector(_cu, -3.2 * k));
  }
  camera.updateMatrixWorld();
}

/* ---------- Medición ---------- */
const ventana = []; let ventanaT = 0;
function medir(dtMs, info) {
  ventana.push(dtMs); ventanaT += dtMs;
  while (ventanaT > 1000 && ventana.length > 1) ventanaT -= ventana.shift();
  if (st.prueba && !document.hidden) {
    const P = st.prueba;
    if (P.calentar > 0) { P.calentar -= dtMs; }
    else { P.frames.push(dtMs); P.calls += info.calls; P.tris += info.triangles; P.t += dtMs; }
  }
}
let hudT = 0;
function hud(dtMs, info) {
  hudT += dtMs; if (hudT < 250) return; hudT = 0;
  const fps = ventana.length / (ventanaT / 1000);
  $('fps').textContent = fps.toFixed(0);
  $('ms').textContent = (ventanaT / ventana.length).toFixed(1);
  $('calls').textContent = info.calls;
  $('tris').textContent = info.triangles.toLocaleString('es-UY');
  $('niveles').textContent = st.forma === 'nueva' ? flota.porNivel.slice(0, 4).join('·') : 'todas completas';
  const b = renderer.getDrawingBufferSize(new T.Vector2());
  $('res-px').textContent = b.x + '×' + b.y;
  if (st.prueba) {
    const P = st.prueba, falta = Math.max(0, P.dur - P.t) / 1000;
    $('estado').textContent = P.calentar > 0 ? 'Prueba: preparando…' : `Prueba: faltan ${Math.floor(falta / 60)}:${String(Math.floor(falta % 60)).padStart(2, '0')}`;
    if (P.t >= P.dur) terminarPrueba();
  }
}
function gpu() {
  try { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch (e) { return '?'; }
}
function empezarPrueba(min) {
  st.prueba = { dur: min * 60000, calentar: 3000, frames: [], calls: 0, tris: 0, t: 0, min };
  document.querySelectorAll('#ui button:not(#ocultar)').forEach(b => { if (!b.dataset.prueba) b.disabled = true; });
  marcar();
}
function terminarPrueba(cancelada) {
  const P = st.prueba; st.prueba = null;
  document.querySelectorAll('#ui button').forEach(b => { b.disabled = false; });
  $('estado').textContent = '';
  marcar();
  if (cancelada || !P.frames.length) return;
  const f = [...P.frames].sort((a, b) => a - b), n = f.length;
  const prom = n / (P.t / 1000), p99 = f[Math.min(n - 1, Math.floor(n * 0.99))], peor = f[n - 1];
  const bajo1 = 1000 / p99, buf = renderer.getDrawingBufferSize(new T.Vector2());
  const tri = flota.resumen();
  const pasa = prom >= 58 && bajo1 >= 45;
  const txt = [
    `Delta Uno · prueba de rendimiento de naves`,
    `Fecha: ${new Date().toLocaleString('es-UY')}`,
    `Duración: ${P.min} min (sin contar 3 s de arranque)`,
    `Forma: ${st.forma === 'nueva' ? 'nueva (instancias + piezas en la placa de video + niveles de detalle)' : 'vieja (un objeto por pieza)'}`,
    `Naves: ${naves.length} · Calidad: ${CALIDAD[st.calidad].nombre} · Piezas: ${st.piezas ? 'se mueven' : 'quietas'}`,
    `Cuadros por segundo: promedio ${prom.toFixed(1)} · 1 % más lento ${bajo1.toFixed(1)} · peor cuadro ${peor.toFixed(1)} ms`,
    `ms por cuadro: promedio ${(P.t / n).toFixed(2)} · 99 % por debajo de ${p99.toFixed(2)}`,
    `Llamadas de dibujo (promedio): ${(P.calls / n).toFixed(0)} · Triángulos (promedio): ${Math.round(P.tris / n).toLocaleString('es-UY')}`,
    `Resolución de dibujo: ${buf.x}×${buf.y} (densidad ${renderer.getPixelRatio()})`,
    `Placa de video: ${gpu()}`,
    `Armado de las mallas al cargar: ${flota.msArmado.toFixed(0)} ms`,
    `Triángulos por diseño y nivel 0/1/2: ${Object.entries(tri).map(([k, v]) => k + ' ' + v.join('/')).join(' · ')}`,
    `Navegador: ${navigator.userAgent}`
  ].join('\n');
  $('veredicto').textContent = pasa ? `Pasa: ${prom.toFixed(0)} cuadros por segundo de promedio y ${bajo1.toFixed(0)} en el 1 % más lento.`
    : `No pasa todavía: ${prom.toFixed(0)} de promedio y ${bajo1.toFixed(0)} en el 1 % más lento (hace falta 58 y 45).`;
  $('veredicto').className = pasa ? 'ok' : 'bad';
  $('res-txt').value = txt;
  $('res').classList.add('on'); $('copiar').focus();
}

/* ---------- Controles ---------- */
function grupo(id, key, items, alCambiar) {
  const g = $(id);
  for (const [v, name] of items) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = name; b.dataset.k = key; b.dataset.v = String(v);
    b.addEventListener('click', () => { st[key] = v; marcar(); alCambiar(v); });
    g.appendChild(b);
  }
}
function marcar() {
  document.querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', String(String(st[b.dataset.k]) === b.dataset.v)));
  document.querySelectorAll('[data-prueba]').forEach(b => {
    const on = st.prueba && String(st.prueba.min) === b.dataset.prueba;
    b.setAttribute('aria-pressed', String(!!on)); b.textContent = on ? 'Cancelar' : b.dataset.prueba + ' min';
  });
}
grupo('g-forma', 'forma', [['nueva', 'Nueva'], ['vieja', 'Vieja']], aplicarForma);
grupo('g-naves', 'naves', [[10, '10'], [25, '25'], [40, '40']], n => armarNaves(n));
grupo('g-calidad', 'calidad', [['baja', 'Baja'], ['media', 'Media'], ['alta', 'Alta']], crearRenderer);
grupo('g-piezas', 'piezas', [[true, 'Se mueven'], [false, 'Quietas']], () => {});
grupo('g-camara', 'camara', [['persecucion', 'Detrás'], ['cerca', 'Cerca']], () => {});
for (const min of [3, 10]) {
  const b = document.createElement('button'); b.type = 'button'; b.dataset.prueba = String(min); b.textContent = min + ' min';
  b.addEventListener('click', () => { if (st.prueba) terminarPrueba(true); else empezarPrueba(min); });
  $('g-prueba').appendChild(b);
}
$('ocultar').addEventListener('click', () => { st.limpio = !st.limpio; document.body.classList.toggle('limpio', st.limpio); $('ocultar').setAttribute('aria-pressed', String(st.limpio)); $('ocultar').textContent = st.limpio ? 'Mostrar controles' : 'Ver solo la escena'; });
$('cerrar').addEventListener('click', () => $('res').classList.remove('on'));
$('copiar').addEventListener('click', async () => {
  const ta = $('res-txt');
  try { await navigator.clipboard.writeText(ta.value); $('copiar').textContent = 'Copiado'; }
  catch (e) { ta.focus(); ta.select(); document.execCommand && document.execCommand('copy'); $('copiar').textContent = 'Seleccionado: copialo'; }
  setTimeout(() => { $('copiar').textContent = 'Copiar resultado'; }, 2500);
});
addEventListener('keydown', e => { if (e.key === 'Escape') $('res').classList.remove('on'); });

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, CALIDAD[st.calidad].pr));
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', () => renderer && resize());

/* ---------- Bucle ---------- */
armarNaves(st.naves);
crearRenderer();
marcar();
let last = performance.now(), t = 0;
function loop(now) {
  const dtMs = Math.min(100, now - last); last = now;
  const dt = dtMs / 1000; t += dt;
  volar(t, dt);
  camara(t);
  if (st.forma === 'nueva') flota.actualizar(naves, camera); else vieja.actualizar(naves);
  disparar(t, dt);
  actualizarLlamas();
  renderer.render(scene, camera);
  const info = renderer.info.render;
  medir(dtMs, info); hud(dtMs, info);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.__rendimiento = { st, naves: () => naves, flota: () => flota, empezarPrueba, terminarPrueba };
