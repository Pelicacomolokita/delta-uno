/* ---------- Diseños de la nave ----------
   Todas las variantes tienen la misma silueta vista desde arriba (punta en z = -3, alas hasta x = ±2,4 en z = 1,6),
   así los tiros y los choques siguen pegando donde se ve la nave. Cambia el volumen: cabina, motores, aletas y placas.
   Los colores vienen de una paleta; "marca" pinta la franja y las puntas de ala (cada aliado tiene la suya).
   La textura (paneles, remaches, desgaste y hollín) se dibuja acá mismo, sin archivos; cuando lleguen los packs de
   texturas de metal se puede reemplazar. */

export const PALETAS = {
  guardia: {
    nombre: 'Guardia', // reporte 0.3: gris claro, azul petróleo y marcas blancas
    top: [0.62, 0.65, 0.67], top2: [0.53, 0.57, 0.6], acento: [0.12, 0.33, 0.4], panza: [0.11, 0.27, 0.34], panzaD: [0.07, 0.18, 0.23],
    marca: [0.94, 0.94, 0.91], oscuro: [0.2, 0.22, 0.24], vidrio: [0.05, 0.14, 0.2], vidrioD: [0.03, 0.08, 0.12], tobera: [0.11, 0.11, 0.12]
  },
  actual: {
    nombre: 'Actual',
    top: [0.96, 0.92, 0.84], top2: [0.84, 0.8, 0.74], acento: [0.72, 0.68, 0.64], panza: [0.16, 0.28, 0.56], panzaD: [0.1, 0.17, 0.38],
    marca: [1, 0.4, 0.22], oscuro: [0.26, 0.26, 0.3], vidrio: [0.06, 0.16, 0.22], vidrioD: [0.03, 0.08, 0.12], tobera: [0.12, 0.12, 0.14]
  }
};

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const up = (p, d) => [p[0], p[1] + d, p[2]];
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Arma triángulos con color por cara (con una variación chica, para que se noten las placas) y UV vista desde arriba
function builder() {
  const pos = [], col = [], uv = [];
  let face = 0;
  const api = {
    poly(pts, k, vary = 0.05) {
      const w = 1 + (hash(face++) - 0.5) * 2 * vary;
      for (let i = 1; i < pts.length - 1; i++) {
        for (const p of [pts[0], pts[i], pts[i + 1]]) {
          pos.push(p[0], p[1], p[2]);
          col.push(Math.min(1, k[0] * w), Math.min(1, k[1] * w), Math.min(1, k[2] * w));
          uv.push((p[0] + 2.7) / 5.4, 1 - (p[2] + 3.2) / 5.4);
        }
      }
    },
    // lo mismo del lado izquierdo y su espejo del derecho
    sym(pts, k, vary) { api.poly(pts, k, vary); api.poly(pts.map(p => [-p[0], p[1], p[2]]), k, vary); },
    // un triángulo partido en 4 o 16 placas, cada una con su tono
    plates(a, b, c, k, level = 1, vary = 0.07, mirror = true) {
      const go = (a, b, c, l) => {
        if (!l) { (mirror ? api.sym : api.poly)([a, b, c], k, vary); return; }
        const ab = lerp(a, b, 0.5), bc = lerp(b, c, 0.5), ca = lerp(c, a, 0.5);
        go(a, ab, ca, l - 1); go(ab, b, bc, l - 1); go(ca, bc, c, l - 1); go(ab, bc, ca, l - 1);
      };
      go(a, b, c, level);
    },
    // tubo a lo largo de z: sección poligonal (x, y) centrada en (cx, cy), escalada s0 adelante y s1 atrás
    tube(cx, cy, z0, z1, sec, s0, s1, k, kFront, kBack, mirror = true) {
      const ring = (z, s) => sec.map(([x, y]) => [cx + x * s, cy + y * s, z]);
      const A = ring(z0, s0), B = ring(z1, s1), n = sec.length, put = mirror ? api.sym : api.poly;
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; put([A[i], A[j], B[j], B[i]], k, 0.06); }
      if (kFront) put(A, kFront, 0);
      if (kBack) {
        put(B, kBack, 0);
        const inner = ring(z1 - 0.12, s1 * 0.62); // la boca de la tobera, hundida
        for (let i = 0; i < n; i++) { const j = (i + 1) % n; put([B[i], B[j], inner[j], inner[i]], [kBack[0] * 0.6, kBack[1] * 0.6, kBack[2] * 0.6], 0); }
      }
    },
    box(x0, x1, y0, y1, z0, z1, k, kTop, mirror = true) {
      const put = mirror ? api.sym : api.poly, t = kTop || k;
      put([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], t, 0.05);
      put([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], k, 0.05);
      put([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], k, 0.05);
      put([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], k, 0.05);
      put([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], k, 0.05);
      put([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], k, 0.05);
    },
    data: () => ({ pos, col, uv })
  };
  return api;
}

