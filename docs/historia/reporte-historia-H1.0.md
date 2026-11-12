# DELTA UNO — REPORTE DE HISTORIA
## Entrega para implementación · H1.0

Documento complementario de **Delta_Uno_Reporte_Mundo_Implementacion.md**. Ambos constituyen la entrega actual para prototipar por partes. Reemplazan las propuestas incompatibles del reporte 0.3, sin afirmar que sus funcionalidades estén implementadas. Se basan en las decisiones de la conversación, no en una auditoría del proyecto.

## 1. Alcance y autoridad

**Fijado:** tres campañas de 7, 10 y 13 misiones; misión 1 existente intacta; convivencia antes de la emboscada; tres bandos; Aguja como única superviviente del núcleo de pilotos; nodrizas gigantes; sacrificio de Delta Uno para detener un misil de destrucción masiva. El mapa se diseña para las operaciones, no al revés.

**Base de diseño:** nombres, títulos, reparto preciso de tareas, duraciones y asignación de algunas escenas de las tablas. Son especificaciones para prototipo y revisión, no balance probado. Faro en C3-03 y Chispa en C3-10 son la asignación narrativa de trabajo para las dos bajas solicitadas. Rastro muere posteriormente; se propone C3-11.

**Pendiente:** ejecución exacta del sacrificio, condiciones del camuflaje/PEM, controles de formaciones, escala final de nodrizas, efectos de destrucción y reglas de supervivencia de compañeros esenciales. No resolver estos puntos de forma invisible dentro del código.

Esta entrega no contiene diálogos definitivos, guion de cinemáticas, arte, coordenadas ni fichas ejecutables. No se recibió `formato.md`; no se promete compatibilidad de carga. La presentación narrativa se diseña en la siguiente etapa. Mientras no se acuerde otra cosa, se conserva la base original sin videos, con instrucciones, radio y resumen. Incorporar cinemáticas sería una decisión posterior, no una dependencia tácita.

## 2. Experiencia buscada

El jugador aprende con un equipo competente, reconoce ciudades y compañeros, consigue pequeñas victorias y después pierde buena parte del escuadrón. La segunda campaña transmite recuperación de iniciativa y progreso técnico. La tercera demuestra que ganar territorio no resolvió el conflicto y obliga a cooperar con antiguos adversarios.

El vínculo se construye jugando: compañeros que cubren, piden respaldo, se arriesgan y tienen hábitos reconocibles. Alternar presión, tránsito breve y alivio. No sustituir variedad por oleadas cada vez mayores ni usar una emboscada sorpresa en todas las misiones.

## 3. Mundo, facciones y antagonistas

**Nácar** contiene mineral gravitacional en rocas flotantes. Su red de estabilización sostiene la actividad industrial y comunidades dependientes de esa infraestructura. La guerra enfrenta control de recursos, autonomía y supervivencia cotidiana.

| Facción | Interés | Conflicto interno o responsabilidad |
|---|---|---|
| Guardia de Nácar | Defender población y autonomía. | Prioriza regiones y operaciones; deja comunidades desatendidas. No todos confían en ella. |
| Directorio de Continuidad | Recuperar extracción, astilleros y mando de la red. | Justifica ocupación y desplazamientos como garantía de estabilidad. |
| Liga de los Desligados | Que las regiones controlen sus recursos. | Varela concentra poder; células disidentes se oponen a sus métodos y al misil. |

**Darío Voss** dirige al Directorio. Antiguo responsable de seguridad de la red, justificó cortes que salvaron el núcleo industrial y perjudicaron periferias. Su indicativo sigue pendiente: «Prefecto» fue descartado y «Bastión» solo fue sugerido.

**Mara Varela / Veta** ganó legitimidad organizando reparaciones y ayuda donde nadie respondía. Su facción captura equipo durante campaña 2 y se impone militarmente en campaña 3. Su decisión de preparar el misil vuelve necesaria la alianza entre Guardia y disidentes. Motivación final específica del lanzamiento —objetivo militar, imposición por terror o destrucción deliberada— debe cerrarse antes del guion final; no escribirla como aprobada.

El **centro militar del Directorio en Salinas** es distinto de la **central montañosa de Corona Negra**. La primera cae en C2-10. La segunda pasa a manos de Varela y alberga/alimenta el complejo del misil. El final vigente detiene ese misil: no hay una segunda catástrofe independiente por sobrecarga que compita con el desenlace.

