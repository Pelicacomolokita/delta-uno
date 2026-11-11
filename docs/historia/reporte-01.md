# DELTA UNO
## Reporte 01 — Historia y requisitos para desarrollo

**Versión:** 0.3 · Documento de preproducción · Contiene spoilers completos.

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

**ACORDADO, actualizado:** la maniobra reconocible de Rastro se presenta en combate durante la convivencia previa a la emboscada; no exige modificar la misión 1 ya realizada. Más adelante un enemigo la repite, generando sospechas. Debe poder escapar de varios encuentros.

**BASE PROPUESTA — «La firma»:** amaga hacia un lado, evade hacia el contrario y sale con un golpe de turbo. La IA debe mostrarla delante del jugador en una situación despejada. Confirmar que el amague puede representarse con los controles actuales de IA.

Ejemplo de radio, aún no asignado a un cronograma: Chispa: «Otra vez la firma. Un día te van a reconocer por eso.»

Progresión propuesta:

1. Primeras misiones: conocemos al piloto y vemos su maniobra en combate, con una segunda aparición antes de la emboscada.
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

### Campaña 1 — introducción ampliada de siete misiones

**ACORDADO, actualizado:** conservar la misión 1 realizada, dedicar las primeras cinco misiones a aprender mecánicas, conocer el mundo y convivir con el escuadrón, y trasladar la emboscada a la misión 6. La escolta y asalto original queda como misión 7. La dificultad crece mediante nuevas decisiones y combinaciones, no solo aumentando enemigos. Se incorpora conocimiento de ciudades y sectores con estructuras de vuelo. Nombres, encuentros concretos y geometrías del apartado 13 son propuestas para aprobar y probar.

**Misión 1 — entrenamiento, ya realizada según el autor.** No se ha inspeccionado su implementación. La descripción original incluía anillos, torretas y tres naves de práctica; esa descripción no autoriza a rehacer lo existente. Contrastar cualquier ajuste con el desarrollador. La demostración de Rastro pasa a combate real en misiones posteriores.

**Misión 2 — primera salida.** Una posición enemiga amenaza el acceso aéreo a una ciudad costera. Combate con cazas y torretas en encuentros separados. Introducir la lectura del blanco, fijación y misiles sin exigir gasto obligatorio de munición. Rastro evade delante del jugador. Se abre la ruta del transporte de la misión siguiente.

**Misión 3 — carga importante.** Escoltar un transporte hacia la ciudad, por un recorrido amplio entre infraestructura portuaria. Enseñar prioridades y cobertura del convoy. Repetir la maniobra de Rastro en una intercepción visible. La carga permite sostener un nodo de suministros que será atacado en M4.

**Misión 4 — mantener la posición.** Defensa por oleadas de los accesos al nodo, sin necesitar daño simulado sobre edificios civiles. Se introducen pausas de combate, gestión de turbo y oportunidad de reparación de ocho segundos, sin imponer recibir daño. El ataque obliga a abrir otra vía de abastecimiento en M5.

**Misión 5 — abrir el paso.** Aproximación baja entre mesetas y asalto secuencial a dos posiciones que bloquean la ruta alternativa. Es la primera combinación exigente de navegación y combate. El sigilo real se incorpora solo si se implementa la detección necesaria; existe alternativa de aproximación táctica con patrullas y sectores de detección actuales. El éxito habilita el desplazamiento del escuadrón en M6.

**Misión 6 — emboscada.** Formación inicial con jugador y nueve aliados. Durante los primeros 40 segundos caen seis aliados; algunas caídas ocurren delante del jugador, incluido el líder alcanzado por un misil. Hay que sobrevivir dos minutos. Quedan Aguja, Chispa y Faro junto al jugador y luego derriban tres bombarderos. Propuesta temporal a validar: los 40 segundos forman parte de los dos minutos. Los bombarderos son dependencia explícita. La emboscada debe ocurrir en un paso con espacio para evadir, sin exigir combate dentro de un túnel estrecho.

