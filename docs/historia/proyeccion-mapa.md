# Proyección del mapa de Nácar

Cómo imagino el planeta armado según la historia, antes de construir nada. Para auditar y corregir.

Sale de `reporte-mundo-M1.0.md` y `reporte-historia-H1.0.md`, más lo que medí en el planeta de hoy.

---

## 1. La idea en una línea

**La campaña camina del día a la noche.** Empieza en una costa soleada donde vive gente y termina en una montaña del lado oscuro del planeta. No es una metáfora puesta encima: el planeta ya tiene un lado de día y uno de noche fijos, así que esa caminata se puede ordenar de verdad sobre la esfera, y el jugador la siente sin que nadie se la explique.

---

## 2. Por qué el mapa de hoy no sirve

Medí el planeta actual sobre 6.000 puntos repartidos parejo:

| Bioma | Cuánto ocupa |
|---|---|
| Hielo | 20 % |
| Pradera | 19 % |
| Mar | 18 % |
| Bosque, Montaña | 11 % cada uno |
| Playa | 10 % |
| Desierto | 9 % |
| Volcán | 2 % |
| **Mesetas** | **1 %** |

Tres problemas concretos:

1. **Las Agujas, que es una región entera y el frente de la campaña 1, está hecha de mesetas, y las mesetas son el 1 % del planeta.** No hay dónde ponerla. Hay que generarlas, no buscarlas.
2. Busqué anclas para las 7 regiones dentro del terreno actual y no cierran las vecindades que pide el reporte. Las mejores candidatas de desierto y de mesetas caen a 6° una de otra: se pisarían enteras.
3. El hielo ocupa el 20 % en los dos polos, pero el Paso del Deshielo tiene que estar **en uno solo**, del lado de noche.

Conclusión: **el mapa se diseña primero y después el generador obedece.** Hoy es al revés. Esto es exactamente lo que el reporte llama generación híbrida, y es la parte que falta programar.

---

## 2 bis. El tamaño del planeta: medido, no supuesto

Pregunta de Santiago: ¿no conviene agrandar el mapa, aunque cueste rendimiento?

**No cuesta rendimiento. Cuesta relieve, y el relieve se arregla gratis.** Lo probé con el planeta a 6 veces el tamaño actual (radio 21.900 m):

| | Llamadas de dibujo | Triángulos | Cómo se ve |
|---|---|---|---|
| Hoy (3.650) | 44 | 78.513 | Montañas, laderas, nieve en la cima |
| 6× sin tocar nada | 28 | 62.626 | **Una llanura verde. Nada.** |
| 6× con el detalle ajustado | **25** | **52.178** | Pared de montaña, costa, relieve fuerte |

El planeta grande sale **más barato** que el de hoy, porque el terreno se arma en anillos alrededor del jugador: da igual cuánto mundo haya más allá.

La razón de que se aplane es que el ruido del terreno se mide en **grados**, no en metros: al agrandar el planeta, la misma loma se estira sobre seis veces más terreno. La corrección es multiplicar la frecuencia de las octavas de relieve por el factor de crecimiento, dejando angulares las de clima y continentes. Resultado: **los continentes crecen con el planeta y las laderas conservan su inclinación.**

| Tamaño | Radio | Vuelta entera a 150 m/s | Horizonte a 300 m | Ancho de un continente | 5 km en grados | Sectores que entran |
|---|---|---|---|---|---|---|
| 1× | 3.650 | 2,5 min | 1.480 m | 7.600 m | 78° | ~20 |
| 2× | 7.300 | 5,1 min | 2.093 m | 15.300 m | 39° | ~83 |
| 4× | 14.600 | 10,2 min | 2.960 m | 30.600 m | 20° | ~333 |
| **6×** | **21.900** | **15,3 min** | **3.625 m** | **45.900 m** | **13°** | **~749** |

Lo que esto resuelve, y que es el motivo real para agrandar:

- **Hoy no entra la campaña.** Un sector de misión cubre 25° del planeta y entran unos 20 en todo el mundo; la campaña son 30 misiones. A 6× entran 749.
- **Hoy no hay lugar para nada entre regiones.** Los 7 centros están a 43-69°, casi el máximo que se puede separar 7 puntos en una esfera. A 6×, los mismos 5 km son 13°: aparece territorio vacío que cruzar.
- **Las escenas de desplazamiento necesitan distancia.** Una ruta de convoy de 5 km hoy es un cuarto del planeta; a 6× es un camino entre dos pueblos.

Lo que cuesta de verdad: **36 veces más superficie que llenar.** Con 7 regiones diseñadas, el resto queda procedural. Y dar la vuelta entera al mundo pasa a tardar 15 minutos, aunque nada obliga a hacerlo: los tránsitos entre regiones siguen en 30 segundos.

