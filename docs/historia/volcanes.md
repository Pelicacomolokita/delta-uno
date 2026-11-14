# Los volcanes de Corona Negra

Qué se cambió, por qué, y los números medidos. Decisión de Santiago, 14 de noviembre: "me gusta la idea de que haya volcanes y que eso afecte al vuelo de la nave".

---

## 1. El problema: el `volc` de Corona Negra no hacía nada

En la tabla de clima, Corona Negra tiene `alto: +1.0` (lo más montañoso del planeta) y `volc: +0.9` (volcánica). Pero la fórmula del bioma volcánico decía:

```js
volc = ruido × land × (1 - mount) × (1 - ice) × …
```

Ese `(1 - mount)` es el problema: en Corona Negra `mount` vale casi 1 en todos lados, así que `volc` quedaba en cero. **Montaña y volcán se anulaban entre sí.** Medido antes del cambio: los 6 hitos de Corona Negra daban bioma 7 (montaña), ninguno daba 8 (volcán). El `volc: +0.9` no hacía absolutamente nada.

No se notaba porque la región estaba de noche. Con el Sol girando (ver `mapa-P1.md`) quedó a la vista: una cordillera **nevada y blanca** en una región que se llama Corona Negra.

## 2. Los tres cambios

| Dónde | Qué | Por qué |
|---|---|---|
| `volc` | `(1-mount)` pasa a `(1-mount*(rVolc>0?.2:1))` | En una región volcánica la montaña deja de tapar al volcán. Fuera de esas regiones, nada cambia. |
| Altura | `h+=(90+rAlto*260+ridge*(240+rAlto*300)-h)*volc` | Antes el volcán empujaba la altura hacia 90–330 m, así que activarlo **bajaba** Corona Negra. Ahora el objetivo escala con lo alta que es la región: un volcán en una región alta es alto. |
| Nieve | `snow *= (1-volc)` | Sobre roca volcánica no cuaja: el suelo quema. Era lo que la pintaba de blanco. |

Resultado medido: **5 de los 6 hitos de Corona Negra dan ahora bioma 8 (volcán)**, y las alturas **subieron** en vez de bajar.

| Hito | Antes | Ahora |
|---|---:|---:|
| CN01 Batería de acceso industrial | 517 m | 631 m |
| CN02 Puesto exterior y evacuación | 407 m | 535 m |
| CN03 Central de Corona Negra | 659 m | 755 m |
| CN04 Instalación del misil | 206 m | 354 m |
| CN05 Arena de las tres nodrizas | 225 m | 375 m |
| CN06 Reunión de la coalición | 185 m | 185 m (sigue montaña) |

El contraste quedó: roca negra abajo, crestas nevadas no volcánicas atrás.

---

## 3. Cómo afecta al vuelo

Sobre roca volcánica el suelo está caliente y el aire sube. Las constantes están en `TERMICA`, en `src/main.js`:

```js
const TERMICA = {
  subida: 19,    // m/s de empuje hacia arriba, pegado al suelo y sobre lava pura
  techo: 1100,   // a esta altura sobre el suelo ya no se siente
  sacudon: .85,  // cuánto zarandea la trompa y el alabeo
  calor: 2.2     // el motor se calienta esto de veces más rápido
};
```

La térmica sale de la roca volcánica (`S.volc`) más un extra sobre los charcos de lava (`S.lava`), y cae con el **cuadrado** de la altura: pegado al suelo empuja, a 1.100 m no se siente.

**No cuesta nada medirlo.** `groundCheck` ya saca la muestra completa del terreno debajo de la nave en cada cuadro, así que la térmica sale de datos que ya estaban calculados. Cero trabajo nuevo por cuadro.

### Lo medido

Subida tras 4 segundos de vuelo nivelado a crucero:

| Dónde | A 120 m del suelo | A 600 m |
|---|---:|---:|
| Corona Negra (CN05) | **+50 m** (térmica 0,56) | +8 m (térmica 0,15) |
| Corona Negra (CN03) | **+28 m** (térmica 0,45) | térmica 0,11 |
| Salinas, Costa Clara, Deshielo | 0 m (térmica 0) | 0 m |

Motor a fondo, hasta recalentar:

| Dónde | Recalienta en |
|---|---:|
| Sobre Costa Clara | 21,7 s (la ficha dice 22) |
| Sobre Corona Negra, a 110 m | **12,5 s** |

O sea: volando bajo sobre los volcanes el turbo dura un **43 % menos**, y el aire te levanta unos 10 m/s mientras te zarandea. Volar pegado al suelo ahí deja de ser gratis, que es lo que hace que Corona Negra se vuele distinta del resto del planeta.

---

## 4. Lo que queda por probar

- **Nadie lo voló todavía.** Los números salen de mediciones automáticas, no de la sensación. `subida`, `sacudon` y `calor` son las tres perillas y están juntas arriba de todo para moverlas rápido.
- Los enemigos **no** sienten la térmica: solo la nave del jugador. Si eso se nota raro en combate dentro de Corona Negra, hay que extenderlo.
- Las misiones de la campaña 3 pasan por ahí. Cuando existan, hay que ver si la térmica ayuda o estorba en los objetivos.
