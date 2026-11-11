# Instrucciones para asistentes de código (Copilot, Claude, GPT)

- **El juego:** Delta Uno, de naves en 3D para teléfono, con three.js 0.128 y Vite. Todo el juego está en `src/main.js`, organizado en secciones que empiezan con `/* ---------- Nombre ---------- */`.
- **Textos:** todo lo que ve el jugador va en español rioplatense con voseo ("Tocá", "Deslizá"). Los comentarios del código, en español.
- **Versión de three.js:** no la actualices sin avisar. Las versiones nuevas cambian nombres y comportamientos, y el juego depende de la 0.128.
- **Archivo final:** el resultado tiene que seguir saliendo en un solo HTML (`npm run build`). No agregues archivos que se descarguen aparte sin hablarlo antes, porque afectan el gasto de datos y el APK.
- **Valores para ajustar:** viven en constantes al principio de cada sección (`TUNE`, `AIM`, `ZONE_KIND`, `ENEMY_DEF`, `DIFF`). Si cambiás uno, actualizá `docs/decisiones.md`.
- **Pruebas:** antes de dar algo por terminado, corré `npm test` (o la prueba del tema: `npm test -- combate`). Las pruebas usan `window.DeltaUno`, la interfaz de depuración que está al final de `src/main.js`. Si cambiás algo que exponga, mantené los nombres.
- **Rendimiento:** el juego corre en teléfonos. Nada de trabajo pesado por cuadro. Reutilizá vectores temporales (`_v`, `_eA` y similares) en lugar de crear objetos nuevos en cada cuadro.
- **Datos de uso:** los eventos de PostHog se mandan con `stats.track('nombre', {...})` (ver `src/stats.js`). Nombres en español y en minúscula con guion bajo. Si agregás o cambiás uno, actualizá `docs/decisiones.md` y la lista de `docs/prompt-difusion.md`. Nunca mandes nada que identifique a la persona.
- **Versión:** sale de `package.json` y la usan el menú y el APK. Para publicar una versión nueva, subí el número y creá la etiqueta `vX.Y.Z`: GitHub arma el APK y el zip para PC (`.github/workflows/demo.yml`).
- **Misiones:** son datos en `src/historia/` (formato en `docs/historia/formato.md`). Los textos de radio tienen como máximo 90 caracteres y la instrucción previa, 80 palabras; `npm test -- historia` lo controla. El código que las juega está en la sección "Historia" de `src/main.js`.
