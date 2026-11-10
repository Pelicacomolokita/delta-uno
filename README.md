# Delta Uno

Juego de naves en 3D para teléfono, en horizontal, sobre un planeta esférico. Tiene cuatro modos (Conquista, Supervivencia, Vuelo libre y Carrera), seis tipos de enemigos y una nave nodriza. La Historia está en diseño.

Está hecho con [three.js](https://threejs.org) 0.128 y se arma con [Vite](https://vitejs.dev). El resultado es **un solo archivo HTML** que trae adentro el código, los estilos y la librería 3D. Ese mismo archivo sirve para publicarlo como página, para abrirlo sin servidor y, más adelante, para meterlo en un APK.

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
| `npm test` | Corre todas las pruebas automáticas y muestra un resumen. Tarda alrededor de media hora. |
| `npm test -- combate` | Corre solo las pruebas que tienen "combate" en el nombre. |
| `npm run medir:punteria` | Mide cuántos tiros enemigos pegan según cómo volás. Imprime números; no es una prueba de sí o no. |

La primera vez que vayas a correr las pruebas, instalá el navegador que usan:

```bash
npx playwright install chromium
```

## Cómo está organizado

```
index.html                  pantalla: botones, paneles, menú de inicio
src/main.js                 todo el juego (por ahora en un solo archivo, ver "Próximos pasos")
src/style.css               estilos
scripts/artifact.mjs        arma la versión para publicar en claude.ai
tests/helpers.js            ayudas comunes de las pruebas (teléfono simulado, toques, tiempos)
tests/suites/               las pruebas, por tema
tests/herramientas/         mediciones que no son pruebas de sí o no
docs/decisiones.md          qué se decidió y por qué: controles, puntería, zonas, modos, campaña
docs/prompt-historia.md     el prompt para que una IA escriba la historia
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

**Pendiente:** la prueba del planeta (biomas, vuelta completa, choques con el suelo) es de una versión vieja y hay que actualizarla.

## Próximos pasos

1. Separar `src/main.js` en módulos (planeta, vuelo, combate, enemigos, zonas, modos y pantalla), de a uno por vez y con las pruebas pasando después de cada separación.
2. Torretas más visibles, cámara de Blanco que no pierda la nave y lanzamisiles que te fijan.
3. Campaña 1 (ver `docs/decisiones.md`).
4. Texturas por bioma en formato KTX2 y efectos con el pack de partículas de Kenney (licencia CC0).
5. APK con Capacitor.