Las direcciones de la tabla de abajo **no cambian** si crece el planeta: son angulares. Lo que cambia es que las regiones se acercan en grados para que los tránsitos sigan durando lo mismo.

## 3. Dónde va cada región

Resolví la ubicación de las 7 regiones como un problema de geometría, con tres condiciones: que respeten las vecindades del reporte, que la luz de cada una sea la que pide la historia, y que ninguna se pise con otra.

**La única posición fija es Costa Clara**, porque ahí está la misión 1 y no se toca.

| Región | Dirección en la esfera | Luz | Polo | Qué es |
|---|---|---|---|---|
| Costa Clara | (−0,295 · +0,534 · −0,792) | Día pleno | templado | Hogar |
| Cuenca Verde | (+0,112 · −0,086 · −0,990) | Mañana alta | templado | Abastecimiento |
| Mar de las Columnas | (+0,569 · +0,486 · −0,663) | Sol a pique | templado | Corredor expuesto |
| Las Agujas | (−0,539 · −0,533 · −0,652) | **Sobre la línea del amanecer** | templado | El frente |
| Salinas del Sur | (+0,440 · −0,634 · −0,636) | Tarde | cálido | Extracción y mando |
| Paso del Deshielo | (−0,994 · −0,105 · −0,036) | Noche | **polo** | La periferia olvidada |
| Corona Negra | (−0,389 · −0,921 · +0,019) | Noche cerrada | templado | El desenlace |

Las distancias dan dentro de lo que el reporte pide (tránsitos de 15 a 35 segundos):

| Tramo | Grados | Metros | Segundos a fondo |
|---|---|---|---|
| Costa Clara – Cuenca Verde | 45° | 2.878 | 22 |
| Costa Clara – Mar de las Columnas | 52° | 3.308 | 25 |
| Cuenca Verde – Las Agujas | 51° | 3.242 | 25 |
| Las Agujas – Salinas del Sur | 59° | 3.754 | 29 |
| Las Agujas – Paso del Deshielo | 52° | 3.316 | 26 |
| Mar de las Columnas – Salinas del Sur | 69° | 4.377 | 34 |
| Paso del Deshielo – Corona Negra | 61° | 3.896 | 30 |
| Salinas del Sur – Corona Negra | 66° | 4.227 | 33 |

Ningún par de centros queda a menos de 43° (2.729 m), así que ninguna región se come a la vecina.

Hay dos cosas que salieron solas de la geometría y que me gustaron más que lo que hubiera elegido a mano:

- **Las Agujas cae justo sobre la línea entre el día y la noche.** El frente de la campaña 1, donde muere Ferreyra, es el único lugar del planeta donde el sol está siempre al ras: sombras largas, contraluz, mesetas que tapan. Para una emboscada no hay mejor luz.
- **El Mar de las Columnas queda con el sol a pique.** La escolta más expuesta de la campaña 2 se juega en el lugar más iluminado y sin un solo accidente donde esconderse. Lo contrario exacto de Las Agujas.

---

## 4. Cómo se ordena la campaña sobre esa esfera

- **Campaña 1** se juega entera del lado de día, en un triángulo chico: Costa, Cuenca y Agujas. El jugador aprende un barrio, no un planeta. Que la emboscada pase en el borde de ese triángulo, en la luz rasante, es lo que marca el final de la parte luminosa de la historia.
- **Campaña 2** cruza a la tarde y al mar: Salinas y Columnas. Es la campaña de recuperar iniciativa, y espacialmente es salir del barrio.
- **Campaña 3** entra en la noche: Deshielo y Corona. Nunca vuelve a ver el sol alto. El sacrificio final pasa en el punto más lejano de donde empezó todo, 145° desde Costa Clara: media vuelta al mundo.

El jugador no necesita que le cuenten esto. Lo ve en la luz.

---

## 5. La capa civil: cómo se gobierna a la gente, visto desde una nave

Esta es la parte que más me interesa de lo que pediste, y la más difícil, porque el jugador nunca baja y pasa a 130 metros por segundo. No se pueden poner peatones. Hay que contarlo con lo que se construye, lo que se ilumina y lo que se repara.

### El vocabulario

Diez cosas que se leen desde el aire en menos de un segundo:

