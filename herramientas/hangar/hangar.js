// Visor para elegir el diseño de la nave: misma nave del juego (src/nave.js), con luz de día y su sombra.
import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NAVES, PALETAS, naveGeometria, naveMaterial } from '../../src/nave.js';

const canvas = document.getElementById('view');
const renderer = new T.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const scene = new T.Scene();
scene.background = new T.Color(0x0a1022);
scene.fog = new T.Fog(0x0a1022, 18, 40);
const camera = new T.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(5.5, 3.6, 6.5);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.minDistance = 4; controls.maxDistance = 16; controls.target.set(0, 0.2, 0);
controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches; controls.autoRotateSpeed = 1.2;
canvas.addEventListener('pointerdown', () => { controls.autoRotate = false; });

// la misma luz que el juego: cielo y suelo, más el sol
scene.add(new T.HemisphereLight(0xa8c8ff, 0xb08a66, 0.72));
const sun = new T.DirectionalLight(0xfff0d8, 0.95); sun.position.set(4, 7, 3); scene.add(sun);
// piso con grilla, como un hangar
const grid = new T.GridHelper(30, 30, 0x2b3a5c, 0x1a2440); grid.position.y = -0.9; scene.add(grid);
const shadow = new T.Mesh(new T.CircleGeometry(2.6, 40), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.89; scene.add(shadow);

const ship = new T.Group(); scene.add(ship);
const flames = [];
let mesh = null, state = { modelo: 'guardia', paleta: 'guardia' };
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(127,240,225,.8)'); gr.addColorStop(1, 'rgba(127,240,225,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c);
})();
function build() {
  if (mesh) { ship.remove(mesh); mesh.geometry.dispose(); }
  flames.splice(0).forEach(f => ship.remove(f));
  mesh = new T.Mesh(naveGeometria(T, state.modelo, state.paleta), naveMaterial(T));
  ship.add(mesh);
  for (const e of NAVES[state.modelo].engines) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: 0x7ff0e1, blending: T.AdditiveBlending, transparent: true, depthWrite: false }));
    s.position.set(e[0], e[1], e[2] + 0.12); s.scale.setScalar(0.9); ship.add(s); flames.push(s);
  }
  document.getElementById('desc').textContent = NAVES[state.modelo].nombre + ': ' + NAVES[state.modelo].desc;
  document.querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', String(state[b.dataset.k] === b.dataset.v)));
}
function buttons(id, k, items) {
  const row = document.getElementById(id);
  for (const [v, name] of items) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = name; b.dataset.k = k; b.dataset.v = v;
    b.addEventListener('click', () => { state[k] = v; build(); });
    row.appendChild(b);
  }
}
buttons('models', 'modelo', Object.entries(NAVES).map(([k, n]) => [k, n.nombre]));
buttons('palettes', 'paleta', Object.entries(PALETAS).map(([k, p]) => [k, p.nombre]));
const VIEWS = { tres: [5.5, 3.6, 6.5], arriba: [0.01, 9, 0.6], atras: [0, 1.6, 8], juego: [0, 2.1, 6.2] };
const vrow = document.getElementById('views');
for (const [v, name] of [['tres', 'Tres cuartos'], ['arriba', 'Desde arriba'], ['atras', 'De atrás'], ['juego', 'Como en el juego']]) {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = name;
  b.addEventListener('click', () => { controls.autoRotate = v === 'tres'; camera.position.set(...VIEWS[v]); controls.update(); });
  vrow.appendChild(b);
}
build();
window.__hangar = { state, build, camera, controls };

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w < h ? 55 : 40; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
let t = 0;
renderer.setAnimationLoop(() => {
  t += 0.016;
  ship.position.y = Math.sin(t * 1.3) * 0.06;
  flames.forEach((f, i) => f.scale.setScalar(0.8 + Math.sin(t * 30 + i) * 0.08));
  controls.update();
  renderer.render(scene, camera);
});
