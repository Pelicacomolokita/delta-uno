# Estado de las misiones de la campaña 1

Repaso pedido por Santiago el 21/11/2026. Qué dicen los documentos que hay que hacer en cada misión, qué
puede hacer el motor hoy, y en qué orden conviene construir. Lo que sale de los documentos está citado; lo
que es mi lectura está marcado como tal.

Fuentes: `reporte-historia-H1.0.md` (tabla de misiones), `encargo-P0.1.md` (hitos narrativos y anexo de
montaje), `formato.md` (lo que el motor sabe hacer y lo que no), `prompt-misiones-y-mapa.md` (qué hay que
pedirle al chat de historia).

## Dónde estamos

- **1 misión jugable:** C1-01 Entrenamiento. Tres partes: anillos, torretas de práctica, blancos de simulación.
- **6 anunciadas y no jugables:** aparecen en el menú con su título y "En desarrollo".
- Los textos de la misión 1 son **provisorios a propósito**: el archivo `campana1.js` lo dice en su primera
  línea. Salen de la "base propuesta" del reporte 01 y se reemplazan cuando llegue la ficha de la campaña 1.

## Qué hay que hacer en cada misión

Partes y lugares según `reporte-historia-H1.0.md` y el anexo de montaje de `encargo-P0.1.md`.

| # | Misión | Lugares | Partes | Qué le falta al motor |
|---|---|---|---|---|
| C1-02 | Primera salida | CO03 → CO04 (Puerto Clara) | Reconocer acceso → patrulla → batería | **Nada.** Se puede armar hoy |
| C1-03 | Carga importante | CO03 → CO06 → CO04 → CU01 | Reunión → despejar ruta → proteger llegada | Convoy con paradas |
| C1-04 | Mantener la posición | CU01 → CU02 → CU03 | Interceptar exploradores → oleadas → cubrir transporte | Transporte; interceptores |
| C1-05 | Por debajo | CU03 → AG01 → AG02 | Aproximación baja con sigilo → batería → abrir paso | Reglas de detección |
| C1-06 | Emboscada | CU03 → AG04 → AG05 | Tres bombarderos → emboscada → resistir 2 min → escapar | Bombarderos; bajas guionadas |
| C1-07 | Los que quedan | CO04 → CU03 → AG02 → AG03 | Escolta → tres posiciones en secuencia → llegada | Convoy con paradas |

Hitos narrativos que no se pueden perder (de `encargo-P0.1.md`, sección 6), porque condicionan cómo se
programa C1-06: los tres bombarderos son **señuelo real** contra Alto del Paso y se destruyen antes de la
emboscada; caen seis aliados en cuarenta segundos adentro de los dos minutos; quedan cinco muertos y Rastro
desaparecido; el cierre es **escapar**, no exterminar.

## Lo que el motor no sabía hacer, y qué cambió

`formato.md` lista lo que falta. Ese archivo se escribió antes del trabajo de este mes, así que lo reviso
uno por uno:

| Falta según `formato.md` | Hoy |
|---|---|
| Aliados que combaten y pueden caer | **El mecanismo existe.** `src/modos/batalla.js` tiene combate entre inteligencias: los aliados pelean, mueren y sus bajas se cuentan. No está conectado a las misiones |
| Otros tipos de sector (`busca`) además de `'costa'` | **Los datos existen.** Están los 37 hitos con su región, su punto y su altura de suelo (`src/mundo/hitos.js`, `centros`). El sector puede pararse sobre un hito con nombre |
| Protección narrativa de los compañeros | Falta. Es una bandera por aliado, trabajo chico |
| Bombarderos | Falta. Tipo de enemigo nuevo |
| Convoy grande por puntos con paradas | Falta. Hay la nodriza del modo Conquista como punto de partida |
| Retirada de un enemigo por un punto de salida | Falta. La batalla ya tiene correa y punto de salida, es adyacente |
| Derribos guionados | Falta. Hace falta una acción nueva en `hacer` |

**Importante y comprobado:** los aliados de misión de hoy (`stepAlly` en `main.js`) vuelan en formación y
nada más. No tienen vida, no disparan y no pueden caer. Lo que hay que hacer es traer a las misiones lo que
ya funciona en Batalla campal, no escribirlo de nuevo.

## Lo que yo cambiaría

Esto es mi lectura, no algo que digan los documentos.

**1. Hoy hay tres tipos de parte: anillos, torretas y naves.** Con eso, las seis misiones que faltan sólo se
diferencian en cuántos enemigos tienen. El propio `reporte-historia-H1.0.md` avisa: "no sustituir variedad por
oleadas cada vez mayores ni usar una emboscada sorpresa en todas las misiones". Con tres tipos de parte eso
es justamente lo único que se puede hacer. Antes de escribir fichas conviene agregar tipos de parte, y los
que hacen falta salen solos de la tabla de arriba:

- `frente`: aliados y rivales peleando entre sí mientras el jugador cumple su objetivo (C1-04, C1-06). Es lo
  que ya hace Batalla campal.
- `escolta`: un transporte que recorre hitos con paradas y hay que mantenerlo vivo (C1-03, C1-07).
- `sigilo`: aproximación baja donde ser visto cuesta (C1-05). En `main.js` ya están `threat` y `lineOfSight`.
- `aguantar`: sostener una posición N segundos (C1-04, y los dos minutos de C1-06).
- `estructuras`: volar construcciones (C1-02 batería y otras). Las construcciones de los hitos ya se rompen.

**2. C1-02 se puede armar hoy mismo**, con anillos, naves y torretas, y es la primera misión donde los
aliados tienen que poder morir. Sirve como prueba de todo el andamio antes de meterse con el convoy.

**3. El orden que propongo**, de lo más barato a lo más caro, y cada paso deja algo jugable:

1. Traer a las misiones los aliados que combaten (ya existe en la batalla) + bandera de protección narrativa.
2. Sector sobre un hito con nombre, para que las misiones puedan pasar fuera de Costa Clara.
3. C1-02 completa, con texto provisorio.
4. Tipo de parte `frente` y `aguantar` → C1-04.
5. Convoy con paradas → C1-03 y C1-07.
6. Sigilo → C1-05.
7. Bombarderos + bajas guionadas → C1-06, que es la más cara y la que no se puede equivocar.

Esto coincide con la entrega P2 del `encargo-P0.1.md`: "Campaña 1 completa; convoy y aliados mínimos".

## Qué hay que pedirle al chat de historia

Ya está escrito en `prompt-misiones-y-mapa.md`, punto 3: las **fichas de las misiones 2 y 3** con el formato
de `formato.md`. Por cada parte: objetivo, despliegue enemigo (tipo, cantidad y dónde, respecto de un hito
del lugar), aliados y qué hacen, estado de inicio, eventos y radio, condición de derrota, y tres medallas.

Dos límites del formato que la ficha tiene que respetar, porque la prueba 12 los controla: cada mensaje de
radio, 90 caracteres como máximo; la instrucción previa, 80 palabras como máximo.

## Límite de rendimiento a tener presente

`encargo-P0.1.md` fija "unas 25 naves activas mientras no se apruebe otra capacidad medida". Medido este mes
en Batalla campal: **89 naves cuestan lo mismo de dibujo que 17** (47 llamadas y 75.000 triángulos, contra un
presupuesto de 150 y 400.000), porque la flota va instanciada y más allá de 900 m una nave es una baliza. Eso
dice que el techo de 25 se puede subir, pero **no está medido en un teléfono de verdad**, que es la condición
que pone el propio documento. No lo trataría como aprobado hasta probarlo en el teléfono objetivo.
