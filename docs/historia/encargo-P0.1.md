# DELTA UNO — ENCARGO AL IMPLEMENTADOR
## Borrador jugable completo y construcción inicial del mapa · P0.1

### Objetivo autorizado

Construir un boceto jugable de las treinta misiones y del mundo que las conecta. Queremos recorrer las tres campañas, probar las situaciones y decidir cambios a partir del juego. Se reemplaza la recomendación de limitar la producción inicial a las misiones 1–3: estas siguen siendo útiles para probar sistemas, pero la meta de esta etapa es la campaña completa en prototipo.

Empezar ya el mapa en geometría simple, usando el plano maestro como propuesta espacial de trabajo. No esperar diálogos, cinemáticas ni arte final. No modificar los hitos narrativos para acomodarlos a una limitación técnica sin dejar constancia y proponer una solución.

Esta es una orden de trabajo para quien implementa, no una afirmación de que se hicieron cambios en el repositorio. La arquitectura, el código y las cantidades concretas del primer balance los define el implementador, con sus supuestos registrados.

### Fuentes y prioridad

1. Esta entrega y decisiones posteriores del autor.
2. `Delta_Uno_Plano_Maestro.md`, su JSON y las dos imágenes: ubicación propuesta e itinerarios de treinta misiones.
3. Reportes de historia H1.0 y mundo M1.0: causalidad, reparto, progresión y necesidades de construcción.
4. `docs/historia/formato.md`: capacidades reales del formato, que habrá que extender para las operaciones nuevas.

El mapa existente es una prueba de estructuras. Sus ubicaciones no son restricciones. La misión 1 también puede mejorarse; conservar su función de enseñanza y la firma de Rastro, comparar antes/después y registrar cambios. Los archivos históricos que piden dejarla intacta quedan superados en ese punto.

## 1. Resultado de esta etapa

- Planeta con siete regiones identificables y los 37 hitos del plano ubicados en bloques o marcadores, con IDs estables.
- Conexiones terrestres y aéreas trazadas; pasos, cauces y puentes funcionales donde las misiones los necesitan.
- Las treinta misiones seleccionables desde un menú de pruebas, ordenadas en tres campañas de 7/10/13.
- Cada misión tiene objetivo visible, partes, condición de éxito/derrota, inicio definido y reinicio de la parte.
- Recorrido de campaña, cambios básicos de ocupación y progresión tecnológica de prueba.
- Registro que distingue operaciones completas de las que todavía contienen simulaciones o dependencias.

El boceto completo es la meta. Se entrega por incrementos, sin pulir una región durante semanas mientras las demás todavía no se pueden recorrer. No declarar una misión validada solo porque existe en el menú.

## 2. Empezar el mapa

### Primera pasada: mundo completo en bloques

Usar el radio ampliado de referencia del plano, 21.900 m, verificándolo contra la rama actual. No volver al tamaño inicial por un reporte antiguo. La carta solar del JSON requiere una rotación rígida al marco del motor; no copiar coordenadas como si fueran las anclas viejas. Identificar las nuevas posiciones con los mismos IDs del plano.

Crear las siete regiones, con relieve y transiciones provisionales. Colocar los 37 hitos como volúmenes de escala aproximada o marcadores; no hacen falta 37 modelos terminados. Preservar su función: ciudad, base, depósito, puente, nodo, arena o reunión.

Representar agua, tierra y vías para que las conexiones tengan sentido. Las carreteras deben seguir pendientes y salvar barrancos; las líneas del plano son conexiones de diseño, no caminos rectos a imponer sobre el relieve. No llenar de obstáculos aleatorios los corredores reservados.

### Segunda pasada: recorridos funcionales

Probar primero el eje Costa–Cuenca–Agujas con caza, cámara y un transporte provisional. Después extender Mar/Salinas, Deshielo y Corona. Medir y corregir posiciones, curvas y espacios antes de vestirlos.

