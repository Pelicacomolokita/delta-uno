// "Forma vieja", solo para comparar: cada nave es un grupo de objetos sueltos (un objeto por pieza móvil y
// unos pocos para el resto), animados desde el procesador, sin instancias y sin niveles de detalle.
// Es como habría que hacerlo con piezas separadas sin la técnica nueva.
import * as T from 'three';
import { armarDiseno } from '../../src/naves/generador.js';
import { DISENOS, PINTURAS, ESCALA_CLASE } from '../../src/naves/disenos.js';

export class FlotaVieja {
  constructor(scene, ids, detalleTex) {
    this.scene = scene;
    this.mat = new T.MeshPhongMaterial({ vertexColors: true, flatShading: true, side: T.DoubleSide, map: detalleTex || null, shininess: 38, specular: 0x3a3d42, emissive: 0x101216 });
    this.piezas = {};
    for (const id of ids) {
      const base = DISENOS[id], dis = { ...base, escala: ESCALA_CLASE[base.clase] || 1 };
      const d = armarDiseno(dis, 0), pint = PINTURAS[base.pintura].zonas.map(h => new T.Color(h));
      const grupos = new Map();
      for (let v = 0; v < d.n; v += 3) {
        const canal = d.bis[v * 4 + 3];
        let key;
        if (canal < 0) key = 's' + [0, 0, 0, 0, 1, 2, 3, 0][d.zona[v]]; // lo fijo, en 4 piezas: casco, alas, oscuro, vidrio
        else key = canal + ':' + [0, 1, 2].map(j => d.bis[v * 4 + j].toFixed(2)).join(',');
        if (!grupos.has(key)) grupos.set(key, []);
        grupos.get(key).push(v);
      }
      this.piezas[id] = [...grupos.values()].map(tris => {
        const v0 = tris[0], piv = [d.bis[v0 * 4], d.bis[v0 * 4 + 1], d.bis[v0 * 4 + 2]], canal = d.bis[v0 * 4 + 3];
        const pos = [], col = [], uv = [];
        for (const t of tris) for (let k = 0; k < 3; k++) {
          const v = t + k;
          pos.push(d.pos[v * 3] - piv[0], d.pos[v * 3 + 1] - piv[1], d.pos[v * 3 + 2] - piv[2]);
          const c = pint[d.zona[v]]; col.push(c.r * d.tono[v], c.g * d.tono[v], c.b * d.tono[v]);
          uv.push(d.uv[v * 2], d.uv[v * 2 + 1]);
        }
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
        g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
        g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
        g.computeVertexNormals();
        return { g, piv, canal, eje: new T.Vector3(d.eje[v0 * 4], d.eje[v0 * 4 + 1], d.eje[v0 * 4 + 2]), max: d.eje[v0 * 4 + 3] };
      });
    }
    this.naves = [];
  }
  preparar(n) {
    for (const o of this.naves) this.scene.remove(o.grupo);
    this.naves = [];
    for (let i = 0; i < n.length; i++) {
      const grupo = new T.Group(), partes = [];
      for (const p of this.piezas[n[i].id]) {
        const m = new T.Mesh(p.g, this.mat); m.position.set(...p.piv);
        grupo.add(m); partes.push({ m, p });
      }
      this.scene.add(grupo); this.naves.push({ grupo, partes });
    }
  }
  actualizar(n) {
    for (let i = 0; i < this.naves.length; i++) {
      const o = this.naves[i], s = n[i];
      o.grupo.position.copy(s.pos); o.grupo.quaternion.copy(s.quat);
      for (const { m, p } of o.partes) {
        if (p.canal < 0) continue;
        const v = s.anim[p.canal];
        if (p.canal === 4) { const k = 1 + v * p.max; m.scale.set(k, k, 1); }
        else m.quaternion.setFromAxisAngle(p.eje, v * p.max);
      }
    }
  }
  setVisible(v) { for (const o of this.naves) o.grupo.visible = v; }
  limpiar() { for (const o of this.naves) this.scene.remove(o.grupo); this.naves = []; }
}