## 4. Personajes y bajas

| Personaje | Identidad y relación | Arco / destino |
|---|---|---|
| Jugador | Sin rostro, voz o biografía obligatorios. Indicativo inicial propuesto: Delta Diez. | Hereda Delta Uno tras la emboscada. Se sacrifica en C3-13. |
| Vera Soria / Mando | Comandante precisa que asume responsabilidad por sus decisiones. | Sostiene operaciones y repliegues; destino personal no fijado. |
| Julián Ferreyra | Líder e instructor, Delta Uno original. | Muere frente al jugador en C1-06. |
| Inés Acosta / Aguja | Directa, precisa, exigente. La confianza se gana con acciones. | Única superviviente del núcleo de pilotos. Puede continuar en otro juego. |
| Tomás Leiva / Chispa | Humor seco, habla para lidiar con el miedo. | Aprende a pedir ayuda; muerte de trabajo en C3-10. |
| Bruno Sosa / Faro | Paciente; cuida al último y quiere formar pilotos. | Ausencia que altera la dinámica; muerte de trabajo al comienzo de C3-03. |
| Nicolás Arce / Rastro | Compañero competente con maniobra propia. Derribado y recuperado por los Desligados. | Memoria fragmentada, manipulación y resentimiento. Rival recurrente; rompe con Varela y muere, propuesto en C3-11. |
| Elena Rivas / Sutura | Médica de una célula de los Desligados que recuperó a Rastro. | Revela la manipulación y solicita ayuda; destino no fijado. |
| Cuatro pilotos iniciales adicionales | Identidades pendientes; necesitan hábitos e intervenciones antes de la emboscada. | Mueren en C1-06. No introducirlos solo segundos antes de perderlos. |

**Contabilidad C1-06:** diez naves de formación = jugador + nueve aliados. Seis aliados derribados: cinco muertes reales —Ferreyra y otros cuatro— y Rastro presuntamente muerto. Quedan Aguja, Chispa y Faro junto al jugador. No presentar seis muertes confirmadas.

Rastro hace su firma en el anillo 2 de C1-01, ya implementada según el autor; se conserva. La repite en combate temprano y después como rival. La maniobra despierta sospechas; no identifica por sí sola. No imponer una maniobra distinta sin revisar la existente.

Su recuperación no es una cura instantánea por escuchar una frase. Conserva capacidades de vuelo y recuerdos incompletos; aislamiento e información manipulada sostienen el relato del abandono. Pruebas, contradicciones y decisiones propias producen la ruptura. La médica no borra las muertes que causó. Evitar tres sacrificios idénticos de «me quedo cubriendo»: las situaciones finales de Faro, Chispa y Rastro aún requieren desarrollo diferenciado.

## 5. Progresión de tecnología y recompensas

Objetivo final: **doce naves pilotables**, cuatro clases por tres bandos. Todas pueden configurar armas dentro de compatibilidades por definir. Cuatro clases: caza versátil, interceptor rápido y frágil, ataque pesado parecido a bombardero, infiltración con camuflaje y alto daño pero aún más delicada que el interceptor.

| Elemento | Presentación | Uso / recompensa propuestos |
|---|---|---|
| Caza Guardia | C1-01 | Inicial. |
| Interceptor enemigo | C1-04 | Interceptor Guardia en C2-02; desbloqueo al completar. |
| Bombardero enemigo | C1-06 | Nave de ataque Guardia en C2-04; desbloqueo al completar. |
| Camuflaje enemigo | Batalla nocturna C2-06 | Planos en C2-07; prototipo Guardia en C3-05; desbloqueo al completar. |
| PEM | Equipo aliado especializado en C2-08 | Primer uso por jugador en C3-02; desbloqueo posterior a la enseñanza. |
| Ocho variantes rivales | Como adversarios gradualmente | Seleccionables al terminar la campaña, cuando estén construidas. No adelantarlas por capturar planos. |
| Pinturas regionales | Aliados locales las muestran primero | Ganadas por operaciones importantes de esa relación; sin ventajas de combate. Misiones exactas pendientes. |

