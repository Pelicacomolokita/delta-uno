# DELTA UNO
## Reporte 01 — Historia y requisitos para desarrollo

**Versión:** 0.1 · Documento de preproducción · Contiene spoilers completos.

**Destinatario:** desarrollo, diseño de misiones y arte.

Este reporte reúne la dirección narrativa y los elementos que conviene preparar en el juego. No reemplaza las fichas ejecutables de cada misión: cantidades, posiciones, tiempos, medallas y diálogos completos se detallarán después. No presupone acceso ni auditoría del código.

### Lectura de estados

- **ACORDADO:** requisito expresado o aceptado explícitamente por el autor del proyecto.
- **BASE PROPUESTA:** desarrollo narrativo presentado en la conversación; sirve para trabajar, pero sus nombres y detalles aún pueden cambiar.
- **POR DEFINIR:** decisión que no debe cerrarse silenciosamente en implementación.
- **[MECÁNICA NUEVA]:** capacidad no confirmada entre las piezas disponibles. Puede existir parcialmente; el desarrollador debe comprobarlo.

## 1. Visión y reglas del juego

**ACORDADO.** Juego de combate de naves 3D para teléfono, en horizontal. Ciencia ficción militar con drama humano y violencia sin detalles gráficos. Protagonista sin rostro ni voz propia. Español rioplatense con voseo.

El planeta es esférico y puede recorrerse de punta a punta en aproximadamente tres minutos, pero cada misión se desarrolla en un sector particular. La escala del escenario no obliga a simular todo el planeta durante una operación. Esto permite puntos de entrada y salida de enemigos y una composición visual específica por misión. Las mejoras de carga y rendimiento deberán medirse en el motor.

No hay escenas de video. La historia sucede mediante instrucciones previas, mensajes de radio, acontecimientos visibles durante el vuelo y resumen final. Cada radio tendrá como máximo 90 caracteres y nunca empezará otra antes de cuatro segundos desde la anterior. No se fuerza la cámara para mostrar una escena: se preparan posiciones y avisos que orienten al jugador.

Al caer el jugador, reintenta desde el comienzo de la parte actual. El objetivo de producción inicial es respetar unas 25 naves simultáneas, contando jugador, compañeros, enemigos y transportes. Se pueden enfrentar más naves en total mediante oleadas.

Las campañas 1 y 2 no requieren nuevas naves seleccionables ni vehículos terrestres. Puentes, caminos y tráfico futuro pueden anticiparse visualmente.

## 2. Mundo y conflicto

**BASE PROPUESTA — Nácar.** Planeta con mar, playa, pradera, bosque, desierto, mesetas, hielo, montaña y volcán. Sus rocas flotantes contienen nácar gravitacional, material usado en motores y estructuras suspendidas. Una red de estabilizadores regula su aprovechamiento. La explotación y la guerra degradaron esa infraestructura. El techo de vuelo puede justificarse como límite operativo por inestabilidad atmosférica; no obliga a implementar tormentas físicas.

La población depende de instalaciones de energía, agua y transporte que comparten territorio con posiciones militares. Liberar una zona permite abrir un corredor, sostener un asentamiento o llevar técnicos a otra instalación. Los objetivos deben tener consecuencias comprensibles.

**ACORDADO:** hay tres bandos con intereses propios. El rival inicial cae al final de la campaña 2; el tercero aprovecha el vacío para apropiarse de su estructura militar y convertirse en la principal amenaza.

| Bando | Interés y conflicto | Estado |
|---|---|---|
| Guardia de Nácar | Defiende la autonomía y a las poblaciones. Sus prioridades militares dejan regiones desatendidas y alimentan resentimiento. | Nombre e historia: base propuesta. |
| Directorio de Continuidad | Busca recuperar extracción, astilleros y control de la red. Considera aceptables ocupación y desplazamientos forzados. | Nombre e historia: base propuesta. |
| Liga de los Desligados | Nace en comunidades perjudicadas por el Directorio y desatendidas por la Guardia. Quiere controlar sus recursos; sus células no comparten todos los métodos. | Tercer bando y fractura interna: acordados; desarrollo político: base propuesta. |

