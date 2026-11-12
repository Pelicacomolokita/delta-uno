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
- **Límite de naves:** como mucho 20 enemigos activos a la vez. En una zona densa entran sus 6 defensas, 3 escuadrones y la nodriza. No está medido en un teléfono real.

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
| Historia | Infinitas | Si caés o salís del sector, repetís la parte de la misión. Hoy: campaña 1, misión 1 |

Los récords se guardan por modo y, en Conquista y Supervivencia, también por dificultad.

## Demo pública

- **Plataformas:** APK para Android 7 o más nuevo, y un zip con el HTML para jugar en la computadora. Los arma GitHub y se publican en Releases, siempre con el mismo nombre (`delta-uno.apk`, `delta-uno-pc.zip`) para que los enlaces apunten a la última versión.
- **Página de descarga:** en GitHub Pages. En el teléfono destaca el botón de Android; en la computadora, el de computadora y un código QR para pasarla al teléfono; en iPhone avisa que no hay versión. Atajos `/apk` y `/pc` para compartir. Cuenta visitas y descargas de forma anónima, con `utm_source` para saber de qué foro vino cada uno.
- **App Android:** pantalla completa, siempre en horizontal (gira sola entre los dos lados) y con la pantalla siempre encendida. Sin botón de pantalla completa, porque ya lo está.
- **Identificador de la app:** `io.github.pelicacomolokita.deltauno`, provisorio hasta que Santiago lo defina.
- **Firma:** clave de pruebas guardada en el repositorio, para que cada versión se instale encima de la anterior. No sirve para Google Play.

### Datos anónimos de uso (PostHog)

- **Qué se manda:** inicio y fin de sesión, inicio y fin de partida (modo, dificultad, resultado, duración, puntos, derribos, caídas), cada caída con su causa, los cuadros por segundo de cada minuto jugado, los cambios de ajustes, los errores (hasta 5 por sesión) y los toques en "Dar tu opinión".
- **Del equipo:** sistema, navegador, pantalla, placa de video, memoria, núcleos, idioma, plataforma (app, archivo en la PC o web) y con qué se juega.
- **Qué no se manda:** nada que identifique a la persona. Cada equipo tiene un número al azar guardado en el navegador o la app. No se crean perfiles de persona en PostHog.
- **Aviso:** está activado de entrada; la primera vez, el menú lo avisa con un botón "Entendido". Se apaga en Ajustes y, apagado, se borra lo que faltaba mandar.
- **Envío:** cada 15 segundos y al salir o pasar la app a segundo plano. Sin conexión, se guarda (hasta 200 eventos) y se manda la próxima vez.

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

### Modo Historia (lo programado)

- **Misión 1, Entrenamiento:** jugable con textos provisorios del reporte 01 (`docs/historia/reporte-01.md`).
  - Tiene tres pruebas: 6 anillos, 3 torretas de práctica y 3 blancos de simulación sin piloto. Los blancos de práctica son amarillos y su munición hace la mitad de daño.
  - Vuelan Ferreyra (Delta Uno), Aguja, Rastro, Chispa y Faro.
  - En el anillo 2, Rastro hace su firma delante del jugador: amague a la izquierda, tonel a la derecha y golpe de turbo. Chispa la comenta.
- **Sector:** la misión se juega en un sector con borde azul.
  - Cerca del borde avisa.
  - Afuera cuenta 8 segundos y, si no volvés, se pierde la parte. Decidido por Santiago: aviso y derrota.
- **Reinicio:** al caer o perder la parte se repite desde su comienzo, con la nave reparada y los misiles llenos. Se reaparece adentro del sector, mirando al centro. Es provisorio: el reporte lo deja por definir.
- **Radio:**
  - Muestra un mensaje por vez, con al menos 4 segundos entre uno y otro, y como máximo 90 caracteres.
  - Primero salen los importantes.
  - Los comentarios atrasados se descartan, y al repetir una parte se vacía.
- **Pantallas:** instrucciones antes de despegar y resumen con tres medallas: completar, sin caer ni salir del sector, y en menos de 5 minutos.
- **Progreso:** se guarda en el navegador o la app, con las medallas ganadas y el mejor tiempo.
- **Aliados:** vuelan en formación (dos adelante, dos a los costados y Faro atrás, cerrando) o en círculo arriba del sector. Todavía no combaten ni pueden caer.
- **Estilo visual:** a futuro va hacia lo industrial desgastado. Lo eligió Santiago.
- **Munición y estado al empezar una parte:** según la historia de cada misión (por ejemplo, arrancar con pocos misiles si el escuadrón no se pudo reabastecer). Lo decidió Santiago; el campo `inicio` de cada parte ya lo permite.
- **Choques contra estructuras** (pórticos, puentes, edificios): rebote con daño, como las rocas. Decidido por Santiago; se programa con las estructuras.
- **El mapa se rehace** a partir de la historia (reporte 0.3): regiones, estructuras y despliegues pensados por misión. Antes de construirlo se escriben las misiones y la relación de cada lugar con la historia. Los récords actuales se pueden perder.
- **Vuelo libre:** se va a poder elegir la región donde arrancar.
- **Formato de las misiones:** está en `docs/historia/formato.md`.