**Misión 7 — los que quedan.** Proteger un transporte aproximadamente cinco veces mayor que el caza mientras se asaltan tres zonas enemigas. Participan los tres compañeros. Se recupera el corredor tras las pérdidas. La complejidad está en alternar protección y ataque; la intensidad tiene descansos para que se sientan las ausencias.

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
| Bombarderos | Amenaza prioritaria contra convoy o instalación. | En desarrollo; requeridos por C1-M6. |

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
4. Conservar la misión 1 realizada y preparar objetivos encadenados para la introducción ampliada.
5. Confirmar convoy por puntos, paradas y reanudación; mantener escala de referencia 5:1.
6. Terminar bombarderos para C1-M6 y comprobar el presupuesto de naves en la emboscada.
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


## 13. Introducción progresiva y construcción del mapa — actualización 0.2

### Principios de dificultad

- Una exigencia nueva dominante por misión; reutilizar lo conocido en un contexto distinto.
- Separar el primer aprendizaje de maniobra de la primera presión fuerte de combate. Evitar radio explicativa durante el tramo más estrecho.
- Mostrar primero el obstáculo con tiempo para elegir trayectoria. No ubicar una salida ciega, un giro cerrado y una amenaza nueva en el mismo punto.
- El equipo acompaña y ayuda de verdad. No concentrar nueve voces en cada salida: destacar dos compañeros por misión y rotar a los restantes.
- Escalar la dificultad por simultaneidad de decisiones: volar, elegir blanco, proteger y administrar recursos. Mantener una intensidad distinta de la complejidad: M7 puede ser más compleja y menos frenética que la emboscada.
- Respetar unas 25 naves simultáneas; usar oleadas y distribución espacial sin asumir que ampliar el mapa aumenta el límite técnico.

### Curva propuesta para pruebas

Escala cualitativa 1 a 5, no valores de IA ni dificultad final aprobada.

| Misión | Manejo | Combate | Atención dividida | Aprendizaje principal |
|---|---|---|---|---|
| 1, realizada | Revisar lo existente | Revisar lo existente | Revisar lo existente | Conservar y comprobar qué enseña realmente. |
| 2 | 1 | 1 | 1 | Leer amenazas y seleccionar/fijar blancos. |
| 3 | 2 | 2 | 2 | Proteger algo además de la propia nave. |
| 4 | 2 | 3 | 3 | Priorizar, apoyar compañeros y aprovechar respiros. |
| 5 | 3 | 3 | 3 | Leer el terreno, aproximarse y elegir cuándo atacar. |
| 6 | 3 | 4 | 4 | Sobrevivir, reagruparse e interceptar bombarderos. |
| 7 | 3 | 3 | 4 | Combinar escolta y liberación de zonas. |

No fijar cantidades ni temporizadores definitivos antes de probar controles, cámara y duración de encuentros. La reparación no necesita convertirse en objetivo obligatorio si el jugador no recibió daño. Tampoco se debe agotar munición para forzar una lección; confirmar política de reposición entre fases.

### Ciudades que vale la pena defender

**BASE PROPUESTA — Puerto Clara:** ciudad costera que concentra viviendas, puerto y plataformas de carga. En M2 se conoce su acceso; en M3 llega el transporte; en M4 se defiende el nodo que la abastece. La familiaridad nace de regresar al lugar y reconocer su función. No requiere civiles caminando, tráfico ni edificios destruibles.

**BASE PROPUESTA — Alto del Paso:** asentamiento industrial entre mesetas, conectado visualmente con depósitos y caminos. M5 abre su corredor. Permite mostrar diferencias de inversión y mantenimiento entre regiones y preparar el contexto social de los Desligados, sin revelar aún su futura fuerza militar.

Diseño urbano: silueta legible desde el aire, dos o tres hitos grandes por sector, accesos amplios y áreas residenciales reconocibles separadas de las posiciones de combate. Las rutas iniciales atraviesan periferia y corredores industriales. Evitar transformar edificios civiles en blancos puntuables. La destrucción civil, penalizaciones por fuego amigo o daño estructural son mecánicas no confirmadas y no se requieren para estas misiones.

### Estructuras de vuelo para el mapa

