# Delta Uno

Juego de naves en 3D para teléfono, en horizontal, sobre un planeta esférico. Tiene cuatro modos (Conquista, Supervivencia, Vuelo libre y Carrera), seis tipos de enemigos y una nave nodriza. La Historia está en diseño.

Está hecho con [three.js](https://threejs.org) 0.128 y se arma con [Vite](https://vitejs.dev). El resultado es **un solo archivo HTML** que trae adentro el código, los estilos y la librería 3D. Ese mismo archivo sirve para publicarlo como página, para abrirlo sin servidor y para la app de Android, que lo envuelve con [Capacitor](https://capacitorjs.com).

**Versión actual: 0.12.0 (demo).** Página de descarga: **https://pelicacomolokita.github.io/delta-uno/** (el APK para Android y un zip para jugar en la computadora, con instrucciones y un código QR). También están en [Releases](https://github.com/Pelicacomolokita/delta-uno/releases).

## La demo: APK, versión para PC y datos de uso

GitHub arma todo solo (`.github/workflows/demo.yml`), así que no hace falta instalar Android Studio:

- **Cada vez que se sube algo a `main`:** arma el APK y el zip para PC. Quedan en **Actions → la última corrida → Artifacts** (se borran a los 90 días).
- **Con una etiqueta de versión** (`v0.12.0`, `v0.13.0`…) **o a mano** (Actions → Armar la demo → Run workflow): además publica la versión en **Releases** y actualiza la página de descarga.
- **Archivos con nombre fijo:** `delta-uno.apk` y `delta-uno-pc.zip`. Así estos enlaces bajan siempre la última versión:
  - Página: `https://pelicacomolokita.github.io/delta-uno/` (sale de `pagina/index.html`, la arma `scripts/pagina.mjs`)
  - Atajos: `…/delta-uno/apk` y `…/delta-uno/pc` (cuentan el clic y bajan el archivo)
  - Directo de GitHub: `https://github.com/Pelicacomolokita/delta-uno/releases/latest/download/delta-uno.apk`
- **Página de descarga, una sola vez:** hay que activar GitHub Pages en **Settings → Pages → Source: GitHub Actions**. Sin eso, la corrida marca error en el paso de la página (la versión en Releases se publica igual).
- **Capturas de la página:** `node scripts/capturas.cjs` (después de `npm run build:test`) las saca jugando, en `pagina/img/`.
- **Versión:** sale de `package.json`. Se ve en el menú del juego y en el APK. Para una versión nueva hay que subir el número; si no, Android no la instala encima de la anterior.
- **Firma del APK:** usa una clave de pruebas que está en el repositorio (`android/app/delta-uno-pruebas.jks`), así cada APK nuevo se instala encima del anterior. Para Google Play hace falta otra clave, privada.
- **Identificador de la app:** `io.github.pelicacomolokita.deltauno`, provisorio. Está en `capacitor.config.json`, `android/app/build.gradle` (`namespace` y `applicationId`), `android/app/src/main/res/values/strings.xml` y la carpeta de `MainActivity.java`. Cambiarlo hace que sea otra app: quien tenga la anterior va a tener las dos.
- **Ícono y pantalla de carga:** `node scripts/iconos.mjs` los arma con la nave del juego.

### Datos de uso (PostHog) y botón de opinión

Se configuran en GitHub, sin tocar el código: **Settings → Secrets and variables → Actions → Variables**.

| Variable | Qué va |
|---|---|
| `POSTHOG_KEY` | La "Project API key" de PostHog (empieza con `phc_`). Es pública: solo sirve para mandar datos. |
| `POSTHOG_HOST` | Solo si el proyecto está en Europa: `https://eu.i.posthog.com`. |
| `FEEDBACK_URL` | El enlace al formulario de opiniones. Con él aparece "Dar tu opinión" en el menú y al terminar la partida. |

Después de cargarlas, hay que volver a armar: **Actions → Armar la demo → Run workflow**, o una versión nueva. Sin clave, el juego no manda nada; en `npm run dev` tampoco, salvo que las pongas en un archivo `.env.local` (`VITE_POSTHOG_KEY=...`).

Qué se mide y cómo está hecho: `src/stats.js` y `docs/decisiones.md`. Para publicar en foros y juntar opiniones con otra IA: `docs/prompt-difusion.md`.

## Lo que necesitás instalar (una sola vez)

1. **Node.js 20 o más nuevo:** bajá la versión LTS de <https://nodejs.org>.
2. **Git:** <https://git-scm.com>.
3. **VS Code:** <https://code.visualstudio.com>.

## Abrirlo en VS Code

```bash
git clone https://github.com/Pelicacomolokita/delta-uno.git
cd delta-uno
npm install
code .
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Abre el juego en <http://localhost:5173>. Cada vez que guardás un cambio, la página se recarga sola. |
| `npm run dev:telefono` | Lo mismo, pero accesible desde el teléfono. Con el teléfono en la misma red Wi‑Fi que la PC, abrí la dirección **Network** que aparece en la terminal (algo como `http://192.168.1.20:5173`). |
| `npm run build` | Arma la versión final en `dist/index.html`, con todo adentro y comprimido. También arma `dist/delta-uno-artifact.html`, que es la versión para publicar en claude.ai. |
| `npm run android:preparar` | Arma el juego y lo copia al proyecto Android (`android/`). Solo hace falta si vas a abrirlo en Android Studio; el APK lo arma GitHub. |
| `npm test` | Corre todas las pruebas automáticas y muestra un resumen. Tarda alrededor de media hora. |
| `npm test -- combate` | Corre solo las pruebas que tienen "combate" en el nombre. |
| `npm run medir:punteria` | Mide cuántos tiros enemigos pegan según cómo volás. Imprime números; no es una prueba de sí o no. |

La primera vez que vayas a correr las pruebas, instalá el navegador que usan:

```bash
npx playwright install chromium
```

## Cómo se juega en PC

- **W / S:** trompa.
- **Q / E:** doblar.
- **A / D:** rotar; dos toques esquivan.
- **Clic izquierdo:** disparar.
- **Clic derecho:** misil.
- **Espacio:** Blanco.
- **Shift:** turbo.
- **Rueda del mouse:** empuje.
- **R:** reparar.
- **C:** cámara.
- **Esc:** pausa.

Todo se puede cambiar en **Ajustes → Teclado y mouse**. Con un mando de Xbox o PlayStation conectado, los botones se cambian en **Ajustes → Mando**.

## Cómo está organizado

```
index.html                  pantalla: botones, paneles, menú de inicio
src/main.js                 todo el juego (por ahora en un solo archivo, ver "Próximos pasos")
src/historia/               las misiones como datos (textos, partes, eventos de radio); formato en docs/historia/formato.md
src/nave.js                 los diseños de la nave (Actual, Guardia, Interceptor, Blindado) y su textura de paneles
src/efectos.js              fuego, humo, restos, onda expansiva y escudo
src/sonido.js               todos los sonidos, sintetizados en el momento (motor, cañón, explosiones, radio)
src/stats.js                datos anónimos de uso (PostHog)
src/config.js               clave de PostHog y enlace del formulario (salen de las variables de GitHub)
src/style.css               estilos
android/                    la app de Android (Capacitor): pantalla completa, horizontal, ícono
capacitor.config.json       nombre e identificador de la app
.github/workflows/demo.yml  arma el APK y el zip para PC en GitHub
scripts/artifact.mjs        arma la versión para publicar en claude.ai
scripts/iconos.mjs          arma el ícono y la pantalla de carga de la app
scripts/pagina.mjs          arma la página de descarga (pagina/ → dist-pagina/)
scripts/capturas.cjs        saca las capturas de la página jugando
herramientas/hangar/        visor 3D para comparar los diseños de la nave (npx vite build --config herramientas/hangar/vite.config.mjs)
pagina/                     la página de descarga y sus capturas
tests/helpers.js            ayudas comunes de las pruebas (teléfono simulado, toques, tiempos)
tests/suites/               las pruebas, por tema
tests/herramientas/         mediciones que no son pruebas de sí o no
docs/decisiones.md          qué se decidió y por qué: controles, puntería, zonas, modos, campaña
docs/prompt-historia.md     el prompt para que una IA escriba la historia
docs/historia/              reportes de la historia y el formato de las misiones
docs/prompt-difusion.md     el prompt para que una IA ayude a publicar la demo y juntar opiniones
docs/version/               textos que van con cada versión (notas, instrucciones del zip para PC)
```

### Partes de `src/main.js`

Cada sección empieza con un comentario `/* ---------- Nombre ---------- */`, así que se pueden buscar con Ctrl+F. Las secciones, en orden:

1. **Valores para ajustar:** cómo se siente el vuelo, el tamaño del planeta y los números del combate.
2. **El planeta:** terreno por biomas, escena y mallas del suelo con más detalle cerca de la nave.
3. **La nave:** forma, estado, física de vuelo y cámara de persecución.
4. **Ambiente:** estelas, polvo de velocidad y rocas.
5. **Disparos, explosiones, choques y sonido.**
6. **Controles y pantalla:** pantalla girada, controles táctiles, ajustes e instrumentos.
7. **Zonas enemigas:** tipos de enemigo, escuadrones, torretas, detección y puntería.
8. **Daño, escudo, Blanco, reparación, misiles, repuestos y puntaje.**
9. **Modos de juego, menú de inicio y fin de partida.**
10. **Marcas en pantalla y bucle principal.**

## Pruebas

Las pruebas abren el juego en un Chromium con pantalla táctil simulada (horizontal y vertical) y juegan solas: tocan botones, mueven la palanca, ponen la nave en lugares concretos y verifican el resultado. Cada línea dice `OK` o `FAIL`, con los números medidos.

| Archivo | Qué prueba |
|---|---|
| `01-controles` | Palanca, botones, evasión, modo Manual, opción de palanca a los costados |
| `02-casco` | Que las balas peguen solo si tocan la forma real de la nave |
| `03-punteria-y-zonas` | Balas rectas que salen por la trompa, tipos de zona, aviso entre escuadrones |
| `04-deteccion` | A qué distancia te ve cada enemigo, de frente, de costado y de atrás |
| `05-misiles-y-reparacion` | Misiles guiados, fijado, repuestos y reparación |
| `06-camara-blanco` | Cámara de Blanco |
| `07-combate` | Patrullas, ataques, daño, vida, puntos, despejar zonas, botones sin encimarse |
| `08-modos-y-enemigos` | Menú de inicio, ajustes que se deslizan, los cuatro modos, torretas, nodriza, drones |
| `09-teclado-mouse-mando` | Controles de PC, mando simulado, asignar teclas y botones, botones en pantalla |
| `10-defensas-mar-camara` | Defensas sobre torres, lanzamisiles, misiles que se esquivan, cámara de Blanco |
| `11-datos-de-uso` | Eventos de PostHog, aviso y opción para apagarlos, envíos sin conexión, versión en el menú, botón de opinión |
| `12-historia` | Misión 1: reglas de los textos, instrucciones, anillos, firma de Rastro, torretas y blancos de práctica, repetir la parte al caer o salir del sector, resumen y medallas |
| `13-graficos-y-sonido` | Calidad Baja, Media y Alta, los cuatro diseños de la nave, explosiones, escudo y sonidos |

**Pendiente:** la prueba del planeta (biomas, vuelta completa, choques con el suelo) es de una versión vieja y hay que actualizarla.

## Próximos pasos

1. Modo Historia: misión 2 (emboscada), con aliados que combaten, bombarderos y derribos guionados.
2. Gráficos con estilo industrial desgastado: texturas por bioma, cielo HDRI, partículas y sonidos de packs gratuitos (con pantalla de Créditos). Ya están la calidad Baja/Media/Alta, los efectos nuevos y los sonidos sintetizados; los packs reemplazan las texturas y sonidos hechos en código.
3. Versión web en `/jugar` (en la misma página de descarga), para PC, en lugar del zip: así se pueden cargar los archivos de los packs.
4. Separar `src/main.js` en módulos (planeta, vuelo, combate, enemigos, zonas, modos y pantalla), de a uno por vez y con las pruebas pasando después de cada separación.
