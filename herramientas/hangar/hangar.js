// Hangar: para mirar y aprobar las naves antes de meterlas al juego.
// "Nuevas": naves por piezas (src/naves/), con el mismo material, las mismas piezas móviles y los mismos mandos
// (src/naves/mandos.js) que van a usar en el juego. "Actuales": las de src/nave.js, como estaban.
import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NAVES, PALETAS, naveGeometria, naveMaterial, naveTextura } from '../../src/nave.js';
import { Flota } from '../../src/naves/flota.js';
import { DISENOS, PINTURAS, BANDOS } from '../../src/naves/disenos.js';
import { CANAL } from '../../src/naves/generador.js';
import { crearMandos, actualizarMandos, MANIOBRAS } from '../../src/naves/mandos.js';

const $ = id => document.getElementById(id);
const canvas = $('view');
const renderer = new T.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const scene = new T.Scene();
const FONDO = new T.Color(0x0a1022), CIELO = new T.Color(0xb3c9e0);
scene.background = FONDO.clone();
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
const LECTURAS = [['aleron', 'Alerón', 0.42], ['elevador', 'Elevador', 0.4], ['timon', 'Timón', 0.45], ['tobera', 'Tobera', 0], ['freno', 'Freno', 0.95]];
const state = {
  sistema: 'nuevas', diseno: 'A', pintura: 'guardia', modelo: 'guardia', paleta: 'guardia',
  vista: 'tres', lod: 0, auto: !quieto, maniobra: null
};
const mandos = crearMandos();
let maniobraT = 0, autoI = 0;
const actitud = new T.Vector3(); // alabeo, cabeceo, guiñada que muestra la nave en el hangar

/* ---------- Naves nuevas ---------- */
const flota = new Flota(scene, IDS, { max: 8, detalleTex: (() => { const t = naveTextura(T); t.wrapS = t.wrapT = T.RepeatWrapping; t.needsUpdate = true; return t; })() });
const medidas = {};
for (const id of IDS) {
  const g = flota.dis[id].lods[0].mesh.geometry; g.computeBoundingBox();
  const b = g.boundingBox, canales = new Set(), bis = g.attributes.aBis.array;
  for (let i = 3; i < bis.length; i += 4) if (bis[i] >= 0) canales.add(bis[i]);
  medidas[id] = { box: b.clone(), largo: b.max.z - b.min.z, ancho: b.max.x - b.min.x, alto: b.max.y - b.min.y, canales };
}
const tiene = (id, k) => medidas[id].canales.has(CANAL[k]);
const naves = [];
const efectos = new T.Group(); scene.add(efectos);
// "De lejos": dos naves de cada bando; la última es un R1 capturado por los Desligados (lleva su marca)
const LEJOS = [['A', 'guardia', 'guardia'], ['A', 'guardia', 'guardiaNoche'], ['R1', 'directorio', 'directorio'], ['R1', 'directorio', 'directorio'], ['X1', 'desligados', 'desligados'], ['R1', 'desligados', 'capturada']];
function armarNaves() {
  naves.length = 0;
  efectos.clear();
  $('etiquetas').replaceChildren();
  let lista;
  if (state.vista === 'fila') lista = IDS.map(id => ({ id, x: 0, z: 0, pintura: DISENOS[id].pintura }));
  else if (state.vista === 'lejos') lista = LEJOS.map(([id, bando, pintura], i) => ({ id, bando, pintura, nombre: BANDOS[bando].nombre + (pintura === 'capturada' ? ' (capturada)' : ''), x: (i - 2.5) * 30, z: -90 - i * 45 }));
  else lista = [{ id: state.diseno, x: 0, z: 0, pintura: state.pintura }];
  const sep = state.vista === 'fila' ? Math.max(...IDS.map(id => medidas[id].ancho)) + 2.5 : 0;
  lista.forEach((it, i) => {
    const pos = state.vista === 'fila' ? new T.Vector3((i - (lista.length - 1) / 2) * sep, 0, 0) : new T.Vector3(it.x, state.vista === 'lejos' ? 25 + i * 6 : 0, it.z);
    const D = DISENOS[it.id];
    const n = { id: it.id, pos, quat: new T.Quaternion(), anim: mandos.anim, pintura: PINTURAS[it.pintura] ? it.pintura : D.pintura, bando: it.bando || D.bando,
      lodFijo: state.vista === 'lejos' ? undefined : state.lod, base: pos.clone(), lod: 0 };
    const P = flota.dis[it.id].puntos;
    n.grupo = new T.Group(); n.grupo.position.copy(pos); efectos.add(n.grupo);
    n.llamas = P.motores.map(m => { const s = sprite(0x7ff0e1); s.position.set(m[0], m[1], m[2] + 0.15); n.grupo.add(s); return s; });
    n.luces = P.luces.map(l => { const s = sprite(l.color); s.position.set(...l.p); s.scale.setScalar(0.35); s.userData.cola = l.cola; n.grupo.add(s); return s; });
    if (state.vista === 'fila' || state.vista === 'lejos') {
      const e = document.createElement('div'); e.className = 'etq';
      e.textContent = state.vista === 'fila' ? `${it.id} · ${medidas[it.id].largo.toFixed(1).replace('.', ',')} m` : `${it.nombre} · ${Math.round(Math.hypot(pos.x, pos.y - 20, pos.z - 60))} m`;
      $('etiquetas').appendChild(e); n.etq = e;
    }
    naves.push(n);
  });
  const ids = lista.map(i => i.id);
  const bajo = Math.min(...ids.map(id => medidas[id].box.min.y));
  grid.position.y = bajo - 0.35; shadow.position.y = bajo - 0.34;
  shadow.scale.setScalar(Math.max(...ids.map(id => Math.max(medidas[id].ancho, medidas[id].largo))) * 0.55 * (state.vista === 'fila' ? ids.length : 1));
  const lejos = state.vista === 'lejos';
  grid.visible = shadow.visible = !lejos;
  scene.background.copy(lejos ? CIELO : FONDO);
}