| Estructura propuesta | Primer uso | Variante futura | Necesidad técnica |
|---|---|---|---|
| Pórticos de carga y arcos amplios | M3: atravesar un acceso portuario con buena visibilidad. | Recorrido contra reloj entre varios accesos. | Geometría con colisiones y pruebas de cámara. |
| Canal o cauce abierto entre mesetas | M5: mantener vuelo bajo siguiendo curvas suaves. | Patrullas arriba y rutas alternativas. | Terreno y marcadores de ruta; sigilo es una incorporación separada. |
| Puente elevado con paso inferior ancho | M5: atajo opcional de manejo. | Variante avanzada con tiempo o amenaza. | Colisiones coherentes; no requiere destrucción ni vehículos. |
| Rocas flotantes espaciadas | M2/M3: referencias y obstáculos opcionales. | Trayectorias alternativas durante combate. | Comprobar navegación de aliados y espacio para evasión. |
| Laderas con recodos y explanadas | M5/M6: variar aproximaciones y permitir reagrupamiento. | Emboscadas más complejas. | No asumir que el terreno bloquea detección o disparos sin soporte real. |
| Grandes conductos industriales exteriores | Presentación ambiental antes de la central. | Ruta técnica en campaña 3. | Colisiones y lectura visual; entrada a túneles no requerida. |

Construir módulos y prototipos grises antes del arte final. Ancho y altura se calculan desde la envolvente de nave, desplazamiento de evasión, velocidad típica, radio de giro y cámara reales. No fijar metros arbitrarios. Un paso para el caza puede ser inviable para un transporte de escala 5:1: darle una ruta distinta y no exigir al convoy atravesar huecos diseñados para cazas. Los aliados necesitan trayectoria válida propia.

Los pasos estrechos iniciales son opcionales o tienen una ruta amplia equivalente. El primer tramo obligatorio de vuelo bajo permite reducir velocidad, ver la salida y recuperar altura si se comete un error. No exigir turbo en curvas ciegas. Verificar el daño por colisión antes de decidir si un roce puede terminar una fase.

### Vuelo bajo y sigilo: dos variantes distintas

**Variante A, sin sigilo nuevo:** el recorrido evita las proximidades de zonas enemigas y aprovecha cómo se distribuyen los enemigos actualmente. Hay vuelo bajo por navegación y ficción táctica, pero no se promete que bajar altitud reduzca detección. Un muro o una meseta no ocultan automáticamente al jugador. Si los radios actuales no permiten una ruta coherente, no presentar esa aproximación como indetectable.

**Variante B — [MECÁNICA NUEVA] detección por terreno:** comprobar distancia y línea de visión contra terreno/estructuras, incorporar sospecha o alerta legible y decidir cómo se comparte el aviso. Si se desea que la altitud modifique detección, debe definirse respecto de la superficie local del planeta, no de un eje vertical global. Definir qué delata al jugador: exposición visual, disparos y, solo si se decide, turbo. No atribuir ruido al turbo sin implementarlo.

Primera misión de sigilo propuesta: cruzar un cauce para alcanzar una posición defensiva antes de que se coordine con la otra. Entrada al cauce → recorrido con exposición legible → llegada al punto de ataque → asalto. El tramo termina antes del combate principal. Detección temprana activa un encuentro adicional o cambia el orden de la defensa, sin superar el límite de naves; no implica derrota automática en esta primera enseñanza. El comportamiento de alerta y esa ramificación también requieren implementación.

No es una misión de infiltración a pie y no necesita vehículos terrestres. Los estados de detección deberán corresponder al jugador y a los aliados: definir si estos siguen la ruta baja, esperan fuera o avanzan por otro corredor. No permitir que un compañero revele al equipo sin que el jugador pueda comprenderlo o prevenirlo.

### Convivencia durante operaciones

