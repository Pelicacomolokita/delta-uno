// Arma la página de descarga (pagina/index.html → dist-pagina/) para publicarla en GitHub Pages.
// Los botones apuntan siempre a la última versión publicada en Releases, así que la página no queda vieja.
// Además arma dos atajos para compartir: <página>/apk (baja el APK) y <página>/pc (baja el zip).
// Uso: node scripts/pagina.mjs [--apk salida/delta-uno.apk] [--pc salida/delta-uno-pc.zip]
// Toma de las variables de entorno la clave de PostHog y el formulario (las mismas que el juego).
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'dist-pagina');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : ''; };

const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const REPO = process.env.GITHUB_REPOSITORY || 'Pelicacomolokita/delta-uno';
const [owner, name] = REPO.split('/');
const PAGE_URL = `https://${owner.toLowerCase()}.github.io/${name}/`;
const DL = `https://github.com/${REPO}/releases/latest/download/`;
const APK_URL = DL + 'delta-uno.apk', PC_URL = DL + 'delta-uno-pc.zip';
const KEY = process.env.VITE_POSTHOG_KEY || '';
const HOST = (process.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/+$/, '');
const FEEDBACK = process.env.VITE_FEEDBACK_URL || '';
const STATS = KEY ? JSON.stringify({ key: KEY, host: HOST, version: pkg.version }) : 'null';

const mb = f => { if (!f || !existsSync(f)) return ''; const b = statSync(f).size; return ' · ' + (b >= 1e6 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.round(b / 1024) + ' KB'); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Ícono: el mismo de la app (scripts/iconos.mjs lo deja en scripts/icono.svg)
const icon = readFileSync(path.join(ROOT, 'scripts/icono.svg'), 'utf8').replace(/\s*\n\s*/g, ' ').trim();
const iconUri = 'data:image/svg+xml,' + encodeURIComponent(icon);
const iconInline = icon.replace('<svg ', '<svg aria-hidden="true" ');

// Código QR hacia esta misma página, para pasarla de la computadora al teléfono
const qr = (await QRCode.toString(PAGE_URL + '?utm_source=qr', { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0a1022', light: '#f6ead6' } }))
  .replace('<svg ', '<svg role="img" aria-label="Código QR de esta página" ');

let html = readFileSync(path.join(ROOT, 'pagina/index.html'), 'utf8');
if (!FEEDBACK) html = html.replace(/<!--opinion-->[\s\S]*?<!--\/opinion-->/, '');
if (!KEY) html = html.replace(/<!--datos-->[\s\S]*?<!--\/datos-->/, '');
const vals = {
  VERSION: pkg.version, PAGE_URL, APK_URL, PC_URL, RELEASES_URL: `https://github.com/${REPO}/releases`,
  APK_SIZE: mb(arg('--apk')), PC_SIZE: mb(arg('--pc')), FEEDBACK_URL: esc(FEEDBACK), ICON_URI: esc(iconUri)
};
html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => {
  if (k === 'QR_SVG') return qr;
  if (k === 'ICON_SVG') return iconInline;
  if (k === 'STATS_JSON') return STATS;
  if (!(k in vals)) throw new Error('Falta el valor de ' + m);
  return vals[k];
});

// Atajo de descarga: cuenta el clic (con de dónde vino) y baja el archivo
function shortcut(file, url, title, steps) {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta property="og:title" content="Delta Uno · demo gratis"><meta property="og:description" content="Juego de naves en 3D alrededor de un planeta entero.">
<meta property="og:image" content="${PAGE_URL}img/despegue.jpg"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a1022"><link rel="icon" href="${esc(iconUri)}">
<noscript><meta http-equiv="refresh" content="0;url=${url}"></noscript>
<style>body{margin:0;background:#0a1022;color:#f6ead6;font:16px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
main{max-width:560px;margin:0 auto;padding:40px 16px}h1{font-size:24px;margin:0 0 8px}p,li{color:rgba(246,234,214,.75)}
a{color:#ff6b3d}ol{padding-left:20px}</style></head>
<body><main>
<h1>Tu descarga empieza en un momento</h1>
<p>Si no empieza, <a href="${url}">tocá acá</a>.</p>
${steps}
<p><a href="../">Ver la página de Delta Uno</a></p>
</main>
<script>
(function(){
  var go=function(){location.href=${JSON.stringify(url)};}, S=${STATS};
  if(!S){go();return;}
  var q=new URLSearchParams(location.search), ua=navigator.userAgent||'';
  var p={token:S.key,distinct_id:'p'+Math.random().toString(36).slice(2),$process_person_profile:false,$lib:'delta-uno-pagina',version:S.version,
    archivo:${JSON.stringify(file)},desde:'enlace_directo',$current_url:location.href,$referrer:document.referrer||'$direct',
    $os:/Android/i.test(ua)?'Android':/iPhone|iPad/i.test(ua)?'iOS':/Windows/.test(ua)?'Windows':/Mac OS X/.test(ua)?'Mac OS X':'Otro'};
  ['utm_source','utm_medium','utm_campaign'].forEach(function(k){if(q.get(k))p[k]=q.get(k);});
  var j=JSON.stringify({api_key:S.key,batch:[{event:'descarga_click',properties:p,timestamp:new Date().toISOString()}]});
  var b='data='+encodeURIComponent(btoa(encodeURIComponent(j).replace(/%([0-9A-F]{2})/g,function(m,h){return String.fromCharCode(parseInt(h,16));})));
  try{navigator.sendBeacon(S.host+'/e/?compression=base64',new Blob([b],{type:'application/x-www-form-urlencoded'}));}catch(e){}
  setTimeout(go,300);
})();
</script>
</body></html>
`;
}
const apkSteps = `<ol>
<li>Abrí el archivo que se bajó. Si Android pide permiso para instalar apps de esa fuente, aceptalo.</li>
<li>Si Play Protect avisa que la app es desconocida, tocá <b>Más detalles → Instalar de todas formas</b>.</li>
<li>Abrí Delta Uno y elegí un modo.</li>
</ol>`;
const pcSteps = `<ol><li>Descomprimí el zip.</li><li>Abrí <b>Delta Uno.html</b> con doble clic: se juega en el navegador.</li></ol>`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(path.join(OUT, 'apk'), { recursive: true });
mkdirSync(path.join(OUT, 'pc'), { recursive: true });
cpSync(path.join(ROOT, 'pagina/img'), path.join(OUT, 'img'), { recursive: true });
writeFileSync(path.join(OUT, 'index.html'), html);
writeFileSync(path.join(OUT, 'apk/index.html'), shortcut('apk', APK_URL, 'Bajando Delta Uno para Android', apkSteps));
writeFileSync(path.join(OUT, 'pc/index.html'), shortcut('pc', PC_URL, 'Bajando Delta Uno para computadora', pcSteps));
writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log('Página lista en dist-pagina/ → ' + PAGE_URL + (KEY ? ' (con datos de uso)' : ' (sin datos de uso)') + (FEEDBACK ? ' (con formulario)' : ''));