La facción dominante de los Desligados captura instalaciones y material mientras la Guardia concentra sus recursos contra el Directorio. En la campaña 2 se los considera objetivos fáciles. Su crecimiento debe dejar pistas visibles: depósitos vaciados, equipo sustraído y posiciones secundarias ocupadas. La transformación de la campaña 3 necesita esa preparación.

## 3. Reparto

| ID sugerido | Personaje / radio | Función y voz | Destino |
|---|---|---|---|
| PLAYER | Jugador / Delta Uno | Sin voz ni biografía impuesta. Conduce al grupo mediante sus acciones. | Se sacrifica en la misión final. Acordado. |
| SORIA | Vera Soria / Mando | Comandante desde tierra. Precisa, responsable y capaz de reconocer errores. | No definido. |
| FERREYRA | Julián Ferreyra / Delta Uno original | Instructor y líder inicial. Calmo y cercano. Muere ante el jugador durante la emboscada. | Muerte acordada; nombre y relevo del indicativo propuestos. |
| AGUJA | Inés Acosta / Aguja | Precisa y frontal. Habla con direcciones y frases cortas. Cuestiona decisiones, no lealtades sin pruebas. | Única superviviente del núcleo de pilotos; disponible para otro juego. Acordado. |
| CHISPA | Tomás Leiva / Chispa | Humor seco y conversación para lidiar con el miedo. Aprende a pedir ayuda. | Muere en campaña 3, misión 10: asignación propuesta. |
| FARO | Bruno Sosa / Faro | Paciente, atento al último de la formación. Quiere enseñar a nuevos pilotos. | Muere al comienzo de campaña 3, misión 3: asignación propuesta. |
| RASTRO | Nicolás Arce / Rastro | Piloto inicial derribado, recuperado por una célula y manipulado durante su recuperación. Rival recurrente. | Debe morir antes del cierre si solo sobrevive Aguja; momento y forma pendientes. |
| VOSS | Darío Voss / indicativo pendiente | Jefe del Directorio. Cree que la estabilidad justifica imponer el control militar. | Derrota de su estructura al final de campaña 2; destino personal pendiente. |
| VARELA | Mara Varela / Veta | Referente de los Desligados que concentra poder y persevera en un plan catastrófico. | Destino personal pendiente. |
| RIVAS | Elena Rivas / Sutura | Médica de los Desligados que recuperó a Rastro y pide ayuda para rescatarlo de la manipulación. | No definido. |

**Sobre el indicativo de Voss:** el nombre original «Prefecto» se pidió cambiar. «Bastión» fue sugerido después, pero no quedó confirmado. No fijar todavía retratos, audio ni recursos definitivos con ese indicativo.

Los nombres civiles y los indicativos restantes son la base de trabajo propuesta, no una exigencia técnica. Los IDs sugeridos permiten que los textos cambien sin alterar la lógica de misión.

### Relación entre los compañeros

Aguja exige claridad; Chispa improvisa y hace bromas; Faro sostiene al grupo. Sus discrepancias y sospechas crecen cuando el enemigo conoce sus maniobras. No hay decisión de convertir a uno de los tres en un traidor secreto. La explicación principal es Rastro, su conocimiento previo y la manipulación que sufrió.

Los tres acompañan al jugador desde la emboscada y durante toda la campaña 2. Las muertes narrativas posteriores deben distinguirse de una baja accidental de combate. Propuesta: si un compañero esencial muere antes del momento escrito, se pierde la parte y se reinicia; esto no se sustituye por invulnerabilidad silenciosa.

## 4. Rastro: pista, encuentros y recuperación

**ACORDADO:** el tutorial muestra una maniobra reconocible de evasión realizada por Rastro. Más adelante un enemigo la repite, generando sospechas. Debe poder escapar de varios encuentros.

**BASE PROPUESTA — «La firma»:** amaga hacia un lado, evade hacia el contrario y sale con un golpe de turbo. La IA debe mostrarla delante del jugador en una situación despejada. Confirmar que el amague puede representarse con los controles actuales de IA.

Ejemplo de radio, aún no asignado a un cronograma: Chispa: «Otra vez la firma. Un día te van a reconocer por eso.»

Progresión propuesta:

