// Naves por piezas (src/naves/): que cada diseño se arme bien, que no se pase de triángulos,
// que cada pieza gire hacia el lado correcto, que el tamaño corresponda a su clase y que el Hangar ande.
// Se corre con: npm test -- naves
const H = require('../helpers');
const { launch, check, f, path, ROOT, dir } = H;
const { execSync } = require('child_process');
const url = require('url');

const imp = rel => import(url.pathToFileURL(path.join(ROOT, rel)).href);

// misma cuenta que el vertex shader de src/naves/flota.js
function mover(d, anim) {
  const out = new Float32Array(d.n * 3);
  for (let v = 0; v < d.n; v++) {
    let p = [d.pos[v * 3], d.pos[v * 3 + 1], d.pos[v * 3 + 2]];
    const piv = d.bis.slice(v * 4, v * 4 + 3), canal = d.bis[v * 4 + 3], k = d.eje.slice(v * 4, v * 4 + 3), mx = d.eje[v * 4 + 3];
    if (canal > -0.5) {
      const val = anim[canal]; let q = p.map((x, i) => x - piv[i]);
      const dt = k[0] * q[0] + k[1] * q[1] + k[2] * q[2];
      if (canal === 4) { const ax = k.map(x => x * dt); q = q.map((x, i) => ax[i] + (x - ax[i]) * (1 + val * mx)); }
      else {
        const a = val * mx, c = Math.cos(a), s = Math.sin(a), cr = [k[1] * q[2] - k[2] * q[1], k[2] * q[0] - k[0] * q[2], k[0] * q[1] - k[1] * q[0]];
        q = q.map((x, i) => x * c + cr[i] * s + k[i] * dt * (1 - c));
      }
      p = q.map((x, i) => x + piv[i]);
    }
    out[v * 3] = p[0]; out[v * 3 + 1] = p[1]; out[v * 3 + 2] = p[2];
  }
  return out;
}
// desplazamiento medio de las piezas de un canal, por lado (izquierda x<0, derecha x>0)
function desplaz(d, canal) {
  const anim = [0, 0, 0, 0, 0, 0, 0]; anim[canal] = 1;
  const m = mover(d, anim), acc = { izq: [0, 0, 0, 0], der: [0, 0, 0, 0] };
  for (let v = 0; v < d.n; v++) if (d.bis[v * 4 + 3] === canal) {
    const s = d.pos[v * 3] < 0 ? 'izq' : 'der';
    for (let i = 0; i < 3; i++) acc[s][i] += m[v * 3 + i] - d.pos[v * 3 + i];
    acc[s][3]++;
  }
  const media = a => a[3] ? a.slice(0, 3).map(x => x / a[3]) : null;
  return { izq: media(acc.izq), der: media(acc.der) };
}

