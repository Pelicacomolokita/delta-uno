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
| Conexiones trazadas | 39 (0,84 a 7,5 km; mediana 2,45 km) |
| Itinerarios cargados | 30 misiones, con su ruta y duración objetivo |

Los lugares salen de `src/mundo/lugares.js`, generado por `scripts/plano.mjs` desde `docs/historia/plano-maestro.json`. **No se edita a mano.** La conversión al marco del motor es exacta: el polo del plano cae sobre el polo del motor (1,0000 / 0,0000 / 0,0000) y el peor desvío de distancia contra el plano, sobre las 39 conexiones, es de **5 m**.

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

**Doce de los 37 hitos se corrieron de lugar.** El plano propone dónde va cada cosa; el relieve decide dónde se puede construir. Varios caían en laderas donde el suelo cambia más de 25 m cada 60 m, y ahí los edificios quedan flotando o enterrados.

Cada hito busca el terreno más parejo hasta 420 m alrededor, con una penalización por moverse: si el lugar del plano ya es plano, no se mueve nada.

| | Sin asentar | Asentados |
|---|---:|---:|
| Hitos en terreno empinado (>25 m cada 60 m) | 14 | **2** |
| Peor desnivel | 172 m | **62 m** |
| Corrimiento máximo | — | 420 m |

Los que se movieron: AG02 252 m · AG03 84 m · AG05 84 m · SA01 84 m · SA05 168 m · DE07 168 m · CN01 84 m · CN02 336 m · CN03 252 m · CN04 252 m · CN05 420 m · CN06 168 m.

Los dos que siguen empinados (CN03 y CN06) están en la montaña de Corona Negra y se resuelven con la falda de cada caja.

**Esto no deforma el plano.** Las conexiones miden entre 0,84 y 7,5 km; corrimientos de 84 a 420 m las cambian en centímetros de mapa. Las distancias totales de los itinerarios se movieron menos del 2 %.

Además, cada caja se apoya en su propio terreno y se alarga hacia abajo lo que haga falta: en una ladera ninguna queda colgada del aire.

---

## 3. El día del planeta

El Sol gira alrededor del eje del planeta y da una vuelta entera cada **40 minutos**. Todo lo que ya existía reacciona solo —el cielo, las estrellas, la Vía Láctea, la niebla, la luz del hemisferio y el shader del terreno leen el mismo vector—, así que girarlo no cuesta un cuadro.

| Región | Horas de luz | Sol más alto |
|---|---:|---:|
| Costa Clara | 12 h | 90° |
| Cuenca Verde | 12 h | 82° |
| Las Agujas | 12 h | 82° |
| Mar de las Columnas | 12 h | 74° |
| Salinas del Sur | 12 h | 80° |
| Paso del Deshielo | 12 h | 72° |
| Corona Negra | 12 h | 87° |

**Quién manda la hora:**
- **La Historia la fija y la congela.** La luz es parte de cómo se cuenta cada misión. La ficha puede pedirla por nombre (`hora: 'amanecer'`, `'mañana'`, `'mediodia'`, `'tarde'`, `'atardecer'`, `'noche'`, `'cerrada'`) y se resuelve sobre el centro del sector de esa misión, así que "amanecer" es el amanecer de ahí. También acepta el número crudo del día (0 a 1). Sin nada, luz de día.
- **Los modos libres la dejan correr.** El día pasa mientras volás.
- **El selector de salida de Vuelo libre la acomoda**: si vas a mirar Corona Negra, te pone la hora en que ahí hay sol (32° en los siete que probé).

### Por qué se rehízo la conversión

La primera versión de `scripts/plano.mjs` conservaba la **dirección del Sol** y repartía el resto con un giro de 328°, elegido para que Costa Clara no se moviera de donde ya estaba. Con el Sol girando eso es el invariante equivocado: el Sol dejó de ser un punto fijo del mundo y el **eje** sí lo es.

Esa elección le tiraba la franja tropical del plano encima del polo del motor y dejaba a Salinas del Sur, el Paso del Deshielo y Corona Negra con **cero horas de luz** — noche polar permanente, medida. Las siete regiones del plano están entre latitud −15,7° y +18,3°: ninguna es polar, el polo lo inventaba la conversión.

Ahora el polo del plano va al +X del motor y el giro sobrante alrededor de ese eje queda en 0, porque solo corre el reloj. La dirección del Sol a la hora 0 la exporta el script (`SOL_HORA0`) elegida para que Costa Clara arranque con el Sol a 35°, como venía siendo, y queda sobre el ecuador (x = 0), que es lo que hace que el día dure 12 h en todas las regiones.

**El costo:** el eje de temperatura del terreno sale de |x|, así que ahora las siete regiones caen en la franja cálida (|x| entre 0,00 y 0,31). El hielo del Deshielo y el desierto de Salinas se sostienen porque el clima de cada región es **absoluto**, no un delta sobre la latitud. Verificado: DE sigue saliendo hielo en 6 de sus 8 hitos y SA desierto en los 5. Lo que cambia es que el terreno **entre** regiones es cálido, así que la transición hielo→tibio pasa en el borde de la región y no a lo largo de un hemisferio.

---

## 4. Lo que hay que decidir

### (resuelto) El Sol fijo dejaba tres regiones en noche permanente

Resuelto girando el Sol y rehaciendo la conversión: ver la sección 3. Queda anotado porque explica por qué los hitos se movieron respecto de la primera versión de `lugares.js`.

### Lo que todavía no existe

Siguiendo el criterio de registro del encargo (§9), al día de hoy:

- Las 30 misiones tienen **itinerario cargado** pero solo la 1 es jugable. Las otras 29 están en estado **recorrido provisional**: se puede volar a sus lugares, no ejecutarlas.
- No hay conexiones dibujadas en el suelo: las 39 están en los datos, no como caminos. Es lo que sigue.
- No hay capa civil más allá de los hitos: ni tráfico, ni rutas, ni pórticos entre ciudades.
- Las estructuras **no tienen choque**: se las atraviesa. El encargo pide rebote y daño; es el próximo paso y cambia la dificultad, así que va medido.
- Nada de esto se probó en un teléfono.

---

## 5. Cómo verlo

1. Menú → **Vuelo libre** → "Desde dónde salís" → elegí un hito → Despegar.
2. `window.DeltaUno.hitos().debug()` en la consola da el recuento y los corrimientos.
3. `window.DeltaUno.LUGARES`, `.CONEXIONES` y `.ITINERARIOS` tienen los datos crudos.
