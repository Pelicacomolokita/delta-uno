# Decisiones de diseño

Qué se decidió hasta ahora y por qué. Los números salen del código (`src/main.js`). Si cambian allá, conviene actualizarlos acá.

## Controles

- **Palanca vertical:** por defecto funciona como un avión: tirar hacia abajo levanta la trompa. Se puede cambiar a directa.
- **Palanca a los costados:** por defecto dobla. En modo Asistido inclina la nave y la hace doblar; en modo Manual es el timón. La opción "Gira sobre su eje" invierte las funciones entre la palanca y los botones.
- **Botones Rotar:** hacen lo contrario que la palanca. Dos toques seguidos esquivan hacia ese lado (3 segundos de recarga).
- **Modo Asistido:** al soltar los controles, la nave se nivela sola. En Manual queda inclinada hasta que la corrijas.
- **Velocidad:** se vuela de crucero al 50 %. El turbo se recalienta en 6 segundos y se enfría en 8; si se recalienta, queda bloqueado 3 segundos.

### PC: teclado y mouse (esquema definido por Santiago)

| Tecla | Acción |
|---|---|
| W / S | Palanca arriba / abajo (la trompa; con "como avión", W baja la trompa) |
| Q / E | Palanca a los costados (doblar, o lo que diga "Palanca a los costados") |
| A / D | Botones Rotar; dos toques esquivan |
| Clic izquierdo | Disparar |
| Clic derecho | Misil: mantener para fijar, soltar para disparar |
| Espacio | Blanco: tocar elige o cambia, mantener suelta |
| Shift | Turbo mientras se mantiene |
| Rueda del mouse | Empuje, de a 10 % |
| R | Reparar |
| C | Cámara: sigue al blanco o normal |
| Esc | Pausa y ajustes |

- **Teclas alternativas:** las flechas, F (misil) y T (Blanco) quedan como segunda opción.
- **Asignar teclas:** cada acción tiene dos casilleros que se cambian en Ajustes → Teclado y mouse. Si una tecla ya estaba en otra acción, se saca de ahí y se avisa.
- **Pantalla:** jugando con teclado o mando no se muestran la palanca ni los botones táctiles. Los indicadores de misil, Blanco y reparación muestran su tecla. En el teléfono, el teclado no esconde los botones; el mando sí.

### Mando (Xbox o PlayStation)

- **Botones de fábrica:**
  - Stick izquierdo: palanca.
  - LB y RB: rotar (dos toques esquivan).
  - RT: disparar.
  - LT: misil.
  - Y: Blanco.
  - A: turbo.
  - X: reparar.
  - B: cámara.
  - Stick derecho arriba y abajo, o la cruz: empuje.
  - Start: pausa.
- **Sticks:** dan valores intermedios, para apuntar fino.
- **Asignar botones:** se cambian en Ajustes → Mando. Start queda fijo para pausar.

### Pantalla táctil

- **Botones en pantalla:** Automático, Siempre o Nunca.
- **Vibrar al recibir daño:** Sí o No. Funciona en la mayoría de los Android.

## Combate del jugador

- **Escudo y casco:** 100 cada uno. El escudo empieza a recargarse 4 segundos después del último golpe.
- **Choque con una roca:** 35 de daño.
- **Misiles guiados:** hasta 4. Se mantiene apretado el botón 1 segundo para fijar el blanco y se suelta para disparar. Se recupera uno cada 20 segundos, y también hay repuestos.
- **Reparación:** 30 de casco en 8 segundos. Cualquier golpe la corta. Recarga de 45 segundos. Se puede volar y disparar mientras repara.
- **Botón Blanco:** la cámara sigue al enemigo elegido. Tocar elige o pasa al siguiente; mantener lo suelta. La cámara gira como mucho 35° desde la trompa, así la nave siempre se ve de atrás. Si el blanco queda más afuera, lo marca la flecha en el borde de la pantalla.

## Puntería enemiga

Antes pegaban 7 de cada 10 tiros de cerca, y parecía que las balas los buscaban. Ahora:

- **Balas rectas desde la trompa:** viajan en línea recta y salen por la trompa, con 3° de corrección como mucho. Si la nave no te apunta, no te pega.
- **Reacción tardía:** ven tu rumbo con 0,3 segundos de retraso, así que maniobrar sirve.
- **Desvío mínimo:** cada tiro se abre al menos 1,6 m, más 1 cm por cada metro de distancia.
- **Impacto real:** solo cuenta si la bala toca la forma real de la nave.
- **Medición** (`npm run medir:punteria`): de cerca y volando recto pegan el 34 % de los tiros; doblando, el 15 %. Antes: 73 % y 63 %.
- **Por dificultad:** los valores cambian con la dificultad elegida (tabla `DIFF` en el código).

## Detección

- **Escuadrones:** te ven de frente hasta 650 m y de costado o de atrás hasta 300 m.
- **Torretas y nodriza:** tienen radar y te ven para todos lados, hasta su alcance más 120 m.
- **Aviso entre grupos:** el grupo que te ve avisa a los grupos de su zona que estén cerca. La distancia del aviso depende del tipo de zona.
- **Perder el rastro:** te pierden si te alejás más de 1,3 km o salís de la zona por más de 650 m, durante 3 segundos.

