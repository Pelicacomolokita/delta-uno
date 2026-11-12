// Hangar: para mirar y aprobar las naves antes de meterlas al juego.
// "Nuevas": naves por piezas (src/naves/), con el mismo material y las mismas piezas móviles que van a usar en el juego.
// "Actuales": las de src/nave.js, como estaban.
import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NAVES, PALETAS, naveGeometria, naveMaterial, naveTextura } from '../../src/nave.js';
import { Flota } from '../../src/naves/flota.js';
import { DISENOS, PINTURAS } from '../../src/naves/disenos.js';
import { CANAL } from '../../src/naves/generador.js';

const $ = id => document.getElementById(id);
const canvas = $('view');
const renderer = new T.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const scene = new T.Scene();
scene.background = new T.Color(0x0a1022);
scene.fog = new T.Fog(0x0a1022, 30, 90);
const camera = new T.PerspectiveCamera(40, 1, 0.1, 400);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.minDistance = 3; controls.maxDistance = 70;
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
controls.autoRotate = !quieto; controls.autoRotateSpeed = 1.2;
canvas.addEventListener('pointerdown', () => { controls.autoRotate = false; });

// la misma luz que el juego: cielo y suelo, más el sol
scene.add(new T.HemisphereLight(0xa8c8ff, 0xb08a66, 0.72));
const sun = new T.DirectionalLight(0xfff0d8, 0.95); sun.position.set(4, 7, 3); scene.add(sun);
// piso con grilla, como un hangar (1 m por cuadro)
const grid = new T.GridHelper(80, 80, 0x2b3a5c, 0x1a2440); scene.add(grid);
const shadow = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }));
shadow.rotation.x = -Math.PI / 2; scene.add(shadow);

const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c);
})();
const sprite = color => new T.Sprite(new T.SpriteMaterial({ map: glowTex, color, blending: T.AdditiveBlending, transparent: true, depthWrite: false }));

/* ---------- Estado ---------- */
const IDS = Object.keys(DISENOS);
const CANALES = [
  ['aleron', 'Alerones', -1, 1], ['timon', 'Timones', -1, 1], ['elevador', 'Elevadores', -1, 1], ['freno', 'Frenos de aire', 0, 1],
  ['tobera', 'Toberas (turbo)', 0, 1], ['compuertas', 'Compuertas', 0, 1], ['camuflaje', 'Camuflaje', 0, 1]
];
const MARCAS = [['ninguna', 'Sin marca', null], ['amarilla', 'Marca amarilla', [0.95, 0.85, 0.25]], ['celeste', 'Marca celeste', [0.35, 0.8, 1]], ['naranja', 'Marca naranja', [1, 0.45, 0.3]]];
const state = {
  sistema: 'nuevas', diseno: 'A', pintura: 'guardia', marca: 'ninguna', modelo: 'guardia', paleta: 'guardia',
  vista: 'tres', lod: 0, animar: !quieto, anim: [0, 0, 0, 0, 0, 0, 0]
};

/* ---------- Naves nuevas ---------- */
const flota = new Flota(scene, IDS, { max: 8, detalleTex: (() => { const t = naveTextura(T); t.wrapS = t.wrapT = T.RepeatWrapping; t.needsUpdate = true; return t; })() });
const medidas = {};
for (const id of IDS) {
  const g = flota.dis[id].lods[0].mesh.geometry; g.computeBoundingBox();
  const b = g.boundingBox, canales = new Set(), bis = g.attributes.aBis.array;
  for (let i = 3; i < bis.length; i += 4) if (bis[i] >= 0) canales.add(bis[i]);
  medidas[id] = { box: b.clone(), largo: b.max.z - b.min.z, ancho: b.max.x - b.min.x, alto: b.max.y - b.min.y, canales };
}
const naves = [];
const efectos = new T.Group(); scene.add(efectos);
function armarNaves() {
  naves.length = 0;
  efectos.clear();
  $('etiquetas').replaceChildren();
  const ids = state.vista === 'fila' ? IDS : [state.diseno];
  const sep = Math.max(...ids.map(id => medidas[id].ancho)) + 2.5;
  ids.forEach((id, i) => {
    const pos = new T.Vector3((i - (ids.length - 1) / 2) * sep, 0, 0);
    const D = DISENOS[id], pint = ids.length > 1 ? D.pintura : state.pintura;
    const n = { id, pos, quat: new T.Quaternion(), anim: state.anim, pintura: PINTURAS[pint] ? pint : D.pintura, marca: MARCAS.find(m => m[0] === state.marca)[2], lodFijo: state.lod, base: pos.clone() };
    // llamas en las toberas y luces de navegación
    const P = flota.dis[id].puntos;
    n.llamas = P.motores.map(m => { const s = sprite(0x7ff0e1); s.position.set(m[0], m[1], m[2] + 0.15).add(pos); efectos.add(s); return s; });
    n.luces = P.luces.map(l => { const s = sprite(l.color); s.position.set(...l.p).add(pos); s.scale.setScalar(0.35); s.userData.cola = l.cola; efectos.add(s); return s; });
    if (ids.length > 1) {
      const e = document.createElement('div'); e.className = 'etq'; e.textContent = `${id} · ${medidas[id].largo.toFixed(1).replace('.', ',')} m`; e.title = D.nombre;
      $('etiquetas').appendChild(e); n.etq = e;
    }
    naves.push(n);
  });
  // piso y sombra justo debajo de la nave más baja
  const bajo = Math.min(...ids.map(id => medidas[id].box.min.y));
  grid.position.y = bajo - 0.35; shadow.position.y = bajo - 0.34;
  shadow.scale.setScalar(Math.max(...ids.map(id => Math.max(medidas[id].ancho, medidas[id].largo))) * 0.55 * (ids.length > 1 ? ids.length : 1));
}

