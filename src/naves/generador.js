/* ---------- Generador de naves por piezas ----------
   Cada diseño es una lista de piezas (fuselaje, alas, timones, motores, armas, frenos, compuertas).
   Acá se convierte en una malla por nivel de detalle (LOD). Cada vértice guarda:
   - zona de pintura (0..7): base, base2, acento, panza, marca, oscuro, vidrio, parche
   - bisagra de su pieza móvil: punto (xyz) y canal; eje (xyz) y ángulo máximo con signo
   Así todas las piezas se mueven en la placa de video sin objetos aparte (ver flota.js).
   Ejes del juego: -Z adelante, +Y arriba, +X derecha. Medidas en metros (antes de la escala de la clase). */

export const ZONA = { base: 0, base2: 1, acento: 2, panza: 3, marca: 4, oscuro: 5, vidrio: 6, parche: 7 };
// canales de animación: los valores llegan por nave, de -1 a 1 (o de 0 a 1)
export const CANAL = { ninguno: -1, aleron: 0, timon: 1, elevador: 2, freno: 3, tobera: 4, compuertas: 5, camuflaje: 6 };
const MAX = { 0: 0.42, 1: 0.45, 2: 0.4, 3: 0.95, 4: 0.28, 5: 1.25, 6: 0.5 }; // ángulo máximo (rad) o apertura de tobera

// por nivel de detalle: lados de los tubos, cortes extra entre estaciones, subdivisión de superficies, piezas chicas
export const LOD_PARAM = [
  { lados: 24, cortes: 5, sub: 6, chicas: true, moviles: true },
  { lados: 10, cortes: 1, sub: 1, chicas: true, moviles: true },
  { lados: 6, cortes: 0, sub: 1, chicas: false, moviles: false }
];

const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/* ---------- Acumulador de triángulos ---------- */
function malla() {
  const pos = [], zona = [], tono = [], bis = [], eje = [], uv = [];
  let cara = 0;
  const NINGUNA = { piv: [0, 0, 0], canal: -1, eje: [0, 0, 1], max: 0 };
  const api = {
    // polígono convexo (en orden), con zona y pieza móvil opcional
    poly(pts, z, mov = NINGUNA, k = 1) {
      const t = (1 + (hash(cara++) - 0.5) * 0.09) * k; // cada placa con su tono; k oscurece uniones y hollín
      const nf = cross(sub3(pts[1], pts[0]), sub3(pts[pts.length - 1], pts[0]));
      const ax = Math.abs(nf[0]), ay = Math.abs(nf[1]), az = Math.abs(nf[2]);
      // la textura de detalle se proyecta desde arriba, el costado o el frente, según hacia dónde mira la cara
      const U = ay >= ax && ay >= az ? p => [p[0], p[2]] : ax >= az ? p => [p[2], p[1]] : p => [p[0], p[1]];
      for (let i = 1; i < pts.length - 1; i++) {
        for (const p of [pts[0], pts[i], pts[i + 1]]) {
          const q = U(p);
          pos.push(p[0], p[1], p[2]); zona.push(z); tono.push(t); uv.push((q[0] + 2.7) / 5.4, 1 - (q[1] + 3.2) / 5.4);
          bis.push(mov.piv[0], mov.piv[1], mov.piv[2], mov.canal);
          eje.push(mov.eje[0], mov.eje[1], mov.eje[2], mov.max);
        }
      }
    },
    quad(a, b, c, d, z, mov, k) { api.poly([a, b, c, d], z, mov, k); },
    datos: () => ({ pos, zona, tono, bis, eje, uv, n: pos.length / 3 })
  };
  return api;
}

/* ---------- Piezas ---------- */
// sección del fuselaje: superelipse; p chico = más cuadrada
const FORMA = { oct: 0.75, box: 0.3, flat: 0.95 };

