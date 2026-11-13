/* ---------- Daño y destrucción de las naves por piezas ----------
   Cada nave lleva n.dano de 0 (entera) a 1 (a punto de caer). El juego lo calcula con su vida.
   - Desde 0,4 (vida bajo 60 %): humo gris por los motores y alguna chispa. Placas quemadas en la pintura.
   - Desde 0,75 (vida bajo 25 %): fuego, humo negro y superficies que flamean sueltas.
   - Al caer (romper): la nave se parte en sus propias piezas (cuerpo, alas, cola), que caen girando y humeando.
   Todo con pocas llamadas de dibujo: humo y fuego son dos nubes de puntos; cada pedazo es una malla compartida
   (InstancedMesh por diseño y pedazo) con el mismo material de la flota. */
import * as T from 'three';
import { armarDiseno, espejar, ESPEJO } from './generador.js';
import { BANDOS } from './disenos.js';

export const UMBRAL = { humo: 0.4, fuego: 0.75 };
const MAX_PEDAZOS = 8;   // del mismo diseño y pedazo a la vez
const VIDA_PEDAZO = 5;   // s

/* ---------- Partículas: humo (normal) y fuego (que suma luz) ---------- */
function nube(n, aditiva) {
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3).setUsage(T.DynamicDrawUsage));
  g.setAttribute('aCol', new T.BufferAttribute(new Float32Array(n * 4), 4).setUsage(T.DynamicDrawUsage));
  g.setAttribute('aTam', new T.BufferAttribute(new Float32Array(n), 1).setUsage(T.DynamicDrawUsage));
  const m = new T.ShaderMaterial({
    uniforms: T.UniformsUtils.merge([T.UniformsLib.fog, { uEscala: { value: 400 } }]),
    vertexShader: `
attribute vec4 aCol; attribute float aTam; uniform float uEscala; varying vec4 vCol;
#include <fog_pars_vertex>
void main() {
  vCol = aCol;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = clamp(aTam * uEscala / max(-mvPosition.z, 0.5), 1.0, 160.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: `
varying vec4 vCol;
#include <fog_pars_fragment>
void main() {
  vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0;
  if (r > 1.0) discard;
  gl_FragColor = vec4(vCol.rgb, vCol.a * (1.0 - r) * (1.0 - r));
  #include <fog_fragment>
}`,
    transparent: true, depthWrite: false, fog: true,
    blending: aditiva ? T.AdditiveBlending : T.NormalBlending
  });
  const p = new T.Points(g, m); p.frustumCulled = false; p.visible = false;
  return { g, m, p, n, vivas: 0, pos: new Float32Array(n * 3), vel: new Float32Array(n * 3), vida: new Float32Array(n), dur: new Float32Array(n), tam: new Float32Array(n), tipo: new Uint8Array(n), prox: 0 };
}

// tipo: 0 humo gris, 1 humo negro, 2 fuego, 3 chispa
const COLOR = [
  t => [0.62 - 0.2 * t, 0.63 - 0.2 * t, 0.65 - 0.2 * t, 0.55 * (1 - t)],
  t => [0.16, 0.15, 0.15, 0.75 * (1 - t)],
  t => [1.0, 0.75 - 0.5 * t, 0.3 - 0.28 * t, 0.9 * (1 - t)],
  t => [1.0, 0.85, 0.5, 1 - t]
];
const CRECE = [2.6, 3.2, 1.2, 0.2];

function emitir(N, tipo, x, y, z, vx, vy, vz, tam, dur) {
  const i = N.prox; N.prox = (N.prox + 1) % N.n;
  N.pos[i * 3] = x; N.pos[i * 3 + 1] = y; N.pos[i * 3 + 2] = z;
  N.vel[i * 3] = vx; N.vel[i * 3 + 1] = vy; N.vel[i * 3 + 2] = vz;
  N.vida[i] = dur; N.dur[i] = dur; N.tam[i] = tam; N.tipo[i] = tipo;
}

function pasoNube(N, dt, arriba) {
  const P = N.g.attributes.position.array, C = N.g.attributes.aCol.array, S = N.g.attributes.aTam.array;
  let k = 0;
  for (let i = 0; i < N.n; i++) {
    if (N.vida[i] <= 0) continue;
    N.vida[i] -= dt;
    if (N.vida[i] <= 0) continue;
    const t = 1 - N.vida[i] / N.dur[i], tp = N.tipo[i];
    const fr = tp === 3 ? 0.4 : 1.6, sube = tp === 3 ? -9 : tp === 2 ? 2 : 4; // el humo sube, las chispas caen
    for (let a = 0; a < 3; a++) {
      N.vel[i * 3 + a] += (arriba[a] * sube - N.vel[i * 3 + a] * fr) * dt;
      N.pos[i * 3 + a] += N.vel[i * 3 + a] * dt;
      P[k * 3 + a] = N.pos[i * 3 + a];
    }
    const c = COLOR[tp](t);
    C[k * 4] = c[0]; C[k * 4 + 1] = c[1]; C[k * 4 + 2] = c[2]; C[k * 4 + 3] = c[3];
    S[k] = N.tam[i] * (1 + CRECE[tp] * t);
    k++;
  }
  N.vivas = k;
  N.g.setDrawRange(0, k);
  N.p.visible = k > 0;
  if (k) for (const a of ['position', 'aCol', 'aTam']) N.g.attributes[a].needsUpdate = true;
}

/* ---------- Pedazos ---------- */
// Parte un diseño en cuerpo, cola, ala derecha y ala izquierda (lo que tenga)
function partir(dis) {
  const cuerpo = [], cola = [], der = [], izq = [];
  for (const pz of dis.piezas) {
    const espeja = pz.espejo !== false && ESPEJO.has(pz.tipo);
    const esCola = pz.tipo === 'superficie' && (pz.canal === 1 || pz.canal === 2 || Math.abs(pz.tle[1] - pz.rle[1]) > Math.abs(pz.tle[0] - pz.rle[0]));
    if (!espeja) cuerpo.push(pz);
    else if (esCola || pz.tipo === 'motor' || pz.tipo === 'freno' || pz.tipo === 'toma') {
      const dest = esCola ? cola : cuerpo;
      dest.push(pz);
    } else { der.push({ ...pz, espejo: false }); izq.push({ ...espejar(pz), espejo: false }); }
  }
  return { cuerpo, cola, der, izq };
}

export class Danos {
  /* scene, material: el de la flota. dis: { id: diseño ya con su escala } (los de Flota). */
  constructor(scene, flota) {
    this.scene = scene; this.flota = flota;
    this.humo = nube(700, false); this.fuego = nube(500, true);
    scene.add(this.humo.p); scene.add(this.fuego.p);
    this.pedazos = [];     // { malla, i, pos, quat, vel, giro, vida, humo }
    this.mallas = {};      // id → [{ mesh, centro }]
    this.t = 0;
    this.centro = new T.Vector3(); // centro del planeta: hacia ahí caen los pedazos
    this.plano = false;            // sin planeta (Hangar): "abajo" es -Y
    this._q = new T.Quaternion(); this._v = new T.Vector3(); this._u = new T.Vector3(); this._m = new T.Matrix4(); this._s = new T.Vector3(1, 1, 1);
  }
  // Mallas de los pedazos de un diseño, armadas la primera vez que hacen falta
  mallasDe(id) {
    if (this.mallas[id]) return this.mallas[id];
    const D = this.flota.dis[id]; if (!D) return null;
    const out = [];
    for (const piezas of Object.values(partir(D.dis))) {
      if (!piezas.length) continue;
      const d = armarDiseno({ ...D.dis, piezas }, 1);
      if (!d.n) continue;
      // centro del pedazo: alrededor de él gira al caer
      let cx = 0, cy = 0, cz = 0;
      for (let i = 0; i < d.pos.length; i += 3) { cx += d.pos[i]; cy += d.pos[i + 1]; cz += d.pos[i + 2]; }
      cx /= d.n; cy /= d.n; cz /= d.n;
      for (let i = 0; i < d.pos.length; i += 3) { d.pos[i] -= cx; d.pos[i + 1] -= cy; d.pos[i + 2] -= cz; }
      for (let i = 0; i < d.bis.length; i += 4) d.bis[i + 3] = -1; // los pedazos no mueven piezas
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(d.pos, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(d.uv, 2));
      g.setAttribute('aZona', new T.Float32BufferAttribute(d.zona, 1));
      g.setAttribute('aTono', new T.Float32BufferAttribute(d.tono, 1));
      g.setAttribute('aBis', new T.Float32BufferAttribute(d.bis, 4));
      g.setAttribute('aEje', new T.Float32BufferAttribute(d.eje, 4));
      for (const [n, s] of [['iAnimA', 4], ['iAnimB', 4], ['iMarca', 4]]) g.setAttribute(n, new T.InstancedBufferAttribute(new Float32Array(MAX_PEDAZOS * s), s).setUsage(T.DynamicDrawUsage));
      g.computeVertexNormals(); g.computeBoundingSphere();
      const mesh = new T.InstancedMesh(g, this.flota.mat, MAX_PEDAZOS);
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.count = 0; mesh.frustumCulled = false; mesh.visible = false;
      this.scene.add(mesh);
      out.push({ mesh, centro: new T.Vector3(cx, cy, cz), libres: Array.from({ length: MAX_PEDAZOS }, (_, i) => MAX_PEDAZOS - 1 - i), radio: g.boundingSphere.radius });
    }
    return (this.mallas[id] = out);
  }
  abajo(p, out) {
    if (this.plano) return out.set(0, -1, 0);
    return out.copy(this.centro).sub(p).normalize();
  }
  /* La nave n cae: se parte en pedazos. vel: su velocidad (m/s) para que los pedazos sigan de largo. */
  romper(n, vel) {
    const M = this.mallasDe(n.id); if (!M) return 0;
    const pint = this.flota.pint.indice[n.pintura] ?? 0;
    let hechos = 0;
    for (const P of M) {
      const i = P.libres.pop(); if (i === undefined) continue;
      const pos = P.centro.clone().applyQuaternion(n.quat).add(n.pos);
      // sale hacia afuera desde el centro de la nave, más lo que traía
      const afuera = P.centro.clone().applyQuaternion(n.quat);
      const l = afuera.length() || 1;
      const v = (vel ? vel.clone() : new T.Vector3()).multiplyScalar(0.9).addScaledVector(afuera, (6 + Math.random() * 8) / l);
      v.x += (Math.random() - 0.5) * 6; v.y += (Math.random() - 0.5) * 6; v.z += (Math.random() - 0.5) * 6;
      const giro = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(1.5 + Math.random() * 3.5);
      this.pedazos.push({ P, i, pos, quat: n.quat.clone(), vel: v, giro, vida: VIDA_PEDAZO * (0.7 + Math.random() * 0.6), pint, marca: (BANDOS[n.bando] || BANDOS[this.flota.dis[n.id].dis.bando] || {}).color || null, humoT: 0, fuego: Math.random() < 0.6 });
      hechos++;
    }
    // fogonazo en el centro
    for (let k = 0; k < 14; k++) {
      const a = Math.random() * 6.283, b = Math.random() * 2 - 1, s = Math.sqrt(1 - b * b), r = 8 + Math.random() * 14;
      emitir(this.fuego, 2, n.pos.x, n.pos.y, n.pos.z, Math.cos(a) * s * r, b * r, Math.sin(a) * s * r, 2.4 + Math.random() * 1.5, 0.5 + Math.random() * 0.4);
    }
    for (let k = 0; k < 10; k++) emitir(this.humo, 1, n.pos.x + (Math.random() - .5) * 3, n.pos.y + (Math.random() - .5) * 3, n.pos.z + (Math.random() - .5) * 3, (Math.random() - .5) * 6, (Math.random() - .5) * 6, (Math.random() - .5) * 6, 3, 2 + Math.random());
    return hechos;
  }
  /* Un cuadro: humo y fuego de las naves dañadas, superficies sueltas, pedazos que caen. */
  actualizar(dt, naves, camera, renderer) {
    this.t += dt;
    const arr = [0, 1, 0];
    // las naves dañadas largan humo por los motores y, muy dañadas, fuego
    for (const n of naves) {
      const d = n.dano || 0;
      if (d < UMBRAL.humo || !n.visible) continue;
      if (n.lod !== undefined && n.lod >= 3) continue;
      const D = this.flota.dis[n.id]; if (!D) continue;
      this.abajo(n.pos, this._u); arr[0] = -this._u.x; arr[1] = -this._u.y; arr[2] = -this._u.z;
      const mot = D.puntos.motores.length ? D.puntos.motores : [[0, 0, 1]];
      const tasa = (d - UMBRAL.humo) / (1 - UMBRAL.humo) * 28 + 6; // partículas por segundo
      n._humoAcum = (n._humoAcum || 0) + tasa * dt;
      while (n._humoAcum >= 1) {
        n._humoAcum -= 1;
        const e = mot[(Math.random() * mot.length) | 0];
        this._v.set(e[0], e[1], e[2]).applyQuaternion(n.quat).add(n.pos);
        const fuerte = d >= UMBRAL.fuego;
        emitir(this.humo, fuerte ? 1 : 0, this._v.x, this._v.y, this._v.z, (Math.random() - .5) * 2, (Math.random() - .5) * 2, (Math.random() - .5) * 2, fuerte ? 1.6 : 1.1, fuerte ? 2.2 : 1.6);
        if (fuerte && Math.random() < 0.7) emitir(this.fuego, 2, this._v.x, this._v.y, this._v.z, (Math.random() - .5) * 3, (Math.random() - .5) * 3, (Math.random() - .5) * 3, 1.1, 0.35);
        if (Math.random() < 0.12 * d) emitir(this.fuego, 3, this._v.x, this._v.y, this._v.z, (Math.random() - .5) * 18, (Math.random() - .5) * 18, (Math.random() - .5) * 18, 0.35, 0.6);
      }
    }
    // pedazos
    for (const id in this.mallas) for (const P of this.mallas[id]) P.mesh.count = 0;
    for (let k = this.pedazos.length - 1; k >= 0; k--) {
      const f = this.pedazos[k];
      f.vida -= dt;
      if (f.vida <= 0) { f.P.libres.push(f.i); this.pedazos.splice(k, 1); continue; }
      this.abajo(f.pos, this._u);
      f.vel.addScaledVector(this._u, 9.8 * dt).multiplyScalar(1 - 0.25 * dt);
      f.pos.addScaledVector(f.vel, dt);
      const w = f.giro.length();
      if (w > 0) { this._q.setFromAxisAngle(this._v.copy(f.giro).divideScalar(w), w * dt); f.quat.premultiply(this._q); }
      f.humoT -= dt;
      if (f.humoT <= 0) {
        f.humoT = 0.06;
        emitir(this.humo, 1, f.pos.x, f.pos.y, f.pos.z, 0, 0, 0, 1.4, 1.8);
        if (f.fuego && f.vida > 1.5) emitir(this.fuego, 2, f.pos.x, f.pos.y, f.pos.z, 0, 0, 0, 1, 0.3);
      }
    }
    // los pedazos se dibujan en su lugar de la malla (cada uno guarda su índice, pero la malla se llena en orden)
    for (const f of this.pedazos) {
      const mesh = f.P.mesh, i = mesh.count++;
      this._m.compose(f.pos, f.quat, this._s); mesh.setMatrixAt(i, this._m);
      const g = mesh.geometry, B = g.attributes.iAnimB.array, Mk = g.attributes.iMarca.array;
      B[i * 4 + 3] = f.pint;
      const c = f.marca; Mk[i * 4] = c ? c[0] : -1; Mk[i * 4 + 1] = c ? c[1] : -1; Mk[i * 4 + 2] = c ? c[2] : -1; Mk[i * 4 + 3] = 0.95;
    }
    for (const id in this.mallas) for (const P of this.mallas[id]) {
      const m = P.mesh; m.visible = m.count > 0;
      if (m.count) { m.instanceMatrix.needsUpdate = true; m.geometry.attributes.iAnimB.needsUpdate = true; m.geometry.attributes.iMarca.needsUpdate = true; }
    }
    // humo y fuego
    if (camera) {
      const h = renderer ? renderer.getDrawingBufferSize(this._v).y : 800;
      const esc = h / (2 * Math.tan(camera.fov * Math.PI / 360));
      this.humo.m.uniforms.uEscala.value = esc; this.fuego.m.uniforms.uEscala.value = esc;
    }
    this.abajo(camera ? camera.position : this._v.set(0, 0, 0), this._u);
    arr[0] = -this._u.x; arr[1] = -this._u.y; arr[2] = -this._u.z;
    pasoNube(this.humo, dt, arr); pasoNube(this.fuego, dt, arr);
  }
  // cuántas cosas hay vivas (para pruebas e informe)
  resumen() { return { pedazos: this.pedazos.length, humo: this.humo.vivas, fuego: this.fuego.vivas }; }
}

// Superficies sueltas: con la nave muy dañada, los alerones y el timón flamean solos.
// Se suma como un desvío aparte (y se saca al cuadro siguiente) para no ensuciar los mandos del piloto.
export function flamear(n, t) {
  const a = n.anim, prev = n._flam;
  if (prev) { a[0] -= prev[0]; a[1] -= prev[1]; a[2] -= prev[2]; }
  const d = n.dano || 0;
  if (d < UMBRAL.fuego) { n._flam = null; return; }
  const k = (d - UMBRAL.fuego) / (1 - UMBRAL.fuego), s = n._semilla ?? (n._semilla = Math.random() * 100);
  const o = n._flam || (n._flam = [0, 0, 0]);
  o[0] = Math.sin(t * 23 + s) * 0.45 * k;
  o[1] = Math.sin(t * 17 + s * 1.7) * 0.35 * k;
  o[2] = 0.25 * k + Math.sin(t * 29 + s * 0.3) * 0.15 * k; // un elevador que quedó trabado y vibra
  a[0] += o[0]; a[1] += o[1]; a[2] += o[2];
}
