# Prompt para el chat de naves y pinturas

Abrí un chat nuevo con acceso al repositorio `Pelicacomolokita/delta-uno` y pegá lo que está dentro del bloque.

```
Vamos a desarrollar las naves y las pinturas (skins) de Delta Uno, un juego de naves 3D para teléfono y PC hecho con three.js 0.128. Soy Santiago; no soy programador, escribime en español rioplatense. Antes de afirmar que algo está mal, preguntame el contexto.

Leé primero: docs/naves/prompt-naves.md (este pedido), docs/decisiones.md, docs/historia/reporte-historia-H1.0.md (sección 5: clases y desbloqueos) y src/nave.js.

## Qué quiero
1. Naves que parezcan naves: fuselaje con volumen, cabina, tomas de aire, alas, timones y toberas. Estilo industrial desgastado. Más compactas y creíbles que las de hoy, que son casi una lámina (4,8 m de ancho, 4,6 m de largo, 1,1 m de alto).
2. Piezas que se mueven: alerones al rotar, timones al doblar, elevadores al subir o bajar la trompa, frenos de aire al cortar empuje y toberas que se abren con el turbo.
3. Naves modificables: cada nave se arma con piezas separadas (fuselaje, alas, motores, armas a la vista) para poder cambiarlas, y con zonas de pintura separadas para las pinturas.
4. Empezar por el Caza de la Guardia. Después Interceptor, Ataque pesado e Infiltración. El objetivo final son 12 naves: 4 clases por 3 bandos (Guardia, Directorio, Desligados).
5. Mostrarme cada nave en el Hangar (herramientas/hangar) antes de meterla al juego, con controles para mover cada pieza.

## Cómo está hecho hoy
- src/nave.js: los diseños se arman en código. NAVES tiene, por diseño, `engines` (dónde salen las llamas), `muzzles` (de dónde salen los tiros) y `build`. PALETAS son las pinturas. naveGeometria(T, modelo, paleta, marca) devuelve una sola malla; naveMaterial(T) le pone la textura de paneles.
- src/main.js: buildPlayerShip() arma la nave del jugador y restyleAllies() la de los compañeros (misma nave, con el color `marca` de cada piloto en las puntas de ala).
- src/hangar/catalogo.js: lo que muestra la pantalla "Preparar la salida": CLASES (con barras de velocidad, agilidad, casco y poder de fuego), ARMAS (ranuras principal y secundaria) y PINTURAS. Hoy solo el Caza está disponible y todas las naves vuelan igual.
- herramientas/hangar/: visor 3D con las mismas luces del juego.
- Calidad gráfica Baja/Media/Alta: en Baja la nave va sin textura.

## Lo que hay que respetar
- La nave apunta hacia -Z, con +Y arriba. Las medidas están en metros.
- Los choques y los tiros usan una silueta fija en src/main.js (boltHitsShip: triángulo de punta (0,-3) y alas (±2,4, 1,6), con 0,62 m de medio espesor). Si la forma cambia, hay que cambiar esa silueta con cada clase y avisarme: afecta la dificultad.
- Tiene que andar en teléfonos: hasta unas 25 naves a la vez. Pocas mallas por nave y materiales compartidos.
- Sin archivos externos por ahora: todo se hace en código. Si conviene pasar a modelos .glb, proponémelo antes.
- Las diferencias de vuelo entre clases (velocidad, giro, casco, armas) las decido yo: proponé números y esperá mi aprobación.
- Correr las pruebas (npm test) antes de cada entrega. Las de naves y de la pantalla de preparación son tests/suites/13 y 14.

## Primer entregable
El Caza de la Guardia en el Hangar, con sus piezas móviles y dos pinturas, y una propuesta de cómo se guardan las piezas y las pinturas para que después se puedan elegir en la pantalla "Preparar la salida" (pestañas Nave, Equipo y Diseño).
```