| Misión | Vínculo a desarrollar | Momento adecuado |
|---|---|---|
| 2 | Ferreyra da confianza; Rastro demuestra competencia. | Aproximación y maniobra visible en combate despejado. |
| 3 | Chispa reconoce la costumbre de Rastro; Faro cuida al transporte. | Tránsito seguro y salida de la intercepción. |
| 4 | Aguja pide apoyo con precisión; Rastro cubre al jugador. | Cambio de objetivo real, sin guionizar una salvación que contradiga el combate. |
| 5 | El equipo coordina una operación ya exigente; los otros cuatro pilotos tienen hábitos reconocibles. | Distribuir sus intervenciones entre aproximación y pausas. |
| 6 | Se interrumpen rutinas conocidas y se pierden voces que el jugador reconoce. | Bajas visibles y reagrupamiento; las instrucciones tienen prioridad. |
| 7 | Cuatro naves intentan cumplir tareas que antes repartían entre diez. | Formación reducida y espacios de radio más silenciosos. |

Los compañeros no tienen que morir prematuramente para enseñar que están en riesgo. Sus amenazas y solicitudes de apoyo pueden ser reales con una condición de derrota clara si son esenciales. Las caídas fijadas en la emboscada siguen siendo eventos narrativos, no seis fallos inevitables de un objetivo que prometía salvarlos.

### Orden sugerido de construcción y verificación

1. Registrar qué enseña la misión 1 existente sin rehacerla por esta guía.
2. Prototipar Puerto Clara, un pórtico amplio, un cauce y un puente con paso inferior. Geometría simple y colisiones primero.
3. Probar nave, cámara, evasión, turbo y trayectorias de compañeros y transporte.
4. Montar M2 y M3 para comprobar aprendizaje y reconocimiento de lugares/personajes.
5. Montar M4 y probar pausas, apoyo aliado y reparación sin saturar radio.
6. Probar M5 en variante A. Si se aprueba sigilo real, implementar y verificar la variante B antes de escribir instrucciones que lo prometan.
7. Ajustar M6 y M7 conservando los hitos narrativos y las dependencias de bombarderos y convoy.
8. Agregar arte y clima decorativo después de validar legibilidad, navegación y rendimiento en teléfono.

**Pendiente para fichas ejecutables:** cantidades por tipo, posiciones, tiempos, medallas, condición de derrota por fase, cronograma de radio y parámetros de detección. Este apartado autoriza una dirección de construcción y propone desafíos; no presenta esos valores como probados.


## 14. Reporte de geografía y construcción del planeta — versión 0.3

**Destinatario:** desarrollador del mapa y del director de misiones.

Este apartado responde las veinte consultas de desarrollo. Conserva la historia y la introducción ampliada de los apartados anteriores. La distribución territorial, red, rutas, indicativo inicial y reglas de bajas que siguen son propuestas concretas para revisión; la solicitud de elaborar el reporte no las convierte por sí sola en decisiones aprobadas.

**Información técnica informada por desarrollo:** actualmente el generador distribuye biomas, seis zonas enemigas y rocas flotantes sin relación con la historia; existe un lado nocturno fijo. No se inspeccionó código ni se verificó rendimiento.

### 14.1 Decisiones que desbloquean el mapa

| Prioridad | Dirección recomendada | Alcance y estado |
|---|---|---|
| 1 | Conservar el generador y fijar regiones narrativas sobre una semilla estable. | Propuesta de arquitectura; validar con desarrollo. |
| 2 | Una geografía compartida entre campaña y modos libres. | Propuesta; estados y progreso independientes. |
| 3 | Mantener el tamaño actual durante el prototipo. | Propuesta; ajustar solo después de probar escala y tiempos. |
| 4 | Guardia en el núcleo costero, Directorio en el eje extractivo y Desligados en periferia/polar. | Propuesta territorial detallada abajo. |
| 5 | Cinco estabilizadores regionales y una central de regulación en Corona Negra. | Propuesta; distinguir de la central militar del Directorio. |
| 6 | Corredor de M7: Costa Clara → Cuenca Verde → Alto del Paso. | Propuesta de ruta; tres posiciones defensivas. |

No se solicita pintar manualmente todo el planeta ni presupone mapas de textura de un tamaño concreto. El generador conserva detalles secundarios, pero no debe cambiar accesos, terreno de misión, posiciones estructurales o colisiones dentro de los recorridos diseñados. Si hay decoraciones aleatorias, excluirlas de corredores reservados.

### 14.2 Respuestas a las consultas 1–3: generación, modos y escala

