# Intro de Cebado Producciones para Delta Uno

Pedido original de la productora, conservado tal cual. **Ya está integrado** (noviembre de 2026); abajo, al final, lo que se hizo y lo que quedó pendiente de revisar.

## Archivos
- assets/intro.mp4: 1920 × 1080, horizontal 16:9, 8 segundos, H.264 + audio AAC.
- assets/poster.jpg: logo para respaldo si no se puede reproducir el video.
- preview.html: prueba independiente; abrir desde un servidor web local.

## Flujo propuesto para implementar
1. Pantalla inicial con botón «Comenzar».
2. El toque inicia la intro con sonido. Respetar el ajuste de silencio guardado del juego. Si no puede reproducirse, continuar al menú sin bloquear el acceso.
3. Botón «Saltar» siempre disponible; Escape, toque o botón de mando según los controles del juego.
4. Al terminar o saltar, detener el audio, liberar el video y mostrar el menú principal. No repetir al cambiar de modo o reiniciar partida.
5. Cargar recursos del juego en paralelo si la arquitectura lo permite. No iniciar una partida ni cargar dos veces el planeta por mostrar la intro.
6. En pantallas con otras proporciones, mantener la proporción del video y rellenar con #201e1b. Nunca recortar el logo ni estirar.

La secuencia conserva el agua y las burbujas animadas, revela PRODUCCIONES y espera dos segundos sin agua visible antes del sonido y movimiento rígido de la bombilla.

## Validación del implementador
Comprobar PC, Android, teclado, touch y mando; sonido/silencio; saltar; reproducción fallida; paso único al menú. No modificar gameplay, récords ni preferencias por integrar la intro.

El botón inicial y la frecuencia propuesta son decisiones de implementación para revisar con Santiago, no funciones ya existentes del juego.

---

# Cómo quedó integrada

## Dónde está
- `src/intro/intro.mp4`: el video. Viaja adentro del HTML en base64 (el juego es un solo archivo). El HTML pasó de 811 KB a 1,27 MB.
- `src/intro.js`: la pantalla y su lógica. Antes de reproducirlo lo pasa a Blob, así anda igual en el navegador y en el APK, y lo libera al terminar.
- `tests/suites/15-intro.js`: la prueba (`npm test -- intro`).
- El `poster.jpg` no se usó: el respaldo es saltar al menú, que es más rápido que mostrar una imagen fija.

## Qué hace
1. Al abrir el juego aparece **Comenzar** sobre fondo #201e1b. Ese toque es el que el navegador exige para dejar sonar, y de paso es el que el juego ya usaba para habilitar su propio audio.
2. Arranca el video con sonido, o mudo si el jugador tiene el sonido apagado en Ajustes. Si el navegador igual lo rechaza, se reintenta mudo antes de darse por vencido.
3. **Saltar** siempre disponible: el botón, un toque en cualquier lado, Escape, cualquier tecla o cualquier botón del mando.
4. Al terminar o saltar se detiene el video, se libera la memoria y se abre el menú. Una sola vez por sesión: volver al menú o reiniciar una partida no la repite.
5. Si el video no puede reproducirse, o tarda más de 5 segundos en arrancar, se abre el menú igual.
6. La proporción no se toca (`object-fit: contain`) y los costados se rellenan con #201e1b.
7. En teléfono vertical la intro se ve derecha, no acostada: va por fuera del escenario rotado del juego. El cartel "Girá el teléfono" espera a que termine.
8. Queda anotado en los datos de uso (evento `intro`): si se saltó, si falló y cuántos segundos se vieron.

## Decisiones para revisar con Santiago
- **El botón "Comenzar"**: es un toque más antes de entrar. Sin él no hay forma de que suene.
- **Frecuencia**: una vez por sesión. En Ajustes → Intro de la productora se puede apagar del todo.
- **Validación pendiente**: probada en PC y en teléfono simulado, con teclado y toque. Falta probarla en un Android de verdad y con un mando físico.