/* ---------- Naves actuales (src/nave.js) ---------- */
const vieja = new T.Group(); scene.add(vieja);
let viejaMesh = null;
function armarVieja() {
  if (viejaMesh) { vieja.remove(viejaMesh); viejaMesh.geometry.dispose(); }
  vieja.clear();
  viejaMesh = new T.Mesh(naveGeometria(T, state.modelo, state.paleta), naveMaterial(T)); vieja.add(viejaMesh);
  for (const e of NAVES[state.modelo].engines) { const s = sprite(0x7ff0e1); s.position.set(e[0], e[1], e[2] + 0.12); s.scale.setScalar(0.9); vieja.add(s); }
  grid.position.y = -0.9; shadow.position.y = -0.89; shadow.scale.setScalar(2.6);
}

/* ---------- Pantalla ---------- */
const fmt = v => v.toFixed(1).replace('.', ',');
function info() {
  if (state.sistema === 'actuales') { $('info').innerHTML = `<b>${NAVES[state.modelo].nombre}</b><span class="k">Nave actual del juego</span>`; $('desc').textContent = NAVES[state.modelo].nombre + ': ' + NAVES[state.modelo].desc; return; }
  const D = DISENOS[state.diseno], M = medidas[state.diseno], tri = flota.resumen()[state.diseno];
  $('info').innerHTML = `<b>${state.diseno} · ${D.nombre}</b>` +
    `<div><span class="k">Clase</span> ${{ caza: 'Caza', interceptor: 'Interceptor', ataque: 'Ataque pesado', infiltracion: 'Infiltración' }[D.clase]} · ${{ guardia: 'Guardia', directorio: 'Directorio', desligados: 'Desligados' }[D.bando]}</div>` +
    `<div><span class="k">Escala</span> ×${String(flota.dis[state.diseno].dis.escala).replace('.', ',')}</div>` +
    `<div><span class="k">Largo × ancho × alto</span> ${fmt(M.largo)} × ${fmt(M.ancho)} × ${fmt(M.alto)} m</div>` +
    `<div><span class="k">Triángulos 0/1/2</span> ${tri.join(' / ')}</div>`;
  $('desc').textContent = `Planos: lienzo "Delta Uno · Planos de naves". Las medidas ya llevan la escala de la clase.`;
}
function marcar() {
  document.querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', String(String(state[b.dataset.k]) === b.dataset.v)));
  const nuevas = state.sistema === 'nuevas';
  for (const id of ['marcas', 'lods']) $(id).hidden = !nuevas;
  $('tab-piezas').hidden = !nuevas;
  if (!nuevas && $('tab-piezas').getAttribute('aria-selected') === 'true') tab('nave');
  document.querySelectorAll('#views [data-v="fila"], #views [data-v="planta"], #views [data-v="perfil"], #views [data-v="trasera"]').forEach(b => { b.hidden = !nuevas; });
}
function fila(id, k, items, alCambiar, extra = {}) {
  const row = $(id); row.querySelectorAll('button').forEach(b => b.remove());
  for (const [v, name, color] of items) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.dataset.v = String(v);
    if (extra.swatch) { b.className = 'swatch'; b.setAttribute('aria-label', name); b.title = name; const s = document.createElement('span'); s.style.background = color; b.appendChild(s); }
    else b.textContent = name;
    b.addEventListener('click', () => { state[k] = v; alCambiar(v); marcar(); });
    row.appendChild(b);
  }
}
function filasNave() {
  if (state.sistema === 'nuevas') {
    fila('models', 'diseno', IDS.map(id => [id, `${id} · ${DISENOS[id].nombre}`]), id => { state.pintura = DISENOS[id].pintura; if (state.vista === 'fila') state.vista = 'tres'; filasNave(); rehacer(); });
    const D = DISENOS[state.diseno], ps = [...new Set([...(D.pinturas || [D.pintura]), 'clasica'])];
    fila('palettes', 'pintura', ps.map(p => [p, PINTURAS[p].nombre]), rehacer);
    fila('marcas', 'marca', MARCAS.map(([v, n, c]) => [v, n, c ? `rgb(${c.map(x => Math.round(x * 255)).join(',')})` : 'transparent']), rehacer, { swatch: true });
  } else {
    fila('models', 'modelo', Object.entries(NAVES).map(([k, n]) => [k, n.nombre]), rehacer);
    fila('palettes', 'paleta', Object.entries(PALETAS).map(([k, p]) => [k, p.nombre]), rehacer);
  }
  marcar();
}
function sliders() {
  const box = $('sliders'); box.replaceChildren();
  const M = medidas[state.diseno];
  CANALES.forEach(([key, nombre, lo, hi], i) => {
    if (!M.canales.has(CANAL[key])) return;
    const l = document.createElement('label'); const id = 'sl-' + key;
    l.htmlFor = id; l.innerHTML = `<span>${nombre}</span><input type="range" id="${id}" min="${lo}" max="${hi}" step="0.01" value="${state.anim[i]}"><output>${state.anim[i].toFixed(2)}</output>`;
    const inp = l.querySelector('input'), out = l.querySelector('output');
    inp.addEventListener('input', () => { state.animar = false; marcar(); state.anim[i] = +inp.value; out.textContent = (+inp.value).toFixed(2); });
    box.appendChild(l);
  });
}
function sincronizarSliders() {
  CANALES.forEach(([key], i) => { const inp = $('sl-' + key); if (inp) { inp.value = state.anim[i]; inp.nextElementSibling.textContent = state.anim[i].toFixed(2); } });
}
function rehacer() {
  const nuevas = state.sistema === 'nuevas';
  flota.setVisible(nuevas); efectos.visible = nuevas; vieja.visible = !nuevas;
  if (nuevas) { armarNaves(); sliders(); } else { armarVieja(); $('etiquetas').replaceChildren(); }
  info(); ponerVista(state.vista);
}