**1. Generación híbrida.** Fijar forma general de las regiones, bioma, bases, poblaciones, infraestructura, corredores, concentraciones de rocas y puntos de llegada/escape. Generar detalle secundario con semilla estable. Las seis zonas enemigas actuales no definen la campaña: cada operación requiere su propia composición de encuentros.

**2. Modos libres.** Recomendación: compartir geografía sin compartir progreso. Campaña usa su ocupación narrativa; Conquista configura bandos para esa partida; Supervivencia usa oleadas de un sector; Carrera recorre trazados diseñados; Vuelo libre permite explorar con amenazas configurables. Una sesión libre no libera posiciones de la campaña. No limitar una partida libre al sector de una misión que no está ejecutándose.

**3. Escala.** Mantener provisionalmente los tres minutos aproximados de travesía. Las siete regiones son áreas reconocibles, no siete metrópolis. Iniciar cada operación cerca de su sector; no introducir viajes planetarios obligatorios para rellenar duración. Ajustar tamaño de ciudad, relieve y distancias con pruebas reales. La recomendación no garantiza mejoras de rendimiento.

### 14.3 Respuestas a las consultas 4–5: territorio y vecindad

**4. Presencia inicial propuesta.** Guardia: Costa Clara y Cuenca Verde, más puestos aislados en Las Agujas. Directorio: Salinas del Sur, el complejo de Corona Negra y posiciones en Las Agujas/Mar de las Columnas. Desligados: comunidades de Paso del Deshielo y células periféricas junto a instalaciones de extracción. Su presencia en Corona Negra al comienzo de campaña 3 deriva de la captura posterior; no es su capital original.

El frente principal cruza Cuenca Verde → Las Agujas → Salinas. No es una línea cerrada que divide tres países: hay corredores y posiciones aisladas. El mar ofrece una alternativa expuesta para transportes. Una región con ocupación militar del Directorio no implica que su población civil lo apoye.

**5. Ubicación relativa propuesta.** Orientación referida a la iluminación actual; las coordenadas definitivas se decidirán dentro del generador.

| Región | Posición | Vecinos / accesos relevantes |
|---|---|---|
| Costa Clara | Núcleo del hemisferio diurno. | Cuenca Verde y Mar de las Columnas. |
| Cuenca Verde | Interior costero hacia el frente. | Costa Clara y Las Agujas. |
| Las Agujas | Transición de vegetación a terreno seco. | Cuenca Verde, Salinas y Paso del Deshielo. |
| Salinas del Sur | Sector seco próximo al terminador. | Las Agujas, Mar de las Columnas y Corona Negra. |
| Mar de las Columnas | Ruta marítima lateral al corredor interior. | Costa Clara y Salinas. |
| Paso del Deshielo | Franja polar que se extiende hacia la noche. | Las Agujas y Corona Negra. |
| Corona Negra | Hemisferio nocturno, aproximadamente opuesto a Costa Clara. | Salinas y Paso del Deshielo. |

Corona Negra está lejos del núcleo de la Guardia, pero conectada a instalaciones industriales. Una conexión indica vecindad/acceso, no necesariamente un camino transitable por tierra. Reservar mar y transiciones suficientes para no comprimir siete escenarios incompatibles en un mismo paso. No convertir esta tabla en coordenadas geográficas aprobadas.

### 14.4 Respuestas a las consultas 6–8: base, población y noche

**6. Base Delta, propuesta.** Base costera en Costa Clara, separada de Puerto Clara. Hangares bajos, antenas, plataformas y acceso abierto hacia el mar. Misiones comienzan con naves en vuelo cerca de la base o del sector. Regresar consiste en llegar a un punto de reunión. **[MECÁNICA NUEVA]** Aterrizar o despegar de forma controlada por el jugador no es dependencia de las primeras campañas.

**7. Ciudades visibles, propuestas.**

| Lugar | Región | Identidad y estado inicial |
|---|---|---|
| Puerto Clara | Costa Clara | Ciudad portuaria vinculada a la Guardia; viviendas, depósitos y plataformas. Mayormente intacta. |
| Alto del Paso | Las Agujas | Asentamiento industrial de población diversa; ocupación parcial y servicios interrumpidos. |
| Asentamientos del Deshielo | Paso del Deshielo | Comunidades donde crecen los Desligados; reparaciones precarias y abandono acumulado. |

