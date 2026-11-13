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
      const val = canal === 7 ? anim[2] + anim[0] * Math.sign(piv[0]) : anim[canal]; let q = p.map((x, i) => x - piv[i]); // 7: elevón
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
function desplaz(d, canal, anim) {
  if (!anim) { anim = [0, 0, 0, 0, 0, 0, 0]; anim[canal] = 1; }
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
  const { DISENOS, ESCALA_CLASE, PINTURAS, BANDOS, ESCUADRONES } = await imp('src/naves/disenos.js');
  const { siluetaDiseno, golpea } = await imp('src/naves/silueta.js');
  const { DISENOS_ARCO1, TIPO_ENEMIGO } = await imp('src/naves/juego.js');
  check('el primer arco tiene sus naves: Caza A, bombardero escoltado P1 y enemigos R1, I4 y P3', DISENOS_ARCO1.every(id => DISENOS[id]) && TIPO_ENEMIGO.caza === 'R1' && TIPO_ENEMIGO.interceptor === 'I4' && TIPO_ENEMIGO.pesada === 'P3', DISENOS_ARCO1.join(', '));
  const colores = Object.values(BANDOS).map(b => b.color.join()), formas = Object.values(BANDOS).map(b => b.forma);
  check('cada bando tiene su color y su forma de baliza', new Set(colores).size === 3 && new Set(formas).size === 3, Object.entries(BANDOS).map(([k, b]) => k + ' ' + b.forma).join(', '));
  check('los escuadrones usan pinturas y diseños que existen', Object.values(ESCUADRONES).every(e => PINTURAS[e.pintura] && BANDOS[e.bando] && Object.values(e.disenos).every(d => DISENOS[d])), Object.keys(ESCUADRONES).join(', '));
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
    // elevones: con la palanca de costado van opuestos; con la palanca atrás, juntos
    const ea = desplaz(d, 7, [1, 0, 0, 0, 0, 0, 0]), ee = desplaz(d, 7, [0, 0, 1, 0, 0, 0, 0]);
    if (ea.izq && ea.der) ok.push(['elevones opuestos al rotar', Math.sign(ea.izq[1]) === -Math.sign(ea.der[1]) && Math.abs(ea.izq[1]) > 0.01]);
    if (ee.izq && ee.der) ok.push(['elevones juntos al subir la trompa', Math.sign(ee.izq[1]) === Math.sign(ee.der[1]) && Math.abs(ee.izq[1]) > 0.01]);
    // alerones y elevones giran para el mismo lado con la misma palanca
    if (a.izq && ea.izq) ok.push(['alerones y elevones de acuerdo', Math.sign(a.izq[1]) === Math.sign(ea.izq[1])]);
    // canards (adelante): con la palanca atrás el borde de fuga baja, al revés que la cola
    if (base.piezas.some(p => p.invertir)) {
      let yc = 0, nc = 0; const m = mover(d, [0, 0, 1, 0, 0, 0, 0]);
      for (let v = 0; v < d.n; v++) if (d.bis[v * 4 + 3] === 2 && d.pos[v * 3 + 2] < 0) { yc += m[v * 3 + 1] - d.pos[v * 3 + 1]; nc++; }
      ok.push(['canards al revés que la cola', nc > 0 && yc / nc > 0.005]);
    }
    const cp = desplaz(d, 5); for (const lado of ['izq', 'der']) if (cp[lado]) ok.push([`compuerta ${lado} baja`, cp[lado][1] < -0.01]);
    const faltan = ok.filter(([, v]) => !v).map(([n]) => n);
    check(`${id}: las piezas giran hacia el lado correcto`, ok.length > 0 && !faltan.length, ok.length + ' comprobadas' + (faltan.length ? ' · mal: ' + faltan.join(', ') : ''));
    // los dos lados de cada pieza espejada tienen que ser iguales: misma bisagra (con x opuesta) y mismo tamaño
    const bis = {};
    for (let v = 0; v < d.n; v++) { const c = d.bis[v * 4 + 3]; if (c < 0) continue; const k = c + ':' + [1, 2].map(i => d.bis[v * 4 + i].toFixed(2)).join(',') + ':' + Math.abs(d.bis[v * 4]).toFixed(2); (bis[k] = bis[k] || { izq: 0, der: 0 })[d.bis[v * 4] < 0 ? 'izq' : 'der']++; }
    const desparejas = base.bando === 'desligados' ? [] : Object.entries(bis).filter(([k, v]) => !k.endsWith(':0.00') && v.izq !== v.der).map(([k]) => k);
    check(`${id}: las piezas espejadas son iguales de los dos lados`, desparejas.length === 0, desparejas.join(' | '));
    const sil = siluetaDiseno(id);
    const golpes = [golpea(sil, 0, 0, 0), golpea(sil, sil.radio + 1, 0, 0), golpea(sil, 0, sil.radio * 0.9, 0)];
    check(`${id}: la silueta de choque toma el centro y descarta lo que queda afuera`, golpes[0] && !golpes[1] && !golpes[2], f({ planta: sil.area, radio: sil.radio, cuerpo: sil.formas[0].area }));
    const P = puntosDiseno(dis);
    check(`${id}: tiene salida de llamas, de tiros y luces de navegación`, P.motores.length >= 1 && P.bocas.length >= 1 && P.luces.length >= 3, f({ motores: P.motores.length, bocas: P.bocas.length, luces: P.luces.length }));
    check(`${id}: su pintura existe`, !!PINTURAS[base.pintura] && (base.pinturas || []).every(p => PINTURAS[p]));
  }
  /* ---------- Mandos ---------- */
  const { crearMandos, actualizarMandos } = await imp('src/naves/mandos.js');
  let m = crearMandos(); m.roll = 1;
  actualizarMandos(m, 0.1); const a01 = m.anim[0];
  for (let i = 0; i < 20; i++) actualizarMandos(m, 0.05);
  check('palanca a la derecha: el alerón se mueve de a poco (como un mando hidráulico) hasta el tope', a01 < 0 && a01 > -0.7 && m.anim[0] < -0.5 && m.anim[1] > 0, f({ a01, aleron: m.anim[0], timon: m.anim[1] }));
  m = crearMandos(); m.pitch = 1; for (let i = 0; i < 20; i++) actualizarMandos(m, 0.05);
  check('tirar de la palanca sube el borde de los elevadores', m.anim[2] < -0.5, f({ elevador: m.anim[2] }));
  m = crearMandos(); m.empuje = 0; m.velocidad = 60; for (let i = 0; i < 30; i++) actualizarMandos(m, 0.05);
  const fr = m.anim[3]; m.empuje = 1; m.turbo = true; for (let i = 0; i < 30; i++) actualizarMandos(m, 0.05);
  check('cortar empuje saca los frenos; el turbo abre las toberas y guarda los frenos', fr > 0.95 && m.anim[4] > 0.95 && m.anim[3] < 0.05, f({ freno: fr, tobera: m.anim[4], frenoDespues: m.anim[3] }));
  m = crearMandos(); m.roll = 1; m.velocidad = 300; for (let i = 0; i < 30; i++) actualizarMandos(m, 0.05);
  check('a mucha velocidad las superficies se mueven menos', m.anim[0] > -0.7, f({ aleron: m.anim[0] }));

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
  r = await page.evaluate(() => ({ palanca: !!document.getElementById('palanca'), botones: [...document.querySelectorAll('#toggles button')].map(b => b.textContent), maniobras: [...document.querySelectorAll('#maniobras [data-man]')].map(b => b.textContent) }));
  check('la pestaña Piezas es un simulador: palanca, botones de la nave y maniobras', r.palanca && r.botones.includes('Turbo') && r.botones.includes('Freno de aire') && r.maniobras.includes('Tonel') && r.maniobras.includes('Looping'), f({ botones: r.botones.join('|'), maniobras: r.maniobras.join('|') }));
  // la palanca mueve la nave: lo que llega a la placa de video sigue al mando, de a poco
  r = await page.evaluate(async () => {
    const H = window.__hangar, pad = document.getElementById('palanca'), q = pad.getBoundingClientRect();
    pad.dispatchEvent(new PointerEvent('pointerdown', { clientX: q.right - 2, clientY: q.top + q.height / 2, pointerId: 1, bubbles: true }));
    await new Promise(res => setTimeout(res, 600));
    const g = H.flota.dis.A.lods[0].mesh.geometry, v = g.attributes.iAnimA.array[0];
    pad.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }));
    return { auto: H.state.auto, roll: H.mandos.roll, aleron: v, lect: document.getElementById('lecturas').textContent };
  });
  check('palanca a la derecha: llega a la nave como alerón y se ve en las lecturas', r.auto === false && r.aleron < -0.3 && /Alerón -\d+°/.test(r.lect), f(r));
  // la maniobra cuenta tiempo de juego: en una máquina lenta tarda más en el reloj, por eso se espera a que termine
  r = await page.evaluate(async () => { const H = window.__hangar; H.empezar('tonel'); const t0 = Date.now(); while (H.state.maniobra && Date.now() - t0 < 30000) await new Promise(res => setTimeout(res, 200)); return { maniobra: H.state.maniobra }; });
  check('una maniobra termina sola', r.maniobra === null, f(r));
  await page.evaluate(() => window.__hangar.ponerVista('lejos')); await new Promise(res => setTimeout(res, 500));
  r = await page.evaluate(() => { const F = window.__hangar.flota; return { naves: window.__hangar.naves.length, balizas: F.balizasPorBando(), marcasR1: F.dis.R1.lods.flatMap(l => Array.from({ length: l.mesh.count }, (_, i) => Array.from(l.mesh.geometry.attributes.iMarca.array.slice(i * 4, i * 4 + 3)).map(v => +v.toFixed(2)).join(','))) }; });
  check('"De lejos": solo las naves enemigas llevan baliza (las de la Guardia no)', r.naves === 6 && r.balizas.guardia === 0 && r.balizas.directorio === 2 && r.balizas.desligados === 2, f(r));
  // hay tres R1: dos del Directorio y uno capturado por los Desligados
  check('un R1 capturado por los Desligados lleva la marca de los Desligados', r.marcasR1.length === 3 && r.marcasR1.filter(m => m === '0.95,0.25,0.75').length === 1 && r.marcasR1.filter(m => m === '1,0.62,0.05').length === 2, r.marcasR1.join(' | '));
  for (const v of ['planta', 'perfil', 'trasera', 'juego', 'fila']) await page.evaluate(v => window.__hangar.ponerVista(v), v);
  r = await page.evaluate(() => ({ naves: window.__hangar.naves.length, etiquetas: document.querySelectorAll('.etq').length }));
  const total = Object.keys(DISENOS).length;
  check(`"Todas a escala" pone los ${total} diseños uno al lado del otro`, r.naves === total && r.etiquetas === total, f(r));
  await page.screenshot({ path: path.join(dir, 'hangar-fila.png') });
  await page.evaluate(() => { document.querySelector('#sistema [data-v="actuales"]').click(); });
  r = await page.evaluate(() => document.querySelectorAll('#models button').length);
  check('las naves actuales siguen disponibles en el Hangar', r >= 4, r);
  check('sin errores en la página', errs.length === 0, errs.join(' | '));
  await browser.close();
})().catch(e => { console.log('FAIL la prueba se cortó: ' + e.message); process.exit(1); });