El plano propone aproximadamente 6 km mínimos para C1-03 y 10 km para C1-07. Son arcos entre hitos, no carreteras ni trayectorias finales. La velocidad de transporte de 45 m/s es un supuesto: definirla y medirla. Si la duración no funciona, presentar el ajuste de ruta/posición o duración; no introducir teletransporte silencioso dentro de una misión.

Una operación puede empezar cerca de su primer objetivo. No es necesario volar desde Base Delta en todas las salidas. El traslado entre misiones puede quedar fuera del juego y señalarse con texto provisional.

### Tercera pasada: áreas especiales

Reservar espacio de tormenta, aproximaciones de sigilo, combate nocturno, primera nodriza y arena final. En el complejo del misil usar un volumen exterior y un objetivo provisional: el interior definitivo depende de cerrar cómo se ejecuta el sacrificio.

## 3. Sistemas para que se pueda jugar

Priorizar capacidades compartidas que desbloquean muchas misiones:

1. Partes, eventos, objetivos encadenados, restauración y selección de misión/parte para pruebas.
2. Aliados que combaten y convoy por puntos con espera y continuación.
3. Oleadas, objetivos estructurales, escape a un punto y salidas de IA.
4. Despliegues fijados por misión; ocupación y variantes simples por etapa.
5. Reglas mínimas de sigilo, tormenta, camuflaje y PEM para sus pruebas específicas.
6. Jefe por componentes y final provisional del misil.

No condicionar el boceto a tener doce modelos de nave, arsenal completo, economía, multijugador, tráfico terrestre o interfaz definitiva. Clases con parámetros distintos y formas simples alcanzan para probar roles. Preservar la progresión: enemigo camuflado de noche → planos → especialistas → prototipo propio varias misiones después.

Las formaciones tácticas siguen en evaluación. El primer boceto puede usar aliados autónomos. Si se ensaya un control de órdenes, hacerlo como variante de prueba, sin volverlo requisito irreversible del resto del juego.

## 4. Qué puede ser provisional y qué debe funcionar

| Área | Provisional permitido | Necesario para validar la experiencia |
|---|---|---|
| Arte | Bloques, pintura plana, modelos compartidos y rótulos. | Escala, colisión, visibilidad y navegación coherentes. |
| Historia | Textos funcionales breves; tarjetas de contexto. | Objetivo y consecuencia comprensibles; causalidad sin contradicciones. |
| Convoy | Modelo simple. | Ruta, paradas, amenazas, daño y reinicio reales. |
| Naves | Mallas simples y catálogo reducido de clases. | Diferencias relevantes de velocidad, resistencia y armamento. |
| Sigilo | Detector sencillo con estado visible. | El terreno oculta de verdad si la misión lo promete; la IA no alerta injustamente al grupo. |
| Tormenta | Efecto visual económico. | Referencias navegables y percepción enemiga acordes. Solo una pantalla opaca no valida la misión. |
| Camuflaje/PEM | Material y efectos simples. | Activación, revelación, vulnerabilidad y efecto PEM comprensibles. |
| Nodriza | Casco básico y pocos componentes. | Torretas/hangares/objetivos con consecuencias; aproximaciones y lanzamientos sin colisiones erróneas. |
| Sacrificio | Evento y objetivo exterior de prueba. | Separar victoria especial de muerte normal; la puesta en escena final queda pendiente. |

Si una capacidad aún no existe, se puede dejar una simulación etiquetada para recorrer la campaña. Esa simulación valida ubicación/ritmo aproximado, no la experiencia de la mecánica faltante. No sustituir un escape por “destruir todo” ni un rescate por una oleada sin declararlo.

## 5. Reglas de prueba

