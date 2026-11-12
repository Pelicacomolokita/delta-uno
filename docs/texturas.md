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
| Terreno | **512 px**, 1K como mucho | Se repite cientos de veces y se ve de lejos, en movimiento. A 2K no se nota la diferencia y pesa 16 veces más. |
| Estructuras que se pasan cerca | **1K** | Ahí sí se ve el detalle. |
| Nunca | 2K, 4K, 8K | Es material para cine. En un teléfono llena la memoria de video y el juego se traba. |

**El cuello de botella no es la calidad: es el peso.** Hoy el juego es un solo archivo HTML de 1,27 MB y todo viaja adentro. Antes de meter texturas hay que separar los archivos (es la versión web en `/jugar` que ya está planeada). Con eso, un presupuesto sano es:

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

## Qué bajar ahora, en concreto

1. En ambientCG, filtrá por **Material** y bajá el **1K-JPG** de un material por cada fila de la tabla de arriba (unos 10 o 12).
2. El **Night Sky HDRI 008 en 1K**.
3. Mandámelos. Yo los recorto, los achico, los convierto y armo la pantalla de Créditos.

No hace falta que elijas el más lindo de cada categoría: con uno por tipo alcanza para probar cómo queda. Si después uno no funciona, se cambia.