/* ---------- Naves actuales (src/nave.js) ---------- */
const vieja = new T.Group(); scene.add(vieja);
let viejaMesh = null;
function armarVieja() {
  if (viejaMesh) { vieja.remove(viejaMesh); viejaMesh.geometry.dispose(); }
  vieja.clear();
  viejaMesh = new T.Mesh(naveGeometria(T, state.modelo, state.paleta), naveMaterial(T)); vieja.add(viejaMesh);
  for (const e of NAVES[state.modelo].engines) { const s = sprite(0x7ff0e1); s.position.set(e[0], e[1], e[2] + 0.12); s.scale.setScalar(0.9); vieja.add(s); }
  grid.position.y = -0.9; shadow.position.y = -0.89; shadow.scale.setScalar(2.6); grid.visible = shadow.visible = true;
  scene.background.copy(FONDO);
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
  $('desc').textContent = state.vista === 'lejos'
    ? 'De lejos: dos naves de cada bando entre 100 y 330 m, con el cielo y la niebla del juego. Desde los 80 m llevan la baliza de su bando: Guardia círculo cian, Directorio cuadrado ámbar, Desligados rombo magenta. La última es un R1 capturado por los Desligados.'
    : 'Planos: lienzo "Delta Uno · Planos de naves". Las medidas ya llevan la escala de la clase.';
}
function marcar() {
  document.querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', String(String(state[b.dataset.k]) === b.dataset.v)));
  document.querySelectorAll('[data-man]').forEach(b => b.setAttribute('aria-pressed', String(state.maniobra === b.dataset.man)));
  document.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', String(!!mandos[b.dataset.t])));
  const nuevas = state.sistema === 'nuevas';
  $('lods').hidden = !nuevas;
  $('tab-piezas').hidden = !nuevas;
  if (!nuevas && $('tab-piezas').getAttribute('aria-selected') === 'true') tab('nave');
  document.querySelectorAll('#views [data-v="fila"], #views [data-v="planta"], #views [data-v="perfil"], #views [data-v="trasera"], #views [data-v="lejos"]').forEach(b => { b.hidden = !nuevas; });
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
  } else {
    fila('models', 'modelo', Object.entries(NAVES).map(([k, n]) => [k, n.nombre]), rehacer);
    fila('palettes', 'paleta', Object.entries(PALETAS).map(([k, p]) => [k, p.nombre]), rehacer);
  }
  marcar();
}

