import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Todo el juego sale en un único index.html (código, estilos y librería 3D adentro).
// Así se puede publicar como página, abrir sin servidor y meter en un APK.
// En modo "test" sale sin comprimir, para que las pruebas puedan instrumentar el código.
export default defineConfig(({ mode }) => {
  const test = mode === 'test';
  return {
    base: './',
    plugins: [viteSingleFile()],
    build: {
      outDir: test ? 'dist-test' : 'dist',
      target: test ? 'esnext' : 'es2019',
      minify: !test,
      reportCompressedSize: false
    },
    server: { port: 5173 }
  };
});