| Lo que se ve | Lo que dice |
|---|---|
| **Trazado** | Cuadrícula perfecta = lo planificó alguien de afuera. Orgánico = creció solo. Remendado = lo rearmaron con lo que había. |
| **Luz de noche** | Quién tiene energía y quién la perdió. |
| **Humo** | Qué chimenea está trabajando y cuál está fría. |
| **Tendido** | Caños y cables: quién está conectado a la red y a quién la cortaron. |
| **Cercas y portones** | Un solo portón en un perímetro cerrado no defiende: encierra. |
| **Reflectores** | Apuntando afuera, defienden. Apuntando adentro, vigilan. |
| **Parches** | Material nuevo sobre estructura vieja: alguien la arregló. |
| **Techos** | Huertas, tendederos, antenas caseras, tanques de agua: vive gente. Números pintados: la administran. |
| **Chatarra** | Dónde murió una industria. |
| **Puentes** | Cortado y sin arreglar, o cortado y cruzado con una pasarela improvisada. |

### Las tres maneras de gobernar

**Guardia de Nácar — presente, pero desigual.**
Pueblos que crecieron solos alrededor de los nodos. Mercados de techo abierto, tanques de agua, una cruz pintada en el techo del hospital, rutas remendadas muchas veces. Las defensas están entre las casas, no alrededor: la Guardia vive ahí.
Y en la periferia, lo mismo pero apagado: las mismas construcciones, sin humo, sin luz, la ruta cortada y nunca arreglada. **Esa grieta es el origen de los Desligados, y tiene que poder verse antes de que nadie la nombre.**

**Directorio de Continuidad — la gente como inventario.**
Cuadrícula perfecta. Bloques de vivienda iguales, numerados con plantilla en el techo. Perímetro cerrado con un solo portón y control. Reflectores apuntando hacia adentro. Todo funciona, todo está iluminado, nada fue elegido por quien vive ahí. No hay huertas ni tendederos: no hay tiempo ni permiso.
Se nota en el contraste: la planta extractiva está impecable y el barrio de al lado, prolijo y gris.

**Liga de los Desligados — la ayuda mutua que se volvió poder.**
Asentamientos armados con partes de otra cosa: un depósito que ahora es vivienda, antenas hechas con caños. Sin trazado. Pero el agua funciona, la clínica tiene un cartel pintado a mano, hay molinos y paneles improvisados, y los puentes que la Guardia dejó cortados están cruzados con pasarelas.
**La firma de los Desligados es el parche**: material nuevo sobre estructura vieja, en todos lados.
Cuando Varela se militariza, en la campaña 3, se ve exactamente así: los mismos asentamientos, con una cerca nueva y una plataforma de aterrizaje que antes no estaba. Nada más. Y alcanza.

### Por qué esto importa para jugar, no solo para mirar

En la campaña 3 conviven tres bandos en el mismo mapa. Si el jugador aprendió a leer un asentamiento de un vistazo —cuadrícula, parche o pueblo— puede decidir a quién tiene enfrente sin leer un cartel. Es la diferencia entre un mundo decorado y un mundo que se lee.

**Propuesta que necesita tu aprobación:** que las construcciones civiles se puedan dañar pero **no den puntos**, y que derribar una dispare una línea de radio de un compañero. El reporte pide "no convertir toda vivienda en blanco militar"; esta es la forma más barata de que se note. Decime si te cierra o si preferís que sean indestructibles.

---

## 6. Región por región

### Costa Clara — el hogar (día pleno)
Pradera verde que baja a playa y mar abierto. Base Delta separada de la ciudad: hangares bajos, plataformas, antenas. Puerto Clara con depósitos y pórticos industriales anchos. El puente del estuario.
**Civil:** Guardia en su mejor versión. Pueblo portuario que creció solo, mercado, tanques de agua, barcos amarrados. Es el único lugar donde el jugador ve lo que está defendiendo.
**Cómo cambia:** en la campaña 1 está sana. Después de la emboscada se llena de reparaciones y defensas nuevas. En la campaña 3 es desde donde se evacúa.

### Cuenca Verde — el abastecimiento (mañana alta)
Bosque cerrado cortado por un cauce. El nodo forestal de la red, claros industriales, depósitos bajos.
**Civil:** pueblos chicos que viven del nodo. Caminos de tierra, aserraderos, humo de leña.
**Cómo cambia:** empieza con el suministro interrumpido; se recupera en la campaña 1 y se evacúa en la 3.

### Mar de las Columnas — el corredor expuesto (sol a pique)
Mar abierto con columnas de roca flotante y plataformas ancladas. Sin un solo lugar donde esconderse.
**Civil:** plataformas de trabajo con camarotes, grúas y barcos de carga. La gente acá no vive: trabaja por turnos.
**Cómo cambia:** corredor amenazado, después campo de restos de la batalla de la nodriza.

### Las Agujas — el frente (luz rasante)
Mesetas, cauces de aproximación con paredes altas, el viaducto, el Alto del Paso. Volar bajo acá es la mecánica de la región.
**Civil:** Alto del Paso es el caso más incómodo de todo el mapa: terrazas industriales **con viviendas encima**. Cuando los bombarderos del Directorio van hacia ahí en la misión 6, van hacia gente. Y en la misión 7 el jugador escolta el convoy que lo reabastece.
**Cómo cambia:** disputada, corredor abierto en la misión 5, contraataque en la 6, recuperada en la 7.