/* ---------- Simulador de mandos (pestaña Piezas) ---------- */
function simulador() {
  const id = state.diseno;
  // botones de lo que la nave tiene
  const tg = $('toggles'); tg.querySelectorAll('button').forEach(b => b.remove());
  for (const [k, n, canal] of [['turbo', 'Turbo', 'tobera'], ['freno', 'Freno de aire', 'freno'], ['compuertas', 'Bodega', 'compuertas'], ['camuflaje', 'Camuflaje', 'camuflaje']]) {
    if (!tiene(id, canal)) continue;
    const b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.dataset.t = k;
    b.addEventListener('click', () => { pararAuto(); mandos[k] = !mandos[k]; marcar(); });
    tg.appendChild(b);
  }
  const mr = $('maniobras'); mr.querySelectorAll('button').forEach(b => b.remove());
  const auto = document.createElement('button'); auto.type = 'button'; auto.textContent = 'Piloto automático'; auto.dataset.k = 'auto'; auto.dataset.v = 'true';
  auto.addEventListener('click', () => { state.auto = !state.auto; if (state.auto) { autoI = 0; empezar(listaManiobras()[0]); } else terminar(); marcar(); });
  mr.appendChild(auto);
  for (const k of listaManiobras()) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = MANIOBRAS[k].nombre; b.dataset.man = k;
    b.addEventListener('click', () => { state.auto = false; empezar(k); marcar(); });
    mr.appendChild(b);
  }
}
const listaManiobras = () => Object.keys(MANIOBRAS).filter(k => k !== 'bodega' || tiene(state.diseno, 'compuertas') || tiene(state.diseno, 'camuflaje'));
function empezar(k) { state.maniobra = k; maniobraT = 0; }
function terminar() { state.maniobra = null; Object.assign(mandos, { roll: 0, pitch: 0, yaw: 0, empuje: 0.5, turbo: false, freno: false, compuertas: false, camuflaje: false }); }
function pararAuto() { if (state.auto || state.maniobra) { state.auto = false; terminar(); marcar(); } }
// palanca virtual: arrastrar el botón; al soltar vuelve al centro (como una palanca con resorte)
{
  const pad = $('palanca'), knob = $('palanca-b');
  let activo = false;
  const mover = e => {
    const r = pad.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)), y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    mandos.roll = x; mandos.pitch = y; // arrastrar hacia abajo = tirar = trompa arriba
    knob.style.transform = `translate(${x * 42}px, ${y * 42}px)`;
  };
  pad.addEventListener('pointerdown', e => { pararAuto(); activo = true; pad.setPointerCapture(e.pointerId); mover(e); });
  pad.addEventListener('pointermove', e => { if (activo) mover(e); });
  const soltar = () => { activo = false; mandos.roll = 0; mandos.pitch = 0; knob.style.transform = ''; };
  pad.addEventListener('pointerup', soltar); pad.addEventListener('pointercancel', soltar);
  // teclado: flechas mueven la palanca
  pad.addEventListener('keydown', e => {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d) return; e.preventDefault(); pararAuto();
    mandos.roll = d[0]; mandos.pitch = d[1]; knob.style.transform = `translate(${d[0] * 42}px, ${d[1] * 42}px)`;
  });
  pad.addEventListener('keyup', soltar);
  const ped = $('pedales');
  ped.addEventListener('input', () => { pararAuto(); mandos.yaw = +ped.value; });
  const vuelve = () => { ped.value = 0; mandos.yaw = 0; };
  ped.addEventListener('pointerup', vuelve); ped.addEventListener('change', vuelve);
  $('empuje').addEventListener('input', () => { pararAuto(); mandos.empuje = +$('empuje').value; });
}
function lecturas() {
  const a = mandos.anim, idx = { aleron: 0, timon: 1, elevador: 2, freno: 3, tobera: 4 };
  $('lecturas').textContent = LECTURAS.map(([k, n, max]) => {
    const v = a[idx[k]];
    return max ? `${n} ${Math.round(v * max * 57.3)}°` : `${n} ${Math.round(v * 100)} %`;
  }).join(' · ');
}

