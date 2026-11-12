// Preparar la salida: elegir misión (con sus datos), nave, equipo y diseño antes de despegar.
// Se corre con: npm test -- preparar
const H = require('../helpers');
const { launch, open, check, sleep, f, path, dir } = H;
H.autostart = false;

(async () => {
  const browser = await launch();
  const L = await open(browser, { width: 844, height: 390 });
  const { page } = L;
  const click = sel => page.evaluate(s => document.querySelector(s).click(), sel);
  await sleep(500);

  /* ---------- Historia: pestaña Misión ---------- */
  await click('.mode[data-mode="historia"]'); await sleep(100);
  await click('#goBtn'); await sleep(200);
  let r = await page.evaluate(() => ({
    open: !document.querySelector('#brief').hidden,
    tabs: [...document.querySelectorAll('#prepTabs button')].filter(b => !b.hidden).map(b => b.textContent).join(','),
    step: document.querySelector('#prepTabs [aria-selected="true"]').dataset.step,
    list: [...document.querySelectorAll('#misList .pick')].map(b => b.querySelector('b').textContent + '|' + b.querySelector('small').textContent),
    facts: [...document.querySelectorAll('#briefFacts dt')].map(d => d.textContent).join(','),
    comp: document.querySelector('#briefFacts dd:nth-of-type(1)') && [...document.querySelectorAll('#briefFacts div')][1].querySelector('dd').textContent,
    title: document.querySelector('#briefTitle').textContent
  }));
  check('se abre en Misión, con las cuatro pestañas', r.open && r.tabs === 'Misión,Nave,Equipo,Diseño' && r.step === 'mision', f({ tabs: r.tabs, step: r.step }));
  check('lista las 7 misiones: la 1 disponible y las demás "Próximamente"', r.list.length === 7 && /^1\. Entrenamiento\|(Disponible|Completa)$/.test(r.list[0]) && r.list.slice(1).every(x => /Próximamente$/.test(x)), r.list.join(' / '));
  check('la misión muestra sus datos: sector, compañeros, duración, mejor tiempo y medallas', r.facts === 'Sector,Compañeros,Duración,Tu mejor tiempo,Medallas' && /Delta Uno, Aguja/.test(r.comp), r.facts + ' · ' + r.comp);
  await page.screenshot({ path: path.join(dir, 'prep-mision.png') });

  /* ---------- Nave ---------- */
  await click('#prepTabs [data-step="nave"]'); await sleep(100);
  r = await page.evaluate(() => ({ n: document.querySelectorAll('#classList .pick').length, locked: document.querySelectorAll('#classList .pick.locked').length, name: document.querySelector('#className').textContent, bars: document.querySelectorAll('#classStats .stat').length }));
  check('cuatro clases: el Caza disponible y tres por desbloquear, con sus barras', r.n === 4 && r.locked === 3 && r.name === 'Caza' && r.bars === 4, f(r));
  await click('#classList .pick[data-id="interceptor"]'); await sleep(100);
  r = await page.evaluate(() => ({ name: document.querySelector('#className').textContent, side: document.querySelector('#classSide').textContent, clase: window.DeltaUno.settings.equipo.clase, sum: document.querySelector('#prepSummary').textContent }));
  check('una clase bloqueada se puede mirar pero no elegir', r.name === 'Interceptor' && /Campaña 2 · misión 2/.test(r.side) && r.clase === 'caza' && /^Caza · /.test(r.sum), f(r));
  await page.screenshot({ path: path.join(dir, 'prep-nave.png') });

  /* ---------- Equipo ---------- */
  await click('#prepTabs [data-step="equipo"]'); await sleep(100);
  r = await page.evaluate(() => [...document.querySelectorAll('#gearSlots section')].map(s => s.querySelector('h3').textContent + ': ' + [...s.querySelectorAll('.pick')].map(b => b.querySelector('b').textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(',')));
  check('equipo: arma principal y secundaria, con la elegida marcada', r.length === 2 && r[0] === 'Arma principal: Cañón de pulsos*' && r[1] === 'Arma secundaria: Misiles guiados*', r.join(' / '));
  await page.screenshot({ path: path.join(dir, 'prep-equipo.png') });

  /* ---------- Diseño ---------- */
  await click('#prepTabs [data-step="diseno"]'); await sleep(100);
  await click('#paintSeg button[data-val="guardia"]'); await sleep(150);
  r = await page.evaluate(() => ({ paint: window.DeltaUno.settings.shipPaint, sum: document.querySelector('#prepSummary').textContent, saved: JSON.parse(localStorage.getItem('delta-uno-ajustes-v3')).shipPaint }));
  check('la pintura se elige en Diseño, cambia el resumen y queda guardada', r.paint === 'guardia' && /pintura Guardia$/.test(r.sum) && r.saved === 'guardia', f(r));
  await page.screenshot({ path: path.join(dir, 'prep-diseno.png') });

  /* ---------- Despegar y volver ---------- */
  await click('#briefGo'); await sleep(400);
  r = await page.evaluate(() => ({ mode: window.DeltaUno.run.mode, live: window.DeltaUno.run.live, brief: document.querySelector('#brief').hidden }));
  check('Despegar arranca la misión elegida', r.mode === 'historia' && r.live && r.brief, f(r));
  await page.evaluate(() => window.DeltaUno.openMenu()); await sleep(200);

  /* ---------- Otros modos: "Nave y equipo" ---------- */
  await click('.mode[data-mode="libre"]'); await sleep(100);
  r = await page.evaluate(() => ({ btn: !document.querySelector('#loadoutBtn').hidden }));
  await click('#loadoutBtn'); await sleep(200);
  const r2 = await page.evaluate(() => ({ step: document.querySelector('#prepTabs [aria-selected="true"]').dataset.step, misTab: document.querySelector('#prepTabs [data-step="mision"]').hidden }));
  check('en los otros modos, "Nave y equipo" abre en Nave y sin la pestaña Misión', r.btn && r2.step === 'nave' && r2.misTab, f(r2));
  await click('#briefGo'); await sleep(400);
  r = await page.evaluate(() => ({ mode: window.DeltaUno.run.mode, live: window.DeltaUno.run.live }));
  check('desde ahí, Despegar arranca el modo elegido', r.mode === 'libre' && r.live, f(r));

  /* ---------- Teléfono angosto: una columna, sin desbordar ---------- */
  await page.evaluate(() => window.DeltaUno.openMenu());
  await page.setViewportSize({ width: 390, height: 844 }); await sleep(400);
  await click('.mode[data-mode="historia"]'); await click('#goBtn'); await sleep(300);
  r = await page.evaluate(() => { const b = document.querySelector('#briefBody'); return { over: b.scrollWidth - b.clientWidth }; });
  check('en vertical no se desborda de costado', r.over <= 1, f(r));

  check('sin errores en la página', L.errs.length === 0, L.errs.join(' | '));
  await browser.close();
})();
