# Cómo publicar una versión nueva

## Para la 0.14.0

La rama `naves/prueba-rendimiento` ya trae main al día, la versión subida a 0.14.0, las novedades escritas y las pruebas pasando (salvo la 15, la de la intro, que falla igual en main).

1. **Unir la rama a main.**
   ```
   git checkout main
   git pull
   git merge origin/naves/prueba-rendimiento
   npm test
   git push
   ```
   Al subir a main, GitHub arma el APK y el zip para PC, pero todavía no los publica: quedan en **Actions → la corrida → Artifacts** (`delta-uno-0.14.0`). Dentro del zip también viene `novedades.md`, el reporte de cambios.

2. **Publicar.** En **Actions → Armar la demo → Run workflow**, rama **main**. Sale la versión **v0.14.0** en Releases y se actualiza la página de descarga.

3. **El enlace es el mismo de siempre**, porque los archivos se llaman igual en cada versión:
   - Página: https://pelicacomolokita.github.io/delta-uno/
   - APK directo: https://github.com/Pelicacomolokita/delta-uno/releases/latest/download/delta-uno.apk

   Como la versión subió a 0.14.0, el APK se instala encima del anterior sin perder récords ni ajustes.

## El reporte de cambios

Cada publicación se arma con tres partes:
- **Las notas de siempre** (`docs/version/notas.md`): qué bajar y cómo instalar.
- **Las novedades** (`docs/version/novedades.md`): lo nuevo contado para quien juega, más una lista de **qué probar en el teléfono**. Se escribe a mano en cada versión.
- **El detalle**: la lista de todos los cambios desde la versión publicada anterior (la etiqueta `v*` anterior). La arma sola la corrida, a partir de la historia.

Las mismas novedades se ven **dentro del juego**, con el botón **Novedades** del menú. Así se puede probar desde el APK con la lista a mano.

## Para la próxima versión

1. Subir el número en `package.json` (y en `package-lock.json`). Si no, Android no instala el APK encima.
2. Reescribir `docs/version/novedades.md`: arriba dice con qué versión se compara.
3. Unir a main y publicar como arriba.