const HEX = [[0, 1], [-0.87, 0.5], [-0.87, -0.5], [0, -1], [0.87, -0.5], [0.87, 0.5]];
const OCT = [[0, 1], [-0.71, 0.71], [-1, 0], [-0.71, -0.71], [0, -1], [0.71, -0.71], [1, 0], [0.71, 0.71]];
const DIAMOND = [[0, 1], [-1, 0.1], [0, -0.75], [1, 0.1]];

// Ala delta con placas, franja de marca y punta pintada. L: punta del ala; LE1: punto del borde de ataque; WR: raíz; TL: borde de fuga
function wing(b, c, P, L, LE1, WR, TL, belly, bellyAt) {
  b.plates(LE1, L, WR, c.top, 1);
  b.plates(L, TL, WR, c.top2, 1);
  // franja y punta de ala con el color de marca
  const A1 = lerp(L, LE1, 0.24), A2 = lerp(L, LE1, 0.34), B1 = lerp(L, TL, 0.24), B2 = lerp(L, TL, 0.34);
  b.sym([up(A1, 0.012), up(A2, 0.012), up(B2, 0.012), up(B1, 0.012)], c.marca, 0.02);
  b.sym([up(L, 0.014), up(A1, 0.014), up(B1, 0.014)], c.marca, 0.02);
  // panza
  b.sym([P.N, L, bellyAt], belly, 0.04);
  b.sym([L, TL, bellyAt], c.panzaD, 0.04);
}

