/* ---------- Campaña 1 ----------
   TEXTOS PROVISORIOS: nombres, indicativos y mensajes salen de la "base propuesta" del reporte 01
   (docs/historia/reporte-01.md). Se reemplazan cuando llegue la ficha completa de la campaña 1.
   Cómo se arma una misión: docs/historia/formato.md. Reglas que controla la prueba 12-historia:
   - cada mensaje de radio tiene como máximo 90 caracteres;
   - la instrucción previa tiene como máximo 80 palabras. */

// Quién habla por radio. "radio" es lo que se ve en pantalla; "marca" es el color de las puntas de ala.
export const REPARTO = {
  MANDO: { radio: 'Mando', nombre: 'Vera Soria' },
  FERREYRA: { radio: 'Delta Uno', nombre: 'Julián Ferreyra', marca: [0.95, 0.95, 0.95] },
  AGUJA: { radio: 'Aguja', nombre: 'Inés Acosta', marca: [0.35, 0.85, 0.80] },
  CHISPA: { radio: 'Chispa', nombre: 'Tomás Leiva', marca: [1.0, 0.80, 0.20] },
  FARO: { radio: 'Faro', nombre: 'Bruno Sosa', marca: [0.50, 0.82, 0.40] },
  RASTRO: { radio: 'Rastro', nombre: 'Nicolás Arce', marca: [0.68, 0.52, 1.0] }
};

/* Una misión:
   - sector: dónde se juega (busca: 'costa' = playa y pradera junto al mar, de día) y su radio en metros.
   - aliados: quiénes vuelan con el jugador, en este orden de formación.
   - partes: cada una con su objetivo. Al caer o salir del sector, se repite la parte.
     tipo 'anillos' (anillos: cuántos), 'torretas' (torretas: cuántas) o 'naves' (naves: tipos de enemigo).
     danio: multiplica el daño enemigo (0,5 = munición de práctica).
     aliados: 'formacion' (atrás del jugador) u 'orbita' (miran desde arriba del sector).
   - eventos: cuando pasa algo ("cuando"), un mensaje de radio y/o una acción ("hacer").
     cuando: { t: segundos desde que empezó la parte } | { anillo: n } | { derribos: n } | { cascoBajo: n }
             | { fin: true } (la parte se completó) | { evento: 'firma_fin' } (terminó la firma de Rastro)
     radio: [quién, texto, 'alta' | 'baja']  (baja: comentario que se descarta si quedó atrasado)
     hacer: ['firma', 'RASTRO'] (la maniobra de Rastro, delante del jugador) */