Secuencia causal del camuflaje: sufrirlo de noche → investigar origen → recuperar planos → llevar especialistas a salvo → desarrollo durante varias misiones → usarlo contra una defensa inaccesible al asalto convencional. Los planos no engañan automáticamente a sensores enemigos: camuflaje e identificación falsa son capacidades distintas.

**[MECÁNICA NUEVA]** Clases pilotables, equipamiento, camuflaje, PEM y personalización. Formaciones tácticas propuestas: cobertura, escolta, concentración sobre blanco y reagrupamiento. Deben evaluarse con interfaz de teléfono; no están aprobados botones ni efectos. Disponibilidad según distancia y compañeros operativos, con explicación de bloqueos. La campaña debe prototiparse con IA autónoma mientras esto se decide.

## 6. Duración y partes

Duraciones = intento exitoso sin pantallas previas, configuración ni reintentos. M1 conserva su duración real. Las demás son metas de prueba, no temporizadores obligatorios. Suma del plan: 4 h 25 min a 5 h 23 min, más M1; no alargar vuelos para alcanzar el número.

Partes típicas de dos a cuatro minutos con objetivos legibles. Reiniciar la parte al caer. Recursos al inicio definidos por continuidad, no por recarga universal: misiles hasta cuatro con regeneración actual de uno cada veinte segundos; cañón inagotable. No introducir munición de cañón sin [MECÁNICA NUEVA]. Un estado dañado debe probarse para asegurar que la parte sigue siendo superable.

Equipo: **libre** dentro de desbloqueos y compatibilidades; **asignado** cuando la historia enseña o requiere una capacidad; **restringido** con alternativas válidas. Nunca permitir una configuración incapaz de cumplir la misión sin informar y resolverlo antes de salir.

## 7. Recorrido de campaña 1

| ID / misión | Sector | Minutos | Partes y consecuencia | Equipo |
|---|---|---:|---|---|
| C1-01 Entrenamiento | Costa Clara | Existente | Conservar implementación y firma en anillo 2. | Existente. |
| C1-02 Primera salida | Puerto Clara | 5–7 | Reconocer acceso → patrulla → batería. Abre suministros; Rastro demuestra competencia. | Caza asignado. |
| C1-03 Carga importante | Puerto–Cuenca | 7–9 | Reunión → despejar ruta → proteger llegada. Carga sostiene el nodo. | Caza, armas elegibles. |
| C1-04 Mantener la posición | Nodo Cuenca | 8–10 | Interceptar exploradores → oleadas → cubrir transporte. Aparecen interceptores; relación con aliados locales. | Libre. |
| C1-05 Por debajo | Cauces de Las Agujas | 8–10 | Aproximación baja [SIGILO] → batería → abrir paso. Habilita refuerzo de Alto del Paso. | Asignado/restringido. |
| C1-06 Emboscada | Las Agujas | 6–8 | Interceptar tres bombarderos → victoria aparente → emboscada → resistir dos minutos → escapar al anillo seguro. | Salida preparada; continuidad. |
| C1-07 Los que quedan | Costa–Cuenca–Alto del Paso | 10–12 | Escolta → tres posiciones en secuencia → llegada. Recuperar corredor retomado durante contraataque. | Caza, armas elegibles. |

### Condiciones dramáticas de C1-06

Los tres bombarderos amenazan realmente Alto del Paso y atraen a Delta fuera de la ruta segura. Son destruidos antes de la emboscada. El Directorio acepta perderlos para eliminar al escuadrón; Ferreyra toma una decisión razonable con información incompleta.

El reloj de supervivencia empieza con el ataque: las seis caídas de los primeros cuarenta segundos se incluyen en sus dos minutos. Tras ese intervalo aparece una oportunidad de salida. No hay obligación de aniquilar las fuerzas restantes. El anillo grande marca reunión bajo cobertura aliada; su cruce completa la retirada con los supervivientes. No es invulnerabilidad mágica. Preparar rutas autónomas para el trío y resolver qué condición confirma su salida.

## 8. Recorrido de campaña 2

