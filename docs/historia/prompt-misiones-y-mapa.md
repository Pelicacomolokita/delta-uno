# Prompt: las misiones y los lugares, antes de construir el mapa

Copiá lo que está dentro del bloque y pegáselo a la IA que escribe la historia, junto con el reporte 0.3 (`docs/historia/reporte-01.md`) y el formato de misiones (`docs/historia/formato.md`).

```
Seguimos con Delta Uno. Ya tenés tu reporte 0.3 y el formato en que el juego carga las misiones (formato.md). Decidimos rehacer el mapa del planeta a partir de la historia: la primera versión solo servía para validar la mecánica de vuelo. Por eso, antes de construir nada, necesito que definamos qué pasa en cada misión y qué papel juega cada lugar a medida que avanza la historia. Los despliegues enemigos también salen de la historia, no del azar.

## Lo que ya está decidido (no lo cambies sin avisar)
- Generación híbrida: el generador pone el detalle; las regiones, ciudades, estructuras, rutas y despliegues se fijan a mano según la historia.
- Un solo planeta para la campaña y los modos libres. En Vuelo libre el jugador va a poder elegir en qué región arrancar.
- Tamaño actual: se cruza de punta a punta en unos 3 minutos.
- La misión 1 (entrenamiento en Costa Clara) ya está hecha y no se cambia. En el anillo 2 Rastro ya hace su firma.
- Sector de cada misión: tiene borde visible. Si el jugador sale, tiene 8 segundos para volver o pierde la parte y la repite.
- Al caer, se repite la parte en la que estaba.
- Munición y estado al empezar cada parte: según la historia. Una parte puede arrancar con pocos misiles, sin recarga automática o con el casco dañado si el escuadrón viene de un combate sin reabastecerse. Ojo: hoy solo los misiles son limitados (hasta 4, se recarga uno cada 20 segundos); el cañón no se agota. Si querés que el cañón tenga munición, marcalo [MECÁNICA NUEVA].
- Chocar con una estructura (pórtico, puente, edificio) hace rebotar la nave con daño, como las rocas. Chocar con el suelo o el mar es caída.
- Radio: 90 caracteres como máximo por mensaje, 4 segundos entre mensajes. Instrucción previa: 80 palabras como máximo.
- Hasta unas 25 naves a la vez, contando jugador, compañeros, enemigos y transportes.
- Estilo visual: industrial desgastado.

## Lo que todavía no está decidido
- Sigilo: el juego ya sabe calcular si el terreno tapa la línea de vista (lo usan los lanzamisiles para fijar al jugador). Si una misión necesita que una meseta oculte al jugador, marcalo [SIGILO] y describí qué lo delata; se decide después si se programa.

## Qué necesito, en este orden (esperá mi aprobación entre cada paso)

1. **Biblia de lugares.** Para cada región y cada lugar con nombre (Base Delta, Puerto Clara, Alto del Paso, los nodos, el centro militar, la central, puentes, pórticos, cauces):
   - qué es, quién lo controla al principio y cómo se ve desde el aire (dos o tres hitos grandes);
   - en qué misiones aparece y qué papel cumple en cada una (de las tres campañas);
   - cómo cambia a lo largo de la historia (ocupación, daño, pintura, actividad);
   - qué estructuras de vuelo tiene (pasos, arcos, cauces, puentes) y para qué misión sirven;
   - desde dónde se puede arrancar en Vuelo libre.
2. **Arco de la campaña 1 en una tabla:** misión, lugar, qué pasa, qué aprende el jugador, qué compañeros destacan, con qué arranca la nave y por qué, y qué queda distinto en el mapa al terminar.
3. **Fichas de las misiones 2 y 3**, con el formato de formato.md. Van primero porque la misión 3 ya es una escolta: el convoy es lo próximo que hay que programar, antes que los bombarderos de la emboscada. Para cada parte: objetivo, despliegue enemigo (tipo, cantidad y dónde, respecto de un hito del lugar), aliados y qué hacen, estado de inicio (inicio), eventos y radio, condición de derrota, y tres medallas.
4. Fichas de las misiones 4 a 7.
5. Campañas 2 y 3: una línea por misión, con su lugar, para planificar cómo evoluciona el mapa.

Para cualquier cosa que el juego no tenga hoy, poné [MECÁNICA NUEVA] y explicá qué haría falta.
```