Dos poblaciones principales y pequeños asentamientos bastan para la primera construcción. Usar hitos grandes y accesos legibles. No requieren peatones, tráfico ni destrucción física. Barrios residenciales se distinguen de defensas y depósitos. Las ciudades no son bloques enteros de blancos militares.

**8. Noche.** Conservar el lado nocturno fijo, sin introducir todavía una explicación astronómica obligatoria. Hay población e industria allí y se proponen operaciones nocturnas. La iluminación ayuda a reconocer instalaciones y rutas. No usar noche como sinónimo de enemigo ni como penalización de sensores no implementada.

### 14.5 Respuestas a las consultas 9–11: nácar, estabilizadores y techo

**9. Nácar visual, propuesta.** Conservar las rocas grises y agregar vetas claras con brillo turquesa tenue, sobre todo perceptible en sombra. El brillo no requiere luz dinámica en cada roca. Concentraciones medias en Las Agujas, grandes bloques separados en Mar de las Columnas y acumulaciones vinculadas a la red en Corona Negra. Ejemplares aislados en otras regiones. Excluir recorridos que deban quedar despejados. Algunas concentraciones tienen anclajes y plataformas extractivas ambientales. No se pide minería, recolección ni destrucción de rocas.

**10. Estabilizadores, propuesta.** Son instalaciones que regulan la red de aprovechamiento del nácar. Silueta repetible: elemento central y tres soportes externos con iluminación identificable. La central usa la misma familia visual a mayor escala.

| ID sugerido | Instalación | Región |
|---|---|---|
| STAB_COAST | Nodo costero | Costa Clara |
| STAB_FOREST | Nodo forestal | Cuenca Verde |
| STAB_PASS | Nodo de transferencia | Las Agujas |
| STAB_SALT | Nodo extractivo | Salinas del Sur |
| STAB_POLAR | Nodo polar | Paso del Deshielo |
| REGULATION_CORE | Central de regulación planetaria | Corona Negra |
| DIRECTORATE_HQ | Centro de mando militar del Directorio | Salinas del Sur |

Hay cinco nodos regionales más la central de regulación. DIRECTORATE_HQ es otra instalación: la desactivación de campaña 2 rompe mando y coordinación militar, no apaga la infraestructura que sostiene el planeta. Su posición exacta y arquitectura pueden compartir el lenguaje industrial, pero su objetivo debe distinguirse en interfaz y radio.

Conexiones principalmente subterráneas/submarinas, con conductos y terminales visibles localmente. No se requieren cables luminosos sobre toda la esfera. Los nodos son hitos ambientales al principio. **[MECÁNICA NUEVA]** Desactivación interactiva, blancos funcionales y efectos de propagación deben implementarse expresamente si una misión los necesita.

**11. Techo de vuelo, propuesta.** Capa atmosférica tenue, más visible al aproximarse, y aviso de cabina. Auroras decorativas en regiones polares son opcionales. No se pide una tormenta eléctrica permanente ni daño por rayos. Definir primero la respuesta jugable al techo y hacer que los efectos la comuniquen; el efecto visual no sustituye esa regla.

### 14.6 Respuestas a las consultas 12–15: rutas y emboscada

**Corrección de numeración:** la emboscada es C1-M6 y la escolta con tres zonas es C1-M7. C1-M3 es la primera escolta de menor dificultad. No utilizar referencias antiguas para construir el corredor grande.

**12. Corredor propuesto para C1-M7.** Salida cercana a Base Delta → periferia de Puerto Clara → Cuenca Verde → puesto de abastecimiento de Alto del Paso. La ruta repite espacios conocidos y muestra cuánto cuesta mantenerlos tras la emboscada.

| Orden | Zona que bloquea la ruta | Función | Punto de espera del convoy |
|---|---|---|---|
| 1 | Batería del Estuario | Domina la salida costera. | En el espacio abierto del lado seguro del estuario. |
| 2 | Puesto de la Cuenca | Controla el corredor de suministros forestal. | En un claro amplio ya asegurado. |
| 3 | Batería del Paso | Impide llegar a Alto del Paso. | Antes del acceso final, fuera de su alcance inicial. |