## Zonas

| Tipo | Radio | Escuadrones (a la vez) | Torretas | Lanzamisiles | Aviso entre grupos | Puntos al despejar |
|---|---|---|---|---|---|---|
| Dispersa | 1.000 m | 4 (3) | 2 | 1 | 450 m | 700 |
| Normal | 760 m | 5 (3) | 3 | 1 | 750 m | 1.000 |
| Densa | 560 m | 6 (3) | 4 | 2 | 1.100 m | 1.500 |

- **Despejar:** hay que destruir todas las defensas de tierra (torretas y lanzamisiles) y todos los escuadrones.
- **Defensas de tierra:**
  - Están sobre una torre de 18 m que se hunde en el suelo, así el terreno lejano, que se dibuja con menos detalle, no las tapa ni las deja flotando.
  - Tienen una baliza roja que titila.
  - Se ubican en terreno abierto y parejo. Van en montaña o volcán solo si la zona no tiene otro lugar, y sobre el agua si la zona está en el mar.
- **En Conquista:** una zona liberada no vuelve a llenarse.
- **Límite de naves:** como mucho 16 enemigos activos a la vez.

## Enemigos

| Tipo | Vida | Qué hace |
|---|---|---|
| Caza | 3 | Ataca en ráfagas de 3 tiros |
| Pesada | 12 | Lenta, ráfagas de 4, más daño |
| Interceptor | 2 | Muy rápido, ataca de pasada y vuelve a dar la vuelta |
| Dron | 1 | En enjambres de 4 a 6; no dispara, se tira encima (12 de daño) |
| Torreta | 7 | Fija sobre una torre, no apunta por debajo del horizonte, alcance 680 m, radar 800 m |
| Lanzamisiles | 6 | Fijo sobre una torre. Si te ve con línea de vista a menos de 1.100 m, te fija durante 2,5 segundos y tira un misil que te persigue (30 de daño, recarga 9 segundos). Se esquiva con la evasión, con turbo (el misil va a 118 m/s y tu máxima es 130) o poniendo una montaña en el medio |
| Nodriza | 60 | Recorre las zonas, tiene cañones que giran y larga drones. Derribarla: +1 vida, y cada zona pierde un escuadrón y una torreta |

## El mar

Tiene olas a dos escalas, más claras en las crestas, y espuma de cerca, todo en movimiento. Antes era un color parejo y no se podía calcular a qué altura estabas.

## Modos y dificultad

| Modo | Vidas | Notas |
|---|---|---|
| Conquista | Fácil infinitas, Medio 5, Difícil 3, Extremo 1 | Extremo: sin corrección automática de tiros ni marca de impacto |
| Supervivencia | 1 | Oleadas cada vez más grandes; nodriza cada 5 oleadas |
| Vuelo libre | Infinitas | Escuadrones al azar, sin zonas fijas |
| Carrera | Infinitas | 12 anillos fijos; si caés, volvés al último con 5 s de castigo |
| Historia | — | En diseño |

Los récords se guardan por modo y, en Conquista y Supervivencia, también por dificultad.

## Campaña 1 (definida por Santiago)

1. **Campo de entrenamiento:** volar por anillos, atacar torretas en un sector y derribar 3 naves "enemigas" de práctica.
2. **Emboscada:** en los primeros 40 segundos caen 6 aliados, algunos frente al jugador; por ejemplo, un misil impacta al líder de la formación. Hay que sobrevivir 2 minutos. Sobreviven 3 aliados, que desde ahí acompañan al jugador. Después, junto a ellos, hay que derribar 3 bombarderos.
3. **Escolta y asalto:** proteger un convoy, que es una nave 5 veces más grande que la del jugador, para asaltar 3 zonas enemigas.

### Resto de las campañas

- **Campaña 2:** unas 10 misiones con los 3 aliados.
- **Campaña 3:** misiones cada vez más complejas. Al final muere uno de los 3 aliados.

### Aliados

Vuelan solos, derriban enemigos, persiguen y son perseguidos, y disparan misiles. Pueden morir si no los respaldás. Cuando cae una parte de los enemigos (por ejemplo, 10 de 16), los que quedan empiezan a perseguir a los aliados.

### El jugador

Al principio pilota un caza básico. Más adelante habrá más naves para elegir, y también vehículos terrestres con rutas, caminos y puentes.

### Supuestos (cambiarlos si no cierran)

- **Al caer en una misión:** se repite la parte de la misión, no la misión entera.
- **Tono:** ciencia ficción militar con drama, sin violencia gráfica.
- **Idioma:** textos en español rioplatense, con voseo.
- **Cantidad de naves:** hasta unas 25 a la vez. No está medido en un teléfono.

### Lo que falta programar para la campaña

Aliados, bombarderos, el convoy, los lanzamisiles, los mensajes de radio, las pantallas de instrucciones y de resumen, los eventos guionados y el guardado del progreso.

La historia la escribe otra IA con `docs/prompt-historia.md`.
