/* ---------- Flota: todas las naves con pocas llamadas de dibujo ----------
   - Una malla por diseño y nivel de detalle, compartida por todas las naves de ese diseño (InstancedMesh).
   - Un solo material para todas: las piezas se mueven en la placa de video (bisagras guardadas en la malla)
     y el color sale de una tabla chica de pinturas (8 zonas × 64 pinturas).
   - Por nave se mandan 11 números: 8 de animación/pintura y 3 del color de marca (el de su bando).
   - El nivel de detalle se elige por distancia, con margen para que no parpadee. Lo muy lejano es un punto. */
import * as T from 'three';
import { armarDiseno, puntosDiseno } from './generador.js';
import { DISENOS, PINTURAS, ESCALA_CLASE, BANDOS } from './disenos.js';

export const LOD_DIST = [80, 300, 900];

// metros para un Caza; se multiplica por la escala de la clase

// baliza de bando: círculo, cuadrado o rombo, con borde oscuro para que se lea sobre cielo claro y sobre terreno
function balizaTex(forma) {
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
  const figura = r => {
    g.beginPath();
    if (forma === 'cuadrado') g.rect(16 - r, 16 - r, r * 2, r * 2);
    else if (forma === 'rombo') { g.moveTo(16, 16 - r * 1.25); g.lineTo(16 + r * 1.25, 16); g.lineTo(16, 16 + r * 1.25); g.lineTo(16 - r * 1.25, 16); g.closePath(); }
    else g.arc(16, 16, r, 0, Math.PI * 2);
  };
  figura(12.5); g.fillStyle = 'rgba(10,14,20,0.85)'; g.fill();
  figura(8.5); g.fillStyle = '#fff'; g.fill();
  return new T.CanvasTexture(c);
}
const HISTERESIS = 0.12;

export function tablaPinturas() {
  const ids = Object.keys(PINTURAS), data = new Uint8Array(8 * 64 * 4);
  ids.forEach((id, row) => PINTURAS[id].zonas.forEach((hex, z) => {
    const c = new T.Color(hex), i = (row * 8 + z) * 4;
    data[i] = c.r * 255; data[i + 1] = c.g * 255; data[i + 2] = c.b * 255; data[i + 3] = 255;
  }));
  const tex = new T.DataTexture(data, 8, 64, T.RGBAFormat);
  tex.magFilter = tex.minFilter = T.NearestFilter; tex.needsUpdate = true;
  return { tex, indice: Object.fromEntries(ids.map((id, i) => [id, i])) };
}

// El material de toda la flota. detalle: textura de paneles (Media y Alta).
export function materialFlota(paleta, detalleTex) {
  const mat = new T.MeshPhongMaterial({
    vertexColors: true, flatShading: true, side: T.DoubleSide, map: detalleTex || null,
    shininess: 38, specular: 0x3a3d42, emissive: 0x101216
  });
  mat.onBeforeCompile = sh => {
    sh.uniforms.uPaleta = { value: paleta };
    sh.vertexShader = `
attribute vec4 aBis;
attribute vec4 aEje;
attribute float aZona;
attribute float aTono;
attribute vec4 iAnimA;
attribute vec4 iAnimB;
attribute vec3 iMarca;
uniform sampler2D uPaleta;
` + sh.vertexShader
      .replace('#include <begin_vertex>', `
vec3 transformed = vec3(position);
float canal = aBis.w;
if (canal > -0.5) {
  // valor de su canal: alerón, timón, elevador, freno | tobera, compuertas, camuflaje
  float v = dot(iAnimA, vec4(equal(vec4(canal), vec4(0.0, 1.0, 2.0, 3.0))))
          + dot(vec4(iAnimB.xyz, 0.0), vec4(equal(vec4(canal), vec4(4.0, 5.0, 6.0, 7.0))));
  // elevón: elevador más alerón, con el alerón al revés de cada lado
  if (canal > 6.5) v = iAnimA.z + iAnimA.x * sign(aBis.x);
  vec3 p = transformed - aBis.xyz;
  vec3 k = aEje.xyz;
  if (canal > 3.5 && canal < 4.5) {
    vec3 ax = k * dot(p, k);
    p = ax + (p - ax) * (1.0 + v * aEje.w); // tobera: se abre hacia afuera
  } else {
    float a = v * aEje.w, c = cos(a), s = sin(a);
    p = p * c + cross(k, p) * s + k * dot(k, p) * (1.0 - c); // giro en la bisagra
  }
  transformed = aBis.xyz + p;
}`)
      .replace('#include <color_vertex>', `
vec3 colZ = texture2D(uPaleta, vec2((aZona + 0.5) / 8.0, (iAnimB.w + 0.5) / 64.0)).rgb;
if (aZona > 3.5 && aZona < 4.5 && iMarca.r >= 0.0) colZ = iMarca;
vColor = colZ * aTono;`);
  };
  mat.customProgramCacheKey = () => 'flota-v2' + (detalleTex ? '-d' : '');
  return mat;
}

