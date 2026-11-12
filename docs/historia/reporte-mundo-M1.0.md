# DELTA UNO — REPORTE DEL MUNDO
## Entrega para implementación · M1.0

Leer junto a **Delta_Uno_Reporte_Historia_Implementacion.md**. El reporte de historia define hechos, misiones y progresión; este define el espacio que necesitan. Diseño para prototipos y construcción gradual, no mapa de coordenadas definitivo ni arte final.

## 1. Reglas fijas y límites de esta entrega

- Un planeta esférico para campaña y modos libres, tamaño actual: unos tres minutos de travesía.
- Generación híbrida: detalle generado, regiones/ciudades/rutas/estructuras/despliegues fijados por diseño.
- Siete regiones provisionales; su geometría se adapta a las operaciones. No construir primero una geografía rígida que obligue a cambiar la historia.
- Estilo industrial desgastado. Pinturas de facción/región orientan, con identificadores que no dependan solo del color.
- M1 existente se preserva. No rehacer su terreno o ruta sin comprobar compatibilidad y consultar el cambio.
- Sector de misión con borde visible y ocho segundos para volver. Su salida no permite recorrer todo el planeta persiguiendo a Rastro.
- Colisión con estructuras: rebote y daño, como rocas. Suelo o mar: caída.
- Vuelo libre inicia en la región inicial y desbloquea regiones por historia. Entornos sanos y destrucción habilitada sobre elementos definidos. Reinicio del daño al salir: propuesta pendiente, no persistencia aprobada.

No hay metros ni coordenadas finales porque faltan dimensiones y cinemática del proyecto. El arte ilustrado, los diálogos y el medio de presentación se diseñan después. La construcción actual usa módulos simples con colisiones y pruebas.

## 2. Geografía al servicio de la historia

Nácar tiene mar, playa, pradera, bosque, desierto, mesetas, hielo, montaña y volcán; rocas flotantes y techo de vuelo. El nácar gravitacional y su explotación conectan bases, ciudades y periferias. Los caminos explican actividad humana sin requerir vehículos terrestres todavía.

| Región / ID sugerido | Función | Hitos grandes | Inicio de control y evolución | Apariciones principales |
|---|---|---|---|---|
| Costa Clara / COAST | Hogar, aprendizaje y contraste tras pérdidas. | Puerto, base costera, entrada del estuario. | Guardia; actividad civil, reparaciones y refuerzo defensivo posterior. | C1-01/02/03/07; referencia de regreso y evacuación posterior. |
| Cuenca Verde / FOREST | Abastecimiento y defensa de población. | Nodo, claros industriales, cauce fluvial. | Guardia con accesos amenazados; ataques y recuperación. | C1-03/04/07; C3-04. |
| Las Agujas / SPIRES | Frente, navegación baja y emboscada. | Mesetas, Alto del Paso, grietas y viaducto. | Disputada; corredor abierto en M5, contraataque en M6, recuperación en M7. | C1-05/06/07; C2-01. |
| Salinas del Sur / SALT | Extracción y mando del Directorio. | Salinas, complejos industriales, centro militar. | Directorio; caída del mando C2-10, apropiación por otras fuerzas después. | C2-03/04/10; C3-01/05 y corredor industrial según trazado. |
| Mar de las Columnas / SEA | Escolta expuesta, velocidad y nodriza. | Columnas flotantes, plataformas y horizonte abierto. | Corredor disputado con presencia del Directorio; luego tres bandos. | C2-02/09; C3-06. |
| Paso del Deshielo / ICE | Periferia olvidada, Desligados y verdad de Rastro. | Hielo roto, asentamientos reparados, nodo polar. | Comunidades y células Desligadas; militarización, fractura y evacuación. | C2-05/08; C3-02/03/07/08. |
| Corona Negra / CROWN | Concentración industrial y desenlace. | Montaña, conductos/anillo industrial, instalación del misil. | Directorio al inicio; capturada por Varela; disidentes abren acceso. | C3-09/10/11/12/13. |

C2-06/07 requieren corredor nocturno y centro de archivos: ubicarlos en la transición Salinas–Deshielo permite continuidad, sin fijar coordenadas antes de probar distancias.

