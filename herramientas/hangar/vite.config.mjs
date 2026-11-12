import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';
// Visor de las naves (herramienta de diseño, no es parte del juego).
// Uso: npx vite build --config herramientas/hangar/vite.config.mjs  →  dist-hangar/index.html
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [viteSingleFile()],
  build: { outDir: fileURLToPath(new URL('../../dist-hangar', import.meta.url)), emptyOutDir: true, target: 'es2019', reportCompressedSize: false }
});