| ID / misión | Sector | Minutos | Partes y consecuencia | Equipo |
|---|---|---:|---|---|
| C2-01 Recuperar el aire | Las Agujas | 8–10 | Patrulla → recuperar puesto → sostenerlo. Recuperar iniciativa. | Libre. |
| C2-02 Entre columnas | Mar de las Columnas | 8–10 | Adaptación al interceptor → escolta → interceptación. | Interceptor asignado. |
| C2-03 Sin horizonte | Salinas | 9–11 | Tormenta → localizar convoy → sacarlo. Pistas del saqueo organizado. | Restringido. |
| C2-04 Golpe pesado | Complejo Salinas | 9–11 | Romper defensa → estructuras → técnicos. Enseña ataque pesado. | Ataque asignado. |
| C2-05 El otro saqueador | Depósitos Deshielo | 8–10 | Depósito → impedir extracción → rival de la firma escapa. | Libre. |
| C2-06 Lo que no vemos | Corredor nocturno | 9–11 | Escolta → infiltradores enemigos → retirada hacia reunión iluminada. | Libre, sin camuflaje propio. |
| C2-07 Los planos | Centro de archivos | 10–12 | [SIGILO] → abrir acceso → cubrir recuperación → escapar. Obtiene diseños. | Restringido. |
| C2-08 Romper el velo | Acceso polar | 9–11 | Escoltar equipo PEM → defenderlo → estación segura. Permite desarrollo propio. | Libre compatible; PEM en aliado. |
| C2-09 La fortaleza vuela | Mar de las Columnas | 11–13 | Contener lanzamientos → torretas/hangares → derribar nodriza. Abre ataque al mando. | Libre compatible. |
| C2-10 Silencio de mando | Centro militar Salinas | 11–13 | Abrir acceso → técnicos → desactivar mando → reunión. Victoria y vacío de poder. | Elección previa; continuidad. |

Los tres compañeros sobreviven esta campaña. Recuperar archivos se representa mediante transporte y técnicos fuera del control directo del jugador; no exige abordar a pie. La iluminación nocturna orienta, pero no revela automáticamente camuflaje sin una regla implementada.

## 9. Recorrido de campaña 3

| ID / misión | Sector | Minutos | Partes y consecuencia | Equipo |
|---|---|---:|---|---|
| C3-01 Últimas órdenes | Salinas | 8–10 | Célula residual → asegurar instalación → depósitos vacíos. | Libre. |
| C3-02 Huellas en el hielo | Deshielo | 9–11 | Seguir traslado → PEM contra camuflaje → impedir extracción parcial. | Configuración PEM preparada. |
| C3-03 La voz conocida | Grietas Deshielo | 9–11 | Faro cae al comienzo del encuentro → Rastro se revela → cubrir repliegue → anillo de salida. | Elección previa; continuidad. |
| C3-04 Aprender a faltar | Cuenca Verde | 9–11 | Evacuación → dos accesos sucesivos → sacar transporte. Se siente la ausencia. | Libre. |
| C3-05 Su propia sombra | Complejo extractivo | 10–12 | Prototipo propio → [SIGILO] → acceso débil → ataque y salida. Resultado de los planos. | Infiltración asignada. |
| C3-06 Tres fuegos | Mar de las Columnas | 10–12 | Combate entre facciones → recuperar transporte → escoltarlo. Información de disidentes. | Libre. |
| C3-07 La médica | Asentamientos Deshielo | 9–11 | Contacto → defender transporte → evacuar referentes. Revelación de Rivas. | Libre. |
| C3-08 Lo que recordás | Cauces Deshielo | 10–12 | Separar apoyos → contener a Rastro → pruebas → proteger salida. Ruptura con Varela. | Preparado para contención. |
| C3-09 La montaña encendida | Corona Negra | 10–12 | Noche y [SIGILO] → reconocer complejo → escapar con datos del misil. | Restringido. |
| C3-10 El precio del paso | Corredor industrial | 11–13 | Defensas → evacuar técnicos → abrir acceso. Muere Chispa. | Elección previa; continuidad. |
| C3-11 Volver por alguien | Puesto exterior Corona | 10–12 | Llegada → rescate → retirada. Rastro coopera y muere. | Libre compatible. |
| C3-12 Antes del amanecer | Perímetro Corona | 10–12 | Coalición → baterías → preparar ruta. Tres nodrizas protegen lanzamiento. | Libre compatible. |
| C3-13 Delta Uno | Complejo final | 14–16 | Frenar tres nodrizas → alcanzar misil → intento de desactivación → acción irreversible. Delta muere; Aguja sale. | Elección inicial; continuidad. |