1. Tutorial: conocemos al piloto y su maniobra.
2. Emboscada: su nave cae fuera de vista; se pierde su señal. Queda presuntamente muerto.
3. Campaña 2: un enemigo repite la maniobra. No basta para identificarlo.
4. Nuevos encuentros: aparecen coincidencias de táctica, voz o conocimiento del grupo.
5. Campaña 3, misión 3: se propone confirmar su identidad al revelar la fuerza de los Desligados.
6. Tramo final: la médica revela su recuperación y pide ayuda. Rastro empieza a cuestionar lo que cree.

**BASE PROPUESTA — manipulación:** conserva habilidades de vuelo y fragmentos de memoria, pero confunde acontecimientos. Lo aíslan, recortan información y alimentan la idea de que fue abandonado. Recuperarse exige pruebas y decisiones propias; una frase familiar no lo cura de inmediato. Puede conocer después que murieron otros compañeros sin que desaparezca su resentimiento.

**POR DEFINIR:** quién ordenó el condicionamiento, qué sabía la médica en cada momento y cuándo Rastro comprende toda la verdad. La propuesta actual responsabiliza a la dirigencia de Varela y hace que Rivas descubra progresivamente el abuso.

### Contrato de retirada

- El objetivo visible es rechazar su ataque, resistir o proteger un transporte; no se promete destruirlo si debe sobrevivir.
- Un disparador de casco o de progreso inicia la retirada mientras aún puede volar.
- Ejecuta su maniobra y va hacia un punto de salida fuera del sector operativo.
- Al cruzar ese punto se retira de la simulación y se emite el evento de escape.
- La misión no permite perseguirlo alrededor de todo el planeta.

**[MECÁNICA NUEVA]** Estado de retirada, puntos de salida y evento de escape, si no existen. El umbral de casco debe considerar el daño en tránsito y los misiles ya disparados. Hay que decidir qué ocurre si el jugador consigue derribarlo antes de salir; ningún encuentro que exija su supervivencia está listo para producción sin resolverlo. El límite del sector resuelve la persecución, no ese problema.

## 5. Arco de campañas y bajas

### Campaña 1 — introducción de tres misiones

**Misión 1 — entrenamiento. ACORDADO:** tres partes: anillos para aprender a volar; torretas en un sector; tres naves enemigas de práctica. Introduce al líder, al grupo y la maniobra de Rastro. Debe quedar claro que las naves de práctica no representan compañeros muertos. Tipo de simulación y reutilización de modelos: por definir.

**Misión 2 — emboscada. ACORDADO:** formación inicial con jugador y nueve aliados. Durante los primeros 40 segundos caen seis aliados; algunas caídas ocurren delante del jugador, incluido el líder alcanzado por un misil. Hay que sobrevivir dos minutos. Quedan Aguja, Chispa y Faro junto al jugador y luego derriban tres bombarderos. Propuesta temporal a validar en la ficha: los 40 segundos forman parte de los dos minutos, no se suman. Los bombarderos aún están en desarrollo y son dependencia explícita.

**Misión 3 — escolta y asalto. ACORDADO:** proteger un transporte aproximadamente cinco veces mayor que el caza mientras se asaltan tres zonas enemigas. Los tres compañeros participan. El corredor recuperado permite sostener suministros y equipos de reparación. Ruta, paradas y secuencia exacta de zonas pendientes.

### Campaña 2 — alrededor de diez misiones

**ACORDADO:** el jugador y sus tres compañeros actúan juntos. El Directorio es el rival principal. Hay encuentros menores con los Desligados, considerados poco peligrosos. La campaña termina con la desactivación de la central más importante del Directorio.

**BASE PROPUESTA:** alternar liberación de zonas, escoltas, defensa por oleadas e interceptación; dejar señales de apropiación de material por los Desligados. Llevar un transporte de técnicos permite representar una desactivación sin agregar interacción a pie. Debe comprobarse el comportamiento del transporte y sus disparadores.

No hay lista definitiva de diez misiones en este reporte ni autorización para rellenarla como contenido cerrado.

### Campaña 3 — escalada y desenlace

