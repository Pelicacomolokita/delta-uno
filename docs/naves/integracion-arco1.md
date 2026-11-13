# Integración de las naves nuevas — primer arco

Para quien edita `src/main.js` (el desarrollador del mundo). Las naves viven en `src/naves/` (rama `naves/prueba-rendimiento`); en `main.js` solo hacen falta llamadas. Nada de esto cambia el juego hasta que se prende.

## Qué hay

| Archivo | Qué hace |
| --- | --- |
| `src/naves/juego.js` | **Lo único que usa main.js.** `NavesJuego`: agrega naves, las actualiza, da puntos (llamas, tiros, luces) y la silueta de choque. |
| `src/naves/prueba-en-juego.js` | Prueba de rendimiento: `?flota=40` suma 40 naves decorativas alrededor del jugador. |
| `src/naves/disenos.js` | Diseños (lista de piezas), pinturas, bandos y escuadrones. |
| `src/naves/flota.js` | Dibujo: una malla por diseño y nivel de detalle (instancias), piezas que se mueven en el shader, balizas. |
| `src/naves/mandos.js` | Palanca, pedales, empuje → deflexión de cada pieza, como en un avión. |
| `src/naves/silueta.js` | Silueta de choque de cada diseño (reemplaza al triángulo de `boltHitsShip`). |

Naves del primer arco: **A** (jugador y compañeros, escuadrón Delta), **P1** (bombardero de la Guardia que se escolta), **R1**, **I4** y **P3** (caza, interceptor y pesada del Directorio). Drones, torretas, lanzamisiles y nodriza siguen con las mallas de hoy.

## Paso 1 — Prueba con el mundo real (ya probada)

Cuatro cambios en `main.js`. Los probé en esta rama con el juego armado (`npm run build:test`): 40 naves suman 5 llamadas de dibujo (de 63 a 68) y no hay errores. Después de probar, `main.js` quedó como estaba.

```js
// 1. arriba, con los otros imports (naveTextura ya existe en nave.js)
import { NAVES, PALETAS, naveGeometria, naveMaterial, naveTextura } from './nave.js';
import { leerPruebaFlota, iniciarPruebaFlota } from './naves/prueba-en-juego.js';

// 2. después de: const camera=new T.PerspectiveCamera(58,2,1,14000);
const PRUEBA_FLOTA=leerPruebaFlota();let pruebaFlota=null; // ?flota=40: naves decorativas para medir rendimiento

// 3. en frame(), justo después de: stepCamera(dt,ship.t);
if(PRUEBA_FLOTA){if(!pruebaFlota)pruebaFlota=iniciarPruebaFlota(scene,PRUEBA_FLOTA,naveTextura(T));pruebaFlota.actualizar(dt,camera,ship.pos,ship.q,U);}
```

Medir en el A34 con `?flota=40` y `?flota=60`, 10 minutos, con el medidor del juego. Pasa con 58 cuadros por segundo de promedio y 45 en el 1 % más lento.

## Paso 2 — Interruptor y nave del jugador

1. Un ajuste `settings.navesNuevas` (apagado por defecto). Todo lo que sigue va adentro de `if(settings.navesNuevas)`.
2. Al arrancar la misión: `const naves = new NavesJuego(scene, { detalleTex: calidad==='baja' ? null : naveTextura(T) });`
3. Jugador: `const propia = naves.agregar({ id: 'A', propia: true, pintura: settings.shipPaint === 'noche' ? 'guardiaNoche' : 'guardia' });` y ocultar `shipMesh`.
4. En cada cuadro, después de `stepFlight`:
   - `propia.pos.copy(ship.pos); propia.quat.copy(ship.q);`
   - Mandos: `propia.mandos.roll` (palanca a la derecha = +1), `pitch` (tirar = +1, trompa arriba), `yaw` (pedal derecho = +1), `empuje` (0 a 1), `turbo`, `freno` (sí/no), `velocidad` (m/s). Salen de `input` y de `ship.throttle`.
   - Al final del cuadro, antes de `renderer.render`: `naves.actualizar(dt, camera);`
5. Llamas, bocas de los cañones y luces de navegación: `naves.puntos('A')` → `{ motores, bocas, luces }`, en coordenadas de la nave y ya escalados. Reemplazan a `NAVES[model].engines` y `muzzles`.

## Paso 3 — Compañeros, enemigos y escoltado

- **Compañeros:** por cada uno, `naves.agregar({ id: 'A' })`. Cada cuadro copiar `pos` y `quat`, y para que muevan las piezas: `mandosDesdeGiro(nave, quatAnterior, dt, { empuje, turbo, velocidad })`.
- **Enemigos:** para `caza`, `interceptor` y `pesada`, `naves.agregar({ id: TIPO_ENEMIGO[kind] })` en vez de `ENEMY_GEO[kind]`, y ocultar `slot.mesh`. El diseño ya trae su tamaño: **no aplicar `def.scale`** a estas naves. Mandos con `mandosDesdeGiro`.
- **Escoltado:** las misiones de escolta cuidan un bombardero de la Guardia: `naves.agregar({ id: 'P1' })` (decidido por Santiago para no hacer una nave nueva).
- **Bandos aliados por misión:** `naves.setAliados(['guardia'])` (por defecto). En la campaña 3, `['guardia', 'desligados']`. Las naves aliadas no llevan baliza; las enemigas, una baliza sutil (contorno) del color y la forma de su bando.

## Paso 4 — Choques

- Tiros que te pegan: en `boltHitsShip`, reemplazar el triángulo por `naves.golpea(propia, punto)` en cada punto del recorrido (ya hace la esfera de descarte y el margen de 0,45 m por el grosor de la bala).
- Tiros del jugador a enemigos: `naves.golpea(naveEnemiga, punto)` en vez del radio `def.hit`.
- **Ojo, cambia la dificultad:** las siluetas reales son más grandes que el triángulo de hoy (11 m²). En planta: A 18,9 m², I4 19,1 m², R1 22,4 m², P1 51,4 m², P3 54,6 m². Hay que volarlo y ajustar con Santiago (distancias, vida, o un margen más chico).

## Paso 5 — Escala del mundo, cámara y vuelo (esperar aprobación)

Propuestas de la especificación técnica, **sin aplicar hasta que Santiago las apruebe volando** con el mapa nuevo: `PLANET_R` 3650 → 4400, `TUNE.vmax` 130 → 150, zonas ×1,2, `LOCK_RANGE` 900 → 1050, alcances enemigos ×1,15, cámara 11,5 m × escala × 0,9 atrás y 5,2 m × escala × 0,9 arriba (Caza: 13,5 m y 6,1 m).

## Pruebas

`npm test -- naves` (prueba 16): armado, triángulos, sentido de giro de cada pieza, simetría, tamaño por clase, silueta de choque, mandos, Hangar. Hoy: 89 bien.
