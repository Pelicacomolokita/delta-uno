// Corre todas las pruebas, una por una, y muestra un resumen.
//   npm test                 → todas
//   npm test -- combate      → solo las que tengan "combate" en el nombre
// Primero arma la versión de prueba del juego (npm run build:test).
const { execSync, spawn } = require('child_process');
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const filter = process.argv.slice(2).join(' ').toLowerCase();
const suites = fs.readdirSync(path.join(__dirname, 'suites')).filter(n => n.endsWith('.js') && (!filter || n.toLowerCase().includes(filter))).sort();

console.log('Armando la versión de prueba…');
execSync('npm run build:test', { cwd: ROOT, stdio: 'ignore' });

const runOne = name => new Promise(resolve => {
  const started = Date.now();
  const child = spawn(process.execPath, [path.join(__dirname, 'suites', name)], { cwd: ROOT });
  let out = '';
  child.stdout.on('data', d => { out += d; process.stdout.write(d); });
  child.stderr.on('data', d => { out += d; process.stderr.write(d); });
  const limit = setTimeout(() => { out += '\nFAIL se pasó de 10 minutos y la corté\n'; child.kill('SIGKILL'); }, 10 * 60 * 1000);
  child.on('close', code => {
    clearTimeout(limit);
    const ok = (out.match(/^OK /gm) || []).length, fail = (out.match(/^FAIL/gm) || []).length;
    resolve({ name, ok, fail: fail + (code && !fail ? 1 : 0), secs: Math.round((Date.now() - started) / 1000) });
  });
});

(async () => {
  const results = [];
  for (const name of suites) {
    console.log('\n=== ' + name + ' ===');
    results.push(await runOne(name));
  }
  console.log('\nResumen');
  for (const r of results) console.log(`${r.fail ? 'FALLA' : 'bien '}  ${r.name.padEnd(32)} ${String(r.ok).padStart(3)} bien, ${r.fail} mal  (${r.secs} s)`);
  const bad = results.reduce((n, r) => n + r.fail, 0);
  console.log(bad ? `\n${bad} comprobaciones fallaron.` : '\nTodo bien.');
  process.exit(bad ? 1 : 0);
})();