### Vecindad de referencia, modificable en prototipo

Costa ↔ Cuenca ↔ Agujas ↔ Salinas. Alternativa marítima Costa ↔ Columnas ↔ Salinas. Ramal Agujas ↔ Deshielo ↔ Corona; acceso industrial Salinas ↔ Corona. No toda conexión equivale a carretera continua.

Costa en hemisferio diurno; transición seca en Salinas; Deshielo polar y Corona mayormente nocturna. Conservar el lado nocturno fijo actual sin requerir explicación astronómica ni ciclo día/noche. Las misiones nocturnas deben estar en esa geografía; no cambiar iluminación de forma incoherente entre visitas sin una decisión explícita.

## 3. Lugares e infraestructura nombrada

| Lugar | Aspecto y función | Misiones / cambio | Requisitos |
|---|---|---|---|
| Base Delta | Hangares bajos, plataformas, antenas; separada de la ciudad. | Salidas/reuniones; hogar de C1. | Inicio en vuelo y llegada por punto; sin aterrizaje obligatorio. |
| Puerto Clara | Barrio portuario, depósitos y pórticos. | C1-02/03 y corredor M7; suministros y familiaridad. | Población reconocible sin tráfico o peatones. |
| Alto del Paso | Terrazas industriales, viviendas y plataforma de abastecimiento. | Objetivo de bombarderos M6 y destino M7. | No convertir toda vivienda en blanco militar. |
| Puente del Estuario | Conexión visual puerto–depósitos. | C1-03/07; paso inferior opcional. | Ruta del convoy por espacio abierto. |
| Viaducto del Paso | Puente sobre barranco. | C1-05/07 y referencia posterior. | Paso caza separado de ruta de transporte. |
| Cauce de aproximación | Curvas suaves, paredes laterales y salida visible. | C1-05; versión avanzada C3-08/09 según sector. | Terreno para [SIGILO], no ocultamiento automático. |
| Pórticos portuarios | Arcos industriales anchos. | C1-03 y carreras futuras. | Colisiones y cámara probadas. |
| Batería del Estuario | Defensa costera. | Primera zona C1-07. | Espera segura del convoy antes. |
| Puesto de la Cuenca | Defensa de suministros. | Segunda zona C1-07. | Claro de combate y espera posterior. |
| Batería del Paso | Control del acceso final. | Tercera zona C1-07. | Llegada despejada al destino. |
| Centro de archivos | Instalación técnica con acceso de transporte. | C2-07, captura de planos. | Defender extracción por eventos; no interior a pie. |
| Estación de especialistas | Plataforma, antenas, taller. | Destino C2-08. | Comunicar desarrollo tecnológico sin entregar nave inmediatamente. |
| Centro militar del Directorio | Complejo simétrico, antenas y defensas. | C2-10; apagado tras derrota. | Distinto de central planetaria. |
| Refugio/puesto de Rivas | Taller médico, viviendas y plataforma. | C3-07 y contexto de Rastro. | Espacio de extracción y rutas para transporte. |
| Puesto exterior Corona | Instalación aislada. | C3-11 rescate y muerte de Rastro. | Retirada por etapas. |
| Central de Corona Negra | Anillo industrial y tres conductos sobre montaña. | Reconocimiento C3-09, aproximación y final. | Complejo asociado a preparación del misil; no segunda catástrofe paralela. |
| Instalación del misil | Silo o plataforma y objetivo de interrupción. | C3-09/13. | Geometría definitiva bloqueada hasta cerrar mecanismo del sacrificio. |

### Red planetaria propuesta

Cinco nodos regionales: costero en Costa, forestal en Cuenca, transferencia en Agujas, extractivo en Salinas y polar en Deshielo; central de regulación en Corona. Modelo modular: núcleo central, tres soportes y luces identificables. Conductos locales visibles; enlaces principalmente subterráneos/submarinos. No hacen falta cables luminosos sobre toda la esfera. No convertir todos los nodos en blancos por defecto.

### Rocas y techo

Rocas grises con vetas claras/turquesa tenues como propuesta visual. Concentrar en Agujas, Columnas y Corona; reservar espacios vacíos para maniobras. Instalar anclajes extractivos ambientales en algunas. Brillo no exige luz dinámica por roca.