function rehacer() {
  const nuevas = state.sistema === 'nuevas';
  flota.setVisible(nuevas); efectos.visible = nuevas; vieja.visible = !nuevas;
  if (nuevas) { armarNaves(); simulador(); } else { armarVieja(); $('etiquetas').replaceChildren(); }
  info(); ponerVista(state.vista);
}

/* ---------- Vistas ---------- */
function ponerVista(v) {
  const antes = state.vista; state.vista = v;
  const nuevas = state.sistema === 'nuevas';
  if (nuevas && ((v === 'fila') !== (antes === 'fila') || (v === 'lejos') !== (antes === 'lejos') || !naves.length)) armarNaves();
  const ids = v === 'fila' ? IDS : [state.diseno];
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
  if (v === 'juego') { const k = nuevas ? flota.dis[state.diseno].dis.escala * 0.9 : 1; camera.position.set(0, 5.2 * k, 11.5 * k); controls.target.set(0, 0, -4); }
  if (v === 'fila') { const w = ids.length * (Math.max(...ids.map(id => medidas[id].ancho)) + 2.5); camera.position.set(0, w * 0.32, w * 1.05); }
  if (v === 'lejos') { camera.fov = innerWidth < innerHeight ? 62 : 55; camera.position.set(0, 20, 60); controls.target.set(0, 30, -250); controls.autoRotate = false; }
  controls.minDistance = plano ? d * 0.4 : 3; controls.maxDistance = plano ? d * 1.6 : (v === 'lejos' ? 600 : 70);
  if (v === 'lejos') { scene.fog.near = 500; scene.fog.far = 4200; scene.fog.color.copy(CIELO); camera.far = 5000; }
  else {
    const lejos = camera.position.distanceTo(controls.target);
    scene.fog.color.copy(FONDO); scene.fog.near = lejos + R * 2; scene.fog.far = lejos + R * 2 + 60; camera.far = lejos * 3 + 200;
  }
  camera.updateProjectionMatrix(); if (camera.view) camera.view.enabled = true; controls.update();
  info(); marcar();
}

