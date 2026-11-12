# Qué texturas sirven para Delta Uno

Guía para elegir packs. La idea es no bajar 500 MB de material que después no entra en el juego.

## Lo primero: qué usa el juego hoy

| Parte | Cómo se pinta hoy |
|---|---|
| Terreno (9 biomas) | Color por vértice. **Sin ninguna textura.** |
| Estructuras (torretas, anillos) | Color por vértice |
| Nave | Textura hecha en código (paneles, remaches, raspones) |
| Cielo | Degradé hecho en código, que sigue al sol |
| Estrellas | 900 puntos generados |

Las texturas se suman arriba de eso, no lo reemplazan: el color por vértice sigue marcando el bioma y la textura le pone el detalle.

## Los dos tipos que sirven

### 1. Materiales que se repiten (lo más importante)
Son cuadrados que se pegan uno al lado del otro sin que se note la unión. Van en el terreno y en las estructuras. **Esto es lo que más cambia cómo se ve el juego.**

| Para qué | Qué buscar en ambientCG |
|---|---|
| Pradera, Bosque | `Grass`, `Ground` (con pasto o con hojas) |
| Playa, Desierto | `Sand` |
| Mesetas, Montaña | `Rock`, `Cliff` |
| Hielo | `Snow`, `Ice` |
| Volcán | `Rock` oscuro, `Lava` |
| Salinas (región nueva) | `Ground` blanco agrietado, `Salt` |
| Puertos, bases, puentes, pórticos | `Metal`, `MetalPlates`, `Concrete`, `Rust`, `Asphalt` |

### 2. Calcomanías sueltas (después, no ahora)
Manchas de óxido, quemaduras, números pintados, rayones. Se pegan encima de una estructura para que no se vean todas iguales. Útiles cuando existan las ciudades y las bases.

## Qué archivos bajar de cada material

Los packs vienen con 5 o 6 imágenes por material. **El juego hoy solo puede usar dos:**

| Archivo | ¿Sirve? |
|---|---|
| `_Color` | **Sí.** Es el que más se nota. |
| `_NormalGL` | **Sí**, da relieve falso. Obliga a cambiar el material del terreno (hoy es Lambert, que no lo soporta; pasaría a Phong). |
| `_Roughness`, `_Metalness` | No. Necesitan materiales PBR, que en teléfono cuestan caro. Más adelante. |
| `_Displacement` | No. El relieve del planeta lo calcula el juego. |
| `_AmbientOcclusion` | No por ahora. |

Entonces: de cada material, **Color y NormalGL**. El resto ocupa lugar y no hace nada.

## Resolución y peso

| Dónde se usa | Resolución | Por qué |
|---|---|---|
| Terreno | **512 px** | Se repite cientos de veces y se ve de lejos, en movimiento. A 2K no se nota la diferencia y pesa 16 veces más. |
| Estructuras que se pasan cerca | **1K** | Ahí sí se ve el detalle. |
| Nunca | 2K, 4K, 8K | Es material para cine. En un teléfono llena la memoria de video y el juego se traba. |

**Corrección (12/11):** el peso de la descarga no es el problema más serio; la **memoria de video** sí. Una textura de 1024×1024 sin comprimir ocupa 5,6 MB en la placa de video con sus mipmaps; la misma a 512 ocupa 1,4 MB. Con 14 texturas, eso es la diferencia entre 78 MB y 20 MB. Por eso el plan arranca en **512**, y sube a 1024 solo si pasamos a texturas comprimidas (KTX2). El detalle está en `docs/naves/respuesta-mundo.md`.

**El otro cuello de botella es el peso de descarga.** Hoy el juego es un solo archivo HTML de 1,27 MB y todo viaja adentro. Antes de meter texturas hay que separar los archivos (es la versión web en `/jugar` que ya está planeada). Con eso, un presupuesto sano es:

- unos 12 materiales (Color + Normal) ≈ **6 a 10 MB** en total, convertidos a JPG o WebP;
- cargan de a poco y quedan guardados en el teléfono después de la primera vez.

Si tuviéramos que dejarlo en un solo archivo, el límite sería 2 MB y habría que ir a 256 px: no vale la pena.

## Sobre los HDRI que estuviste mirando

Un HDRI es una foto de 360° del cielo. **Son los menos útiles para este proyecto ahora**, por tres razones:

1. El juego no usa iluminación PBR, así que un HDRI no puede iluminar nada. Solo serviría como fondo.
2. El cielo de hoy es un degradé que sigue al sol: si lo cambio por una foto fija, el sol de la foto no coincide con el del juego.
3. Pesan mucho: el de 1K ya son 4 MB, y el de 8K, 131 MB.