/* ---------- Las variantes ---------- */
// engines: dónde salen las llamas; muzzles: de dónde salen los tiros
export const NAVES = {
  actual: {
    nombre: 'Actual', desc: 'La de hoy: plana y liviana.',
    engines: [[-0.55, 0.04, 1.42], [0.55, 0.04, 1.42]], muzzles: [[-1.55, -0.02, 0.3], [1.55, -0.02, 0.3]],
    build(b, c) {
      const N = [0, 0, -3], L = [-2.4, -0.1, 1.6], Sp = [0, 0.62, 0.55], B = [0, -0.34, 0.7], TL = [-0.85, 0.06, 1.35];
      const P1 = lerp(N, L, 0.74), Q1 = lerp(L, Sp, 0.28), P2 = lerp(L, TL, 0.4);
      b.sym([P1, L, Q1], c.marca, 0); b.sym([N, P1, Q1], c.top, 0); b.sym([N, Q1, Sp], c.top, 0);
      b.sym([L, P2, Q1], c.marca, 0); b.sym([P2, TL, Sp], c.acento, 0); b.sym([P2, Sp, Q1], c.acento, 0);
      b.poly([TL, [0.85, 0.06, 1.35], Sp], c.acento, 0);
      b.sym([N, B, L], c.panza, 0); b.sym([L, B, TL], c.panzaD, 0); b.poly([TL, B, [0.85, 0.06, 1.35]], c.panzaD, 0);
      b.sym([[0, 0.335, -1.15], [-0.38, 0.42, 0.1], [0, 0.78, 0.35]], c.vidrio, 0);
      b.poly([[-0.38, 0.42, 0.1], [0.38, 0.42, 0.1], [0, 0.78, 0.35]], c.vidrioD, 0);
    }
  },

  guardia: {
    nombre: 'Guardia', desc: 'Caza estándar: dos motores en góndolas, aletas dobles inclinadas y placas reparadas.',
    engines: [[-0.55, 0.06, 1.47], [0.55, 0.06, 1.47]], muzzles: [[-1.55, -0.1, 0.05], [1.55, -0.1, 0.05]],
    build(b, c) {
      const P = { N: [0, 0, -3] }, L = [-2.4, -0.06, 1.6], LE1 = lerp(P.N, L, 0.42), WR = [-0.72, 0.26, 0.35], TL = [-0.98, 0.06, 1.32];
      const SpF = [0, 0.3, -1.5], Sp = [0, 0.5, 0.35], TC = [0, 0.16, 1.32], B = [0, -0.3, 0.45], TCb = [0, -0.06, 1.32];
      // trompa y lomo
      b.sym([P.N, LE1, SpF], c.top, 0.05);
      b.sym([LE1, WR, SpF], c.top2, 0.05);
      b.sym([SpF, WR, Sp], c.top, 0.04);
      b.sym([WR, TC, Sp], c.acento, 0.04);
      b.sym([WR, TL, TC], c.top2, 0.05);
      wing(b, c, P, L, LE1, WR, TL, c.panza, B);
      b.sym([TL, TC, TCb], c.oscuro, 0.03);
      b.sym([TL, TCb, B], c.panzaD, 0.03);
      // cabina con marco
      const C0 = [0, 0.36, -1.62], C1 = [-0.27, 0.44, -0.95], C2 = [-0.28, 0.5, -0.25], C3 = [0, 0.74, -0.5], C4 = [0, 0.6, 0.12];
      b.sym([C0, C1, C3], c.vidrio, 0); b.sym([C1, C2, C3], c.vidrioD, 0); b.sym([C2, C4, C3], c.vidrio, 0);
      b.sym([up(C1, -0.02), [-0.33, 0.4, -0.95], [-0.34, 0.46, -0.25], up(C2, -0.02)], c.oscuro, 0);
      // góndolas de motor y toberas
      b.tube(-0.55, 0.06, -0.15, 1.47, HEX, 0.17, 0.25, c.top2, c.oscuro, c.tobera);
      b.box(-0.6, -0.5, 0.25, 0.33, 0.2, 1.1, c.acento, c.acento); // lomo de la góndola, azul
      // aletas dobles inclinadas hacia afuera
      b.sym([[-0.82, 0.22, 0.72], [-0.86, 0.2, 1.36], [-1.12, 0.74, 1.46], [-1.04, 0.76, 1.12]], c.top2, 0.04);
      b.sym([[-1.04, 0.76, 1.12], [-1.12, 0.74, 1.46], [-1.14, 0.8, 1.5], [-1.06, 0.82, 1.14]], c.marca, 0);
      // cañones bajo el ala
      b.tube(-1.55, -0.12, 0.05, 0.95, HEX, 0.05, 0.07, c.oscuro, c.oscuro, c.oscuro);
      // tomas de aire bajo la trompa
      b.sym([[-0.2, -0.05, -1.2], [-0.45, -0.06, -0.6], [-0.42, -0.2, -0.5], [-0.18, -0.18, -1.0]], c.oscuro, 0);
    }
  },

  interceptor: {
    nombre: 'Interceptor', desc: 'Más fino y agresivo: fuselaje en punta, aletas delanteras, un motor grande y aleta alta.',
    engines: [[-0.2, 0.04, 1.62], [0.2, 0.04, 1.62]], muzzles: [[-1.5, -0.05, 0.55], [1.5, -0.05, 0.55]],
    build(b, c) {
      const P = { N: [-0.3, 0.05, -0.95] }, L = [-2.4, -0.04, 1.6], LE1 = lerp(P.N, L, 0.3), WR = [-0.32, 0.12, 0.45], TL = [-0.42, 0.05, 1.42];
      // fuselaje en rombo, de la punta a la cola
      b.tube(0, 0.04, -3, 1.55, DIAMOND, 0.02, 0.42, c.acento, null, c.tobera, false);
      b.tube(0, 0.04, -3, -1.7, DIAMOND, 0.02, 0.32, c.top, null, null, false);
      // alas finas que arrancan más atrás
      b.plates(LE1, L, WR, c.top, 1, 0.06);
      b.plates(L, TL, WR, c.top2, 1, 0.06);
      b.plates(P.N, LE1, WR, c.top2, 0, 0.06);
      const A1 = lerp(L, LE1, 0.22), A2 = lerp(L, LE1, 0.3), B1 = lerp(L, TL, 0.22), B2 = lerp(L, TL, 0.3);
      b.sym([up(A1, 0.012), up(A2, 0.012), up(B2, 0.012), up(B1, 0.012)], c.marca, 0);
      b.sym([up(L, 0.014), up(A1, 0.014), up(B1, 0.014)], c.marca, 0);
      b.sym([P.N, L, [-0.3, -0.12, 0.5]], c.panza, 0.04); b.sym([L, TL, [-0.3, -0.12, 0.5]], c.panzaD, 0.04);
      // aletas delanteras (canards)
      b.sym([[-0.28, 0.12, -1.95], [-0.98, 0.07, -1.32], [-0.9, 0.07, -1.18], [-0.28, 0.12, -1.55]], c.top2, 0.04);
      // cabina de burbuja
      const C0 = [0, 0.34, -2.15], C1 = [-0.22, 0.42, -1.7], C2 = [-0.22, 0.46, -1.0], C3 = [0, 0.66, -1.35], C4 = [0, 0.54, -0.75];
      b.sym([C0, C1, C3], c.vidrio, 0); b.sym([C1, C2, C3], c.vidrioD, 0); b.sym([C2, C4, C3], c.vidrio, 0);
      // motor central grande
      b.tube(0, 0.04, 0.35, 1.64, OCT, 0.3, 0.38, c.top2, null, c.tobera, false);
      // aleta dorsal alta, con la marca
      b.poly([[0, 0.38, 0.55], [0, 0.42, 1.5], [0, 1.08, 1.66], [0, 1.02, 1.22]], c.acento, 0.03);
      b.poly([[0, 1.02, 1.22], [0, 1.08, 1.66], [0, 1.16, 1.7], [0, 1.1, 1.26]], c.marca, 0);
      // rieles de cañón en las alas
      b.box(-1.56, -1.44, -0.1, -0.02, 0.55, 1.25, c.oscuro);
    }
  },

  blindado: {
    nombre: 'Blindado', desc: 'Más pesado: alas gruesas con placas de blindaje, tomas de aire, dos toberas grandes y puntas caídas.',
    engines: [[-0.62, 0.04, 1.5], [0.62, 0.04, 1.5]], muzzles: [[-1.5, -0.14, 0.1], [1.5, -0.14, 0.1]],
    build(b, c) {
      const P = { N: [0, -0.02, -3] }, L = [-2.4, -0.3, 1.6], LE1 = lerp(P.N, L, 0.42), WR = [-0.78, 0.34, 0.3], TL = [-1.05, 0.08, 1.34];
      const SpF = [0, 0.36, -1.45], Sp = [0, 0.62, 0.3], TC = [0, 0.2, 1.34], B = [0, -0.44, 0.4], TCb = [0, -0.1, 1.34];
      const K = lerp(LE1, L, 0.55); // quiebre del ala: de ahí hacia afuera, la punta cae
      const KT = lerp(TL, L, 0.55);
      b.sym([P.N, LE1, SpF], c.top, 0.05);
      b.sym([LE1, WR, SpF], c.top2, 0.05);
      b.sym([SpF, WR, Sp], c.top, 0.04);
      b.sym([WR, TC, Sp], c.acento, 0.04);
      b.sym([WR, TL, TC], c.top2, 0.05);
      // ala interior gruesa y punta caída
      const Ki = up(K, 0.18), KTi = up(KT, 0.16);
      b.plates(LE1, Ki, WR, c.top, 1); b.plates(Ki, KTi, WR, c.top2, 1); b.plates(KTi, TL, WR, c.top, 1);
      b.sym([Ki, L, KTi], c.top2, 0.05);
      const A1 = lerp(L, Ki, 0.3), B1 = lerp(L, KTi, 0.3);
      b.sym([up(L, 0.01), up(A1, 0.01), up(B1, 0.01)], c.marca, 0);
      b.sym([P.N, L, B], c.panza, 0.04); b.sym([L, TL, B], c.panzaD, 0.04);
      b.sym([TL, TC, TCb], c.oscuro, 0.03); b.sym([TL, TCb, B], c.panzaD, 0.03);
      b.sym([LE1, Ki, L], c.oscuro, 0.02); // canto del ala, gastado
      // placas de blindaje encima del ala
      b.box(-1.32, -1.0, 0.1, 0.17, 0.35, 0.85, c.oscuro, c.acento);
      b.box(-0.86, -0.64, 0.3, 0.37, -0.45, 0.1, c.oscuro, c.acento);
      // cabina chica y protegida
      const C0 = [0, 0.4, -1.5], C1 = [-0.24, 0.48, -1.0], C2 = [-0.25, 0.54, -0.45], C3 = [0, 0.74, -0.7], C4 = [0, 0.66, -0.15];
      b.sym([C0, C1, C3], c.vidrio, 0); b.sym([C1, C2, C3], c.vidrioD, 0); b.sym([C2, C4, C3], c.oscuro, 0);
      // tomas de aire y toberas grandes
      b.sym([[-0.36, 0.3, -0.9], [-0.72, 0.28, -0.9], [-0.72, 0.06, -0.85], [-0.36, 0.08, -0.85]], c.tobera, 0);
      b.tube(-0.62, 0.04, -0.85, 1.5, OCT, 0.26, 0.32, c.top2, null, c.tobera);
      // joroba de sensores en el lomo
      b.box(-0.12, 0.12, 0.6, 0.74, 0.3, 0.75, c.oscuro, c.acento, false);
      b.tube(-1.5, -0.16, 0.1, 0.9, HEX, 0.06, 0.08, c.oscuro, c.oscuro, c.oscuro);
    }
  }
};