function fuselaje(m, P, pz) {
  const est = [...pz.est].sort((a, b) => a[0] - b[0]);
  const N = P.lados, pe = FORMA[pz.seccion || 'oct'], x0 = pz.x || 0;
  // estaciones con cortes intermedios
  const st = [];
  for (let i = 0; i < est.length; i++) {
    st.push(est[i]);
    if (i < est.length - 1) for (let k = 1; k <= P.cortes; k++) {
      const t = k / (P.cortes + 1), a = est[i], b = est[i + 1];
      st.push(a.map((v, j) => v + (b[j] - v) * t));
    }
  }
  const ring = ([z, w, yt, yb]) => {
    const cy = (yt + yb) / 2, h = (yt - yb) / 2, out = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      const flat = pz.seccion === 'flat' ? 0.62 + 0.38 * Math.abs(c) : 1; // chato: más angosto arriba y abajo
      out.push([x0 + Math.sign(c) * Math.pow(Math.abs(c), pe) * w, cy + Math.sign(s) * Math.pow(Math.abs(s), pe) * h * flat, z]);
    }
    return out;
  };
  const R = st.map(ring);
  const [lz0, lz1, lfr] = pz.lomo || [0, 0, 0];
  const zCola = st[st.length - 1][0];
  for (let i = 0; i < R.length - 1; i++) {
    const A = R[i], B = R[i + 1], e0 = st[i], e1 = st[i + 1];
    const yb = (e0[3] + e1[3]) / 2, yt = (e0[2] + e1[2]) / 2, w = Math.max(e0[1], e1[1]);
    for (let j = 0; j < N; j++) {
      const k = (j + 1) % N, c = lerp3(lerp3(A[j], A[k], 0.5), lerp3(B[j], B[k], 0.5), 0.5);
      let z = pz.zona ?? ZONA.base;
      if (c[1] < yb + (yt - yb) * 0.3) z = ZONA.panza;
      else if (lfr && c[2] > lz0 && c[2] < lz1 && Math.abs(c[0] - x0) < w * lfr && c[1] > (yt + yb) / 2) z = ZONA.acento;
      const holl = c[2] > zCola - 0.45 ? 0.74 + 0.26 * (zCola - c[2]) / 0.45 : 1; // hollín cerca de las toberas
      m.quad(A[j], B[j], B[k], A[k], z, undefined, holl);
    }
  }
  // tapas: atrás oscura (si la última estación tiene ancho), adelante si no termina en punta
  const last = R[R.length - 1], first = R[0];
  if (st[st.length - 1][1] > 0.01) m.poly([...last].reverse(), ZONA.oscuro);
  if (st[0][1] > 0.01) m.poly(first, ZONA.base);
}

function cabina(m, P, pz) {
  const { z0, z1, w, yb, yt } = pz, x0 = pz.x || 0, N = Math.max(6, P.lados >> 1), C = P.cortes + 3;
  const R = [];
  for (let i = 0; i <= C; i++) {
    const t = i / C, z = z0 + (z1 - z0) * t, f = Math.sin(Math.PI * Math.pow(t, 0.8));
    const ring = [];
    for (let j = 0; j <= N; j++) {
      const a = Math.PI * j / N;
      ring.push([x0 + Math.cos(a) * w * f, yb + Math.sin(a) * (yt - yb) * f, z]);
    }
    R.push(ring);
  }
  for (let i = 0; i < C; i++) for (let j = 0; j < N; j++)
    m.quad(R[i][j], R[i + 1][j], R[i + 1][j + 1], R[i][j + 1], j === 0 || j === N - 1 ? ZONA.oscuro : ZONA.vidrio);
}