export function geometriaDiseno(dis, lod) {
  const d = armarDiseno(dis, lod), g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(d.pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(d.uv, 2));
  g.setAttribute('aZona', new T.Float32BufferAttribute(d.zona, 1));
  g.setAttribute('aTono', new T.Float32BufferAttribute(d.tono, 1));
  g.setAttribute('aBis', new T.Float32BufferAttribute(d.bis, 4));
  g.setAttribute('aEje', new T.Float32BufferAttribute(d.eje, 4));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

export class Flota {
  /* ids: los diseños que se usan en la misión. max: naves por diseño. */
  constructor(scene, ids, { max = 40, detalleTex = null } = {}) {
    this.scene = scene;
    this.pint = tablaPinturas();
    this.mat = materialFlota(this.pint.tex, detalleTex);
    this.dis = {};
    const t0 = performance.now();
    for (const id of ids) {
      const base = DISENOS[id], dis = { ...base, escala: ESCALA_CLASE[base.clase] || 1 };
      const lods = [0, 1, 2].map(l => {
        const g = geometriaDiseno(dis, l);
        const mesh = new T.InstancedMesh(g, this.mat, max);
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
        for (const [n, s, init] of [['iAnimA', 4, 0], ['iAnimB', 4, 0], ['iMarca', 3, -1]]) {
          const a = new T.InstancedBufferAttribute(new Float32Array(max * s).fill(init), s);
          a.setUsage(T.DynamicDrawUsage); g.setAttribute(n, a);
        }
        mesh.count = 0; mesh.frustumCulled = false;
        scene.add(mesh);
        return { mesh, tris: g.attributes.position.count / 3 };
      });
      this.dis[id] = { dis, lods, radio: lods[0].mesh.geometry.boundingSphere.radius, puntos: puntosDiseno(dis) };
    }
    this.msArmado = performance.now() - t0;
    // balizas de bando: desde el nivel 1 cada nave lleva una, de tamaño fijo en pantalla; en el nivel 3 es lo único
    // que se ve. Una llamada de dibujo por bando (círculo, cuadrado, rombo).
    const n = max * ids.length, pr = Math.min((typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1, 2);
    this.balizas = {};
    for (const [b, B] of Object.entries(BANDOS)) {
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3).setUsage(T.DynamicDrawUsage));
      const pts = new T.Points(geo, new T.PointsMaterial({ size: 9 * pr, sizeAttenuation: false, color: new T.Color(...B.color), fog: false, map: balizaTex(B.forma), transparent: true, depthWrite: false, alphaTest: 0.05 }));
      pts.frustumCulled = false; scene.add(pts);
      this.balizas[b] = { geo, pts, n: 0 };
    }
    this._m = new T.Matrix4(); this._s = new T.Vector3(1, 1, 1); this._sph = new T.Sphere(); this._fr = new T.Frustum(); this._pm = new T.Matrix4();
    this.porNivel = [0, 0, 0, 0, 0]; // 0..3 y ocultas (fuera de cámara)
  }
  // nave: { id, pos, quat, anim:[aleron,timon,elevador,freno,tobera,compuertas,camuflaje], pintura, bando (si no, el del diseño), propia, lod, lodFijo }
  actualizar(naves, camera) {
    for (const id in this.dis) for (const l of this.dis[id].lods) l.mesh.count = 0;
    this._pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); this._fr.setFromProjectionMatrix(this._pm);
    for (const b in this.balizas) this.balizas[b].n = 0;
    this.porNivel.fill(0);
    for (const n of naves) {
      const D = this.dis[n.id]; if (!D) continue;
      this._sph.center.copy(n.pos); this._sph.radius = D.radio;
      if (!this._fr.intersectsSphere(this._sph)) { this.porNivel[4]++; continue; }
      const k = D.dis.escala, dist = n.pos.distanceTo(camera.position);
      let lod = n.lod ?? 0;
      if (n.lodFijo !== undefined) lod = n.lodFijo;
      else if (n.propia) lod = 0;
      else {
        // con margen: para subir de detalle hay que acercarse un poco más que para bajarlo
        while (lod < 3 && dist > LOD_DIST[lod] * k * (1 + HISTERESIS)) lod++;
        while (lod > 0 && dist < LOD_DIST[lod - 1] * k * (1 - HISTERESIS)) lod--;
      }
      n.lod = lod; this.porNivel[lod]++;
      const bando = BANDOS[n.bando] ? n.bando : D.dis.bando, marca = BANDOS[bando].color;
      if (lod >= 1) { // baliza de bando, un poco arriba de la nave (en el nivel 3, en su lugar)
        const B = this.balizas[bando], p = B.geo.attributes.position.array, j = B.n++ * 3;
        p[j] = n.pos.x; p[j + 1] = n.pos.y + (lod === 3 ? 0 : D.radio * 0.7); p[j + 2] = n.pos.z;
      }
      if (lod === 3) continue;
      const L = D.lods[lod], mesh = L.mesh, i = mesh.count++;
      this._m.compose(n.pos, n.quat, this._s); mesh.setMatrixAt(i, this._m);
      const g = mesh.geometry, A = g.attributes.iAnimA.array, B = g.attributes.iAnimB.array, M = g.attributes.iMarca.array, a = n.anim;
      A[i * 4] = a[0]; A[i * 4 + 1] = a[1]; A[i * 4 + 2] = a[2]; A[i * 4 + 3] = a[3];
      B[i * 4] = a[4]; B[i * 4 + 1] = a[5]; B[i * 4 + 2] = a[6]; B[i * 4 + 3] = this.pint.indice[n.pintura] ?? 0;
      M[i * 3] = marca[0]; M[i * 3 + 1] = marca[1]; M[i * 3 + 2] = marca[2];
    }
    for (const id in this.dis) for (const l of this.dis[id].lods) {
      const m = l.mesh; if (!m.count) continue;
      m.instanceMatrix.needsUpdate = true;
      for (const a of ['iAnimA', 'iAnimB', 'iMarca']) m.geometry.attributes[a].needsUpdate = true;
    }
    for (const b in this.balizas) {
      const B = this.balizas[b]; B.geo.setDrawRange(0, B.n); B.geo.attributes.position.needsUpdate = B.n > 0; B.pts.visible = this.visible !== false && B.n > 0;
    }
  }
  // triángulos de cada diseño por nivel (para el informe)
  resumen() {
    return Object.fromEntries(Object.entries(this.dis).map(([id, D]) => [id, D.lods.map(l => Math.round(l.tris))]));
  }
  setVisible(v) { this.visible = v; for (const id in this.dis) for (const l of this.dis[id].lods) l.mesh.visible = v; for (const b in this.balizas) this.balizas[b].pts.visible = v; }
  // cantidad de balizas dibujadas por bando (para el informe y las pruebas)
  balizasPorBando() { return Object.fromEntries(Object.entries(this.balizas).map(([b, B]) => [b, B.n])); }
}