export function naveGeometria(T, modelo = 'guardia', paleta = 'guardia', marca) {
  const c = Object.assign({}, PALETAS[paleta] || PALETAS.guardia);
  if (marca) c.marca = marca;
  const b = builder();
  (NAVES[modelo] || NAVES.guardia).build(b, c);
  const { pos, col, uv } = b.data();
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/* Textura de paneles: líneas de placas, remaches, desgaste, rayones y hollín detrás de los motores.
   Es casi blanca (multiplica el color de cada placa), así sirve para cualquier paleta. */
let texCache = null;
export function naveTextura(T) {
  if (texCache) return texCache;
  const S = 512, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  let s = 1337; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const X = x => (x + 2.7) / 5.4 * S, Z = z => (z + 3.2) / 5.4 * S;
  g.fillStyle = '#fff'; g.fillRect(0, 0, S, S);
  // desgaste: manchas suaves
  for (let i = 0; i < 260; i++) {
    const x = rnd() * S, y = rnd() * S, r = 4 + rnd() * 26;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(70,64,58,' + (0.05 + rnd() * 0.08).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(70,64,58,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // líneas de paneles: a lo largo y cruzadas, más algunas paralelas al borde de ataque
  g.strokeStyle = 'rgba(30,32,36,0.55)'; g.lineWidth = 1.3;
  g.strokeStyle = 'rgba(30,32,36,0.42)';
  for (let z = -2.6; z < 1.7; z += 0.42) for (let x = -2.7; x < 2.7; x += 0.55) if (rnd() < 0.8) { g.beginPath(); g.moveTo(X(x), Z(z)); g.lineTo(X(x + 0.55), Z(z)); g.stroke(); }
  for (let x = -2.2; x <= 2.2; x += 0.55) for (let z = -3; z < 1.7; z += 0.42) if (rnd() < 0.7) { g.beginPath(); g.moveTo(X(x), Z(z)); g.lineTo(X(x), Z(z + 0.42)); g.stroke(); }
  for (let k = -1; k <= 1; k += 2) for (let o = 0.35; o < 2.2; o += 0.5) {
    g.beginPath(); g.moveTo(X(k * o), Z(-3 + o * 0.6)); g.lineTo(X(k * (o + 2.4)), Z(-3 + o * 0.6 + 4.6)); g.stroke();
  }
  // remaches sobre las líneas
  g.fillStyle = 'rgba(25,26,30,0.6)';
  for (let z = -2.6; z < 1.7; z += 0.42) for (let x = -2.6; x < 2.6; x += 0.11) g.fillRect(X(x) - 0.8, Z(z) + 2.2, 1.6, 1.6);
  // placas reparadas: rectángulos de otro tono con su borde
  for (let i = 0; i < 18; i++) {
    const w = 18 + rnd() * 46, h = 12 + rnd() * 34, x = rnd() * (S - w), y = rnd() * (S - h);
    g.fillStyle = 'rgba(60,60,58,' + (0.06 + rnd() * 0.1).toFixed(3) + ')'; g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(28,28,30,0.5)'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w, h);
  }
  // rayones finos
  g.strokeStyle = 'rgba(40,40,44,0.28)'; g.lineWidth = 0.8;
  for (let i = 0; i < 90; i++) {
    const x = rnd() * S, y = rnd() * S, a = rnd() * Math.PI, l = 6 + rnd() * 22;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // hollín detrás de los motores y en el borde de fuga
  for (const x of [-0.6, 0, 0.6]) {
    const gr = g.createRadialGradient(X(x), Z(1.6), 2, X(x), Z(1.5), 70);
    gr.addColorStop(0, 'rgba(20,18,16,0.55)'); gr.addColorStop(1, 'rgba(20,18,16,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
  }
  const tex = new T.CanvasTexture(cv);
  tex.anisotropy = 4;
  texCache = tex;
  return tex;
}

export function naveMaterial(T, extra) {
  return new T.MeshPhongMaterial(Object.assign({
    vertexColors: true, map: naveTextura(T), flatShading: true, side: T.DoubleSide,
    shininess: 38, specular: 0x3a3d42, emissive: 0x101216
  }, extra || {}));
}
