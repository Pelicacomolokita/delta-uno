# Decisiones de diseño

Qué se decidió hasta ahora y por qué. Los números salen del código (`src/main.js`). Si cambian allá, conviene actualizarlos acá.

## Controles

- **Palanca vertical:** por defecto funciona como un avión: tirar hacia abajo levanta la trompa. Se puede cambiar a directa.
- **Palanca a los costados:** por defecto dobla. En modo Asistido inclina la nave y la hace doblar; en modo Manual es el timón. La opción "Gira sobre su eje" invierte las funciones entre la palanca y los botones.
- **Botones Rotar:** hacen lo contrario que la palanca. Dos toques seguidos esquivan hacia ese lado (3 segundos de recarga).
- **Modo Asistido:** al soltar los controles, la nave se nivela sola. En Manual queda inclinada hasta que la corrijas.
- **Velocidad:** se vuela de crucero al 50 %. El turbo se recalienta en 6 segundos y se enfría en 8; si se recalienta, queda bloqueado 3 segundos.

## Combate del jugador

- **Escudo y casco:** 100 cada uno. El escudo empieza a recargarse 4 segundos después del último golpe.
- **Choque con una roca:** 35 de daño.
- **Misiles guiados:** hasta 4. Se mantiene apretado el botón 1 segundo para fijar el blanco y se suelta para disparar. Se recupera uno cada 20 segundos, y también hay repuestos.
- **Reparación:** 30 de casco en 8 segundos. Cualquier golpe la corta. Recarga de 45 segundos. Se puede volar y disparar mientras repara.
- **Botón Blanco:** la cámara sigue al enemigo elegido. Tocar elige o pasa al siguiente; mantener lo suelta. **Pendiente:** hoy hace perder de vista la propia nave; hay que limitar el giro para que la nave siempre quede en cuadro.

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

| Tipo | Radio | Escuadrones (a la vez) | Torretas | Aviso entre grupos | Puntos al despejar |
|---|---|---|---|---|---|
| Dispersa | 1.000 m | 4 (3) | 2 | 450 m | 700 |
| Normal | 760 m | 5 (3) | 3 | 750 m | 1.000 |
| Densa | 560 m | 6 (3) | 4 | 1.100 m | 1.500 |

- **Despejar:** hay que destruir todas las torretas y todos los escuadrones.
- **En Conquista:** una zona liberada no vuelve a llenarse.
- **Límite de naves:** como mucho 16 enemigos activos a la vez.

## Enemigos

| Tipo | Vida | Qué hace |
|---|---|---|
| Caza | 3 | Ataca en ráfagas de 3 tiros |
| Pesada | 12 | Lenta, ráfagas de 4, más daño |
| Interceptor | 2 | Muy rápido, ataca de pasada y vuelve a dar la vuelta |
| Dron | 1 | En enjambres de 4 a 6; no dispara, se tira encima (12 de daño) |
| Torreta | 7 | Fija en tierra, no apunta por debajo del horizonte, alcance 680 m |
| Nodriza | 60 | Recorre las zonas, tiene cañones que giran y larga drones. Derribarla: +1 vida, y cada zona pierde un escuadrón y una torreta |

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
