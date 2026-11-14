# P1 — El mundo en bloques

Registro de la primera entrega del encargo P0.1. Qué quedó construido, qué se corrió respecto del plano y qué sigue siendo provisional.

Commit: ver el pie. Rama: `main`.

---

## 1. Qué hay en el juego

| | |
|---|---|
| Radio del planeta | 21.900 m (el del plano, verificado contra la rama) |
| Regiones sembradas | 7, con clima y relieve propios |
| Hitos construidos | **37 de 37**, con los IDs del plano |
| Piezas | 189 cajas, **una sola llamada de dibujo** |
| Conexiones trazadas | 39 (0,92 a 7,59 km; mediana 2,35 km) |
| Itinerarios cargados | 30 misiones, con su ruta y duración objetivo |

Los lugares salen de `src/mundo/lugares.js`, generado por `scripts/plano.mjs` desde `docs/historia/plano-maestro.json`. **No se edita a mano.** La conversión al marco del motor es exacta: el Sol del plano cae sobre el Sol del motor con error cero y el peor desvío de distancia contra el plano, sobre las 39 conexiones, es de **3 m**.

### Cómo se lee cada lugar desde el aire

Cada tipo del plano tiene su volumen, no su modelo:

| Tipo | Cuántos | Qué se ve |
|---|---:|---|
| ciudad | 2 | Ocho manzanas de alturas distintas |
| base | 1 | Dos hangares, plataforma y antena |
| fortaleza | 4 | Muralla en cuatro tramos y torre |
| nodo | 5 | Núcleo, tres soportes y anillo |
| puente | 2 | Tablero de 320 m sobre dos pilas |
| depósito | 2 | Cuatro naves de carga |
| industria | 2 | Galpón, torre y dos chimeneas |
| plataforma | 2 | Losa sobre patas (va en el mar) |
| asentamiento | 1 | Seis construcciones chicas y desparejas |
| central | 1 | Macizo con anillo y tres conductos |
| misil | 1 | Silo de 96 m |
| vuelo, reunión, arena | 14 | Mástiles altos: no hay qué construir, pero hay que poder encontrarlos |

El color dice quién controla el lugar al empezar: Guardia, Directorio, Desligados, Disidentes, Comunidades o disputado.

### Acceso de pruebas a regiones

En **Vuelo libre**, el menú ahora tiene "Desde dónde salís": cualquiera de los 37 hitos, agrupados por región. Sirve para ir a mirar una región sin cruzar el planeta. Los demás modos salen siempre de casa (Base Delta, Costa Clara), como pide el encargo.

---

## 2. Cambios respecto del plano, y por qué

**Diecinueve de los 37 hitos se corrieron de lugar.** El plano propone dónde va cada cosa; el relieve decide dónde se puede construir. Catorce caían en laderas donde el suelo cambia más de 25 m cada 60 m —hasta **172 m** en el caso de la arena de las tres nodrizas—, y ahí los edificios quedan flotando o enterrados.

Cada hito busca el terreno más parejo hasta 420 m alrededor, con una penalización por moverse: si el lugar del plano ya es plano, no se mueve nada.

| | Antes | Después |
|---|---:|---:|
| Hitos en terreno empinado (>25 m cada 60 m) | 14 | **4** |
| Peor desnivel | 172 m | **55 m** |
| Corrimiento máximo | — | 420 m |

Los que se movieron: CO04 84 m · CU01 84 m · AG01 168 m · AG02 84 m · AG03 168 m · AG05 84 m · SA01 84 m · SA02 84 m · SA05 84 m · DE04 336 m · DE05 420 m · DE06 168 m · DE07 84 m · CN01 84 m · CN02 336 m · CN03 336 m · CN04 252 m · CN05 420 m · CN06 252 m.

**Esto no deforma el plano.** Las conexiones miden entre 0,92 y 7,59 km; corrimientos de 84 a 420 m las cambian en centímetros de mapa. Las distancias totales de los itinerarios se movieron menos del 2 %.

Además, cada caja se apoya en su propio terreno y se alarga hacia abajo lo que haga falta: en una ladera ninguna queda colgada del aire. Los cuatro que siguen empinados (DE04, DE06, CN04, CN06) están en montaña de verdad y se resuelven así.

---

## 3. Lo que hay que decidir

### El Sol fijo deja tres regiones en noche permanente

El motor tiene un solo Sol, quieto. Con la rotación que elegimos para encajar el plano, la altura del Sol sobre el horizonte queda así:

| Región | Sol | |
|---|---:|---|
| Costa Clara | 28,8° | día |
| Cuenca Verde | 18,1° | día |
| Mar de las Columnas | 10,1° | sol bajo |
| Las Agujas | 2,6° | atardecer permanente |
| Paso del Deshielo | −12,4° | **noche** |
| Salinas del Sur | −12,9° | **noche** |
| Corona Negra | −34,0° | **noche** |

Esto es una medición, no un juicio. Puede ser exactamente lo que querés: la campaña 1 entera transcurre con luz, la 2 y la 3 se van a la oscuridad, y eso es un arco visual que no habría que fabricar. Corona Negra a oscuras le queda bien al nombre, y el corredor nocturno del Deshielo (DE02) ya pide noche.

Pero Salinas del Sur es un desierto de sal, y nunca ver el sol ahí puede no ser lo buscado. Tres caminos:

1. **Dejarlo.** Medio planeta de día, medio de noche, y la campaña avanza hacia la oscuridad.
2. **Girar el Sol** para que Salinas y Deshielo tengan luz. Cuesta: Costa Clara pierde la suya; es un intercambio, no una mejora.
3. **Un Sol por misión.** Cada misión fija su propia dirección de luz. Es un uniforme del shader, así que es barato, y deja contar la historia con la luz que cada operación necesita sin tocar el mapa.

Yo iría por la 3, pero la decisión es de la historia, no mía. Decime.

### Lo que todavía no existe

Siguiendo el criterio de registro del encargo (§9), al día de hoy:

- Las 30 misiones tienen **itinerario cargado** pero solo la 1 es jugable. Las otras 29 están en estado **recorrido provisional**: se puede volar a sus lugares, no ejecutarlas.
- No hay conexiones dibujadas en el suelo: las 39 están en los datos, no como caminos. Es lo que sigue.
- No hay capa civil más allá de los hitos: ni tráfico, ni rutas, ni pórticos entre ciudades.
- Las estructuras **no tienen choque**: se las atraviesa. El encargo pide rebote y daño; es el próximo paso y cambia la dificultad, así que va medido.
- Nada de esto se probó en un teléfono.

---

## 4. Cómo verlo

1. Menú → **Vuelo libre** → "Desde dónde salís" → elegí un hito → Despegar.
2. `window.DeltaUno.hitos().debug()` en la consola da el recuento y los corrimientos.
3. `window.DeltaUno.LUGARES`, `.CONEXIONES` y `.ITINERARIOS` tienen los datos crudos.
