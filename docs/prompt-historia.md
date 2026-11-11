# Prompt para escribir la historia

Copiá todo lo que está dentro del bloque y pegalo en la IA que vaya a escribir la historia. Si cambia algo del juego, actualizá primero la sección "Cómo es el juego hoy".

Su primer reporte está en `docs/historia/reporte-01.md`. Para la próxima entrega conviene pasarle también `docs/historia/formato.md`, que explica cómo se escribe una misión para el juego.

```
Sos guionista y diseñador narrativo de videojuegos. Necesito la historia de "Delta Uno", un juego de naves en 3D para teléfono, que se juega con la pantalla en horizontal. Nosotros programamos el juego; vos escribís el mundo, los personajes y las misiones, en un formato que podamos programar directamente.

## Cómo es el juego hoy
- Se juega en un planeta esférico que se recorre de punta a punta en unos 3 minutos de vuelo. Biomas: mar, playa, pradera, bosque, desierto, mesetas, hielo, montaña y volcán. Hay rocas flotantes y un techo de altura.
- El jugador pilota un caza básico triangular. Tiene cañón, hasta 4 misiles guiados que fijan un blanco antes de disparar, escudo y casco, turbo que se recalienta, una evasión lateral, una reparación que tarda 8 segundos y se corta si le pegan, y una cámara que sigue a un enemigo elegido.
- Enemigos que ya existen: cazas, pesadas (lentas y resistentes), interceptores (muy rápidos, atacan de pasada), drones (enjambres que se tiran encima), torretas en tierra, lanzamisiles en tierra (te fijan antes de disparar; se esquivan con la evasión o con turbo) y una nave nodriza enorme que larga drones. En desarrollo: bombarderos.
- Cada misión se juega en un sector con borde visible. Si el jugador sale, tiene 8 segundos para volver o pierde la parte y la repite.
- La misión 1 (entrenamiento) ya se puede jugar, con los textos provisorios de tu primer reporte. Los aliados vuelan en formación, todavía sin combatir. La "firma" de Rastro ya existe como maniobra.
- Los enemigos ocupan zonas dispersas, normales o densas. Te detectan cuando te acercás y se avisan entre ellos. Para liberar una zona hay que destruir sus torretas y todos sus escuadrones.
- Otras piezas para armar misiones: recorrido de anillos contra reloj, oleadas, escolta de una nave grande y aliados manejados por la máquina.
- Los aliados vuelan solos: derriban enemigos, persiguen, son perseguidos, disparan misiles y pueden morir si el jugador no los respalda. Cuando cae una parte de los enemigos (por ejemplo 10 de 16), los que quedan pueden ir a perseguir a los aliados.
- En pantalla entran hasta unas 25 naves a la vez, sumando aliados y enemigos.
- No hay escenas de video. La historia se cuenta con mensajes de radio en pantalla durante el vuelo, una pantalla de instrucciones antes de cada misión y un resumen al terminar. Los momentos dramáticos pasan dentro del juego, frente al jugador.
- A futuro habrá más naves para elegir y vehículos terrestres con rutas, caminos y puentes. Podés anticiparlos en la historia, pero ninguna misión de las campañas 1 y 2 puede necesitarlos.

## Lo que ya está decidido
Campaña 1 (introducción), 3 misiones:
1. Campo de entrenamiento, en tres partes: aprender a volar pasando por anillos; atacar torretas en un sector; derribar 3 naves "enemigas" de práctica.
2. Emboscada: el escuadrón vuela en formación y lo emboscan. En los primeros 40 segundos caen 6 aliados, y algunas caídas pasan frente al jugador; por ejemplo, un misil enemigo impacta al líder de la formación. Hay que sobrevivir 2 minutos. Del asalto sobreviven solo 3 aliados, y junto a ellos el jugador tiene que derribar 3 bombarderos.
3. Escolta y asalto: proteger un convoy, que es una nave 5 veces más grande que la del jugador, para asaltar 3 zonas enemigas.
Los 3 aliados que sobreviven a la emboscada acompañan al jugador desde ese momento.

Campaña 2: unas 10 misiones donde esos 3 aliados hacen todo con el jugador.
Campaña 3: misiones cada vez más complejas. Al final muere uno de los 3 aliados.

## Lo que tenés que inventar
- El mundo: nombre del planeta, por qué se pelea ahí, la facción enemiga y qué quiere, el nombre del escuadrón del jugador y quién lo comanda.
- Los personajes: el jugador (sin rostro ni voz propia, para que cualquiera se identifique), el comandante, el líder que muere en la emboscada, los 3 aliados que sobreviven (cada uno con indicativo de radio, personalidad y forma de hablar propias) y un antagonista enemigo.
- Por qué importa cada misión en la trama y cómo lleva a la siguiente.
- La muerte del aliado al final de la campaña 3: quién es, cómo pasa y por qué duele. Prepará el terreno desde la campaña 1.

## Reglas
- Todo en español rioplatense con voseo, como el resto del juego.
- Tono: ciencia ficción militar con drama humano. Violencia sin detalles gráficos.
- Los mensajes de radio se leen mientras se vuela: como máximo 90 caracteres cada uno y nunca más de uno cada 4 segundos.
- Cada misión tiene que poder armarse con las piezas de la lista. Si una idea necesita algo nuevo, marcala con [MECÁNICA NUEVA] y explicá qué haría falta.
- Si el jugador cae, reintenta desde el comienzo de la parte de la misión donde estaba.

## Formato de entrega
Entregá en este orden y esperá mi aprobación entre cada paso:
1. La biblia del mundo: planeta, facciones, personajes y el arco de cada campaña en un párrafo.
2. La campaña 1 completa. Para cada misión:
   - Título e instrucción previa (hasta 80 palabras).
   - Objetivos, condición de victoria y condición de derrota.
   - Partes de la misión. Para cada parte: enemigos por tipo y cantidad, aliados presentes, bioma, y qué la dispara (tiempo, cantidad de derribos o llegar a un lugar).
   - Eventos guionados: qué pasa, a quién, cuándo y dónde respecto del jugador.
   - Mensajes de radio en una tabla: qué lo dispara | quién habla | texto.
   - Resumen final y criterios para 3 medallas (por ejemplo: tiempo, daño recibido, aliados vivos).
3. Las campañas 2 y 3 como lista de misiones, una línea por misión. Las detallamos después.
```