// superficie con espesor: raíz (borde de ataque + cuerda) a punta. mov: [s0, s1, fracción de cuerda] o 'todo'
function superficie(m, P, pz, lado) {
  const { rle, cr, tle, ct } = pz, t = pz.t ?? 0.08;
  const rte = [rle[0], rle[1], rle[2] + cr], tte = [tle[0], tle[1], tle[2] + ct];
  const d = sub3(tle, rle), vertical = Math.abs(d[1]) > Math.abs(d[0]);
  let n = norm([d[1], -d[0], 0]);
  if (!vertical && n[1] < 0) n = [-n[0], -n[1], 0];
  const at = (s, c, k) => { const p = lerp3(lerp3(rle, tle, s), lerp3(rte, tte, s), c); return [p[0] + n[0] * k * t / 2, p[1] + n[1] * k * t / 2, p[2] + n[2] * k * t / 2]; };
  const canal = pz.canal ?? (pz.mov ? CANAL.aleron : -1);
  const marca = pz.marca || 0;
  // cortes en el largo (s) y en la cuerda (c), alineados con la pieza móvil y la marca
  const S = new Set([0, 1]), Cc = new Set([0, 1]);
  for (let i = 1; i < P.sub; i++) { S.add(i / P.sub); Cc.add(i / P.sub); }
  const movs = [];
  if (P.moviles && pz.mov && pz.mov !== 'todo') movs.push({ r: pz.mov, canal });
  if (P.moviles) for (const [r, cn] of (pz.extra || [])) movs.push({ r, canal: cn });
  for (const { r } of movs) { S.add(r[0]); S.add(r[1]); Cc.add(1 - r[2]); }
  if (marca) S.add(1 - marca);
  const ss = [...S].sort((a, b) => a - b), cs = [...Cc].sort((a, b) => a - b);
  const bisagra = (r, cn) => {
    const piv = at(r[0], 1 - r[2], 0), e = norm(sub3(at(r[1], 1 - r[2], 0), piv));
    return { piv, eje: e, canal: cn, max: MAX[cn] * signo(cn, lado) };
  };
  const movTodo = P.moviles && pz.mov === 'todo' ? (() => {
    const piv = at(0, 0.3, 0), e = norm(sub3(at(1, 0.3, 0), piv));
    return { piv, eje: e, canal, max: MAX[canal] * signo(canal, lado) };
  })() : null;
  const fillZ = ZONA[pz.fill || 'base'];
  for (let i = 0; i < ss.length - 1; i++) for (let j = 0; j < cs.length - 1; j++) {
    const sm = (ss[i] + ss[i + 1]) / 2, cm = (cs[j] + cs[j + 1]) / 2;
    let z = fillZ, mov = movTodo || undefined;
    for (const { r, canal: cn } of movs) if (sm > r[0] && sm < r[1] && cm > 1 - r[2]) { mov = bisagra(r, cn); z = cn === CANAL.elevador ? ZONA.acento : ZONA.base2; }
    if (marca && sm > 1 - marca) z = ZONA.marca;
    const [s0, s1, c0, c1] = [ss[i], ss[i + 1], cs[j], cs[j + 1]];
    const raiz = 0.8 + 0.2 * Math.min(1, sm / 0.22); // sombra en la unión con el fuselaje
    m.quad(at(s0, c0, 1), at(s1, c0, 1), at(s1, c1, 1), at(s0, c1, 1), z, mov, raiz);
    m.quad(at(s0, c1, -1), at(s1, c1, -1), at(s1, c0, -1), at(s0, c0, -1), z === ZONA.base && !vertical ? ZONA.panza : z, mov, raiz);
    if (j === 0) m.quad(at(s0, 0, -1), at(s1, 0, -1), at(s1, 0, 1), at(s0, 0, 1), ZONA.oscuro, mov);
    if (j === cs.length - 2) m.quad(at(s0, 1, 1), at(s1, 1, 1), at(s1, 1, -1), at(s0, 1, -1), ZONA.oscuro, mov);
    if (i === ss.length - 2) m.quad(at(1, c0, 1), at(1, c0, -1), at(1, c1, -1), at(1, c1, 1), z, mov);
  }
}

// en el lado espejado el giro se invierte; alerones y timones se mueven "en paralelo", el resto en espejo
function signo(canal, lado) { return lado < 0 && canal !== CANAL.aleron && canal !== CANAL.timon ? -1 : 1; }

function tubo(m, x, y, z0, z1, r0, r1, N, z, mov, sx = 1, sy = 1, tapa = true) {
  const A = [], B = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    A.push([x + Math.cos(a) * r0 * sx, y + Math.sin(a) * r0 * sy, z0]);
    B.push([x + Math.cos(a) * r1 * sx, y + Math.sin(a) * r1 * sy, z1]);
  }
  for (let i = 0; i < N; i++) { const k = (i + 1) % N; m.quad(A[i], B[i], B[k], A[k], z, mov); }
  if (tapa) { m.poly(A, z, mov); m.poly([...B].reverse(), z, mov); }
  return B;
}

function motor(m, P, pz, lado) {
  const { x, y, z0, z1, r } = pz, tob = pz.tobera ?? 0.3, N = P.lados;
  if (pz.visible !== false) {
    tubo(m, x, y, z0, z1, r, r * 0.96, N, ZONA[pz.fill || 'base'], undefined);
    tubo(m, x, y, z0 - 0.02, z0 + 0.06, r * 1.02, r * 1.02, N, ZONA.oscuro, undefined, 1, 1, false);
  }
  const mov = P.moviles ? { piv: [x, y, z1], eje: [0, 0, 1], canal: CANAL.tobera, max: MAX[CANAL.tobera] } : undefined;
  if (pz.plana) {
    const [w, h] = pz.plana;
    caja(m, x - w / 2, x + w / 2, y - h / 2, y + h / 2, z1, z1 + tob, ZONA.oscuro, mov);
  } else {
    const rt = (pz.r_tob || r * 0.9);
    tubo(m, x, y, z1, z1 + tob, rt, rt * 0.9, N, ZONA.oscuro, mov, 1, 1, false);
    tubo(m, x, y, z1 + tob * 0.6, z1 + tob * 0.62, rt * 0.62, rt * 0.62, N, ZONA.oscuro, undefined, 1, 1, true);
  }
}