El transporte avanza después de liberar la posición correspondiente. Confirmar IA por puntos, espera y reanudación. Evitar que aparezcan enemigos fuera de las zonas sin comunicarlo y bloqueen la condición de liberación. La ruta se calibra para tránsitos breves y espacio apto para la escala 5:1.

**Continuidad propuesta M5–M7.** M5 abre la ruta alternativa. M6 intenta reforzarla y sufre la emboscada. Durante esa operación el Directorio retoma las tres posiciones. M7 transporta suministros y recupera el corredor. Este contraataque debe comunicarse en el resumen de M6 y la instrucción de M7: no reaparecen defensas por un reinicio arbitrario del mapa.

**13. Red terrestre propuesta.** Ruta principal Puerto Clara → depósitos de Cuenca Verde → Alto del Paso → instalaciones de Salinas. Ramal desde Alto del Paso hacia Paso del Deshielo. Vía industrial de Salinas hacia Corona Negra donde el terreno lo permita. Mantener transportes aéreos/marítimos para discontinuidades; no construir un puente que recorra el planeta.

- Puente del Estuario: conecta puerto y depósitos.
- Viaducto del Paso: cruza un barranco de acceso a Alto del Paso.

Ambos pueden tener pasos inferiores opcionales para cazas. No necesitan ser destruibles ni tener vehículos ahora. Su destrucción futura requerirá estados y consecuencias de ruta, no solo una explosión cosmética.

**14. Emboscada en Las Agujas, propuesta de contexto.** El escuadrón parte de un punto de reunión en Cuenca Verde hacia Alto del Paso para reforzar la ruta abierta en M5. Atacantes esperan detrás de mesetas y entran por los flancos; defensas terrestres participan según las capacidades implementadas. No presentar una ladera como bloqueo de sensores si no existe oclusión de detección. Los tres bombarderos amenazan el puesto de abastecimiento y plataformas de evacuación de Alto del Paso. La emboscada intenta eliminar a quienes pueden interceptarlos. La amenaza sobre el lugar puede resolverse con objetivo y temporizador de misión; daño real a edificios no está confirmado.

Se mantienen los hitos: seis aliados derribados en cuarenta segundos, dos minutos de supervivencia y luego tres bombarderos. Las cantidades de atacantes y tiempos de aparición precisos quedan para la ficha ejecutable. Respetar presupuesto de naves durante cada fase.

**15. Costa Clara.** Está cerca de Base Delta y se vuelve allí. Se reconoce su puerto y costa antes y después de las bajas. La familiaridad aporta significado sin necesitar una ciudad distinta para cada misión.

### 14.7 Respuestas a las consultas 16–17: persistencia y desgaste

**16. Estados del planeta, propuesta.** Mantener geografía y semilla; cambiar ocupación, pintura, actividad, presencia militar y variantes de daño según campaña/misión. Después de campaña 2 el centro militar DIRECTORATE_HQ queda desactivado. En campaña 3 los Desligados ocupan y repintan material e instalaciones capturadas, entre ellas el complejo de Corona Negra. La central de regulación sigue siendo distinta del centro militar.

**[MECÁNICA NUEVA]** Si no existe persistencia narrativa, agregar estados de instalaciones/zonas y su restauración al reintentar. Consolidar progreso al completar la misión; al reiniciar una fase, restaurar el estado de entrada de esa fase. Los modos libres usan una configuración separada. No requerir simulación bélica global fuera del sector.

**17. Desgaste propuesto.**

| Región | Estado inicial | Evolución visible |
|---|---|---|
| Costa Clara | Daño leve, actividad civil e industrial. | Reparaciones puntuales y más defensas. |
| Cuenca Verde | Suministro interrumpido y puestos activos. | Instalaciones recuperadas, algunos daños. |
| Las Agujas | Ocupación y desgaste moderado. | Restos y cicatrices de la campaña 1. |
| Salinas del Sur | Explotación intensa y presencia militar. | Centro de mando apagado tras campaña 2. |
| Mar de las Columnas | Poco daño visible. | Restos e instalaciones aisladas. |
| Paso del Deshielo | Abandono de larga data. | Reparaciones precarias y militarización. |
| Corona Negra | Complejo activo y mantenido. | Fallas y sobrecarga al final de campaña 3. |

