# Estado de las misiones de la campaña 1

Repaso pedido por Santiago el 21/11/2026, corregido el 23/11. Qué dicen los documentos que hay que hacer en
cada misión, qué puede hacer el motor hoy, y en qué orden conviene construir. Lo que sale de los documentos
está citado; lo que es mi lectura está marcado como tal.

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

### El problema

Hoy hay tres tipos de parte: anillos, torretas y naves. Con eso, las seis misiones que faltan sólo se pueden
diferenciar en cuántos enemigos tienen. El propio `reporte-historia-H1.0.md` avisa: "no sustituir variedad por
oleadas cada vez mayores ni usar una emboscada sorpresa en todas las misiones". Con tres tipos de parte eso es
justamente lo único que se puede hacer.

### Separar el contenido de la condición

> **Corrección del 23/11.** La primera versión de este documento proponía cinco tipos de parte nuevos
> (`frente`, `escolta`, `sigilo`, `aguantar`, `estructuras`). Me retracto: cinco sistemas nuevos para seis
> misiones significa que cada misión necesita código nuevo antes de poder jugarse, o sea trabajo de
> construcción y no de juego. Lo que sigue lo reemplaza.

Hoy el tipo de parte decide dos cosas a la vez: **qué hay en el sector** y **qué te hace ganar o perder**.
Separarlas da variedad por combinación en lugar de por sistema nuevo.

| Contenido (qué hay en el sector) | Condición (qué te hace ganar) |
|---|---|
| naves | derribarlos a todos |
| torretas | aguantar N segundos |
| estructuras | que el transporte llegue |
| frente: aliados y rivales peleando entre sí | pasar sin que te vean |
| transporte | no bajar del X % de casco |

Cinco por cinco son veinticinco combinaciones, y de sistemas nuevos hacen falta **dos**:

1. **El transporte** que recorre hitos con paradas y hay que mantener vivo. Se paga en C1-03 y C1-07.
2. **Conectar el frente a las misiones.** Ya está escrito y probado en `src/modos/batalla.js`. Se paga en
   C1-04 y C1-06.

Los otros tres que había propuesto no eran sistemas:

- `aguantar` es una **condición de victoria** sobre una parte que ya existe: sobrevivir N segundos en vez de
  derribar a todos.
- `sigilo` es una **restricción**: no subir de cierta altura, no dejarse ver. `threat` y `lineOfSight` ya
  están en `main.js`.
- `estructuras` son las **torretas apuntadas a los hitos**, que ya se rompen (`src/mundo/hitos.js`).

El criterio que aplico, y es mío: **un sistema nuevo tiene que pagarse en dos misiones por lo menos.** Esto no
es un estudio con equipo; cada sistema que se agrega es tiempo que no se está jugando.

### Qué dice la práctica del oficio

El método más citado para esto es el de **cuatro pasos de Koichi Hayashida (Nintendo EAD)**, tomado del
kishōtenketsu: presentar el concepto en un lugar seguro donde el jugador lo aprende, desarrollarlo donde
fallar ya cuesta, meterle un giro que lo sorprenda, y cerrar dándole una última oportunidad de mostrar lo que
aprendió. La regla de fondo es introducir una cosa a la vez, dejar que la domine, y después combinarla con
algo que ya sabe.

Y el punto que respalda la corrección de arriba: **no hace falta una mecánica nueva por nivel.** Las
mecánicas profundas dan para muchos niveles cada una (apuntes de diseño de niveles de Cornell, CS3152).

Para este género en particular la referencia es Ace Combat, y lo que se le reconoce es exactamente esto: la
estructura de misiones es específica, hay que hacer las cosas de una manera determinada en cada una y no es
sólo volar todo lo que se cruza — algunas piden mantener cierta altura para no ser detectado, otras exigen
volar bien, otras son combate aéreo puro. **Eso no son sistemas distintos: son restricciones sobre el mismo
vuelo.** En el más reciente, como líder de escuadrón hay que equilibrar la superioridad aérea con defender
unidades aliadas en el aire o en tierra, que es el *frente* más el *transporte* de la tabla.

El contraejemplo también sirve: de un clon del género se dijo que la variedad de misiones era llamativamente
escasa, y que le faltaba algo tan simple como alternar el clima. Delta Uno ya tiene sol que rota, volcanes,
agua con relieve y 37 lugares distintos: hay con qué variar sin programar nada.