| Hito | Dirección narrativa | Estado |
|---|---|---|
| Misiones 1 y 2 | Desactivar células del Directorio que resisten después de su derrota. | Acordado. |
| Comienzo de misión 3 | Descubrir que los Desligados capturaron estructura militar y son mucho más peligrosos. Primera muerte del trío. | Hito acordado; Faro como víctima, propuesto. |
| Desarrollo | Encuentros con Rastro, sospechas y fractura de los Desligados. | Dirección acordada; orden preciso pendiente. |
| Misión 10 | Segunda muerte del trío. | Hito acordado; Chispa como víctima, propuesto. |
| Últimas misiones | Referentes de los Desligados piden ayuda contra la central montañosa. La médica pide recuperar a Rastro. | Acordado. |
| Antes del final | Ruptura de Rastro con quienes lo manipularon y muerte posterior. | Recuperación es propuesta; muerte necesaria para el cierre aceptado. Falta su escena. |
| Misión final | Delta Uno se sacrifica y evita que destruyan el planeta. Aguja sobrevive. | Acordado. Ejecución pendiente. |

**POR DEFINIR:** cantidad total de misiones de campaña 3. La interpretación de trabajo es que el final ocurre después de la misión 10; no fijar todavía una numeración final.

### Contabilidad de la emboscada

De los nueve aliados iniciales: cinco mueren realmente —Ferreyra y otros cuatro pilotos—, Rastro es derribado y sobrevive sin que el grupo lo sepa, y tres permanecen operativos. El jugador es la décima nave aliada de la formación. Los «seis caídos» no deben describirse como seis muertes confirmadas.

Al terminar la historia, Aguja es la única superviviente del núcleo de pilotos. Esto no decide el destino de Soria, Rivas, población civil ni todos los secundarios. Las bajas adicionales de otros escuadrones o referentes fueron sugeridas, pero no tienen personajes ni escenas aprobadas.

## 6. Central montañosa y sacrificio

**ACORDADO:** referentes de los Desligados solicitan ayuda porque una central en una montaña amenaza con explotar y destruir lo que queda de sus comunidades. El desenlace debe conservar el alcance planetario del sacrificio de Delta Uno.

**BASE PROPUESTA:** la central redistribuye energía entre estabilizadores. Varela pretende usarla contra la Guardia, pero su estado provoca una reacción en cadena: primero destruye las comunidades cercanas y después desestabiliza el planeta. Los disidentes ofrecen acceso y apoyo porque no pueden detenerla solos.

La alianza no borra agravios ni convierte a todos los Desligados en aliados. Puede representarse mediante una escolta, apoyo aéreo o información de radio, sin diplomacia interactiva.

**POR DEFINIR, antes de construir el final:**

- Qué acción exacta evita la catástrofe.
- Por qué esa acción exige la permanencia o proximidad mortal del jugador.
- Cómo conoce el jugador esa consecuencia antes de actuar.
- Qué papel cumplen Aguja, Rastro, Rivas y Varela.
- Cuándo se consolida el último punto de reinicio.

**[MECÁNICA NUEVA]** Objetivo final con victoria asociada a la muerte guionada de Delta Uno. Una caída normal sigue siendo derrota. No implementar todavía un suicidio arbitrario, una explosión inevitable sin explicación ni un túnel obligatorio.

## 7. Correspondencia entre narrativa y piezas jugables

| Pieza | Uso narrativo | Restricción |
|---|---|---|
| Anillos contra reloj | Entrenamiento y rutas urgentes. | No repetirlos sin una razón clara. |
| Liberación de zona | Abrir corredores, recuperar posiciones y quitar defensas. | Zona liberada = torretas y todos sus escuadrones destruidos. |
| Oleadas | Cubrir una evacuación, una preparación o trabajo técnico. | Controlar simultaneidad y pausa para radio/reparación. |
| Escolta grande | Suministros, técnicos, heridos o referentes disidentes. | Confirmar ruta por puntos, paradas y reanudación. |
| Aliados autónomos | Apoyo real, presión sobre compañeros y vínculo con el grupo. | Pueden morir; fijar protección narrativa y reinicio por fase. |
| Cazas | Combate general y patrullas. | No requieren un rol nuevo. |
| Pesadas | Prioridad resistente y presión sostenida. | Su lentitud debe seguir siendo legible. |
| Interceptores | Pasadas rápidas y hostigamiento. | Evitar que una misión dependa de perseguirlos fuera del sector. |
| Drones / nodriza | Enjambres y dominio de una posición. | Drones cuentan en el presupuesto de naves; confirmar destrucción y emisión de la nodriza. |
| Lanzamisiles terrestres | Amenaza de fijación que exige evasión o turbo. | En desarrollo. |
| Bombarderos | Amenaza prioritaria contra convoy o instalación. | En desarrollo; requeridos por C1-M2. |