Usar variantes de malla, pintura, luces y elementos ambientales cuando sea viable. No introducir destrucción física general como requisito implícito. Los restos no deben obstruir retroactivamente rutas críticas sin una prueba nueva.

### 14.8 Respuestas a las consultas 18–20: indicativos, colores y supervivencia

**18. Indicativo inicial, propuesta.** Jugador = Delta Diez. Ferreyra = Delta Uno hasta morir. Soria asigna al jugador el liderazgo provisional durante el reagrupamiento posterior a la emboscada; empieza M7 como Delta Uno. Diez coincide con jugador más nueve aliados, pero la numeración no obliga a darle a cada personaje un número como indicativo de radio principal.

Ejemplo de radio: «Delta Diez, reuní a los demás. Desde ahora sos Delta Uno.» Este texto es un ejemplo, no parte de un cronograma validado; volver a contar caracteres al producir las tablas definitivas.

**19. Colores, recomendación de trabajo.** Guardia: gris claro, azul petróleo y blanco. Directorio: grafito, marfil industrial y ámbar. Desligados: equipo recuperado con óxido, arena y turquesa, más repintado parcial de material capturado. Falta aprobación visual definitiva. Probar nave contra mar, nieve, cielo y noche antes de cerrar materiales. Los marcadores de identificación no dependen solo del color de pintura.

**20. Compañeros imprescindibles, recomendación pendiente de confirmación.** Si caen antes de su muerte narrativa, se pierde y reinicia la parte actual. Comunicar esa condición en la instrucción. Aliados secundarios pueden morir cuando la ficha lo permita. En la emboscada las seis caídas programadas no son fallos de protección: el objetivo es sobrevivir y reagruparse. No activar la derrota genérica por muerte aliada durante esos eventos. Esta regla sustituye la propuesta por una recomendación explícita, pero no se registra como aprobación del autor.

### 14.9 Paquete mínimo de construcción sugerido

1. Prototipo gris de la esfera con las siete regiones y transiciones, conservando tamaño actual.
2. Base Delta y Puerto Clara, separados pero próximos; hitos simples para Alto del Paso.
3. Eje de ruta Costa Clara–Cuenca Verde–Las Agujas y sus tres posiciones de M7.
4. Un pórtico, un cauce de curvas suaves y un puente de paso inferior amplio para probar vuelo y cámara.
5. Familia visual de estabilizadores, central de regulación y centro militar distinguibles.
6. Distribución reservada de rocas con zonas libres de obstáculos para rutas y eventos.
7. Puntos de llegada y escape en cada sector; comprobación de navegación aliada.
8. Prueba en teléfono de legibilidad, carga y máximo simultáneo antes de aumentar escala o densidad.

Calidades Baja/Media/Alta, detalle de suelo, vegetación, efectos y variantes de nave pueden avanzar en paralelo al cierre de propuestas, como indicó desarrollo. No comprometer esas tareas a coordenadas o densidades aún no probadas.

### 14.10 Decisiones pendientes para cerrar esta entrega

- Aprobar o ajustar generación híbrida, planeta compartido y tamaño provisional.
- Aprobar vecindades, ocupación inicial y corredor de M7.
- Aprobar cinco nodos más central de regulación y la separación del centro militar.
- Confirmar Delta Diez y el momento del relevo.
- Confirmar derrota por baja prematura de compañero imprescindible.
- Probar escala de poblaciones y pasos, definir límites de sector y validar retirada de Rastro.
- Elegir vuelo bajo táctico o implementar sigilo real antes de prometer ocultamiento por terreno.

**Límite del reporte:** define una propuesta coherente de mundo para que desarrollo estime y prototipe. Todavía faltan fichas completas de misión con cantidades, posiciones, temporizadores, radios, medallas y validación jugable. No hay código ni rendimiento verificados por este documento.
