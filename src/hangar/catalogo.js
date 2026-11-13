/* ---------- Catálogo del hangar: clases de nave, armas y pinturas ----------
   La pantalla de preparación (misión → nave → equipo → diseño) se arma con estos datos.
   Para sumar una nave, un arma o una pintura alcanza con agregarla acá: la pantalla la muestra sola.
   - disponible: true  → se puede elegir.
   - desbloqueo: texto → todavía no; se muestra con ese texto ("Campaña 2 · misión 2").
   Los modelos 3D y las pinturas se desarrollan aparte (ver docs/naves/formato.md). */

// diseno: la nave por piezas que se ve (src/naves/disenos.js). Las barras de velocidad, agilidad y casco
// salen de la ficha de vuelo de cada clase (src/vuelo/ficha.js); poder de fuego todavía es a ojo.
export const CLASES = [
  { id: 'caza', diseno: 'A', nombre: 'Caza', bando: 'Guardia de Nácar', disponible: true,
    desc: 'Versátil: sirve para todo y no tiene puntos flojos. Es la nave del escuadrón Delta.',
    stats: { velocidad: 3, agilidad: 3, casco: 3, fuego: 3 } },
  { id: 'interceptor', diseno: 'I2', nombre: 'Interceptor', bando: 'Guardia de Nácar', desbloqueo: 'Campaña 2 · misión 2',
    desc: 'Rápido y ágil, pero frágil. Para alcanzar y cortar el paso.',
    stats: { velocidad: 5, agilidad: 4, casco: 2, fuego: 2 } },
  { id: 'ataque', diseno: 'P1', nombre: 'Ataque pesado', bando: 'Guardia de Nácar', desbloqueo: 'Campaña 2 · misión 4',
    desc: 'Lento y resistente, con mucha carga. Para romper defensas y estructuras.',
    stats: { velocidad: 2, agilidad: 2, casco: 5, fuego: 5 } },
  { id: 'infiltracion', diseno: 'S4', nombre: 'Infiltración', bando: 'Guardia de Nácar', desbloqueo: 'Campaña 3 · misión 5',
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

// Pinturas: las del escuadrón del jugador (camuflajes por escuadrón). id: la pintura en src/naves/disenos.js
export const PINTURAS = [
  { id: 'guardia', nombre: 'Guardia', desc: 'Gris y verde azulado, gastada por el uso. La del escuadrón Delta.', disponible: true },
  { id: 'guardiaNoche', nombre: 'Guardia nocturna', desc: 'Gris oscuro para las salidas de noche.', disponible: true }
];

// Carrocerías del caza: el Delta compacto es la principal; las otras tres se desbloquean con escuadrones
export const CARROCERIAS = [
  { id: 'A', nombre: 'Delta compacto', desc: 'La nave del escuadrón Delta.', disponible: true },
  { id: 'B', nombre: 'Caza B', desbloqueo: 'Próximamente' },
  { id: 'C', nombre: 'Caza C', desbloqueo: 'Próximamente' },
  { id: 'D', nombre: 'Caza D', desbloqueo: 'Próximamente' }
];

export const EQUIPO_INICIAL = { clase: 'caza', principal: 'canon', secundaria: 'misiles' };
