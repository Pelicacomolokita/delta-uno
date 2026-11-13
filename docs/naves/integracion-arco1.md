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

## Paso 5 — Escala del mundo, cámara y vuelo

> **Reemplazado el 13/11.** El planeta quedó en 21.900 m. Las velocidades, el fijado y los alcances se aprobaron con otros valores, que están en `src/vuelo/` y en `docs/decisiones.md`. Lo de abajo queda como historia.

Propuestas de la especificación técnica, **sin aplicar hasta que Santiago las apruebe volando** con el mapa nuevo: `PLANET_R` 3650 → 4400, `TUNE.vmax` 130 → 150, zonas ×1,2, `LOCK_RANGE` 900 → 1050, alcances enemigos ×1,15, cámara 11,5 m × escala × 0,9 atrás y 5,2 m × escala × 0,9 arriba (Caza: 13,5 m y 6,1 m).

## Pruebas

`npm test -- naves` (prueba 16): armado, triángulos, sentido de giro de cada pieza, simetría, tamaño por clase, silueta de choque, mandos, Hangar. Hoy: 89 bien.

---

# Estado de la integración (13 de noviembre, en `main`)

Hecho: **pasos 1 a 4**. El paso 5 queda sin aplicar, como pidieron.

## Medido con el mundo real

Modo Vuelo libre, calidad Alta, 844×390, en el contenedor de pruebas (renderizador por software: son conteos, no tiempos).

| | Llamadas de dibujo | Triángulos |
|---|---|---|
| Mundo solo | 37 | 57.809 |
| `?flota=40` | 42 | 67.461 |
| `?flota=60` | 42 | 69.251 |

Las 5 llamadas que ustedes midieron se confirman, y 60 naves no cuestan más que 40. Contra el presupuesto de 150 llamadas y 400.000 triángulos, sobra.

## Lo que quedó conectado

- `settings.navesNuevas`, apagado por defecto, en Ajustes → Vuelo. Prenderlo y apagarlo funciona en caliente.
- **Jugador:** diseño A, pintura `guardia`. La malla vieja se esconde. Llamas, bocas de cañón y luces salen de `naves.puntos('A')`.
- **Mandos:** `roll` sale de los botones de tonel o de la palanca, `pitch` de la palanca, `yaw` acompaña al alabeo (el juego es de vuelo asistido: la nave dobla inclinándose), `empuje` de `ship.throttle`, `turbo` de `ship.tf`, `freno` cuando el empuje baja de 0,08.
- **Compañeros:** diseño A, con `mandosDesdeGiro`.
- **Enemigos:** caza, interceptor y pesada con `TIPO_ENEMIGO`, sin aplicar `def.scale`. Al morir se sacan de la flota.
- **Choques:** `boltHitsShip` usa `naves.golpea(navePropia, punto)` cuando el interruptor está prendido.

## Lo que falta y por qué

- **El escoltado P1 no está conectado**: todavía no hay ninguna misión de escolta en el juego. El convoy es lo próximo que hay que programar; cuando exista, se agrega con `naves.agregar({id:'P1'})`.
- **Las balizas de bando** usan el valor por defecto (`['guardia']`). La campaña 3 no existe todavía.
- **La dificultad no está ajustada.** Las siluetas nuevas son más grandes (18,9 m² contra 11) y eso hay que volarlo con Santiago, como avisaron.

## Importante: el tamaño del planeta cambió

El paso 5 propone `PLANET_R` 3650 → 4400. **En `main` ya está en 21.900** (seis veces el original), decidido por Santiago el 13 de noviembre para que entren ciudades y escenas de desplazamiento. Medido: el planeta grande sale más barato que el chico, porque el terreno se arma en anillos alrededor del jugador.

Lo que esto cambia para ustedes:

- La cámara, las zonas y los alcances hay que dimensionarlos sobre 21.900, no sobre 4.400. Las zonas de combate y los alcances están en metros, así que **no cambian** con el tamaño del planeta: lo único que cambia es cuánto mundo hay alrededor.
- `TUNE.vmax` sigue en 130. Si proponen 150, mándenlo y lo aplico.
- Las propuestas de cámara (11,5 m × escala × 0,9 atrás, 5,2 m × escala × 0,9 arriba) no dependen del planeta: ésas las puedo aplicar cuando Santiago las apruebe volando.

Detalle en `docs/historia/proyeccion-mapa.md`, sección 2 bis.

# Segunda tanda (13 de noviembre, rama `naves/prueba-rendimiento`)

Ya está conectada en `main.js`. Esto es lo que se agregó a `NavesJuego` y qué hace el juego con cada cosa.

## Estado por nave

| Campo | Qué es | Quién lo carga |
|---|---|---|
| `n.dano` | 0 (entera) a 1 (a punto de caer). Desde 0,4 hay humo y placas quemadas; desde 0,75, fuego y superficies que flamean. | El jugador con su vida; los enemigos con `hp/hpMax`; los compañeros con su daño simulado |
| `n.disparados` | Misiles colgados que ya salieron: esos no se dibujan. | Solo el jugador: lugares del diseño menos los misiles que le quedan |

## Funciones nuevas

- **`naves.romper(n, vel)`** parte la nave en cuerpo, alas y cola. Los pedazos siguen con su velocidad, caen hacia el centro del planeta y humean unos 5 segundos. Hay que llamarla antes de `quitar(n)`. Se usa en `killEnemy` y cuando derriban al jugador (no cuando choca contra el suelo).
- **`naves.setCentro(v)`** dice dónde está el centro del planeta. En el juego es el (0, 0, 0).
- **`naves.renderer = renderer`** hace falta para que el humo calcule bien su tamaño en pantalla.
- **`naves.fogonazo(pos, tam)`** dibuja el destello del cañón. Lo usan los tiros enemigos.
- **`naves.chispas(pos, n)`** dibuja las chispas de un tiro que pega en un compañero.
- **`naves.puntos(id).misiles`** da dónde cuelga cada misil, en el orden en que salen. El misil del jugador sale de ahí.

## Costo

Todo se dibuja con muy pocas llamadas. El humo es una nube de puntos, el fuego otra y el brillo de motores otra; las tres son sumables. Los pedazos usan una malla por diseño y pedazo, y solo mientras hay pedazos en el aire. Cuando no pasa nada, no se dibuja nada de esto.

## Compañeros

Todavía no tienen vida. Simulan los golpes:
- un tiro que les pega larga chispas y les deja humo y placas quemadas (hasta 0,7: nunca fuego ni caída), que se va de a poco;
- un tiro que pasa a menos de 28 m los hace esquivar de costado.

Cuando una misión necesite que puedan caer, conviene un dato en la misión (por ejemplo `aliadosConVida: true`) que use esa misma vía con vida de verdad.

## Choques

El margen de la silueta bajó de 0,45 a 0,35 m. Con 0,45, una bala que pasaba 1 m por debajo del caza pegaba (prueba 2).