(async () => {
  const { armarDiseno, puntosDiseno, LOD_PARAM } = await imp('src/naves/generador.js');
  const { DISENOS, ESCALA_CLASE, PINTURAS } = await imp('src/naves/disenos.js');
  const TOPE = { 0: { normal: 5000, ataque: 8000 }, 1: 1500, 2: 400 };
  const LARGO = { interceptor: [5.5, 7.5], caza: [5.8, 7.6], infiltracion: [5.8, 7.6], ataque: [8, 10.5] };

  for (const [id, base] of Object.entries(DISENOS)) {
    const dis = { ...base, escala: ESCALA_CLASE[base.clase] };
    const L = [0, 1, 2].map(l => armarDiseno(dis, l));
    const tris = L.map(d => d.n / 3);
    const sano = L.every(d => d.pos.every(Number.isFinite) && d.zona.every(z => z >= 0 && z <= 7) && d.bis.every(Number.isFinite) && d.eje.every(Number.isFinite));
    check(`${id}: se arma en los 3 niveles sin valores rotos`, sano && tris.every(t => t > 50), f({ tris: tris.join('/') }));
    const tope0 = base.clase === 'ataque' ? TOPE[0].ataque : TOPE[0].normal;
    check(`${id}: no se pasa de triángulos (${tope0} / ${TOPE[1]} / ${TOPE[2]})`, tris[0] <= tope0 && tris[1] <= TOPE[1] && tris[2] <= TOPE[2] && tris[0] > tris[1] && tris[1] > tris[2], tris.join('/'));
    const movil2 = L[2].bis.some((v, i) => i % 4 === 3 && v >= 0);
    check(`${id}: la silueta lejana no tiene piezas móviles`, !movil2);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < L[0].pos.length; i += 3) { x0 = Math.min(x0, L[0].pos[i]); x1 = Math.max(x1, L[0].pos[i]); z0 = Math.min(z0, L[0].pos[i + 2]); z1 = Math.max(z1, L[0].pos[i + 2]); }
    const [lo, hi] = LARGO[base.clase], largo = z1 - z0;
    check(`${id}: el largo corresponde a su clase (${lo}–${hi} m)`, largo >= lo && largo <= hi, largo.toFixed(2) + ' m');
    // sentido de las piezas
    const d = L[0], r = {}, ok = [];
    const a = desplaz(d, 0); if (a.izq && a.der) ok.push(['alerones en sentidos opuestos', Math.sign(a.izq[1]) === -Math.sign(a.der[1]) && Math.abs(a.izq[1]) > 0.01]);
    const t = desplaz(d, 1); if (t.izq && t.der) ok.push(['timones hacia el mismo lado', Math.sign(t.izq[0]) === Math.sign(t.der[0])]);
    const e = desplaz(d, 2); if (e.izq && e.der) ok.push(['elevadores juntos', Math.sign(e.izq[1]) === Math.sign(e.der[1])]);
    const fr = desplaz(d, 3); for (const lado of ['izq', 'der']) if (fr[lado]) ok.push([`freno ${lado} se abre hacia afuera o arriba`, fr[lado][1] > 0.01 || (lado === 'izq' ? fr[lado][0] < -0.01 : fr[lado][0] > 0.01)]);
    const cp = desplaz(d, 5); for (const lado of ['izq', 'der']) if (cp[lado]) ok.push([`compuerta ${lado} baja`, cp[lado][1] < -0.01]);
    const faltan = ok.filter(([, v]) => !v).map(([n]) => n);
    check(`${id}: las piezas giran hacia el lado correcto`, ok.length > 0 && !faltan.length, ok.length + ' comprobadas' + (faltan.length ? ' · mal: ' + faltan.join(', ') : ''));
    const P = puntosDiseno(dis);
    check(`${id}: tiene salida de llamas, de tiros y luces de navegación`, P.motores.length >= 1 && P.bocas.length >= 1 && P.luces.length >= 3, f({ motores: P.motores.length, bocas: P.bocas.length, luces: P.luces.length }));
    check(`${id}: su pintura existe`, !!PINTURAS[base.pintura] && (base.pinturas || []).every(p => PINTURAS[p]));
  }
  check('el Caza A tiene dos pinturas para elegir', (DISENOS.A.pinturas || []).length >= 2, (DISENOS.A.pinturas || []).join(', '));

  /* ---------- Hangar ---------- */
  execSync('npx vite build --config herramientas/hangar/vite.config.mjs', { cwd: ROOT, stdio: 'ignore' });
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto(url.pathToFileURL(path.join(ROOT, 'dist-hangar', 'index.html')).href);
  await page.waitForFunction(() => window.__hangar, null, { timeout: 15000 });
  let r = await page.evaluate(() => ({ disenos: document.querySelectorAll('#models button').length, pinturas: [...document.querySelectorAll('#palettes button')].map(b => b.textContent), info: document.getElementById('info').textContent }));
  check('el Hangar muestra las naves nuevas, con sus diseños y pinturas', r.disenos >= 6 && r.pinturas.includes('Guardia nocturna') && /Delta compacto/.test(r.info), f({ disenos: r.disenos, pinturas: r.pinturas.join('|') }));
  await page.evaluate(() => document.getElementById('tab-piezas').click());
  r = await page.evaluate(() => [...document.querySelectorAll('#sliders label span')].map(s => s.textContent));
  check('el Caza A tiene controles para sus piezas', ['Alerones', 'Timones', 'Elevadores', 'Frenos de aire', 'Toberas (turbo)'].every(n => r.includes(n)), r.join(', '));
  // mover un control mueve la nave: cambia lo que llega a la placa de video
  r = await page.evaluate(async () => {
    const H = window.__hangar, inp = document.getElementById('sl-aleron');
    inp.value = '0.8'; inp.dispatchEvent(new Event('input'));
    await new Promise(res => setTimeout(res, 300));
    const g = H.flota.dis.A.lods[0].mesh.geometry;
    return { animar: H.state.animar, valor: g.attributes.iAnimA.array[0], count: H.flota.dis.A.lods[0].mesh.count };
  });
  check('mover el control de alerones llega a la nave', r.animar === false && Math.abs(r.valor - 0.8) < 1e-6 && r.count === 1, f(r));
  for (const v of ['planta', 'perfil', 'trasera', 'juego', 'fila']) await page.evaluate(v => window.__hangar.ponerVista(v), v);
  r = await page.evaluate(() => ({ naves: window.__hangar.naves.length, etiquetas: document.querySelectorAll('.etq').length }));
  check('"Todas a escala" pone los 6 diseños uno al lado del otro', r.naves === 6 && r.etiquetas === 6, f(r));
  await page.screenshot({ path: path.join(dir, 'hangar-fila.png') });
  await page.evaluate(() => { document.querySelector('#sistema [data-v="actuales"]').click(); });
  r = await page.evaluate(() => document.querySelectorAll('#models button').length);
  check('las naves actuales siguen disponibles en el Hangar', r >= 4, r);
  check('sin errores en la página', errs.length === 0, errs.join(' | '));
  await browser.close();
})().catch(e => { console.log('FAIL la prueba se cortó: ' + e.message); process.exit(1); });
