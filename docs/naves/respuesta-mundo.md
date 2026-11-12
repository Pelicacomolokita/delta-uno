# Respuesta del lado del mundo (texturas, terreno y escala)

Para el chat de las naves. Fecha: 12 de noviembre de 2026, sobre `main`.

**Antes que nada: las texturas del mundo todavía no están implementadas.** Hoy el terreno se pinta entero en código. Todo lo que diga "propuesta" acá abajo no está programado ni aprobado. Lo que diga "medido" lo corrí yo en este repositorio y pongo el número. Lo que diga "decidido" lo decidió Santiago.

---

## Formato y origen

**1. ¿Imágenes de archivo o dibujadas en código?**
Imágenes de archivo. *Decidido por Santiago*: calidad alta con packs gratuitos, dando crédito a los autores cuando la licencia lo pida.
Hoy, en `main`, no hay ninguna imagen: el terreno usa color por vértice y el shader le agrega grano con ruido. Las texturas se suman arriba de eso, no lo reemplazan.

**2. ¿De dónde salen, con qué licencia, y cómo se cargan?**
De [ambientCG](https://ambientcg.com), todo **CC0**: uso libre, sin pedir permiso. Santiago ya bajó y yo ya preparé 15 materiales y 3 cielos nocturnos; están en `assets/texturas/`.
Carga: *propuesta*, de a poco y después del menú, nunca bloqueando el arranque. Hay un problema previo que hay que resolver primero: **hoy el juego se publica como un solo archivo HTML** (vite-plugin-singlefile) y todo viaja adentro en base64. Con la intro ya pesa 1,27 MB. Para cargar texturas como archivos aparte hay que hacer la versión web separada (`/jugar`), que ya estaba planificada.

**3. ¿Comprimidas para la placa de video o PNG/JPG?**
*Propuesta*: arrancar con **WebP** y pasar a KTX2/Basis solo si la medición lo justifica.
Ya están convertidas: 15 materiales × (Color + Normal) × (1024 y 512), más 3 cielos, **9,8 MB en total**. El pipeline es `node scripts/texturas.mjs <carpeta-con-zips>`.
KTX2 agrega el `KTX2Loader` más el transcodificador de Basis (unos 200 KB) y un paso de compilación. Vale la pena si la memoria de video aprieta, y según la pregunta 5 probablemente apriete. **Sin decidir todavía.**
Aviso sobre las extensiones: corrí una prueba de capacidades y dio WebGL2 sí, ETC2 sí, ASTC sí, S3TC sí, tamaño máximo 8192, anisotropía 16. **Pero eso salió del renderizador por software del entorno de pruebas, no de un teléfono.** No lo tomen como dato del A34.

---

## Tamaño y memoria

**4. ¿Cuántas texturas, de qué resolución, con mipmaps?**
*Propuesta*: **el terreno no lleva una textura por bioma.** El motivo está en la pregunta 7. Serían 4 para el terreno (grano general, roca, lava, nieve) y 3 para estructuras (chapa, hormigón, metal pintado). Siete materiales, catorce imágenes contando los normales.
Resolución: 1024 en Alta, 512 en Media, **ninguna en Baja** (Baja se queda como está hoy).
Mipmaps: sí, hacen falta — sin ellos el terreno lejano hierve. Las imágenes son 1024×1024, potencia de dos, así que no hay problema.

**5. ¿Cuánta memoria de video ocupan?**
Esta es la cuenta que decide todo lo demás, y es la que más me preocupa de su propuesta de 1K:

| | Por textura (con mipmaps) | 14 texturas |
|---|---|---|
| 1024² sin comprimir | 5,6 MB | **78 MB** |
| 512² sin comprimir | 1,4 MB | **20 MB** |
| 1024² en ASTC o ETC2 | ~1,4 MB | **20 MB** |

78 MB de texturas solo para el mundo, al lado de los 8 MB que piden ustedes para las naves, no entra cómodo en un teléfono de gama media.

*Propuesta*: **Alta y Media a 512 sin comprimir (unos 20 MB), y recién subir a 1024 cuando exista KTX2.** Más el cielo nocturno, 1024×512 sin mipmaps, unos 2 MB.
Esto corrige lo que yo mismo le había dicho a Santiago antes: para el *peso de descarga* 1K está bien, para la *memoria de video* no.

**6. ¿Cambian de resolución según la calidad?**
Sí, es parte de la propuesta: Baja sin texturas, Media 512, Alta 512 hoy y 1024 cuando haya compresión. El juego ya tiene el sistema de calidad Baja/Media/Alta con detección automática y bajada sola si no llega a 30 cuadros por segundo.

---

## Cómo se aplican

**7. ¿Qué mapeo usa el terreno? ¿Cada cuántos metros se repite?**
El terreno **no tiene UV**. Conviene que sepan cómo está armado, porque cambia la respuesta:

- Es un *clipmap*: anillos concéntricos de grilla anclados al jugador, con separación creciente hacia afuera. Se reconstruyen como mucho dos anillos por cuadro.
- El fragment shader **ya hace triplanar**: proyecta según hacia dónde mira la cara, igual que lo que ustedes proponen para las naves. Hoy muestrea una textura de ruido en tres escalas (90 m, 9 m y 1,7 m) con desvanecido por distancia.
- Cada vértice lleva un color (`vC`, que es el bioma) y cuatro pesos (`vM`: agua, lava, estratos, copa de árbol).

*Propuesta*: extender eso. Mismos pesos triplanares, fotos en lugar del ruido, repetición de unos **30 m** para el grano principal y **8 m** para el detalle de vuelo rasante, a ajustar mirando.
**El bioma sigue saliendo del color por vértice**, no de una foto por bioma. O sea: la foto del pasto aporta grano y relieve, y el verde lo sigue poniendo el juego. Así el terreno queda con **un solo material** y no se multiplican las llamadas de dibujo, y de paso no importa que la textura de pasto venga con un verde demasiado vivo.

**8. ¿Llevan relieve, rugosidad u otros mapas?**
Solo **Color y Normal**. Rugosidad y metalicidad no: el shader del terreno es a mano y no hace PBR. El desplazamiento no sirve, porque el relieve del planeta lo calcula el juego.

**9. ¿Qué material usa el mundo? ¿Se cambia el espacio de color o el tone mapping?**
Ojo acá, porque la premisa de la pregunta no coincide con el código:

- **El terreno no usa Phong ni Standard ni Lambert: es un `ShaderMaterial` escrito a mano**, con su propia cuenta de iluminación (`GROUND_VS` / `GROUND_FS` en `src/main.js`).
- Las rocas usan `MeshLambertMaterial`; los efectos, `MeshBasicMaterial`; la nave, `MeshPhongMaterial`.
- **No hay `outputEncoding` ni `toneMapping` configurados.** *Propuesta*: no tocarlos, justamente para que las naves no cambien de aspecto.

Esto importa para ustedes: como la luz del terreno la calcula un shader propio y la de las naves la calcula Phong, las dos cuentas tienen que dar parecido. Si en algún momento el terreno se ve más claro o más oscuro que las naves, el ajuste va en el shader del terreno, no en las naves.

**10. ¿Cambian las luces, la niebla o el cielo?**
Los valores que citan están bien, los verifiqué en el código: `HemisphereLight(0xa8c8ff, 0xb08a66, 0.72)`, `DirectionalLight(0xfff0d8, 0.95)`, `Fog(0xb3c9e0, 500, 4200)`.
*Propuesta*: **no cambiarlos** al meter las texturas. Lo único que cambiaría es el fondo estrellado del lado nocturno, que hoy son 900 puntos generados y pasaría a ser la foto de la Vía Láctea. Si eso llegara a obligar a tocar una luz, se los aviso antes.

---

## Estilo

**11. ¿Qué estilo?**
Industrial desgastado, realista pero **desaturado**. Nada de colores de folleto.
De lo que ya bajamos, tres avisos de cosas que vi mirando las imágenes: el pasto (Grass006) viene con un verde de cancha de fútbol y hay que bajarlo bastante; el metal pintado rojo (PaintedMetal004) es un rojo muy fuerte, sirve para detalles chicos y no para una superficie grande; y la nieve con musgo (Snow015) tiene manchas verdes grandes que se van a notar repetidas.

**12. ¿Cuánto desgaste?**
Estructuras: bastante. Óxido en juntas y bordes, pintura saltada, hollín. Naturaleza: limpia, el desgaste es cosa de lo que construyó la gente. Ese contraste es lo que hace leer el mundo como habitado y en guerra.

---

## Escala del mapa

**13. ¿Qué depende del radio de 3650 m? ¿Qué se rompe a 4400?**

Esto lo probé, no lo supongo. Cambié `PLANET_R` a 4400 en una copia y medí:

- **Los biomas no se mueven.** El ruido del terreno se muestrea sobre la esfera unitaria, así que el dibujo de continentes y biomas es angular: el planeta se hace más grande en metros y el mismo lugar sigue estando en la misma dirección.
- **El sector de la misión 1 cae exactamente en el mismo punto**: dirección `(-0.2954, 0.5345, -0.7918)` con 3650 y con 4400.
- **La prueba 12 (historia) pasa igual**: 34 comprobaciones, 0 fallas, con el planeta a 4400.

Lo que **no** se adapta solo, porque está en metros y habría que multiplicarlo a mano:

| Qué | Valor hoy |
|---|---|
| Radio del sector de misión | 1600 m |
| Zonas de combate | ZONE_WAKE / ZONE_SLEEP / ZONE_LEASH |
| Niebla | 500 a 4200 m |
| Piso de cámara y altura de reaparición | en metros sobre el terreno |
| Tamaño de los anillos y de las estructuras | en metros |
| Un término de ruido de la línea 167 | divide por `PLANET_R`: cambiaría un patrón de franjas |

**Cuidado con una cosa:** que la prueba pase no quiere decir que la misión 1 se juegue igual. Con el planeta más grande, los mismos 1600 m de sector abarcan menos terreno, así que el entrenamiento queda en un pedazo más chico y más parejo de costa. Eso hay que **volarlo** antes de decidir. Yo lo puedo probar cuando quieran.

**14. ¿Los biomas deberían crecer con el planeta?**
Crecen solos, por lo que expliqué arriba: son angulares. Lo que hay que decidir es si las **zonas y los sectores** crecen con él. *Opinión*: sí, ×1,2 como proponen, porque si no las misiones quedan proporcionalmente más chicas respecto del mundo.

---

## Rendimiento

**15. ¿Cuántas llamadas y triángulos necesita el mundo? ¿Está medido?**

Medido hoy, en `main`, modo Conquista, dificultad media, 844×390, nave a unos 307 m de altura:

| Calidad | Llamadas de dibujo | Triángulos | Geometrías | Texturas |
|---|---|---|---|---|
| Alta | 61 | 79.000 | 52 | 5 |
| Media | 64 | 79.000 | 55 | 5 |
| Baja | 70 | 79.000 | 55 | 5 |

Con `PLANET_R` a 4400: 60 llamadas y 74.000 triángulos en Alta. Mismo orden.

**Esto son conteos, no tiempos.** Lo corrí en un contenedor con renderizador por software: no sirve para hablar de milisegundos ni de cuadros por segundo, y no está medido en el A34.

Contra el presupuesto que proponen (150 llamadas, 400.000 triángulos): el mundo usa hoy unas 61 llamadas y 79.000 triángulos, y ustedes piden 20 a 25 y hasta 80.000. Da unas 85 llamadas y 160.000 triángulos, bastante por debajo del tope. Me cierra.

Con las texturas, las llamadas no deberían subir, porque el terreno sigue siendo un material. Lo que sube es el relleno de píxeles y la memoria.

Una observación sobre su medición: 59,7 cuadros por segundo de promedio y 59,5 en el 1 % más lento está pegado al tope de 60, así que efectivamente no dice cuánto margen sobra. **Y además esa prueba fue con las naves solas.** Para que el número sirva habría que medir con el mundo andando al mismo tiempo, que es lo que se va a llevar la mayor parte del presupuesto.

**16. ¿Hay niveles de detalle o carga por distancia?**
Para el terreno, sí: los anillos del clipmap tienen separación creciente hacia afuera, y la función de altura saltea octavas de ruido según el nivel de detalle que se le pida. Como mucho se reconstruyen dos anillos por cuadro, para que no haya tirones volando rápido.
Las rocas tienen tres geometrías por distancia. Para las texturas no hay carga por distancia: eso lo resolverían los mipmaps.

---

## Compartir y coordinar

**17. ¿Pueden usar el mismo sistema de carga? ¿Hay texturas para reutilizar?**
Sí a las dos. *Propuesta*: un solo cargador y un solo formato para todo el juego, y un solo lugar donde se declara qué textura se carga en cada calidad.
Para reutilizar ya mismo, en `assets/texturas/`:

| Archivo | Qué es |
|---|---|
| `Metal022-color-1024.webp` + `-normal-` | Chapa oxidada |
| `Concrete047A-...` | Hormigón gris neutro |
| `PaintedMetal003-...` | Metal pintado descascarado |
| `PaintedMetal004-...` | Metal pintado rojo, para detalles |

Están en WebP, 512 y 1024. Si les sirve otro tamaño, lo saco con el mismo script.

**18. ¿Qué archivos vamos a tocar?**
Del lado del mundo: `src/main.js` (el shader del terreno y la carga de texturas), `assets/texturas/`, `scripts/texturas.mjs`, `docs/texturas*.md` y las pruebas 13 a 15.
**No vamos a tocar `src/naves/` ni `herramientas/`.**

**Dónde nos vamos a pisar:** ustedes dicen que en `src/main.js` van a tocar la cámara, las constantes de velocidad, alcance y zonas, y la silueta de choque. El shader del terreno está en ese mismo archivo. *Propuesta*: mándenme los valores nuevos y los aplico yo de una, en vez de que los dos editemos `main.js` en ramas distintas. Si prefieren hacerlo ustedes, avisen antes para que yo no tenga nada a medio hacer ahí.

---

## Lo que necesito de ustedes

1. **Confirmación del presupuesto de memoria de video.** Si las naves se quedan con 8 MB y el mundo con 20, son 28 MB de texturas. ¿Les cierra para el A34?
2. **Una medición con el mundo andando**, no con las naves solas, aunque sean 10 naves. Es el único número que nos dice si 40 a 60 entran de verdad.
3. **Decidir juntos lo de KTX2.** Si lo hacemos, conviene hacerlo una sola vez y para todo el juego.
4. **El valor final de `PLANET_R`**, después de volar la misión 1 con el planeta grande.