function caja(m, x0, x1, y0, y1, z0, z1, z, mov) {
  const p = (x, y, zz) => [x, y, zz];
  m.quad(p(x0, y1, z0), p(x0, y1, z1), p(x1, y1, z1), p(x1, y1, z0), z, mov);
  m.quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1), z, mov);
  m.quad(p(x0, y0, z0), p(x0, y1, z0), p(x1, y1, z0), p(x1, y0, z0), z, mov);
  m.quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1), z, mov);
  m.quad(p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), p(x0, y1, z0), z, mov);
  m.quad(p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1), z, mov);
}

function freno(m, P, pz, lado) {
  const { x0, x1, z0, z1, y } = pz;
  if (pz.lateral !== undefined) {
    const xs = pz.lateral, mov = P.moviles ? { piv: [xs, 0, z0], eje: [0, 1, 0], canal: CANAL.freno, max: MAX[CANAL.freno] * 0.7 * Math.sign(xs) } : undefined;
    caja(m, xs - 0.015, xs + 0.015, x0, x1, z0, z1, ZONA.base2, mov);
  } else {
    const mov = P.moviles ? { piv: [0, y, z1], eje: [1, 0, 0], canal: CANAL.freno, max: MAX[CANAL.freno] } : undefined;
    caja(m, x0, x1, y - 0.015, y + 0.015, z0, z1, ZONA.base2, mov);
  }
}

function compuertas(m, P, pz) {
  const { x0, x1, z0, z1, y } = pz;
  for (const s of [1, -1]) {
    const a = s > 0 ? x0 : -x1, b = s > 0 ? x1 : -x0, hx = s > 0 ? x1 : -x1;
    const mov = P.moviles ? { piv: [hx, y, 0], eje: [0, 0, 1], canal: CANAL.compuertas, max: MAX[CANAL.compuertas] * s } : undefined;
    caja(m, a, b, y - 0.015, y + 0.015, z0, z1, ZONA.panza, mov);
  }
}

function carga(m, P, pz) {
  const { x, y, z0, z1, r } = pz, N = lod => Math.max(6, P.lados >> 1);
  caja(m, x - 0.02, x + 0.02, y + r * 0.8, y + r + 0.14, z0 + (z1 - z0) * 0.25, z1 - (z1 - z0) * 0.3, ZONA.oscuro); // pilón
  if (pz.misil) {
    tubo(m, x, y, z0 + r * 2.5, z1, r, r, N(), ZONA.base2, undefined, 1, 1, false);
    tubo(m, x, y, z0, z0 + r * 2.5, 0.01, r, N(), ZONA.marca, undefined, 1, 1, false);
    m.poly([[x, y, z1], ...Array.from({ length: N() }, (_, i) => [x + Math.cos(i / N() * 6.283) * r, y + Math.sin(i / N() * 6.283) * r, z1])], ZONA.oscuro);
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) // aletas en cruz
      m.poly([[x + dx * r, y + dy * r, z1 - r * 4], [x + dx * r * 2.6, y + dy * r * 2.6, z1 - r * 0.6], [x + dx * r * 2.6, y + dy * r * 2.6, z1], [x + dx * r, y + dy * r, z1]], ZONA.oscuro);
  } else tubo(m, x, y, z0, z1, r, r * 0.8, N(), ZONA.oscuro);
}

const ESPEJO = new Set(['superficie', 'motor', 'caja', 'canon', 'carga', 'freno', 'toma', 'placas']);

