/* ---------- Texturas del mundo ----------
   Las imágenes vienen de ambientCG (licencia CC0) y se preparan con `node scripts/texturas.mjs`.
   De cada material se usan el color y, más adelante, el relieve: ver docs/texturas.md.

   Viajan adentro del HTML en base64, igual que la intro, porque el juego se publica como un solo
   archivo. Por eso van a 512: una textura de 1024 ocupa 5,6 MB de memoria de video con sus mipmaps,
   y a 512 ocupa 1,4 MB. Cuando el juego pase a archivos sueltos se puede subir a 1024.

   En calidad Baja no se carga ninguna: el terreno se queda con el grano hecho en código. */

import sueloUrl from '../assets/texturas/Ground038-color-512.webp';
import rocaUrl from '../assets/texturas/Rock060-color-512.webp';
import cieloUrl from '../assets/texturas/NightSkyHDRI002-cielo.webp';

export const CREDITOS = [
  { que: 'Suelo, roca y cielo nocturno', autor: 'ambientCG', licencia: 'CC0', url: 'https://ambientcg.com' }
];

const URLS = { suelo: sueloUrl, roca: rocaUrl, cielo: cieloUrl };

/* Carga las texturas y avisa cuando están todas. No bloquea: el juego arranca sin ellas
   y las usa en cuanto llegan. Si alguna falla, se sigue con el aspecto de siempre. */
export function cargarTexturas(T, listo) {
  const out = {}, loader = new T.TextureLoader();
  let faltan = Object.keys(URLS).length;
  const fin = () => { if (--faltan === 0 && listo) listo(out); };
  for (const nombre in URLS) {
    loader.load(URLS[nombre], tex => {
      if (nombre === 'cielo') {           // el cielo no se repite: se estira una sola vez
        tex.wrapS = T.ClampToEdgeWrapping; tex.wrapT = T.ClampToEdgeWrapping;
        tex.minFilter = T.LinearFilter; tex.generateMipmaps = false;
      } else {
        tex.wrapS = tex.wrapT = T.RepeatWrapping;
        tex.minFilter = T.LinearMipMapLinearFilter; tex.magFilter = T.LinearFilter;
      }
      out[nombre] = tex; fin();
    }, undefined, () => { fin(); });     // si una no carga, se sigue igual
  }
  return out;
}

// La anisotropía se pide después, cuando ya existe el renderizador
export function afinar(tex, renderer) {
  if (!tex || !renderer) return;
  try { tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); tex.needsUpdate = true; } catch (e) { /* da igual */ }
}