Techo: efecto atmosférico tenue y aviso cercano al límite; auroras polares opcionales. Daño por rayos, viento físico o efectos de sensor no están aprobados por existir un efecto visual.

## 4. Dimensionamiento inicial

Solicitar al implementador: longitud/envergadura/altura de cada nave de prueba, velocidades mínima/típica/turbo, radio de giro, desplazamiento de evasión, frenado y cámara; dimensiones y radio de giro de transporte. En planeta esférico, altitud y orientación se calculan contra superficie local, no un eje vertical global.

Variables: **L** = longitud del caza; **E** = envergadura de la nave que atraviesa; **R** = radio de giro a velocidad de diseño. Valores siguientes son rangos iniciales, no dimensiones finales aprobadas.

| Elemento | Prototipo | Prueba obligatoria |
|---|---|---|
| Pórtico temprano | 8–12 E de abertura horizontal y vertical. | Entrada recta, salida visible, margen de cámara y corrección. |
| Paso avanzado | 4–6 E de abertura. | Opcional hasta probarlo; no combinar con amenaza nueva al inicio. |
| Paso bajo puente | 8–12 E ancho, 6–8 E altura libre. | Suelo/mar letales: probar recuperación al errar. |
| Cauce | 12–20 E ancho; curvas de radio ≥ R. | Visibilidad, altura y posibilidad de abortar aproximación. |
| Grieta de emboscada | Sin tamaño fijo antes de prueba; ramales más cuenca. | Debe permitir evasión y combate, no una trampa geométrica inevitable. |
| Anillo seguro | 20–30 E de diámetro, inicialmente. | Reconocible y alcanzable con daño; cruzarlo no exige precisión extrema. |
| Arena de combate | Derivada de R, velocidad y alcance de armas. | Giro completo, varias aproximaciones, IA y cobertura legibles. |
| Ruta de convoy | Medida con E y R del transporte. | No reutilizar huecos de caza para un transporte 5:1. |

Puentes y pórticos tempranos tienen alternativa amplia. Ningún giro ciego exige turbo sin enseñanza previa. No diseñar todos los pasajes como anillos de carrera. Señalizar funciones sin llenar la pantalla.

Tránsitos típicos propuestos: 15–35 segundos; navegación deliberada: 45–75 segundos. Medir por ruta a velocidad real, no por distancia recta. Duración de misión incluye combate, defensa y retorno; no llenar minutos con viajes. La esfera conserva tamaño hasta probar necesidades.

## 5. Matriz de construcción por misión

Las misiones y causalidad completas están en el reporte de historia. Aquí se identifica la infraestructura mínima, evitando treinta mapas independientes.