El caza del jugador conserva cañón, hasta cuatro misiles guiados con fijación previa, escudo y casco, turbo con recalentamiento, evasión lateral, reparación de ocho segundos interrumpida por daño y cámara de seguimiento de un enemigo elegido. No escribir objetivos que exijan munición o capacidades adicionales sin marcarlos.

## 8. Dirección visual preliminar

Todo este apartado es **BASE PROPUESTA**, no arte aprobado. No se eligió todavía entre acabado estilizado e industrial desgastado. Se recomienda lectura clara en pantalla chica: facciones reconocibles por forma y marcas, además del color.

| Facción | Lenguaje visual propuesto |
|---|---|
| Guardia | Triángulos compactos, placas reparadas, gris claro, azul petróleo y marcas blancas. |
| Directorio | Volúmenes rectangulares y uniformes, grafito, marfil industrial y ámbar. Instalaciones simétricas. |
| Desligados iniciales | Piezas recuperadas, óxido, arena y turquesa; marcas locales. |
| Desligados de campaña 3 | Equipo capturado al Directorio, repintado parcial y emblemas anteriores visibles. |

Los compañeros pueden compartir modelo y diferenciarse por pintura: Aguja, línea estrecha; Chispa, panel amarillo de reemplazo; Faro, banda posterior ancha; Rastro, franja diagonal partida que reaparece bajo el repintado enemigo. Ferreyra llevaría dos bandas blancas. Son sugerencias económicas de producción, no nuevos vehículos.

### Sectores de referencia

| Nombre provisional | Biomas y composición | Función potencial |
|---|---|---|
| Costa Clara | Playa y pradera, entrenamiento sobre el mar. | Introducción y regreso a un lugar conocido. |
| Las Agujas | Mesetas, pasos y rocas flotantes. | Emboscada. |
| Cuenca Verde | Bosque, claros industriales y depósitos. | Resistencia dispersa y primeros Desligados. |
| Salinas del Sur | Desierto, excavaciones y maquinaria oscura. | Extracción y posiciones del Directorio. |
| Paso del Deshielo | Hielo, roca y complejos envejecidos. | Regiones abandonadas. |
| Mar de las Columnas | Mar y pilares flotantes. | Escoltas y aproximaciones aéreas. |
| Corona Negra | Montaña volcánica, nieve en altura y estructuras industriales. | Aproximación a la central final. |

El clima sirve primero como ambientación. **[MECÁNICA NUEVA]** Cualquier efecto sobre sensores, control de vuelo o daño. Los cambios de iluminación no deben ocultar blancos ni radio.

Central propuesta: tres conductos exteriores que suben por la montaña hacia un anillo industrial encastrado en la ladera. Puede mostrarse a distancia antes del final. Pulsos, descargas y movimiento de fragmentos requieren efectos y animación; las rocas no tienen por qué convertirse en obstáculos móviles.

## 9. Infraestructura y ampliaciones sugeridas

| Elemento | Primera implementación posible | Ampliación que debe presupuestarse aparte |
|---|---|---|
| Caminos | Geometría ambiental entre depósitos y bases. | Vehículos con rutas y navegación terrestre. |
| Puentes | Hitos visuales y conexiones del paisaje. | [MECÁNICA NUEVA] Destrucción, estados y consecuencias sobre rutas. |
| Subestaciones / conductos | Infraestructura visible de la red. | [MECÁNICA NUEVA] Blanco destruible que altera defensas u objetivos. |
| Antenas | Decoración y referencia de sectores. | [MECÁNICA NUEVA] Cambios reales en comunicaciones o detección. |
| Plataformas de carga | Referencia de destino de convoy. | Paradas y reanudación condicionadas, si no existen. |
| Refugios y asentamientos | Geometría ambiental sin civiles simulados. | Daño o evacuación simulados solo si una misión lo requiere. |

El autor autoriza proponer estas creaciones para el reporte maestro. Eso no significa que ya estén implementadas ni que cada misión deba necesitarlas. Destruir un puente debe producir una consecuencia concreta cuando exista la mecánica terrestre.