De los tres que mandaste:

| HDRI | Veredicto |
|---|---|
| **Day Environment HDRI 114** | No sirve. Se ve una ciudad, una pasarela y gente: aparecerían Ámsterdam y unos turistas en el horizonte de Nácar. |
| **Day Sky HDRI 046 A** | No sirve como está. La mitad de abajo es un campo sembrado con árboles. Solo serviría recortando la mitad de arriba, y aun así pelea con el sol del juego. |
| **Night Sky HDRI 008** | **Este sí, y es el mejor de los tres.** Una Vía Láctea de verdad es mucho mejor que los 900 puntitos que tenemos. Bajá el de 1K y yo lo convierto a imagen común y lo pongo de fondo del lado nocturno. |

Regla para elegir HDRI de acá en adelante: que sea **solo cielo**, sin suelo, sin edificios y sin gente.

## Licencias

ambientCG es todo **CC0**: se puede usar sin pedir permiso y sin dar crédito. Igual vamos a poner una pantalla de Créditos nombrando a los autores, porque corresponde.

Si mirás otros sitios, fijate que diga **CC0** o **CC-BY**. Evitá "NC" (no comercial) y "Editorial".

## Lista de candidatos en ambientCG

Buscados por nombre y etiquetas, **sin verlos**: desde acá puedo leer el texto de la página (etiquetas, licencia, peso), pero no la imagen. Mirálos vos antes de bajar; si alguno no pega con el estilo, se cambia.

| Para qué | Candidato | Etiquetas que declara | Zip 1K |
|---|---|---|---|
| Pradera | [Ground 020](https://ambientcg.com/view?id=Ground020) | Dirt, Forest, Grass, Ground, Leaves | 10 MB |
| Bosque | [Ground 053](https://ambientcg.com/view?id=Ground053) | Forest, Ground, Leaves, Sand | 10 MB |
| Desierto y Playa | [Ground 031](https://ambientcg.com/view?id=Ground031) | Cracks, Desert, Dry, Ground, Sand, Soil | 10 MB |
| Mesetas y Montaña | [Rock 028](https://ambientcg.com/view?id=Rock028) | Cliff, Grey, Rock, Rough, Stone | 9 MB |
| Hielo | [Snow 011](https://ambientcg.com/view?id=Snow011) | Dirt, Dirty, Floor, Ground, Snow | 8 MB |
| Estructuras: chapa | [Metal Plates 013](https://ambientcg.com/view?id=MetalPlates013) | Metal, Plates, Rust, Rusted | 7 MB |
| Estructuras: hormigón | [Concrete 042 C](https://ambientcg.com/view?id=Concrete042C) | Concrete, Damaged, Mesh, Metal, Rust | 8 MB |
| Cielo nocturno | [Night Sky HDRI 008](https://ambientcg.com/view?id=NightSkyHDRI008) | — | 4 MB |

Faltan Volcán y Salinas: buscá `Lava` y `Ground` blanco agrietado, que no aparecieron candidatos claros.

**Ojo con uno que descarté:** Snow 006 tiene las etiquetas "Steps, Stomped", o sea pisadas. Repetida cientos de veces en el planeta se vería un campo de huellas iguales. La regla es evitar texturas con algo *puntual* adentro (una pisada, una mancha grande, una hoja sola): al repetirse se nota el patrón.

## Cuánto vas a bajar y cuánto queda

El zip de 1K pesa 8 o 10 MB porque trae **todos** los mapas (color, normal, rugosidad, desplazamiento, oclusión). Nosotros usamos dos. Así que:

- lo que bajás: unos **80 MB** por los 10 materiales;
- lo que termina en el juego: unos **6 a 10 MB**, después de quedarme con Color y NormalGL, achicarlos y convertirlos.

No te asustes con el peso de la descarga: el 90 % se descarta.

## Qué bajar ahora, en concreto

1. Bajá el **1K-JPG** de cada fila de la tabla de candidatos (o el que elijas vos en su lugar).
2. El **Night Sky HDRI 008 en 1K**.
3. Mandámelos. Yo los recorto, los achico, los convierto y armo la pantalla de Créditos.

No hace falta que elijas el más lindo de cada categoría: con uno por tipo alcanza para probar cómo queda. Si después uno no funciona, se cambia.


## Lo que ya está preparado

Santiago bajó 15 materiales y 3 cielos nocturnos. Ya están convertidos en `assets/texturas/`, en WebP, a 1024 y 512, con solo el color y el normal: **9,8 MB en total**.

Para preparar más, alcanza con dejar los `.zip` de ambientCG en una carpeta y correr:

```
node scripts/texturas.mjs <carpeta-con-los-zips>
```