| ID | Estructuras y espacio | Reutilización / prueba clave |
|---|---|---|
| C1-01 | Lo existente. | No alterar. |
| C1-02 | Periferia ciudad, batería, arena de patrulla. | Firma visible sin forzar cámara. |
| C1-03 | Plataformas, pórticos y ruta abierta de convoy. | Transporte no pasa por huecos de caza. |
| C1-04 | Nodo, depósitos bajos y accesos de oleadas. | Respiros de reparación y radio. |
| C1-05 | Cauce, mesetas, puente y dos defensas. | [SIGILO] o cambio explícito a aproximación táctica. |
| C1-06 | Corredor de bombarderos, cuenca, grietas laterales, cierre y anillo seguro. | Intercepción primero; después emboscada y escape. |
| C1-07 | Tres baterías/puestos, esperas y destino. | Contraataque explica reocupación. |
| C2-01 | Puesto y rutas de refuerzo. | Reutilizar Agujas con nueva aproximación. |
| C2-02 | Columnas separadas y corredor de transporte. | Interceptor puede completar pasadas. |
| C2-03 | Salinas y hitos altos en tormenta. | No obstáculos invisibles letales; IA afectada coherentemente. |
| C2-04 | Complejo, blancos funcionales y plataforma técnica. | Aproximaciones aptas para nave pesada. |
| C2-05 | Depósito, extracción y punto de retirada. | Rastro sale del sector. |
| C2-06 | Corredor nocturno y reunión iluminada. | Camuflaje amenaza legible; no equiparar luz a detector sin regla. |
| C2-07 | Archivos, acceso cubierto y plataforma defendible. | Recuperación de planos mediante transporte. |
| C2-08 | Ruta polar y estación técnica. | Espacio para aprender PEM. |
| C2-09 | Nodriza individual y arena exterior. | Primer jefe enseña componentes. |
| C2-10 | Centro militar, defensas y acceso técnico. | Desactivar mando no destruye red planetaria. |
| C3-01 | Instalación residual y depósitos vacíos. | Estados del mismo lugar. |
| C3-02 | Ruta de traslado, puestos y extracción. | Contraste en hielo y prueba PEM. |
| C3-03 | Grietas nuevas, encuentro y retirada. | Diferenciar de C1-06; caída de Faro visible. |
| C3-04 | Evacuación y dos accesos sucesivos. | Distancias permiten cubrirlos con equipo reducido. |
| C3-05 | Perímetro denso y acceso débil. | Infiltración tiene utilidad real. |
| C3-06 | Transferencia y entradas de tres bandos. | Identificación de amenazas y presupuesto compartido. |
| C3-07 | Asentamiento, refugio Rivas y plataforma. | Población reconocible; ruta apta para transporte. |
| C3-08 | Sector para separar apoyos y salida protegida. | No exigir daño letal a Rastro. |
| C3-09 | Aproximación cubierta y vista del complejo. | Reconocimiento del misil antes del final. |
| C3-10 | Corredor, defensas funcionales y evacuación. | Destruir objetivo abre acceso de verdad. |
| C3-11 | Puesto aislado, plataforma y salidas por etapas. | Rescate y muerte diferenciada de otras bajas. |
| C3-12 | Reunión, baterías y corredor final. | Nodrizas se reconocen a distancia. |
| C3-13 | Tres nodrizas, arena, montaña e instalación del misil. | Final medido por fases; interior pendiente de resolución narrativa. |

## 6. Nodriza jefe y escala

Requisito: nave gigante con torretas y lanzamiento de naves; tres en el final. Referencia de tamaño del autor: «100 veces más grande». **Pendiente de confirmar:** propuesta de 100 L de longitud, no cien veces cada dimensión. No cerrar malla final ni colisiones sin esta confirmación.

Prototipar una nodriza primero. Componentes propuestos: torretas exteriores, hangares y casco/objetivo principal. Destruir o inutilizar componentes debe cambiar la amenaza. Identificar qué es atacable y cuándo. Hangares con salida libre, lanzamientos sin colisiones con nave madre, rutas que no atraviesen casco y cámara sin quedar encerrada.

Tres nodrizas presentes pueden activarse por fases. Presupuesto compartido de unas 25 naves incluyendo las tres, jugador y aliados. Componentes, proyectiles y efectos no son gratuitos aunque no cuenten como naves. Probar escala contra curvatura del planeta, techo, visibilidad y rendimiento. No garantizar tamaño y densidad simultáneamente sin medir.

## 7. Ocupación, daño y modos libres

Semilla/geografía estables. Cambios por misión completada: ocupación, actividad, luces, repintado, restos y variantes de daño. Restaurar el estado de entrada al reintentar una parte. No regenerar enemigos aleatorios dentro de una ruta escrita.

| Región | Estado inicial | Cambio principal |
|---|---|---|
| Costa | Mayormente sana. | Reparaciones y defensa. |
| Cuenca | Suministro interrumpido. | Nodo recuperado, evacuación posterior. |
| Agujas | Frente ocupado/disputado. | Ruta abierta, contraataque, pérdidas y recuperación. |
| Salinas | Extracción y mando activos. | Centro militar apagado y equipo capturado. |
| Columnas | Corredor amenazado. | Restos y batalla de nodriza. |
| Deshielo | Abandono previo. | Militarización, fractura y evacuación. |
| Corona | Complejo industrial activo. | Captura por Varela y preparación del misil. |

**Vuelo libre:** Costa inicial; regiones desbloqueadas por progreso. Propuesta de criterio: al completar una primera operación relevante en la región; asignación exacta debe fijarse con la lista definitiva. Permitir elegir punto de inicio seguro en región desbloqueada; no iniciar dentro de una estructura ni bajo amenaza inmediata.