## Gráficos y sonido

- **Calidad:** Automática, Baja, Media o Alta, en Ajustes → Gráficos.
  - **Baja:** resolución 1, sin suavizado de bordes, nave lisa, menos fuego y restos, sin onda expansiva.
  - **Media:** resolución 1,5 y nave con paneles.
  - **Alta:** resolución 2 y todos los efectos.
  - **Automática:** elige según el equipo. Computadoras: Alta, o Media con placa de video débil. Teléfonos: Baja si son viejos, Media los comunes y Alta los de gama alta de los últimos años (Adreno 7xx, Mali-G7xx, Immortalis, Apple).
  - Si en Automática el juego no llega a 30 cuadros por segundo durante 10 segundos (después de bajar la resolución), baja un escalón solo. Queda en los datos de uso como `calidad_auto`.
- **Explosiones:** destello, fuego que pasa de amarillo a naranja y rojo, humo oscuro que sube, restos de chapa que caen dejando humo, y una onda expansiva. Todo hecho en código; el pack de partículas de Kenney lo va a reemplazar.
- **Escudo:** cuando te pegan con escudo, se ilumina la cáscara del lado del tiro y se abre una onda desde ese punto.
- **Diseños de la nave:** Actual, Guardia, Interceptor y Blindado, elegibles en Preparar la salida → Diseño. Todos tienen la misma silueta para los choques y los tiros, así que se juega igual. Los compañeros usan el mismo diseño, con el color de sus puntas de ala. Falta que Santiago elija uno (visor: herramientas/hangar).
- **Sonido sintetizado** (sin archivos, en `src/sonido.js`):
  - Motor con dos tonos graves, silbido de turbina según el empuje y rugido con el turbo. Viento según la velocidad.
  - Cañón con chasquido, cuerpo y golpe grave, un poco distinto en cada tiro.
  - Explosiones en capas: estruendo grave, ruido, chasquido si está cerca y restos que repiquetean. Suenan según dónde pasan: más lejos, más bajas, más apagadas, con un poco de demora y del lado que corresponde. Como máximo 4 a la vez.
  - Escudo (zumbido eléctrico) y casco (chapa golpeada) suenan distinto.
  - Radio: clic y estática al abrir, crujidos bajitos mientras dura el mensaje y el "chsss" del final.
- **Packs gratuitos** (decidido por Santiago: calidad completa, con crédito a los autores si la licencia lo pide): texturas, cielo HDRI, partículas, sonidos y música. Los sitios de packs no se pueden descargar desde el entorno de trabajo, así que los baja Santiago y los adjunta. Con los packs llega una pantalla de Créditos.

## Intro de la productora

- El juego abre con la intro de Cebado Producciones (8 segundos), antes del menú. Detalle en `docs/intro-cebado.md`.
- Primero una pantalla con "Comenzar": el navegador solo deja sonar después de un toque, y ese mismo toque habilita el audio del juego.
- Se puede saltar con el botón, un toque, Escape, cualquier tecla o cualquier botón del mando.
- Una vez por sesión. Se apaga en Ajustes → Intro de la productora.
- Si el video no se puede reproducir, se entra al menú igual: nunca deja al jugador trabado.

## Preparar la salida (decidido por Santiago)

- La nave no se elige en Ajustes ni se cambia en vuelo. Se elige antes de despegar, en una pantalla alineada con el selector de misión.
- La pantalla tiene cuatro pestañas: **Misión** (lista de la campaña, descripción, sector, compañeros, duración, mejor tiempo, pruebas y medallas), **Nave** (clases, con barras para comparar), **Equipo** (arma principal y secundaria) y **Diseño** (pintura).
- Abajo queda siempre a la vista el resumen de lo elegido y el botón Despegar.
- En Historia se entra por "Ver la misión". En los otros modos, por el botón "Nave y equipo" del menú; "Despegar" sigue saliendo directo.
- Todo sale de `src/hangar/catalogo.js`. Hoy hay una sola nave disponible (Caza), un arma por ranura y dos pinturas. Las otras clases se ven, con la misión que las desbloquea, pero no se pueden elegir.
- Las naves y las pinturas se desarrollan en otro chat (`docs/naves/prompt-naves.md`). Tienen que ser modificables: piezas y zonas de pintura separadas.
- En Diseño queda "Carrocería de prueba" con los cuatro bocetos, hasta que esté el modelo definitivo.

### Lo que falta programar para la campaña

Aliados que combaten y pueden caer, bombarderos, el convoy, derribos guionados (el líder alcanzado por un misil), la retirada de un enemigo por un punto de salida, y más tipos de sector.

La historia la escribe otra IA con `docs/prompt-historia.md`. Su primer reporte está en `docs/historia/reporte-01.md`.
