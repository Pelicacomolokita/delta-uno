# Auditoría del proyecto — 13 de noviembre de 2026

Qué está flojo y dónde conviene meter el próximo esfuerzo. Los números los medí; las opiniones van marcadas.

---

## 1. La interfaz promete cosas que no existen

Lo que vos marcaste de las naves es el síntoma de algo más grande.

| Dónde | Qué ofrece | Qué pasa de verdad |
|---|---|---|
| Preparar la salida → Nave | 4 clases con barras de velocidad, agilidad, casco y fuego | Solo el Caza se puede elegir, y **ninguna clase cambia cómo vuela**. Las barras son dibujo. |
| Preparar la salida → Equipo | Arma principal y secundaria | Una sola opción en cada ranura. |
| Preparar la salida → Diseño | Pintura y cuatro carrocerías | **Desde que las naves nuevas reemplazaron a las viejas, no hacen nada.** Lo verifiqué: cambiar la pintura deja la nave igual. |
| Ajustes → Diseño de la nave | Cuatro bocetos | Lo mismo: quedaron colgados. |

Además, la malla vieja del jugador se sigue construyendo aunque no se vea nunca.

**Lo que creo:** esto es lo más urgente, porque es lo único que un jugador nota como "me están mintiendo". Hay dos salidas y hay que elegir una:
- **Sacar lo que no funciona** (pintura, carrocerías, las tres clases bloqueadas) y dejar la pantalla honesta: una nave, un arma, sin barras.
- **Hacer que las clases vuelen distinto**, que es lo que pide la historia. Cada clase necesita velocidad, giro, casco, misiles y daño propios. Es trabajo de verdad, pero es la base de la progresión de la campaña 2.

---

## 2. Son dos juegos que no se tocan

Conquista, Supervivencia, Carrera y Vuelo libre viven en un planeta con zonas tiradas al azar. La Historia vive en sectores diseñados, con compañeros y radio. **No comparten nada:** ni progreso, ni naves, ni desbloqueos. Terminar la misión 1 no cambia nada en los otros modos, y jugar cien partidas de Conquista no aporta nada a la campaña.

Para un juego de campaña con modos libres eso es raro. La proyección del mapa ya propone que Vuelo libre desbloquee regiones por historia; hoy no hay nada de eso.

---

## 3. Contenido: hay una misión de treinta

| | Planificado | Hecho |
|---|---|---|
| Campaña 1 | 7 misiones | 1 |
| Campañas 2 y 3 | 23 misiones | 0 |

Y para la misión 2 hace falta, antes que nada: convoy por puntos, aliados que combaten y pueden caer, y choque con estructuras. Nada de eso existe.

**Lo que creo:** es el agujero más grande del proyecto, pero no el más urgente, porque depende de decisiones de historia que todavía están abiertas.

---

## 4. El mundo está vacío

El planeta es seis veces más grande y las 7 regiones están sembradas, pero no hay **una sola construcción civil**: ni ciudades, ni rutas, ni puentes, ni pórticos. La capa civil de `proyeccion-mapa.md` —que es lo que hace que un mundo se lea como habitado— no existe en el código.

Dicho de otro modo: agrandamos la casa y todavía no pusimos los muebles.

---

## 5. Peso y rendimiento

Lo bueno: **el presupuesto de dibujo está holgado.** El mundo con 60 naves usa 42 llamadas de dibujo y 69.000 triángulos, contra un tope propuesto de 150 y 400.000. Hay lugar de sobra para ciudades.

Lo malo: **el juego es un solo archivo de 1,6 MB** y todo viaja adentro en base64 — la intro, las dos texturas, el cielo. Cada textura que sumemos lo infla. Con archivos sueltos se cargarían de a poco y quedarían guardados en el teléfono. Es el paso que falta antes de meter más texturas.

| Qué | Cuánto |
|---|---|
| Página completa | 1,6 MB |
| De eso, la intro | ~0,46 MB |
| Texturas usadas | 2 de las 15 que bajaste |

---

## 6. El código

`src/main.js` tiene **4.397 líneas de las 6.559 del proyecto**: terreno, shaders, vuelo, inteligencia de los enemigos, interfaz, misiones y datos de uso, todo junto. Ya está anotado como pendiente en el README, pero ahora además **dos chats trabajan sobre el mismo archivo**, que es exactamente donde nos vamos a pisar.

Las pruebas completas tardan **17 minutos**. Cada cambio grande cuesta eso, y por eso termino corriendo suites sueltas y arriesgándome.

---

## 7. Lo que nunca se probó

Esto es lo que más me preocupa después de lo de la interfaz, porque son suposiciones que arrastramos:

- **Nada se probó en un teléfono de verdad desde la demo v0.12.** Todos los números de rendimiento salen de un renderizador por software en un contenedor: sirven para contar llamadas de dibujo, no para hablar de cuadros por segundo.
- **El sonido lo equilibré midiendo, no escuchando.** Nunca lo oyó nadie salvo vos en la muestra.
- **La intro, el mando y los controles táctiles** no se probaron en hardware real desde que cambió todo.
- **La misión 1 no se voló** con el planeta nuevo. La prueba automática pasa, pero eso no dice cómo se siente.

---

## 8. Decisiones abiertas que están bloqueando

| Decisión | Quién | Bloquea |
|---|---|---|
| ¿Las clases de nave vuelan distinto? | Santiago | Toda la pantalla de preparación y la progresión de la campaña 2 |
| Dificultad con las siluetas nuevas (casi el doble de grandes) | Santiago, volando | El equilibrio del combate |
| Blancos civiles: ¿se pueden dañar? | Santiago | La capa civil |
| Valor final de `PLANET_R` | Santiago, volando | El chat de naves, que dimensiona cámara y alcances |
| Fichas de las misiones 2 y 3 | El chat de historia | Todo el contenido nuevo |

---

## Lo que yo atacaría, en este orden

1. **Dejar la pantalla de preparación honesta** y decidir si las clases vuelan distinto. Es barato y saca la mentira de encima.
2. **Separar el juego en archivos sueltos** (la versión web en `/jugar`). Desbloquea las texturas buenas y el mapa de relieve.
3. **Probarlo en tu teléfono** y anotar lo que salga. Es el único dato que no tenemos.
4. **Partir `main.js`** antes de que los dos chats se pisen.
5. **La capa civil**, que es lo que convierte el mapa en un mundo.

El contenido de misiones lo dejaría para después de 1 y 2, porque depende de la historia y porque sin clases ni mundo vestido, más misiones serían más de lo mismo.