export const MISIONES = [
  {
    id: 'c1m1',
    campana: 1,
    numero: 1,
    titulo: 'Entrenamiento',
    sector: { nombre: 'Costa Clara', radio: 1600, busca: 'costa' },
    instruccion: 'Costa Clara, sector de entrenamiento de la Guardia de Nácar. Hoy volás por primera vez con el escuadrón Delta, al mando de Julián Ferreyra. Son tres pruebas: pasar por los anillos, destruir torretas de práctica y derribar blancos de simulación. La munición es de práctica, pero el daño se mide igual. Si caés, repetís la prueba en la que estabas. No salgas del sector: afuera no hay apoyo y la prueba se pierde.',
    resumen: 'Pasaste las tres pruebas. Ferreyra te sumó a la formación y Rastro ya te mostró su firma. Mañana el escuadrón vuela de verdad, sobre Las Agujas.',
    aliados: ['FERREYRA', 'AGUJA', 'RASTRO', 'CHISPA', 'FARO'],
    medallas: [
      { id: 'completa', texto: 'Completar el entrenamiento' },
      { id: 'sin_caer', texto: 'Sin caer ni salir del sector' },
      { id: 'tiempo', texto: 'En menos de 5 minutos', seg: 300 }
    ],
    reinicio: ['FERREYRA', 'Repetimos la prueba. Respirá y arrancá de nuevo.', 'alta'],
    partes: [
      {
        id: 'anillos',
        objetivo: 'Pasá por los anillos',
        tipo: 'anillos',
        anillos: 6,
        aliados: 'formacion',
        eventos: [
          { cuando: { t: 1.5 }, radio: ['MANDO', 'Escuadrón Delta, acá Mando. Costa Clara despejada. Pueden empezar.', 'alta'] },
          { cuando: { t: 6 }, radio: ['FERREYRA', 'Bienvenido a Delta. Pasá por los anillos; nosotros te acompañamos.', 'alta'] },
          { cuando: { anillo: 1 }, radio: ['FERREYRA', 'Bien. Suave con la palanca: esta nave responde rápido.', 'baja'] },
          { cuando: { anillo: 2 }, radio: ['RASTRO', 'Mirá adelante, nuevo. Así se sale de un apuro.', 'alta'], hacer: ['firma', 'RASTRO'] },
          { cuando: { evento: 'firma_fin' }, radio: ['CHISPA', 'Otra vez la firma. Un día te van a reconocer por eso.', 'alta'] },
          { cuando: { evento: 'firma_fin' }, radio: ['AGUJA', 'Menos show, Rastro. Volvé a la formación.', 'baja'] },
          { cuando: { anillo: 4 }, radio: ['FARO', 'Vas bien. Yo cierro la formación; cualquier cosa, avisá.', 'baja'] },
          { cuando: { fin: true }, radio: ['FERREYRA', 'Anillos completos. Ahora, blancos en tierra.', 'alta'] }
        ]
      },
      {
        id: 'torretas',
        objetivo: 'Destruí las torretas de práctica',
        tipo: 'torretas',
        torretas: 3,
        danio: 0.5,
        aliados: 'orbita',
        eventos: [
          { cuando: { t: 0.5 }, radio: ['FERREYRA', 'Tres torretas de práctica en el centro del sector. Destruilas.', 'alta'] },
          { cuando: { t: 8 }, radio: ['AGUJA', 'Entrá bajo: las torretas no apuntan por debajo del horizonte.', 'alta'] },
          { cuando: { derribos: 1 }, radio: ['CHISPA', '¡Una menos! Quedan dos, y yo no las voy a hacer por vos.', 'baja'] },
          { cuando: { cascoBajo: 50 }, radio: ['FARO', 'Te están dando. Alejate, tocá Reparar y volvé a entrar.', 'alta'] },
          { cuando: { fin: true }, radio: ['FERREYRA', 'Limpio. Última prueba: blancos que vuelan.', 'alta'] }
        ]
      },
      {
        id: 'naves',
        objetivo: 'Derribá los blancos de simulación',
        tipo: 'naves',
        naves: ['caza', 'caza', 'caza'],
        danio: 0.5,
        aliados: 'orbita',
        eventos: [
          { cuando: { t: 0.5 }, radio: ['MANDO', 'Lanzamos tres blancos de simulación. No llevan piloto.', 'alta'] },
          { cuando: { t: 5 }, radio: ['FERREYRA', 'Tocá Blanco para que la cámara siga a uno. Después, a cazarlos.', 'alta'] },
          { cuando: { t: 16 }, radio: ['RASTRO', 'Probá un misil: mantené apretado hasta fijar y soltá.', 'baja'] },
          { cuando: { derribos: 1 }, radio: ['FARO', 'Buen tiro.', 'baja'] },
          { cuando: { derribos: 2 }, radio: ['CHISPA', 'Queda uno. Dejame algo a mí, ¿no?', 'baja'] },
          { cuando: { fin: true }, radio: ['FERREYRA', 'Entrenamiento completo. Bienvenido al escuadrón, de verdad.', 'alta'] },
          { cuando: { fin: true }, radio: ['MANDO', 'Bien hecho, Delta. Vuelvan a la base.', 'alta'] }
        ]
      }
    ]
  }
];

// Misiones anunciadas que todavía no se pueden jugar (se muestran en el menú)
export const PROXIMAS = [
  { campana: 1, numero: 2, titulo: 'Emboscada' },
  { campana: 1, numero: 3, titulo: 'Escolta y asalto' }
];