La petición de ayuda de los disidentes nace del peligro para sus comunidades y el planeta. No implica perdón general ni unificación política. Rastro no se vuelve inocente por haber sido manipulado. Aguja tiene razones para desconfiar y aun así puede cooperar.

## 10. Final: requisitos antes de construcción definitiva

Las nodrizas defienden el lanzamiento. Frenarlas significa impedir su intervención; decidir si exige destruir las tres o neutralizar componentes. Presencia de tres no obliga a lanzar enjambres simultáneos ni a triplicar el presupuesto.

Luego se detiene el misil en el complejo montañoso. Antes de producir el interior y la escena final, cerrar: estado del misil, acción exacta del jugador, razón verificable por la que no puede hacerse a distancia, tiempo de escape insuficiente, salida de Aguja y distinción entre victoria por sacrificio y derrota normal.

No se autoriza una explosión inesperada después de ganar ni una colisión arbitraria obligatoria. El último tramo debe comunicar la consecuencia y conservar participación del jugador. El sacrificio es fijo, no un final alternativo decidido por habilidad. Su presentación concreta se diseña después.

## 11. Contrato con implementación

- Cada parte declara objetivo, estado inicial, aliados, amenazas, eventos, éxito, derrota y restauración al reintentar.
- Sectores con borde visible: ocho segundos para volver al salir; de lo contrario pierde y repite la parte.
- Hasta unas 25 naves activas incluyendo jugador, aliados, transportes, drones y nodrizas. Turretas, proyectiles y colisiones requieren presupuestos propios medidos.
- Rastro necesita retirada auténtica al borde de sector. Resolver exceso de daño y misiles en vuelo antes de usar escapes obligatorios; no ocultar invulnerabilidad sin diseño aprobado.
- Sigilo se marca [SIGILO]. Existe cálculo de oclusión usado por lanzamisiles, según desarrollo, pero eso no equivale a un sistema de infiltración completo.
- Regla recomendada, pendiente de confirmación: compañero esencial muerto fuera de su escena = derrota de parte; no aplicar a bajas guionadas. Evitar prometer que seis bajas inevitables pueden prevenirse.
- Límites originales de texto se conservan como compatibilidad provisional: radio de 90 caracteres, cuatro segundos entre mensajes, previa de hasta 80 palabras. No se escriben aún los textos finales.

**[MECÁNICAS NUEVAS]** Convoy por puntos/paradas si falta; retirada; eventos de bajas; destrucción funcional; clima con percepción coherente; camuflaje/PEM; tres facciones hostiles; contención no letal de Rastro; personalización; nodrizas por componentes; final del misil. Verificar existencia real y estimar cada capacidad, no marcarlas como terminadas por aparecer aquí.

## 12. Construcción por entregas y prueba de experiencia

| Entrega | Resultado demostrable | Condición de aceptación |
|---|---|---|
| A: M2–M3 | Combate temprano, firma visible y convoy. | Entender prioridades, reconocer ciudad/compañeros, convoy navega sin atascos y reinicios funcionan. |
| B: M4–M5 | Oleadas y aproximación de vuelo bajo. | Dificultad gradual, descanso útil, ruta legible; no prometer sigilo inexistente. |
| C: M6–M7 | Señuelo, pérdidas, escape y operación reducida. | Entender por qué entramos, ver caídas relevantes y escapar sin eliminar todo. |
| D: progresión técnica | Interceptor, ataque, noche, planos y PEM. | Cada incorporación tiene preparación, debilidad y consecuencia; camuflaje propio no se entrega antes de tiempo. |
| E: jefes y tercera campaña | Nodriza individual y operaciones de coalición. | Jefe legible y combate entre facciones coherente dentro del presupuesto. |
| F: final | Tres nodrizas y secuencia del misil. | Causa del sacrificio comprensible y viable; Aguja sale; victoria no se confunde con derrota. |

Cada entrega incluye recorrido grabado o demostración, problemas observados, métricas en teléfono objetivo y revisión narrativa antes de aumentar detalle. No garantizar sensaciones mediante texto: comprobarlas jugando y corregir. No fijar FPS sin acordar dispositivo/meta.

Cambios que alteren causalidad, bajas, desbloqueos, duración de forma importante o motivo del sacrificio deben presentarse como cambios de diseño. El implementador decide herramientas y orden técnico, preservando esos compromisos.
