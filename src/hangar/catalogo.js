/* ---------- Catálogo del hangar: clases de nave, armas y pinturas ----------
   La pantalla de preparación (misión → nave → equipo → diseño) se arma con estos datos.
   Para sumar una nave, un arma o una pintura alcanza con agregarla acá: la pantalla la muestra sola.
   - disponible: true  → se puede elegir.
   - desbloqueo: texto → todavía no; se muestra con ese texto ("Campaña 2 · misión 2").
   Los modelos 3D y las pinturas se desarrollan aparte (ver docs/naves/formato.md). */

// barras de 1 a 5: sirven para comparar, no son los números reales del vuelo
export const CLASES = [
  { id: 'caza', nombre: 'Caza', bando: 'Guardia de Nácar', disponible: true,
    desc: 'Versátil: sirve para todo y no tiene puntos flojos. Es la nave del escuadrón Delta.',
    stats: { velocidad: 3, agilidad: 3, casco: 3, fuego: 3 } },
  { id: 'interceptor', nombre: 'Interceptor', bando: 'Guardia de Nácar', desbloqueo: 'Campaña 2 · misión 2',
    desc: 'Rápido y ágil, pero frágil. Para alcanzar y cortar el paso.',
    stats: { velocidad: 5, agilidad: 4, casco: 2, fuego: 2 } },
  { id: 'ataque', nombre: 'Ataque pesado', bando: 'Guardia de Nácar', desbloqueo: 'Campaña 2 · misión 4',
    desc: 'Lento y resistente, con mucha carga. Para romper defensas y estructuras.',
    stats: { velocidad: 2, agilidad: 2, casco: 5, fuego: 5 } },
  { id: 'infiltracion', nombre: 'Infiltración', bando: 'Guardia de Nácar', desbloqueo: 'Campaña 3 · misión 5',
    desc: 'Camuflaje y mucho daño, pero es la más delicada de todas.',
    stats: { velocidad: 3, agilidad: 4, casco: 1, fuego: 5 } }
];
export const STAT_NOMBRE = { velocidad: 'Velocidad', agilidad: 'Agilidad', casco: 'Casco', fuego: 'Poder de fuego' };

// ranura: 'principal' (botón Fuego) o 'secundaria' (botón Misil)
export const ARMAS = [
  { id: 'canon', ranura: 'principal', nombre: 'Cañón de pulsos', disponible: true,
    desc: 'Dos bocas que tiran alternadas. No se agota.' },
  { id: 'misiles', ranura: 'secundaria', nombre: 'Misiles guiados', disponible: true,
    desc: 'Hasta 4. Hay que fijar el blanco. Se recarga uno cada 20 segundos.' }
];
export const RANURA_NOMBRE = { principal: 'Arma principal', secundaria: 'Arma secundaria' };

// id: el nombre de la paleta en src/nave.js (PALETAS)
export const PINTURAS = [
  { id: 'actual', nombre: 'Clásica', desc: 'Marfil y coral.', disponible: true },
  { id: 'guardia', nombre: 'Guardia', desc: 'Gris y verde azulado, gastada por el uso.', disponible: true }
];

export const EQUIPO_INICIAL = { clase: 'caza', principal: 'canon', secundaria: 'misiles' };
