# Dirección de arte · OLEACARB v2

**Idea.** La web es la memoria abierta sobre la mesa de la oficina técnica. Lo narrativo va en **capítulos de carbón** (`--char`, grano y luz rasante, como el vídeo) y lo técnico en **hojas de plano** (`--paper` con retícula de 5 mm, marco, cotas y cajetín). Las hojas no son tarjetas: ocupan todo el ancho, tienen su código (`G-01`) y se separan entre sí por el borde del papel.

## Retícula

- **Escritorio:** 12 columnas, 1.240 px de máximo, medianil de 24 px y margen lateral `max(24px, 4vw)`. La columna 1 es el margen del plano: lleva el índice de sección en Plex Mono 12 px (`05 / Proceso`) y las notas de fuente. El texto corrido va de la 2 a la 7 (≈ 64 caracteres).
- **Móvil (360–430 px):** una columna con 20 px de margen; el índice pasa a línea propia sobre el titular, en mono y en minúscula, nunca como antetítulo espaciado.
- **Retícula de dibujo:** `background-size: 5mm 5mm` en `--grid`, con un marco interior de 1 px a 12 px del borde y el cajetín abajo a la derecha (`G-01 · Implantación · 1:1.000 · OLEACARB`).
- **Escala:** titulares en Source Serif 4 600 con `opsz` alto, `clamp(34px, 5.4vw, 64px)`; portada hasta 104 px. Texto en Plex Sans 17/1,6. Cifras que cambian, en `tabular-nums`. Rótulos de diagrama en Plex Sans Condensed 12–13 px (≥ 12 px en el móvil). Radios: 2 px en etiquetas, 4 px en botones, 0 en figuras y hojas.

## Ritmo de secciones

| # | Sección | Fondo | Composición | Pieza que rompe la retícula |
|---|---|---|---|---|
| 1 | Portada | carbón | foto en duotono, titular abajo a la izquierda en 7 columnas, cifras en franja al pie | almendra teselada gigante sangrando a la derecha |
| 2 | Reto | papel liso | afirmación grande; tres datos en columnas desiguales (5/3/4), cada uno con su figura (gofre, ecuación, barra) | «95» en Serif de 40 vw cortado por el borde |
| 3 | Territorio | hoja `G-00` | texto en margen izquierdo (4 col), mapa sangrando a la derecha | cota de 44 km que cruza dos columnas |
| 4 | Viaje | carbón, fijado | escenario a pantalla completa: masa a la izquierda, hueso al centro, termómetro a la derecha | la microestructura que llena el cuadro |
| 5 | Proceso | hoja `P-01` | PFD a sangre, texto en margen estrecho, panel de etapa debajo | la línea de energía ocre que vuelve atrás |
| 6 | Planta | hoja `G-01` | plano en 8 columnas, ficha en 4 | cotas de 200 m fuera del marco |
| 7 | Balances | carbón | Sankey a todo el ancho; tres cifras y anillo de electricidad debajo | banda de *hard carbon* en `--olive-l` |
| 8 | Calendario | hoja `PL-01` | cifra gigante «3,7 M€» + Gantt; escalones de capital con eje partido | el salto a 65,3 M€ |
| 9 | Simulador | hoja `E-01` | mando en 4 columnas, resultados en 8 | — (aquí manda la legibilidad) |
| 10 | Impacto | papel liso | cifra gigante «0,21» con columna estrecha de texto; barras y destinos | la barra de 25,1 que se sale del ancho del texto |
| 11 | Vídeo | carbón | reproductor grande, título a la izquierda | — |
| 12 | Equipo | papel | cajetín de firmas de plano | — |
| 13 | Fuentes | carbón | lista a dos columnas y pie | — |

## Los cuatro momentos de movimiento

1. **Entrada de la portada** (0–1,4 s). El titular se revela por líneas (SplitText, máscara y `expo.out`), el teselado de almendras se dibuja desde el centro como en la escena s1 del vídeo y los iones Na⁺ derivan hacia el puntero o la inclinación del móvil. Las cinco cifras ruedan una sola vez.
2. **El viaje de una tonelada** (fijado con *scrub*, ≈ 7 pantallas). El hueso encoge con la raíz cúbica de la masa y vira de ocre a negro; la barra de masa rueda y el termómetro sube; cada salida se despega como partículas de su color; en la carbonización la cámara entra en la microestructura (láminas a 0,38 nm, poros cerrados, Na⁺). Cierra con el polvo sobre la lámina de aluminio que se enrolla en una celda.
3. **Flujos del PFD y del Sankey.** Partículas que recorren cada corriente con grosor y velocidad proporcionales a `log10(caudal)`. Son trazos discontinuos animados en CSS: no cuestan JS.
4. **Vuelo por la maqueta 3D.** «Recorrido» lleva la cámara por las siete paradas de `route` con GSAP, con una tarjeta por parada.

Todo lo demás se dibuja, se llena o se ensambla con 150–250 ms y `ease-out`: el gofre se llena, las barras crecen, los arcos de suministro se trazan, las barras del Gantt se extienden. Nada sube deslizándose. Con `prefers-reduced-motion: reduce`: sin Lenis, sin fijados, sin partículas, sin contadores y con el viaje en siete bloques estáticos.

## Móvil, sección a sección (390 × 844 primero)

- **Cabecera:** 56 px; menú a pantalla completa sobre carbón con secciones numeradas y accesos directos al vídeo y al simulador.
- **Portada:** foto con punto focal en el olivar; teselado más ligero; cifras en dos columnas con la quinta a lo ancho; «Sigue una tonelada» a lo ancho y la miniatura del vídeo debajo.
- **Reto:** gofre a todo el ancho, ecuación apilada, barras de valor en vertical.
- **Territorio:** mapa a todo el ancho y municipios en tabla debajo.
- **Viaje:** el mismo fijado en `100svh`; escenario arriba y franja de datos abajo; `ignoreMobileResize` para que la barra de iOS no lo rompa.
- **Proceso:** PFD vertical propio (etapas en columna, salidas como ramas cortas), elegido con `matchMedia`; fichas y paneles en hoja inferior.
- **Planta:** plano a todo el ancho, chips en fila desplazable, ficha en *bottom sheet* arrastrable, maqueta 3D a pantalla completa con «Cerrar».
- **Balances:** Sankey vertical con rótulos de 12 px; el anillo debajo.
- **Calendario:** fases e hitos; «Ver todas las actividades» despliega la lista completa.
- **Simulador:** barra fija con VAN y TIR mientras se mueven los deslizadores; gráfico debajo; tornado y Monte Carlo en pestañas.
- **Impacto, vídeo, equipo y fuentes:** una columna, sin tablas anchas.