Entornos sanos al entrar y destrucción de elementos designados. **Pendiente:** si toda destrucción se reinicia al salir; recomendación sí. No implica destruir el planeta o cualquier edificio: crear catálogo de elementos destruibles, decorativos y funcionales. Daño de Vuelo libre no altera campaña. Conquista, Supervivencia y Carrera comparten geografía pero mantienen reglas propias por definir.

## 8. Capacidades nuevas y decisiones técnicas

| Capacidad | Necesita | No asumir |
|---|---|---|
| [SIGILO] | Línea de vista, exposición/alerta, conducta de aliados y respuesta al descubrimiento. | Que una función usada por lanzamisiles ya cubra toda infiltración. |
| Tormenta [MECÁNICA NUEVA] | Visibilidad, referencias y percepción IA consistentes. | IA con visión perfecta a través del efecto. |
| Destrucción funcional [MECÁNICA NUEVA] | Estados, colisiones, consecuencia y restauración. | Puente roto que no altera nada o bloquea una misión sin salida. |
| Camuflaje/PEM [MECÁNICA NUEVA] | Qué sensores afecta, revelación, duración y recuperación. | Invisibilidad total o identificación falsa automática. |
| Retirada [MECÁNICA NUEVA] | Estado IA, ruta, salida y evento. | Que borde del jugador garantice supervivencia de Rastro. |
| Tres facciones [MECÁNICA NUEVA] | Relaciones y objetivos por entidad. | Toda nave enemiga coopera contra jugador. |
| Nodrizas [MECÁNICA NUEVA] | Componentes, torretas móviles, lanzamientos y fases. | Simple escala del modelo actual resuelve jefe. |
| Misil final [MECÁNICA NUEVA] | Objetivo, secuencia irreversible y victoria especial. | Un video o túnel todavía no aprobado. |

Vehículos terrestres, rutas navegables por tierra, armas futuras y formaciones pueden añadirse después de estimación. No convertir la existencia de un camino en una dependencia de conducción terrestre de campaña 1.

## 9. Método de construcción y criterios de aceptación

1. **Datos y medidas:** registrar dimensiones, cinemática, cámara y dispositivo objetivo. Confirmar formato de misiones; aún no recibido por narrativa.
2. **Primera porción jugable M2–M3:** ciudad en bloques, plataforma, pórtico, batería y convoy. Demostrar misión completa antes de aumentar detalle.
3. **Relieve M4–M5:** nodo, cauce y puente. Probar manejo y detección antes de vestir el escenario.
4. **Emboscada M6–M7:** intercepción, cuenca, rutas de llegada/salida y tres posiciones de corredor. Validar pérdidas y escape.
5. **Entornos especializados:** tormenta, noche y archivos; después nodriza individual.
6. **Reutilización y campaña 3:** daño/ocupación, camuflaje y coalición; final solo al cerrar sacrificio.

Cada entrega debe demostrar:

- Objetivo y ruta comprensibles en pantalla de teléfono, sin depender de leer un párrafo durante una maniobra.
- Caza, transporte y compañeros navegan sin atascos ni atravesar estructuras.
- Cámara y evasión tienen margen; error de manejo no produce una situación irrecuperable por geometría injusta.
- Inicio, final y reinicio de parte restauran entidades, recursos y eventos correctos.
- Salir del sector activa aviso y ocho segundos; volver cancela la cuenta; persistir causa derrota de parte.
- Encuentros respetan el presupuesto de naves y no dependen de enemigos inaccesibles para liberar una zona.
- Daño y ocupación se conservan/restauran según modo; destrucción no bloquea rutas necesarias sin alternativa prevista.
- Prueba en dispositivo objetivo con tiempos de carga, fluidez y fallos registrados. Meta numérica a acordar, no inventada.

**Límites de delegación:** implementación puede ajustar herramientas, módulos, dimensiones tras prueba y orden técnico. Cambios de geografía que rompan causalidad, rutas clave, supervivientes o progresión se devuelven como propuesta. Mantener lista de diferencias frente a estos reportes. La experiencia se acepta con demostraciones jugables y revisión, no por afirmar que un escenario fue construido.