- Borde visible; salir permite ocho segundos para volver o se repite la parte. Los itinerarios largos requieren un sector fijo suficiente o una extensión explícita del sistema, no un borde que persiga al jugador.
- Cada parte define `inicio` o una política explícita de continuidad y restauración. No heredar accidentalmente un reinicio lleno cuando se quería daño o escasez. Misiles: máximo cuatro y regeneración actual; cañón sin límite de munición.
- Colisión con estructura: rebote y daño. Suelo y mar: caída.
- Mantener unas 25 naves activas mientras no se apruebe otra capacidad medida; contar jugador, compañeros, transportes, drones y nodrizas. Presupuestar también torretas, proyectiles y efectos.
- Texto temporal compatible con 90 caracteres por radio y cuatro segundos de separación; previa de hasta 80 palabras. No redactar ahora el guion definitivo.
- En modo de prueba se permite desbloquear todos los puntos de arranque; la progresión normal de Vuelo libre sigue empezando en Costa y desbloqueando regiones por historia.
- Separar datos de prueba de progreso normal. Iniciar directamente una misión tardía debe crear su estado de mundo, compañeros y equipo sin obligar a completar todo antes.

## 6. Hitos narrativos que no deben perderse

**C1-06:** tres bombarderos son señuelo real contra Alto del Paso; se destruyen primero. Después llega la emboscada. Seis aliados caen en cuarenta segundos, dentro de los dos minutos de supervivencia. Cinco muertos y Rastro desaparecido. El cierre es escapar a la reunión con Aguja, Chispa y Faro, no exterminar al enemigo.

**Campaña 2:** el trío sigue vivo. El Directorio cae al desactivar su centro militar, distinto de la central montañosa. Los Desligados aprovechan la guerra y capturan material. No entregar las variantes enemigas seleccionables antes del final por conveniencia de pruebas fuera del menú de desarrollo.

**Campaña 3:** Faro cae al comienzo de M3; Chispa en M10; muerte de Rastro propuesta en M11 tras su ruptura. Disidentes y médica piden ayuda. Tres nodrizas protegen el misil. Delta detiene el arma y muere; Aguja sobrevive. Mecanismo y presentación exactos del sacrificio aún por cerrar.

## 7. Decisiones que admiten trabajo provisional

No bloquear todo el mapa por estas dudas. Implementar valores configurables, registrar supuesto y no tratarlo como aprobación definitiva:

- Velocidad/dimensiones del transporte y tamaños de pasos.
- Escala de la nodriza: usar una referencia de prueba; 100 veces la longitud sigue siendo interpretación pendiente de confirmar.
- Compañero esencial caído antes de escena: regla propuesta de derrota/reinicio. Si se usa provisionalmente, indicarlo; las bajas guionadas no disparan esa derrota.
- Escape de Rastro: definir qué ocurre con daño y misiles en tránsito. Si aún se protege por guion, etiquetar limitación para que no se confunda con balance validado.
- Camuflaje, sensores y PEM: elegir reglas mínimas explícitas para pruebas y someterlas a revisión.
- Vuelo libre destructible: prototipo con catálogo pequeño; persistencia o reinicio de daños sigue pendiente.
- Última acción contra misil: usar un marcador/objetivo que permita recorrer el flujo; no modelar túneles definitivos antes de decidirlo.

## 8. Entregas incrementales dentro del boceto completo

| Entrega | Contenido | Qué podremos comprobar |
|---|---|---|
| P1 | Mundo completo en bloques, 37 hitos y acceso de pruebas a regiones. | Distribución, escala, luz, biomas y conexiones. |
| P2 | Campaña 1 completa; convoy y aliados mínimos. | Aprendizaje, convivencia, señuelo, pérdidas y retirada. |
| P3 | Campaña 2 completa en borrador. | Variedad, cadena tecnológica, tormenta y primer jefe. |
| P4 | Campaña 3 completa en borrador. | Retornos a lugares, coalición, pérdidas y recorrido final. |
| P5 | Pasada completa de las tres campañas y revisión transversal. | Duraciones, repetición, huecos narrativos, dificultad y mapa. |

No esperar a cerrar P4 para mostrar problemas de P1/P2. Mantener una versión jugable en cada incremento. No optimizar decorado ni pulir diálogos mientras falten recorridos principales.

## 9. Registro y criterio de aceptación

Cada misión debe aparecer como **recorrido provisional**, **jugable con sustituciones**, **jugable con mecánicas previstas** o **validada en prueba**. Registrar qué partes faltan y qué conclusiones pueden sacarse.