/* ---------- Vistas ---------- */
function ponerVista(v) {
  state.vista = v;
  const nuevas = state.sistema === 'nuevas';
  const ids = v === 'fila' ? IDS : [state.diseno];
  const M = nuevas ? medidas[state.diseno] : { largo: 4.6, ancho: 4.8, alto: 1.1 };
  const R = nuevas ? Math.max(...ids.map(id => Math.hypot(medidas[id].largo, medidas[id].ancho))) / 2 : 3.3;
  const plano = v === 'planta' || v === 'perfil' || v === 'trasera';
  // las vistas de plano usan un lente muy cerrado desde lejos: casi sin perspectiva, como en las láminas
  camera.fov = plano ? 6 : (innerWidth < innerHeight ? 55 : 40);
  const d = plano ? (R * 1.25) / Math.tan(T.MathUtils.degToRad(camera.fov / 2)) : R * 3.2;
  camera.up.set(0, 1, 0); controls.target.set(0, 0, 0);
  controls.enableRotate = !plano; controls.autoRotate = v === 'tres' && !quieto;
  if (v === 'tres') camera.position.set(d * 0.62, d * 0.4, d * 0.72);
  if (v === 'planta') { camera.position.set(0, d, 0); camera.up.set(0, 0, -1); }
  if (v === 'perfil') camera.position.set(-d, 0, 0);
  if (v === 'trasera') camera.position.set(0, 0.2, d);
  if (v === 'juego') { const k = nuevas ? flota.dis[state.diseno].dis.escala * 0.9 : 1; camera.position.set(0, 5.2 * k, 11.5 * k); controls.target.set(0, 0, -20 * 0.2); }
  if (v === 'fila') { const w = ids.length * (Math.max(...ids.map(id => medidas[id].ancho)) + 2.5); camera.position.set(0, w * 0.32, w * 1.05); }
  controls.minDistance = plano ? d * 0.4 : 3; controls.maxDistance = plano ? d * 1.6 : 70;
  const lejos = camera.position.distanceTo(controls.target);
  scene.fog.near = lejos + R * 2; scene.fog.far = lejos + R * 2 + 60;
  camera.far = lejos * 3 + 200;
  camera.updateProjectionMatrix(); if (camera.view) camera.view.enabled = true; controls.update();
  if (nuevas && (v === 'fila') !== (naves.length > 1)) armarNaves();
  marcar();
}