### Salinas del Sur — extracción y mando (tarde)
Salinas blancas y agrietadas, complejos industriales, el centro militar del Directorio.
**Civil:** acá se ve el Directorio entero. Cuadrícula, bloques numerados, perímetro, reflectores hacia adentro. Al lado, una salina que se trabaja a destajo.
**Cómo cambia:** el centro militar cae en la campaña 2 y queda apagado; después se lo apropian otras fuerzas.

### Paso del Deshielo — la periferia olvidada (noche, polo)
Hielo roto, grietas, asentamientos reparados, el nodo polar.
**Civil:** el corazón del problema moral de la historia. Construcciones de la Guardia **abandonadas y después arregladas por otros**: ahí se ve, en un solo edificio, que alguien se fue y alguien vino. Es donde el jugador entiende a los Desligados sin que nadie se lo explique, y es donde está Rastro.
**Cómo cambia:** de abandono a militarización, fractura y evacuación.

### Corona Negra — el desenlace (noche cerrada)
La montaña más alta del planeta, anillo industrial y tres conductos, la instalación del misil.
**Civil:** casi nada, y eso es el punto. Dormitorios de turno pegados a la planta, sin ventanas que den afuera. Nadie eligió vivir acá.
**Cómo cambia:** del Directorio a Varela, y de planta industrial a preparación del misil.

---

## 7. La red de nácar: lo que ata todo

Cinco nodos regionales (costero, forestal, de transferencia, extractivo y polar) y la central de regulación en Corona Negra. Es la columna vertebral del mapa y la explicación de por qué las ciudades están donde están: **la gente vive donde la red llega.**

Se ve en los conductos locales, no en cables luminosos por todo el planeta. Y el estado de un nodo cuenta la historia de su región sin una línea de diálogo: encendido y humeando, apagado y frío, o apagado y con un parche nuevo encima.

Regla: **los nodos no son blancos por defecto.** Volarlos deja sin nada a la gente que vive alrededor, y eso es precisamente lo que hace el enemigo.

---

## 8. Cómo lo construiría

Cuatro capas, de abajo hacia arriba:

1. **Siembra de regiones.** Las 7 direcciones de la tabla pasan a ser semillas que empujan temperatura, humedad y altura a su alrededor. Es un cambio chico en la función del terreno, y es lo que hace que las mesetas de Las Agujas existan.
2. **Relieve a mano donde la historia lo necesita.** Cauces, el viaducto, el paso bajo el puente, las grietas de la emboscada, los conductos de Corona. Esto no se puede dejar al azar: son las piezas que se vuelan.
3. **Hitos y estructuras.** Base Delta, Puerto Clara, Alto del Paso, el centro militar, la central. Tres hitos grandes por lugar, reconocibles desde lejos.
4. **Capa civil.** Lo de la sección 5, como piezas que se repiten con variación: manzana de pueblo, bloque de cuadrícula, asentamiento remendado, plataforma de trabajo.

Las capas 1 y 2 van primero porque definen si se puede volar; la 3 y la 4 son vestir el escenario y se pueden ir agregando sin romper nada.

**Misión 1 no se toca.** Está en Costa Clara, que es la única ancla fija, y la pruebo antes y después de cada capa.

---

## 9. Qué decido yo y qué te traigo

**Decido yo:** la forma exacta de cada región, cuántas piezas civiles hay y cómo se reparten, las paletas, el detalle del terreno, y cómo se programa todo esto.

**Te traigo:**
- lo de los blancos civiles (sección 5);
- el valor final de `PLANET_R`, después de volar la misión 1 con el planeta grande;
- cualquier cambio que afecte cómo se juega la misión 1.

---

## 10. Lo que todavía no está resuelto

- **Las ciudades cuestan.** El presupuesto es de unas 25 naves y 400.000 triángulos para toda la escena. Un pueblo entero de piezas distintas no entra: van a ser pocas piezas repetidas con variación de color, rotación y daño. Todavía no medí cuántas.
- **La capa civil no existe en el código.** Hoy no hay ni una construcción civil en el juego. Es la parte más grande de este plan.
- **Sigilo.** Dos misiones lo piden. Hay cálculo de si el terreno tapa la vista, pero eso no es un sistema de infiltración.
- **El tamaño del planeta.** Ver la sección 2 bis. Las direcciones no cambian; lo que hay que recalcular es la separación entre regiones en grados y avisarle al chat de naves, que está dimensionando cámara, zonas y alcances sobre 4.400.