Referencias: [MCV, los cuatro pasos de Nintendo](https://www.mcvuk.com/development/video-nintendos-level-design-secrets-in-four-steps) ·
[Introduction to Level Design (kishōtenketsu, Hayashida)](https://www.slideshare.net/slideshow/introduction-to-level-design-49277472/49277472) ·
[Level Design Basics](https://abratabia.com/game-design/level-design-basics.php) ·
[Cornell CS3152, diseño de niveles](https://www.cs.cornell.edu/courses/cs3152/2013sp/lectures/24-LevelDesign.pdf) ·
[Ace Combat 8, GadgetMatch](https://www.gadgetmatch.com/now-playing-ace-combat-8-wings-of-theve/) ·
[Ace Combat 8, playday.one](https://playday.one/2026/09/25/ace-combat-8-review/) ·
[Non-Ace Combat Ace Combats #1](https://medium.com/@WordsMaybe/non-ace-combat-ace-combats-1-56a50e5b3a0)

### El orden

De lo más barato a lo más caro, y cada paso deja algo jugable:

1. **Aliados que combaten en las misiones** (ya existe en la batalla) + bandera de protección narrativa.
2. **Sector sobre un hito con nombre**, para que las misiones puedan pasar fuera de Costa Clara.
3. **C1-02 completa**, con texto provisorio. No hace falta motor nuevo: anillos, naves y torretas.
4. **Condiciones de victoria separadas del contenido** (aguantar N segundos, no bajar del X % de casco).
5. **Frente conectado a las misiones** → C1-04.
6. **Transporte con paradas** → C1-03 y C1-07.
7. **Restricción de sigilo** → C1-05.
8. **Bombarderos y bajas guionadas** → C1-06, la más cara y la que no se puede equivocar.

Los aliados que combaten van **primeros**, y no sólo porque sean baratos. En C1-06 caen seis compañeros en
cuarenta segundos. Si en las misiones 2 a 5 los aliados siguen siendo decoración que vuela en formación y no
puede morir, esa muerte no va a pegar. El `encargo-P0.1.md` ya lo advierte: "no introducirlos solo segundos
antes de perderlos".

Esto coincide con la entrega P2 del `encargo-P0.1.md`: "Campaña 1 completa; convoy y aliados mínimos".

### Lo que no haría

**No escribir las seis fichas ahora.** Pedir la de C1-02, armarla, jugarla, y recién después las otras. Los
propios documentos lo dicen: "mantener una versión jugable en cada incremento" y "no optimizar decorado ni
pulir diálogos mientras falten recorridos principales".

## Qué hay que pedirle al chat de historia

Ya está escrito en `prompt-misiones-y-mapa.md`, punto 3: las **fichas de las misiones 2 y 3** con el formato
de `formato.md`. Por cada parte: objetivo, despliegue enemigo (tipo, cantidad y dónde, respecto de un hito
del lugar), aliados y qué hacen, estado de inicio, eventos y radio, condición de derrota, y tres medallas.

**Yo pediría primero sólo la de C1-02**, por lo que está en "Lo que no haría": armarla, jugarla, y recién
entonces pedir las otras con lo aprendido. La de C1-03 depende del transporte, que todavía no existe, así que
una ficha de esa misión hoy describiría algo que el motor no puede jugar.

Dos límites del formato que la ficha tiene que respetar, porque la prueba 12 los controla: cada mensaje de
radio, 90 caracteres como máximo; la instrucción previa, 80 palabras como máximo.

## Límite de rendimiento a tener presente

`encargo-P0.1.md` fija "unas 25 naves activas mientras no se apruebe otra capacidad medida". Medido este mes
en Batalla campal: **89 naves cuestan lo mismo de dibujo que 17** (47 llamadas y 75.000 triángulos, contra un
presupuesto de 150 y 400.000), porque la flota va instanciada y más allá de 900 m una nave es una baliza. Eso
dice que el techo de 25 se puede subir, pero **no está medido en un teléfono de verdad**, que es la condición
que pone el propio documento. No lo trataría como aprobado hasta probarlo en el teléfono objetivo.
