# Cómo se escribe una misión

Las misiones son datos, no código: viven en `src/historia/` (la campaña 1 está en `campana1.js`). Para cambiar un texto, un mensaje de radio o cuándo pasa algo, alcanza con editar ese archivo. Si una idea necesita algo que el formato no tiene, se marca como **[MECÁNICA NUEVA]** y se programa aparte.

Después de cambiar algo, correr `npm test -- historia`: controla que los mensajes de radio no pasen de 90 caracteres, que la instrucción previa no pase de 80 palabras y que todos los que hablan estén en el reparto.

## Reparto

`REPARTO` dice quién habla por radio. Cada personaje tiene un ID estable (`FERREYRA`, `AGUJA`…) que usan las misiones; así se puede cambiar un nombre sin tocar nada más.

| Campo | Qué es |
|---|---|
| `radio` | Lo que se ve en pantalla al hablar (el indicativo). |
| `nombre` | Nombre civil (por ahora solo de referencia). |
| `marca` | Color de las puntas de ala de su nave, en RGB de 0 a 1. Los aliados comparten el modelo del jugador y se distinguen por este color. |

## Misión

| Campo | Qué es |
|---|---|
| `id` | Identificador estable (`c1m1`). Con él se guarda el progreso: no cambiarlo una vez publicado. |
| `campana`, `numero`, `titulo` | Lo que se ve en el menú y en las instrucciones. |
| `sector` | Dónde se juega: `nombre`, `radio` en metros y `busca` (por ahora solo `'costa'`: de día, tierra verde en el centro y mar alrededor). |
| `instruccion` | Pantalla de instrucciones antes de despegar. Hasta 80 palabras. |
| `resumen` | Texto de la pantalla final. |
| `aliados` | IDs del reparto que vuelan con el jugador, en orden de formación. |
| `medallas` | Tres. Hoy se entienden `completa`, `sin_caer` (sin caer ni salir del sector) y `tiempo` (con `seg`). |
| `reinicio` | Mensaje de radio al repetir una parte. |
| `partes` | Las pruebas, en orden. |

## Parte

| Campo | Qué es |
|---|---|
| `id`, `objetivo` | El objetivo se ve arriba a la izquierda, con su avance (por ejemplo, "Pasá por los anillos 2/6"). |
| `tipo` | `'anillos'` (con `anillos`: cuántos), `'torretas'` (con `torretas`: cuántas) o `'naves'` (con `naves`: lista de tipos de enemigo: `caza`, `pesada`, `interceptor`, `dron`). |
| `danio` | Multiplica el daño enemigo. `0.5` es munición de práctica. |
| `aliados` | `'formacion'` (vuelan con el jugador) u `'orbita'` (miran desde arriba del centro del sector). |
| `eventos` | Qué pasa y cuándo. |

## Eventos

Cada evento se dispara una sola vez por intento de la parte.

```js
{ cuando: { anillo: 2 }, radio: ['RASTRO', 'Mirá adelante, nuevo.', 'alta'], hacer: ['firma', 'RASTRO'] }
```

**Cuándo (`cuando`):**

| Disparador | Se cumple cuando |
|---|---|
| `{ t: 5 }` | pasaron 5 segundos desde que empezó la parte (sin contar el tiempo caído) |
| `{ anillo: 2 }` | el jugador pasó 2 anillos |
| `{ derribos: 1 }` | cayó 1 blanco de esta parte |
| `{ cascoBajo: 50 }` | el casco del jugador bajó de 50 |
| `{ fin: true }` | la parte se completó (su radio suena durante la pausa antes de la siguiente) |
| `{ evento: 'firma_fin' }` | terminó la firma de Rastro |

**Radio (`radio`):** `[quién, texto, prioridad]`.
- **Prioridad `'alta'`:** instrucciones y bajas. Siempre suenan.
- **Prioridad `'baja'`:** comentarios. Se descartan si quedaron más de 6 segundos esperando, y no se repiten al reintentar la parte.
- **Separación:** entre un mensaje y el siguiente hay al menos 4 segundos, para todo el juego.
- **Al repetir una parte:** se vacía la cola de mensajes.

**Acciones (`hacer`):**
- `['firma', 'RASTRO']`: el aliado se pone adelante del jugador y espera a estar a la vista. Después amaga a la izquierda, esquiva a la derecha con un tonel y sale con un golpe de turbo. Al terminar dispara el evento `firma_fin`.

## Reglas del juego para las misiones

- **Sector:** tiene un borde azul.
  - Cerca del borde avisa "Límite del sector".
  - Afuera cuenta 8 segundos ("Volvé al sector · 8"). Si no volvés, se pierde la parte y se repite.
  - Decidido por Santiago: aviso y derrota.
- **Al caer o perder la parte:** se repite desde su comienzo, con casco, escudo y misiles llenos. Se reaparece adentro del sector, mirando al centro. Esto es provisorio (el reporte lo deja por definir).
- **Entre partes:** hay una pausa de 4,5 segundos con el cartel "Prueba completa".
- **Blancos de práctica:** son amarillos y su marca en pantalla también.
- **Aliados:** todavía no combaten ni pueden morir. Eso llega con la misión 2.

## Lo que todavía no existe (pedido por el reporte 01)

- Aliados que combaten y pueden caer; protección narrativa de los compañeros.
- Bombarderos, convoy grande por puntos con paradas.
- Retirada de un enemigo por un punto de salida (Rastro en la campaña 2).
- Derribos guionados (el líder alcanzado por un misil delante del jugador).
- Otros tipos de sector (`busca`) además de `'costa'`.