## 10. Contratos recomendados para el director de misiones

Esta es una propuesta de estructura independiente del motor, no código listo para integrar.

| Registro | Campos mínimos sugeridos |
|---|---|
| Misión | ID, campaña, sector, instrucción previa, fases, resumen y criterios de medallas. |
| Fase | ID, inicio, objetivo visible, entidades, disparadores de victoria/derrota y estado de reinicio. |
| Entidad | ID estable, facción, tipo, posición o ruta, comportamiento y condición narrativa. |
| Evento | ID, disparador, condiciones, acciones, ejecución única y política de reinicio. |
| Radio | ID, emisor, texto, prioridad, disparador, caducidad y requisito de fase. |
| Salida | ID, ubicación, entidades permitidas y evento al cruzar. |

Disparadores requeridos por lo ya planteado: tiempo de fase, llegada a un punto, cantidad de derribos, zona liberada, nave destruida, casco bajo umbral, escolta llegada y retirada completada. Un evento puede encadenar acciones sin añadir una mecánica de combate nueva, pero el sistema de guion debe soportarlo.

La cola de radio debe respetar los cuatro segundos globalmente. Propuesta: priorizar instrucciones y bajas; descartar comentarios ambientales que quedaron atrasados. No reproducir diálogos de una fase anterior tras un reinicio o cambio de objetivo. Las instrucciones previas tendrán hasta 80 palabras.

### Estado al reiniciar una parte

Restaurar el reparto y las entidades de la fase, el progreso de objetivos, temporizadores, oleadas y eventos de ejecución única. Los derribos guionados vuelven a ocurrir si pertenecen a esa fase. El estado inicial de casco, escudo, misiles y turbo todavía debe acordarse. El diseño debe evitar reinicios que comiencen en una situación imposible.

### Eventos dramáticos visibles

Preparar el acontecimiento dentro del campo de visión probable, con separación suficiente de obstáculos y margen para la velocidad del jugador. El líder debe caer delante del jugador en la emboscada. Registrar disparadores y posiciones relativas en la ficha. No asumir que la cámara está mirando a un enemigo concreto. Hace falta comprobar qué herramientas existen para representar un misil y un impacto guionados.

## 11. Qué puede construir desarrollo ahora

1. Comprobar soporte de fases, reinicio, eventos y cola de radio.
2. Prototipar un sector operativo con aviso de límite y puntos de entrada/salida. **POR DEFINIR:** respuesta al jugador que insiste en salir; no se eligió pared invisible, giro forzado ni derrota por abandono.
3. Probar la maniobra reconocible de Rastro y una retirada completa, incluidos misiles en vuelo.
4. Preparar la secuencia de entrenamiento y el formato de objetivos encadenados.
5. Confirmar convoy por puntos, paradas y reanudación; mantener escala de referencia 5:1.
6. Terminar bombarderos para C1-M2 y comprobar el presupuesto de naves en la emboscada.
7. Crear variantes visuales por facción y marcadores de compañeros sin exigir modelos únicos.
8. Preparar estructuras ambientales modulares; separar decoración de blancos funcionales.

No construir todavía la solución definitiva del sacrificio, un sistema de recuperación de memoria, diplomacia jugable, vehículos terrestres ni destrucción de puentes como dependencias de las campañas 1 y 2.

## 12. Pendientes para la siguiente entrega

- Confirmar nombres, indicativo de Voss y estilo visual.
- Validar Faro en C3-M3 y Chispa en C3-M10; la necesidad de esas dos bajas y de Aguja superviviente está establecida.
- Fijar cantidad total de misiones de campaña 3 y el destino de Rastro antes del final.
- Definir consecuencia de salir del sector y manejo de daño durante escapes obligatorios.
- Resolver el sacrificio con causalidad clara antes de producir su escenario.
- Escribir C1 completa: instrucción, objetivos, victoria/derrota, fases, cantidades, bioma, eventos, radio, resumen y tres medallas por misión.
- Después de aprobar C1, entregar la lista definitiva de misiones de C2 y C3 para desarrollar sus fichas.

**Criterio de cierre de este reporte:** el desarrollador puede preparar sistemas y recursos comunes sin confundir propuestas narrativas con funcionalidades existentes ni escenas todavía pendientes con especificaciones finales.
