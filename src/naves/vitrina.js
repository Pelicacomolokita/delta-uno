/* ---------- Vitrina: la nave elegida, girando, en la pantalla de preparación ----------
   Usa el mismo renderizador del juego (no abre otro contexto 3D, que en los teléfonos cuesta caro):
   dibuja en una textura chica, lee los píxeles y los pasa a un <canvas> 2D de la pantalla.
   Solo trabaja mientras la pantalla está abierta. */
import * as T from 'three';
import { Flota } from './flota.js';
import { DISENOS } from './disenos.js';
import { crearMandos, actualizarMandos } from './mandos.js';

export class Vitrina {
  constructor({ ids, detalleTex = null, ancho = 360, alto = 200 } = {}) {
    this.ids = ids;
    this.scene = new T.Scene();
    this.scene.add(new T.HemisphereLight(0xdfe8f5, 0x3a4250, 0.95));
    const sol = new T.DirectionalLight(0xffffff, 0.85); sol.position.set(-4, 6, 5); this.scene.add(sol);
    this.camera = new T.PerspectiveCamera(30, ancho / alto, 0.5, 400);
    this.flota = new Flota(this.scene, ids, { max: 1, detalleTex, bandoPropio: 'guardia' });
    this.nave = { id: ids[0], bando: 'guardia', pintura: 'guardia', propia: true, visible: true, lod: 0,
      pos: new T.Vector3(), quat: new T.Quaternion(), mandos: crearMandos() };
    this.nave.anim = this.nave.mandos.anim;
    this.t = 0; this.acum = 0;
    this.tamano(ancho, alto);
  }
  tamano(ancho, alto) {
    ancho = Math.max(64, Math.round(ancho)); alto = Math.max(48, Math.round(alto));
    if (this.rt && this.rt.width === ancho && this.rt.height === alto) return;
    if (this.rt) this.rt.dispose();
    this.rt = new T.WebGLRenderTarget(ancho, alto);
    this.px = new Uint8Array(ancho * alto * 4);
    this.img = null;
    this.camera.aspect = ancho / alto; this.camera.updateProjectionMatrix();
  }
  // Qué nave mostrar y con qué pintura
  mostrar(id, pintura) {
    if (!DISENOS[id] || !this.ids.includes(id)) return false;
    this.nave.id = id; this.nave.pintura = pintura || DISENOS[id].pintura;
    const r = this.flota.dis[id].radio; // ya viene con la escala de la clase
    this.dist = r / Math.sin(this.camera.fov * Math.PI / 360) * 1.15;
    return true;
  }
  /* Un paso: mueve la nave y, a 30 cuadros por segundo como mucho, la dibuja en el canvas.
     canvas: el <canvas> 2D donde se ve. */
  paso(renderer, canvas, dt) {
    if (!canvas || !canvas.width) return;
    this.t += dt; this.acum += dt;
    // gira despacio y de vez en cuando mueve los alerones, para que se vea que las piezas andan
    const m = this.nave.mandos, s = Math.sin(this.t * 0.9);
    m.roll = s > 0.85 ? 0.6 : s < -0.85 ? -0.6 : 0; m.pitch = Math.sin(this.t * 0.55) > 0.9 ? 0.5 : 0;
    m.empuje = 0.55; m.velocidad = 120;
    actualizarMandos(m, dt);
    if (this.acum < 1 / 30) return;
    this.acum = 0;
    this.tamano(canvas.width, canvas.height);
    const a = this.t * 0.35, d = this.dist || 40;
    this.camera.position.set(Math.sin(a) * d, d * 0.32, Math.cos(a) * d);
    this.camera.lookAt(0, 0, 0);
    this.flota.actualizar([this.nave], this.camera);
    const prev = renderer.getRenderTarget(), clear = renderer.getClearAlpha(), cc = renderer.getClearColor(new T.Color());
    renderer.setRenderTarget(this.rt);
    renderer.setClearColor(0x000000, 0); renderer.clear();
    renderer.render(this.scene, this.camera);
    renderer.readRenderTargetPixels(this.rt, 0, 0, this.rt.width, this.rt.height, this.px);
    renderer.setRenderTarget(prev); renderer.setClearColor(cc, clear);
    const W = this.rt.width, H = this.rt.height, ctx = canvas.getContext('2d');
    if (!this.img) this.img = ctx.createImageData(W, H);
    const o = this.img.data, row = W * 4;
    for (let y = 0; y < H; y++) o.set(this.px.subarray((H - 1 - y) * row, (H - y) * row), y * row); // WebGL lee de abajo hacia arriba
    ctx.putImageData(this.img, 0, 0);
  }
}
