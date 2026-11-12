# Diferencias entre los reportes H1.0 / M1.0 y el juego de hoy

Los reportes (`reporte-historia-H1.0.md` y `reporte-mundo-M1.0.md`) piden mantener esta lista. Se actualiza con cada entrega.

## Medidas que pide el reporte del mundo (sección 4)

Sacadas del código, no estimadas.

| Dato | Valor hoy |
|---|---|
| Envergadura del caza (E) | 4,8 m |
| Largo del caza (L) | 4,6 m (y 1,1 m de alto) |
| Velocidad mínima / crucero / máxima | 26 / 65 / 130 m/s (empuje 20 %, 50 % y 100 %) |
| Giro | 1,35 rad/s de cabeceo. Radio de giro (R): unos 48 m a crucero y 96 m a fondo |
| Esquive | 35 m de costado en 0,42 s, cada 3 s |
| Radio del planeta | 3650 m. Una vuelta a fondo: unos 3 minutos |
| Techo de vuelo | 1620 m |
| Naves a la vez | unas 25 |
| Transporte | No existe todavía: sus medidas se definen al programar el convoy |

Con esas medidas, los rangos del reporte quedan así (para probar, no definitivos):

| Elemento | Rango del reporte | En metros |
|---|---|---|
| Pórtico temprano | 8–12 E | 38–58 m |
| Paso avanzado | 4–6 E | 19–29 m |
| Paso bajo puente | 8–12 E × 6–8 E | 38–58 m de ancho, 29–38 m de alto |
| Cauce | 12–20 E, curvas de radio ≥ R | 58–96 m de ancho, curvas de 96 m o más |
| Anillo seguro | 20–30 E | 96–144 m de diámetro |
| Nodriza | 100 L (pendiente de confirmar) | unos 460 m de largo |

## Lo que ya coincide

- Misión 1 (C1-01) y la firma de Rastro en el anillo 2: sin cambios.
- Sector con borde, aviso y 8 segundos; repetir la parte al caer.
- Estado de inicio por parte (`inicio`): misiles, casco, escudo y recarga.
- Radio de 90 caracteres con 4 segundos entre mensajes; instrucción de 80 palabras.
- Reparto: Mando, Ferreyra, Aguja, Chispa, Faro y Rastro, con los mismos nombres.
- Lado nocturno fijo del planeta.

## Lo que cambia respecto de lo hecho o lo anotado

| Tema | Antes | Reportes H1.0 / M1.0 | Estado |
|---|---|---|---|
| Título de C1-05 | "Abrir el paso" | "Por debajo" | Cambiado en el menú |
| Escuadrón | 5 compañeros | 9 compañeros (10 naves con el jugador); faltan 4 pilotos con identidad | Pendiente de la historia: nombres e indicativos |
| Indicativo del jugador | Sin definir | "Delta Diez" (propuesto) | Sin usar todavía |
| Vuelo libre | Elegir cualquier región | Empieza en Costa; las demás se desbloquean con la historia | Anotado; se programa con las regiones |
| Regiones | 6 zonas generadas al azar | 7 regiones fijas con nombre y vecindad | Se programa con el mapa nuevo |
| Final de la campaña 1 | Sin detalle | C1-06: 3 bombarderos, emboscada, resistir 2 minutos y salir por un anillo grande | Pendiente |
| Naves pilotables | 1 | 12 (4 clases × 3 bandos), con armas configurables | [MECÁNICA NUEVA], para la campaña 2 |

## Lo que no existe y los reportes necesitan

Por orden de las entregas A a F:

1. **Entrega A (M2–M3):** aliados que combaten y pueden caer; ciudad en bloques, plataforma, pórtico y batería; convoy por puntos con paradas; choque con estructuras (rebote con daño).
2. **Entrega B (M4–M5):** oleadas dentro de una misión, nodo, cauce y puente. El sigilo no existe: hoy solo hay cálculo de si el terreno tapa la vista.
3. **Entrega C (M6–M7):** bombarderos, derribos guionados, anillo de salida, tres posiciones en secuencia.
4. **Entrega D:** interceptor y nave de ataque pilotables, tormenta, noche con camuflaje, PEM.
5. **Entrega E:** nodriza por componentes (la actual es un solo cuerpo con cañones), tres bandos que pelean entre sí.
6. **Entrega F:** tres nodrizas y la secuencia del misil.

## Pendiente del lado de la historia

- La IA de la historia dice que no recibió `formato.md`: hay que pasárselo, junto con este archivo.
- Identidad de los 4 pilotos que faltan.
- Escala de la nodriza: 100 veces el largo, o 100 veces cada dimensión.
- Regla de compañero esencial muerto fuera de su escena.
- Si la destrucción en Vuelo libre se reinicia al salir.