/* ---------- Controles ---------- */
function tab(nombre) {
  for (const t of ['nave', 'piezas', 'vista']) { $('tab-' + t).setAttribute('aria-selected', String(t === nombre)); $('p-' + t).hidden = t !== nombre; }
}
for (const t of ['nave', 'piezas', 'vista']) $('tab-' + t).addEventListener('click', () => tab(t));
fila('sistema', 'sistema', [['nuevas', 'Nuevas (por piezas)'], ['actuales', 'Actuales']], () => { if (state.sistema === 'actuales' && (state.vista === 'fila' || state.vista === 'lejos')) state.vista = 'tres'; filasNave(); rehacer(); });
fila('views', 'vista', [['tres', 'Tres cuartos'], ['planta', 'Planta'], ['perfil', 'Perfil'], ['trasera', 'De atrás'], ['juego', 'Como en el juego'], ['lejos', 'De lejos'], ['fila', 'Todas a escala']], ponerVista);
fila('lods', 'lod', [[0, 'Completa'], [1, 'Media'], [2, 'Silueta']], () => { for (const n of naves) if (state.vista !== 'lejos') n.lodFijo = state.lod; });
filasNave();
rehacer();
if (state.auto) empezar(listaManiobras()[0]);
window.__hangar = { state, rehacer, ponerVista, camera, controls, flota, naves, medidas, mandos, empezar, terminar };

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
let t = 0, last = performance.now(), lectT = 0;
const _v = new T.Vector3(), _q = new T.Quaternion(), _e = new T.Euler(0, 0, 0, 'YXZ');
renderer.setAnimationLoop(now => {
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; t += dt;
  if (state.sistema === 'nuevas') {
    // maniobra en curso: el guion da los mandos y la actitud de la nave
    let objetivo = [mandos.roll * 0.5, -mandos.pitch * 0.22, -mandos.yaw * 0.15];
    if (state.maniobra) {
      const M = MANIOBRAS[state.maniobra], p = M.paso(maniobraT);
      Object.assign(mandos, { roll: p.roll, pitch: p.pitch, yaw: p.yaw, empuje: p.empuje ?? 0.5, turbo: !!p.turbo, freno: !!p.freno, compuertas: !!p.compuertas, camuflaje: !!p.camuflaje });
      objetivo = p.actitud;
      maniobraT += dt;
      if (maniobraT > M.dur + 0.6) {
        if (state.auto) { const L = listaManiobras(); autoI = (autoI + 1) % L.length; empezar(L[autoI]); }
        else terminar();
        marcar();
      }
    }
    actualizarMandos(mandos, dt);
    // la nave sigue la actitud con suavidad (en las vueltas completas la sigue directo)
    const k = 1 - Math.exp(-6 * dt);
    if (state.maniobra === 'tonel' || state.maniobra === 'looping') actitud.set(objetivo[0], objetivo[1], objetivo[2]);
    else actitud.lerp(_v.set(...objetivo), k);
    _e.set(actitud.y, -actitud.z, -actitud.x); // cabeceo (x), guiñada (y), alabeo (alrededor de -Z)
    _q.setFromEuler(_e);
    const flot = state.vista === 'tres' || state.vista === 'juego' ? Math.sin(t * 1.3) * 0.06 : 0;
    for (const n of naves) {
      n.pos.copy(n.base); n.pos.y += flot;
      if (state.vista === 'lejos') { n.pos.y += Math.sin(t * 0.8 + n.base.x) * 2; n.quat.setFromEuler(_e.set(0, 0, Math.sin(t * 0.6 + n.base.x) * 0.3)); }
      else if (state.vista === 'fila') n.quat.identity();
      else n.quat.copy(_q);
      n.grupo.position.copy(n.pos); n.grupo.quaternion.copy(n.quat);
      const turbo = mandos.anim[4];
      n.llamas.forEach((s, i) => { s.scale.setScalar((0.5 + turbo * 1.1) * (1 + Math.sin(t * 30 + i) * 0.06)); s.material.opacity = 0.45 + turbo * 0.55; });
      // luces de navegación: fijas en las alas, la de la cola titila
      n.luces.forEach(s => { s.material.opacity = s.userData.cola ? (Math.sin(t * 6) > 0.6 ? 1 : 0.15) : 0.9; });
      if (n.etq) {
        _v.copy(n.pos); _v.y = n.pos.y + medidas[n.id].box.min.y - 0.3; _v.project(camera);
        n.etq.style.left = ((_v.x + 1) / 2 * innerWidth) + 'px'; n.etq.style.top = ((1 - _v.y) / 2 * innerHeight + 8) + 'px';
      }
    }
    flota.actualizar(naves, camera);
    lectT += dt; if (lectT > 0.1) { lectT = 0; lecturas(); }
  } else {
    vieja.position.y = Math.sin(t * 1.3) * 0.06;
  }
  controls.update();
  renderer.render(scene, camera);
});
