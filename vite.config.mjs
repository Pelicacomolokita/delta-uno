import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Todo el juego sale en un único index.html (código, estilos y librería 3D adentro).
// Así se puede publicar como página, abrir sin servidor y meter en un APK.
// En modo "test" sale sin comprimir, para que las pruebas puedan instrumentar el código.
// La versión del juego sale de package.json (la usan el menú, los datos de uso y el APK).
export default defineConfig(({ mode }) => {
  const test = mode === 'test';
  return {
    base: './',
    plugins: [viteSingleFile()],
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    build: {
      outDir: test ? 'dist-test' : 'dist',
      target: test ? 'esnext' : 'es2019',
      minify: !test,
      reportCompressedSize: false
    },
    server: { port: 5173 }
  };
});