Por misión registrar: versión/commit, estado, partes, tiempo objetivo, tiempo real sin reinicios, distancia volada, fallos/reintentos, bajas relevantes, límites de sector, problemas de cámara/IA y máximo de naves. El tiempo narrativo buscado no se impone con esperas vacías.

Por entrega mostrar recorrido jugable o grabación, cambios frente al plano y limitaciones. Medir rendimiento en teléfono objetivo; pruebas en computadora no garantizan ese resultado. No inventar una meta de FPS/dispositivo sin acordarla.

**Aceptación del boceto completo:** poder iniciar y terminar las treinta misiones, repetir partes, recorrer sus lugares y entender el propósito de cada operación; conocer de forma visible qué mecánicas son reales y cuáles siguen simuladas. Esto no equivale a aprobar arte, balance, diálogos ni final definitivo.

**Después de jugar:** revisar cambios de historia y mapa, cortar tareas repetitivas, agregar lo que falta, cerrar presentación narrativa y producir fichas/diálogos definitivos sobre la experiencia comprobada.

## Anexo — lista de montaje de las treinta misiones

Los itinerarios son la propuesta PM-0.1; el implementador registra cualquier ajuste necesario por prueba. No son rutas finales de IA.

| ID | Misión | Hitos en orden | Duración objetivo |
|---|---|---|---:|
| C1-01 | Entrenamiento | CO02 | Revisar |
| C1-02 | Primera salida | CO03 → CO04 | 5–7 min |
| C1-03 | Carga importante | CO03 → CO06 → CO04 → CU01 | 7–9 min |
| C1-04 | Mantener la posición | CU01 → CU02 → CU03 | 8–10 min |
| C1-05 | Por debajo | CU03 → AG01 → AG02 | 8–10 min |
| C1-06 | Emboscada | CU03 → AG04 → AG05 | 6–8 min |
| C1-07 | Los que quedan | CO04 → CU03 → AG02 → AG03 | 10–12 min |
| C2-01 | Recuperar el aire | AG02 → AG03 → AG06 | 8–10 min |
| C2-02 | Entre columnas | MA01 → MA02 | 8–10 min |
| C2-03 | Sin horizonte | SA01 → SA05 | 9–11 min |
| C2-04 | Golpe pesado | SA01 → SA03 | 9–11 min |
| C2-05 | El otro saqueador | DE01 | 8–10 min |
| C2-06 | Lo que no vemos | DE02 → DE08 | 9–11 min |
| C2-07 | Los planos | DE02 → DE03 | 10–12 min |
| C2-08 | Romper el velo | DE03 → DE04 | 9–11 min |
| C2-09 | La fortaleza vuela | MA02 → MA03 | 11–13 min |
| C2-10 | Silencio de mando | SA01 → SA02 | 11–13 min |
| C3-01 | Últimas órdenes | SA02 → SA04 | 8–10 min |
| C3-02 | Huellas en el hielo | DE01 → DE04 | 9–11 min |
| C3-03 | La voz conocida | DE05 → DE08 | 9–11 min |
| C3-04 | Aprender a faltar | CU02 → CU01 → CU03 | 9–11 min |
| C3-05 | Su propia sombra | SA03 → SA04 | 10–12 min |
| C3-06 | Tres fuegos | MA01 → MA02 | 10–12 min |
| C3-07 | La médica | DE04 → DE06 | 9–11 min |
| C3-08 | Lo que recordás | DE06 → DE07 | 10–12 min |
| C3-09 | La montaña encendida | CN01 → CN03 → CN06 | 10–12 min |
| C3-10 | El precio del paso | SA04 → CN01 | 11–13 min |
| C3-11 | Volver por alguien | CN06 → CN02 → CN06 | 10–12 min |
| C3-12 | Antes del amanecer | CN06 → CN01 → CN05 | 10–12 min |
| C3-13 | Delta Uno | CN05 → CN03 → CN04 | 14–16 min |
