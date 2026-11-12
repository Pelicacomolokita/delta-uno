import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';
// Prueba de rendimiento de naves (herramienta, no es parte del juego).
// Uso: npx vite build --config herramientas/rendimiento/vite.config.mjs  →  dist-rendimiento/index.html
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [viteSingleFile()],
  build: { outDir: fileURLToPath(new URL('../../dist-rendimiento', import.meta.url)), emptyOutDir: true, target: 'es2019', reportCompressedSize: false }
});