/* ---------- Controles ---------- */
function tab(nombre) {
  for (const t of ['nave', 'piezas', 'vista']) { $('tab-' + t).setAttribute('aria-selected', String(t === nombre)); $('p-' + t).hidden = t !== nombre; }
}
for (const t of ['nave', 'piezas', 'vista']) $('tab-' + t).addEventListener('click', () => tab(t));
fila('sistema', 'sistema', [['nuevas', 'Nuevas (por piezas)'], ['actuales', 'Actuales']], () => { if (state.sistema === 'actuales' && state.vista === 'fila') state.vista = 'tres'; filasNave(); rehacer(); });
fila('views', 'vista', [['tres', 'Tres cuartos'], ['planta', 'Planta'], ['perfil', 'Perfil'], ['trasera', 'De atrás'], ['juego', 'Como en el juego'], ['fila', 'Todas a escala']], ponerVista);
fila('lods', 'lod', [[0, 'Completa'], [1, 'Media'], [2, 'Silueta']], () => { for (const n of naves) n.lodFijo = state.lod; });
fila('acciones', 'animar', [[true, 'Animar'], [false, 'Quieta']], v => { if (!v) { state.anim.fill(0); sincronizarSliders(); } });
filasNave();
rehacer();
window.__hangar = { state, rehacer, ponerVista, camera, controls, flota, naves, medidas };

function encuadre() {
  const w = innerWidth, h = innerHeight, r = $('ui').getBoundingClientRect();
  const costado = r.height >= h - 2 && r.width < w * 0.6; // columna a la izquierda
  const dx = costado ? -r.width / 2 : 0, dy = costado ? 0 : Math.min(r.height, h * 0.6) / 2 - 20;
  camera.setViewOffset(w, h, dx, dy, w, h);
  camera.updateProjectionMatrix();
}
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; ponerVista(state.vista); encuadre();
}
addEventListener('resize', resize); resize();
new ResizeObserver(encuadre).observe($('ui'));

/* ---------- Bucle ---------- */
let t = 0;
const _v = new T.Vector3();
renderer.setAnimationLoop(() => {
  t += 0.016;
  if (state.sistema === 'nuevas') {
    if (state.animar) {
      // una demostración que pasa por todas las piezas
      const a = state.anim;
      a[0] = Math.sin(t * 1.1); a[1] = Math.sin(t * 0.7 + 1); a[2] = Math.sin(t * 0.9 + 2);
      a[3] = Math.max(0, Math.sin(t * 0.5)); a[4] = Math.max(0, Math.sin(t * 0.6 + 2)); a[5] = Math.max(0, Math.sin(t * 0.4 + 4)); a[6] = Math.max(0, Math.sin(t * 0.3 + 1));
      if (Math.floor(t * 10) % 3 === 0) sincronizarSliders();
    }
    const flot = state.vista === 'tres' || state.vista === 'juego' ? Math.sin(t * 1.3) * 0.06 : 0;
    for (const n of naves) {
      n.pos.copy(n.base); n.pos.y += flot;
      const turbo = state.anim[4];
      n.llamas.forEach((s, i) => { s.visible = turbo > 0.02 || true; s.scale.setScalar((0.5 + turbo * 0.9) * (1 + Math.sin(t * 30 + i) * 0.06)); s.material.opacity = 0.45 + turbo * 0.55; });
      // luces de navegación: fijas en las alas, la de la cola titila
      n.luces.forEach(s => { s.material.opacity = s.userData.cola ? (Math.sin(t * 6) > 0.6 ? 1 : 0.15) : 0.9; });
      if (n.etq) {
        _v.copy(n.pos); _v.y = medidas[n.id].box.min.y - 0.3; _v.project(camera);
        n.etq.style.left = ((_v.x + 1) / 2 * innerWidth) + 'px'; n.etq.style.top = ((1 - _v.y) / 2 * innerHeight + 8) + 'px';
      }
    }
    efectos.position.y = flot;
    flota.actualizar(naves, camera);
  } else {
    vieja.position.y = Math.sin(t * 1.3) * 0.06;
  }
  controls.update();
  renderer.render(scene, camera);
});