/* Arma un diseño en un nivel de detalle. Devuelve arreglos listos para BufferGeometry. */
export function armarDiseno(dis, lod = 0) {
  const P = LOD_PARAM[lod], m = malla();
  for (const pz0 of dis.piezas) {
    const lados = pz0.espejo === false || !ESPEJO.has(pz0.tipo) ? [1] : [1, -1];
    for (const lado of lados) {
      const pz = lado > 0 ? pz0 : espejar(pz0);
      switch (pz.tipo) {
        case 'fuselaje': fuselaje(m, P, pz); if (pz.espejo) fuselaje(m, P, espejar(pz)); break;
        case 'cabina': cabina(m, P, pz); break;
        case 'superficie': superficie(m, P, pz, lado * (pz0.lado || 1)); break;
        case 'motor': motor(m, P, pz, lado); break;
        case 'toma': caja(m, pz.x0, pz.x1, pz.y0, pz.y1, pz.z0, pz.z1, ZONA.oscuro); break;
        case 'caja': if (P.chicas || pz.grande) caja(m, pz.x0, pz.x1, pz.y0, pz.y1, pz.z0, pz.z1, ZONA[pz.fill || 'oscuro']); break;
        case 'canon': if (P.chicas) tubo(m, pz.x, pz.y, pz.z0, pz.z1, pz.r || 0.05, pz.r || 0.05, 6, ZONA.oscuro); break;
        case 'carga': if (P.chicas) carga(m, P, pz); break;
        case 'freno': if (P.moviles || lod < 2) freno(m, P, pz, lado); break;
        case 'compuertas': if (lod < 2) compuertas(m, P, pz); break;
        case 'placas': if (lod < 2) caja(m, pz.x0, pz.x1, pz.y - 0.01, pz.y + 0.02, pz.z0, pz.z1, ZONA.oscuro,
          P.moviles ? { piv: [pz.x0, pz.y, pz.z0], eje: [0, 0, 1], canal: CANAL.camuflaje, max: MAX[CANAL.camuflaje] * lado } : undefined); break;
      }
    }
  }
  const d = m.datos();
  // escala de la clase
  const k = dis.escala || 1;
  for (let i = 0; i < d.pos.length; i++) d.pos[i] *= k;
  for (let i = 0; i < d.bis.length; i += 4) { d.bis[i] *= k; d.bis[i + 1] *= k; d.bis[i + 2] *= k; }
  return d;
}

function espejar(pz) {
  const f = v => Array.isArray(v) && v.length === 3 && typeof v[0] === 'number' ? [-v[0], v[1], v[2]] : v;
  const o = { ...pz };
  for (const k of Object.keys(o)) o[k] = f(o[k]);
  if ('x' in o && typeof o.x === 'number') o.x = -o.x;
  if ('x0' in o && 'x1' in o && pz.tipo !== 'freno') { o.x0 = -pz.x1; o.x1 = -pz.x0; }
  if (pz.tipo === 'freno') { if (pz.lateral !== undefined) o.lateral = -pz.lateral; else { o.x0 = -pz.x1; o.x1 = -pz.x0; } }
  if (pz.tipo === 'placas') { o.x0 = -pz.x0; o.x1 = -pz.x1; }
  return o;
}

/* Puntos útiles del diseño, ya escalados: salida de llamas y de tiros */
export function puntosDiseno(dis) {
  const k = dis.escala || 1, motores = [], bocas = [], luces = [];
  let cola = null;
  for (const pz of dis.piezas) {
    if (pz.tipo === 'superficie' && pz.canal === 0) {
      // punta del ala: luz de navegación, roja a la izquierda y verde a la derecha
      const p = [pz.tle[0], pz.tle[1], pz.tle[2] + pz.ct * 0.5];
      for (const s of pz.espejo === false ? [1] : [1, -1]) {
        const x = p[0] * s;
        luces.push({ p: [x * k, p[1] * k, p[2] * k], color: x < 0 ? 0xff3b30 : 0x3dff7a });
      }
    }
    if (pz.tipo === 'superficie' && pz.canal === 1 && (!cola || pz.tle[1] > cola[1])) cola = [pz.tle[0], pz.tle[1], pz.tle[2] + pz.ct];
    if (pz.tipo !== 'motor' && pz.tipo !== 'canon') continue;
    const lados = pz.espejo === false || pz.x === 0 ? [1] : [1, -1];
    for (const s of lados) {
      if (pz.tipo === 'motor') motores.push([pz.x * s * k, pz.y * k, (pz.z1 + (pz.tobera ?? 0.3)) * k]);
      else bocas.push([pz.x * s * k, pz.y * k, pz.z0 * k]);
    }
  }
  if (cola) luces.push({ p: [cola[0] * k, cola[1] * k, cola[2] * k], color: 0xffffff, cola: true });
  return { motores, bocas, luces };
}
