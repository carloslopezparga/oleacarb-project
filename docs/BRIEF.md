# OLEACARB · Brief de la web v2

Para Claude Code. Este documento manda sobre cualquier otra referencia. Los datos de `data/` mandan sobre este documento.
Equipo OLEACARB (Grupo T1, Proyectos 55000037, GITI, ETSII-UPM) · 15-11-2026

---

## 0. En diez líneas

1. Web de una sola página, en español, sobre OLEACARB: una planta en Mancha Real (Jaén) que convierte hueso de aceituna en *hard carbon* para el ánodo de las baterías de ion-sodio y aprovecha el resto de corrientes.
2. Sustituye a una primera versión hecha como artefacto de claude.ai. Tienes su HTML en `reference/current-site.html` y capturas en `reference/screenshots/`. El enlace es https://claude.ai/artifact/SANawB6uGnCGeiw6aAXYZc. Si no puedes abrirlo, usa la copia local.
3. Esa versión es correcta en datos pero plana. Esta tiene que parecer el trabajo de un estudio: dirección de arte propia, tres o cuatro momentos de movimiento memorables, figuras técnicas vivas y un simulador financiero que se use solo.
4. La memoria del proyecto lleva códigos QR a esta web y a las anclas `#proceso`, `#planta` y `#simulador`. El vídeo tiene su propia ruta `/video`. Esas cuatro direcciones no pueden romperse nunca.
5. La mayoría la abrirá desde el móvil, al escanear el QR de la memoria. Diseña primero para 390 × 844 y después para escritorio.
6. Todas las cifras salen de `data/*.json`. No inventes ni redondees por tu cuenta. Si necesitas un número nuevo, calcúlalo desde los datos y deja la fórmula en un comentario.
7. El simulador porta `reference/model.js` a TypeScript sin cambiar la matemática y pasa los 11 casos de `data/model.test.json` con una tolerancia de 1e-6.
8. Stack: Astro, TypeScript e islas Svelte 5 donde haya estado; GSAP con ScrollTrigger, Lenis, d3 y three.js cargado bajo demanda. Despliegue estático en Vercel desde GitHub.
9. Antes de dar nada por terminado: capturas con Playwright a 390 px y a 1440 px de cada sección, revisadas una a una, y Lighthouse móvil ≥ 90 en rendimiento y ≥ 95 en accesibilidad.
10. Al final entregas la URL de producción y las cinco direcciones probadas: `/`, `/#proceso`, `/#planta`, `/#simulador` y `/video`.

---

## 1. Quién la ve y en qué situación

- **El promotor y el tribunal** de la asignatura, con la memoria (168 páginas) en la mano. Escanean un QR al lado de una figura y quieren ver esa parte en vivo: el proceso, la planta o el simulador. Llegan en frío, con el móvil y a menudo con datos móviles.
- **El equipo**, en la defensa, proyectando la web en una pantalla de 1920 × 1080. Conviene que con ← y → se salte de sección en sección. Es opcional pero muy útil.
- **Terceros** (fabricantes de celdas, El Tejar, administraciones) que reciben el enlace.

Qué tiene que quedar claro en 30 segundos:
- de dónde sale el hueso;
- qué se fabrica y cuánto;
- que no hay residuos a vertedero;
- que la inversión va por fases y la decisión de construir espera a dos hitos: el Hito 1, en el laboratorio, con un 15 % de rendimiento, 330 mAh/g y cartas de intención a 7 €/kg, y el Hito 2, con contratos firmes por al menos 1.500 t/año a 7 €/kg o más;
- que el visitante puede comprobar los números él mismo.

---

## 2. Reglas que no se negocian

**Datos**
- Cada cifra visible procede de `data/*.json` o de la sección 5 de este brief, que copia la memoria.
- Formato español en todas partes: `3.010 t/año`, `61,6 M€`, `7,9 %`, `−0,2 M€`. Usa el signo menos U+2212, no un guion. Pon un espacio fino o duro entre la cifra y la unidad. Centraliza todo en `src/lib/format.ts` con `Intl.NumberFormat('es-ES')`; ojo, que por defecto no agrupa los miles en números de cuatro cifras, así que fuerza `useGrouping: 'always'` o lo resuelves a mano.
- Cada dato de mercado lleva su fuente visible debajo, en pequeño y con enlace (sección 14).
- No copies las erratas de la web actual (sección 13).

**Direcciones**
- Rutas `/` y `/video`.
- Anclas en `/`: `#inicio`, `#reto`, `#territorio`, `#viaje`, `#proceso`, `#planta`, `#balances`, `#calendario`, `#simulador`, `#impacto`, `#video`, `#equipo`, `#fuentes`.
- `#proceso`, `#planta` y `#simulador` vienen impresas en QR. Deben funcionar en carga en frío (iOS Safari y Chrome Android), con la cabecera fija sin tapar el título de la sección y con las secciones fijadas (*pinned*) de ScrollTrigger ya montadas.
  - Al cargar con hash, espera a `document.fonts.ready` y a `ScrollTrigger.refresh()`.
  - Después haz `lenis.scrollTo(target, { offset: -altoCabecera, immediate: true })`.
  - Añádelo como prueba e2e.

**Identidad.** La de la sección 3.2. Es la misma de la memoria en PDF y del vídeo; no se cambia la paleta ni el logotipo.

**Accesibilidad**
- Contraste AA: 4,5:1 en texto normal y 3:1 en texto grande y en elementos gráficos con significado.
- Todo se usa con teclado y el foco es visible.
- Cada animación tiene alternativa con `prefers-reduced-motion: reduce`: sin secciones fijadas, sin partículas y con transiciones instantáneas.
- Los diagramas tienen `role="img"`, un `aria-label` útil y, donde haya datos, una tabla equivalente accesible ("Ver como tabla").

**Móvil**
- Sin scroll horizontal a 360, 375 y 390 px.
- Objetivos táctiles de 44 px como mínimo.
- Nada se entiende solo pasando el ratón por encima: todo lo que sale en *hover* sale también al tocar.

**Rendimiento**
- LCP menor de 2,5 s en 4G lento simulado y CLS menor de 0,05.
- Menos de 180 kB de JS comprimido en la carga inicial; three.js, el *worker* de Monte Carlo y el vídeo solo se cargan cuando hacen falta.

**Privacidad.** Sin cookies ni rastreadores de terceros. Si se quiere medir visitas, Vercel Web Analytics, que no usa cookies, y nada más.

---

## 3. Dirección de arte

### 3.1 Concepto

**"Del hueso al ánodo"**: un dossier técnico de oficina de planos cruzado con la ciencia de materiales.

- **Capítulos de carbón.** Las secciones narrativas van sobre carbón (`--char` #15191A): portada, viaje, balances, vídeo y cierre. Llevan grano fotográfico sutil y luz rasante, la estética del vídeo.
- **Hojas de plano.** Las secciones técnicas van sobre papel (`--paper` #F6F4EE): territorio, proceso, planta, calendario y simulador.
  - Llevan una retícula de dibujo de 5 mm muy tenue, cotas, la escala gráfica, el norte y un cajetín en una esquina, como los planos de la memoria (`G-01 · Implantación · 1:1.000`).
  - El papel nunca es el fondo de toda la página: alterna con el carbón como alternan las partes de la memoria.
- **Lo memorable** es el **viaje de una tonelada**. Una sección fijada en la que el visitante sigue 1.000 kg de hueso por las siete etapas:
  - la masa baja hasta 124,6 kg de *hard carbon*;
  - un termómetro sube hasta 1.300 °C;
  - el hueso, con la forma de almendra del logotipo, pasa de ocre a negro;
  - al final se abre en la microestructura del material, con láminas de carbono desordenadas separadas 0,38 nm y poros cerrados, donde entran los iones de sodio (puntos `--ion`).
  - Es la idea que alguien se lleva en la cabeza.

### 3.2 Identidad

**Tokens** (`src/styles/tokens.css`)

```css
:root {
  /* carbón */
  --char: #15191A;  --char-2: #1D2320;  --char-rule: #333B35;
  --char-ink: #EEF0E7;  --char-muted: #A9B0A4;
  /* papel */
  --paper: #F6F4EE;  --surface: #FFFFFF;  --ink: #1B201C;  --muted: #5D655E;
  --rule: #D8DCD0;  --rule-2: #E9ECE3;  --grid: rgba(27,32,28,.06);
  /* oliva: materia y producto */
  --olive: #5B6B2E;  --olive-d: #3C4A1C;  --olive-m: #8C9A55;
  --olive-l: #A3B465;  /* sobre carbón */  --olive-p: #DDE3C8;
  /* ocre: calor y gases */
  --ochre: #B9862C;  --ochre-l: #D6A54A;  --ochre-p: #F1E2BF;
  /* terracota: riesgo, crítico, flujo negativo */
  --terra: #A35A3A;  --terra-l: #D88A66;  --terra-p: #F1DCD0;
  /* ion: sodio y electricidad; --ion-d para texto sobre papel */
  --ion: #16AEBF;  --ion-d: #0E7F8C;  --ion-p: #D7EFF2;
}
```

**Significado fijo de los colores** en todas las figuras:
- oliva: materia y producto;
- ocre: calor, gases y energía térmica;
- ion: sodio, electricidad y agua evaporada;
- gris (`--muted`): minerales y rechazos;
- terracota: flujos negativos, camino crítico y alertas.

No añadas colores nuevos salvo grises neutros. Comprueba el contraste de cada pareja texto/fondo que uses; `--olive-l` y `--ion` solo sirven para texto sobre carbón.

**Tipografía**, autoalojada con `@fontsource` y `font-display: swap`:
- Source Serif 4, variable con eje óptico: titulares, cifras grandes y el logotipo, en peso 600, con `opsz` alto en los titulares.
- IBM Plex Sans 400, 500 y 600, más la cursiva 400: el texto.
- IBM Plex Mono 400 y 500: números de corriente, etiquetas de equipos (TO-101, HE-501), tablas de datos, cajetín e índices de sección.
- IBM Plex Sans Condensed 500 y 600: rótulos dentro de diagramas.
- Las cifras siempre en `font-variant-numeric: tabular-nums` cuando cambian, como en el simulador y los contadores.

**Logotipo** (`brand/`)
- La marca es una almendra girada −32°, en oliva, con un hexágono de trazo claro y un punto `--ion` en el centro.
- El logotipo escrito es **OLEA** en oliva y **CARB** en tinta sobre papel, o en `--char-ink` sobre carbón: Source Serif 4, 600, con un espaciado de 0,06 em.
- Los SVG de `brand/` usan `<text>`. En la web, compón el logotipo escrito con HTML y la fuente real, y usa el SVG solo para la marca.
- Favicon: la marca en SVG más un PNG de 180 px para iOS.

### 3.3 Composición

- Retícula de 12 columnas con un ancho máximo de 1.240 px. El texto corrido va a 62–68 caracteres por línea.
- La composición varía de verdad entre secciones:
  - texto a la izquierda con la figura sangrando a la derecha;
  - figura a sangre y texto en un margen;
  - cifra gigante con texto en columna estrecha;
  - y así con las demás.
- Una o dos piezas por sección rompen la retícula: un número enorme de Source Serif cortado por el borde, o una cota que cruza dos columnas.
- El índice de sección, en Plex Mono pequeño y en margen (`02 / Proceso` o `G-02`), va como en un plano. No uses antetítulos en mayúsculas espaciadas encima de cada sección.
- Radios pequeños y distintos según el elemento: 2 px en etiquetas, 4 px en botones, 0 en figuras y hojas. No unifiques todo con `rounded-2xl`.
- Las sombras solo aparecen en la maqueta 3D y en el *bottom sheet* del móvil.

### 3.4 Movimiento

Hay pocos momentos y todos tienen intención:
1. la entrada de la portada;
2. el viaje de una tonelada, fijado con *scrub*;
3. los flujos del PFD y del Sankey, con partículas que corren a una velocidad que depende del caudal;
4. el vuelo de cámara por la maqueta 3D.

El resto va con transiciones de 150–250 ms y `ease-out`. Los contadores ruedan una sola vez, la primera vez que entran en pantalla, y solo en las cifras de portada y en los KPI del simulador.

- Lenis para el scroll suave. Desactívalo con `prefers-reduced-motion` y en dispositivos de entrada gruesa si da tirones.
- GSAP con ScrollTrigger para las secciones fijadas. GSAP es gratuito con todos sus plugins, SplitText y DrawSVG incluidos, desde 2025.
- Para movimientos sencillos, CSS antes que JavaScript.
- Nada de "todo aparece deslizándose hacia arriba al hacer scroll". Si una pieza aparece, que sea porque se dibuja (un trazo), se llena (una barra) o se ensambla (un plano).

### 3.5 Lo que no queremos: tics de interfaz hecha por IA

**Evita todo esto:**
- acento morado o índigo, o degradados de morado a azul;
- titulares con texto en degradado;
- fondo crema en toda la página;
- manchas tipo aurora o sombras de color que brillan;
- Inter, Geist o Space Grotesk;
- texto de cuerpo en gris claro;
- antetítulos en mayúsculas espaciadas encima de cada sección;
- portada centrada con "pastilla", titular y dos botones;
- tres tarjetas iguales con un icono en un cuadrado redondeado;
- *bento grid* por defecto;
- `hover:scale-105` en tarjetas;
- emojis como iconos;
- tarjetas con borde de acento a la izquierda;
- tarjetas dentro de tarjetas;
- *glassmorphism* en todas las superficies;
- la misma estructura de sección repetida una y otra vez;
- animaciones que ignoran `prefers-reduced-motion`.

**La web actual cae en varios de estos tics; no los arrastres:**
- fondo crema en toda la página;
- antetítulo en mayúsculas en cada sección;
- "El reto" como tres tarjetas iguales;
- portada con antetítulo, titular y dos botones;
- clase `.rv` que desliza hacia arriba cada bloque.

### 3.6 Cómo se escriben los textos

**Registro**
- Español de España, registro técnico y directo, frases de longitud variada y voz de equipo ("suponemos", "elegimos").
- Puedes reescribir los textos que propongo para el ritmo del diseño, pero sin añadir datos que no estén en `data/` ni afirmaciones sin fuente.

**Prohibido**
- muletillas como "en un mundo cada vez más…", "cabe destacar", "juega un papel crucial" o "en definitiva";
- adjetivos vacíos como innovador, robusto, integral o clave;
- listas de tres por sistema;
- abusar de rayas y negritas;
- cierres que repiten lo dicho.

**Cada afirmación lleva un dato, un cálculo o una fuente.**

**Mayúsculas**
- Los títulos en minúscula salvo la primera palabra y los nombres propios.
- *Hard carbon* va en cursiva dentro del texto corrido.

---

## 4. Arquitectura

```
/                    página única con las secciones de la 5.1 a la 5.13
/video               página del vídeo (sección 7), pensada para abrirse desde un QR
/404                 página de error con enlace a /
```

**Cabecera fija y fina** (56 px):
- a la izquierda, el logotipo, que lleva a `#inicio`;
- a la derecha, la navegación por secciones con la activa marcada;
- en el móvil, un menú desplegable a pantalla completa sobre carbón, con las secciones numeradas y un acceso directo al vídeo y al simulador.

**Barra de progreso** de lectura de 2 px en `--ion` bajo la cabecera. Es opcional.

---

## 5. Secciones

Para cada sección: qué cuenta, qué se ve, con qué datos y cómo se comporta en el móvil. Los textos entre comillas son propuestas.

### 5.1 Portada · `#inicio` · carbón

**Titular:** "Del hueso de aceituna al *ánodo* de las baterías de sodio".

**Entradilla:** "Una planta en Mancha Real que compra cada año 24.157 t de hueso a las almazaras y extractoras de Jaén y lo convierte en *hard carbon*, el material que guarda los iones de sodio en el ánodo. Lo que no acaba en la batería da calor, electricidad, carbón activo y sales."

**Fondo**
- `public/img/hero-olivar.jpg`, una foto de olivar ya en duotono (crédito obligatorio en el pie: "Foto: Veinticuatro de Jahén, CC BY-SA 4.0, virada a duotono"), con un ligero paralaje.
- Encima, un lienzo (canvas 2D o WebGL ligero) con un teselado de almendras como el del inicio del vídeo (`reference/video-stage.html`, escena s1). Por él derivan iones de sodio (puntos `--ion` con un halo débil) que el puntero o la inclinación del móvil atraen suavemente.
- Con movimiento reducido, imagen fija.

**Entrada:** el titular se revela por líneas (SplitText). Las cifras ruedan una vez.

**Cifras** (`key-figures.json`), en una fila de cinco que en el móvil pasa a un carrusel horizontal con *snap* o a dos columnas:

| Cifra | Texto |
|---|---|
| 3.225 t/año | de *hard carbon* con un 15 % de rendimiento (3.010 t con el 14 % de diseño) |
| 61,6 M€ | de inversión en la planta (± 30 %) |
| 55 | empleos directos (tres turnos, cinco equipos) |
| 73 % | de la electricidad, producida en la propia planta |
| 0 t | a vertedero (un 2 % de rechazos va a árido) |

**Llamada a la acción:** una sola acción principal, "Sigue una tonelada", que lleva a `#viaje`. Un acceso discreto al vídeo con miniatura y duración, 1:19. Nada de dos botones gemelos.

### 5.2 El reto · `#reto` · papel

**Titular:** "Europa quiere baterías sin litio, pero el ánodo sigue llegando de Asia".

**Composición:** una afirmación grande con tres datos que se apoyan en figuras pequeñas distintas entre sí, no en tres tarjetas iguales.

- **Gofre de 10 × 10.** Más del 95 % de la capacidad de celdas de sodio prevista para 2030 está en China (IEA, 17-02-2026). Rellena 96 cuadros en `--terra` y deja el resto en `--olive`, con la etiqueta "> 95 %". En Europa empiezan Bihar Batteries (Gipuzkoa, línea piloto) y Altris (Suecia).
- **Cuenta animada.** Cada kWh de celda consume entre 1,2 y 1,5 kg de *hard carbon* (SMM, sep-2026; SPIR, 2026). Solo el contrato de CATL con HyperStrong, 60 GWh en tres años, pide a 1,5 kg/kWh unas 90.000 t, más que toda la producción mundial de 2025 (Energy-Storage.news, 27-04-2026). Se ve como `60 GWh × 1,5 kg/kWh = 90.000 t`.
- **Barra de precursores.** En 2025 los precursores fueron un 54 % biomasa y un 32 % cáscara de coco (SPIR 2025), y el coco escasea.
- **Comparación de valor.** El hueso de aceituna se vende como combustible a unos 0,20 €/kg (AVEBIOM, 2T-2026: 204 €/t sin IVA, entregado). A la planta le cuesta 0,18 €/kg seco puesto en planta (176 €/t, modelo). Convertido en ánodo, carbón activo y energía vale unos 1,02 €/kg seco, cinco o seis veces más (ventas de un año tipo, 21,98 M€, entre 21.500 t).
- **Cierre:** con 1,2–1,5 kg/kWh, las 3.010–3.225 t/año de la planta abastecen entre 2 y 2,5 GWh de celdas al año: una línea piloto grande o una fábrica pequeña.

### 5.3 Territorio · `#territorio` · papel, hoja de plano

**Titular:** "Hueso de seis municipios, a 44 km de media".

**Mapa de la provincia de Jaén** (contorno de `es-atlas` en npm, provincias en TopoJSON):
- la planta en Mancha Real y anillos de 25 y 50 km;
- arcos de suministro animados desde cada municipio, con un grosor proporcional a las t/año de `territory.json`:

  | Origen | t/año |
  |---|---|
  | El Tejar, en Mancha Real (25 %, por cinta, sin camiones) | 6.000 |
  | Jaén | 4.000 |
  | Baeza | 4.000 |
  | Bailén | 4.000 |
  | Úbeda | 3.000 |
  | Villanueva del Arzobispo | 3.000 |

- marcadores secundarios:
  - Carboliva, en Puente del Obispo, una referencia de pirólisis de hueso a unos 20 km;
  - Linares, plan B en el Parque Empresarial Santana.

**Textos:**
- unos 730 camiones de hueso al año, 917 contando producto y reactivos;
- 44 km de media por carretera (36 km en línea recta según el equipo);
- Jaén genera entre 159.000 y 289.000 t de hueso al año, y la planta compra entre el 8 y el 15 %;
- estar junto a El Tejar, con suelo, una cuarta parte del hueso por cinta y servicios compartidos, vale unos 6 M€ de VAN frente a una parcela aislada.

**Móvil:** el mapa a todo el ancho y la lista de municipios debajo como tabla.

### 5.4 El viaje de una tonelada · `#viaje` · carbón · la pieza memorable

**Titular:** "Una tonelada de hueso, siete paradas".

**Entradilla:** "Sigue 1.000 kg de hueso tal como llega de la almazara, con un 11 % de humedad. Al final quedan 124,6 kg de *hard carbon*; el resto es calor, electricidad, carbón activo y sales."

**Sección fijada** con *scrub*, siete pasos y uno final. Datos en `process.json → por_tonelada` y `temperaturas_C`:

| Paso | Etapa | Qué pasa | kg que siguen | T |
|---|---|---|---|---|
| 1 | Recepción | criba y separador magnético; salen 20,0 kg de rechazos a árido | 980,0 | 20 °C |
| 2 | Secado | se evaporan 107,8 kg de agua con calor residual del ORC | 872,2 | aire a 90–110 °C |
| 3 | Pirólisis | 693,4 kg pasan a volátiles, que van al oxidador y calientan toda la planta | 178,8 de carbonizado | 550 °C |
| 4 | Lavado ácido | HCl 2 M retira 5,4 kg de minerales, que salen como sales | 173,4 | 40 °C |
| 5 | Carbonización | 29,5 kg de gases al oxidador; nace la microestructura | 144,0 | 1.300 °C |
| 6 | Molienda | 19,4 kg de finos, que se activan y dan 7,9 kg de carbón activo | 124,6 | 40 °C |
| 7 | Envasado | lote de 10 t con certificado; ≥ 330 mAh/g e ICE ≥ 88 % | **124,6 kg de *hard carbon*** | 30 °C |
| Final | La celda | 124,6 kg dan para unos 83–104 kWh de celdas de sodio (a 1,2–1,5 kg/kWh) | | |

**Qué se ve**
- **El hueso.** Una almendra en SVG que cambia de color de ocre a negro, encoge en proporción a la masa (escala por raíz cúbica para que se perciba) y se agrieta en la pirólisis.
- **Una barra de masa** vertical a la izquierda con la cifra rodando, y **un termómetro** a la derecha.
- **Las salidas de cada etapa** (agua, volátiles, sales, gases, finos) se despegan como partículas del color de su corriente y salen de cuadro. Así se ve que nada se tira.
- **La microestructura** en el paso 5:
  - zoom hasta láminas cortas y curvadas, al estilo "castillo de naipes", separadas 0,38 nm;
  - poros cerrados;
  - iones Na⁺ que entran entre las láminas y en los poros;
  - una leyenda breve: "Así guarda la energía el ánodo: el sodio se aloja entre láminas desordenadas y en poros cerrados".
- **Al final**, el polvo se deposita como recubrimiento negro sobre una lámina de aluminio que se enrolla en una celda. Una ilustración esquemática basta; nada fotorrealista.

**Móvil:** el mismo efecto fijado, con los datos en una franja inferior. Comprueba que el *scrub* no se pelea con la barra de direcciones de iOS (usa `svh`).

**Movimiento reducido:** siete bloques estáticos con la misma información y la ilustración final fija.

### 5.5 Proceso · `#proceso` · papel, hoja de plano · ancla en QR

**Titular:** "Siete etapas y ningún residuo a vertedero".

**PFD vivo**, con la referencia en `reference/figures/pfd.svg` (el de la memoria) y la versión animada actual en `reference/current-site.html`:
- Las 16 corrientes de `process.json → streams` se numeran en un círculo de Plex Mono.
- Cada corriente es un trayecto SVG con partículas que corren a lo largo. El grosor y la velocidad van con el logaritmo del caudal.
- Los colores siguen el código de la sección 3.2.
- Al pasar o tocar una corriente sale su ficha: número, nombre, t/año, t/h, °C, origen y destino.
- Al tocar una etapa se abre su panel con los textos de `process.json → stages` (`title`, `cond`, `text`, `kv`) y la lista de equipos de esa área de `equipment` (etiqueta, nombre, especificación y potencia), con la etiqueta en Plex Mono.
- El bucle de energía se marca en ocre: "el calor vuelve a secado, pirólisis y activación".
- Un botón "Ver tabla de corrientes" muestra las 16 corrientes como tabla accesible.

**Móvil:** no escales el PFD de escritorio hasta que no se lea. Haz un PFD vertical propio: las etapas en columna y las secundarias como ramas laterales cortas, con el mismo código de colores y los mismos números de corriente. Usa `matchMedia` para elegir el diseño.

**En la etapa de carbonización**, un pequeño recuadro enlaza al viaje (`#viaje`) para ver la microestructura.

### 5.6 Planta · `#planta` · papel, hoja de plano · ancla en QR

**Titular:** "Cuatro hectáreas junto a la extractora de El Tejar".

**Plano 2D a escala** con `plant.json`:
- **Geometría.** Parcela de 200 × 200 m, edificios con `x, y, w, h` en metros, viales, zona verde y la extractora vecina al norte.
- **Elementos de plano:**
  - cotas de la parcela, norte y escala gráfica de 0–50 m;
  - cajetín `G-01 · Implantación · 1:1.000 · OLEACARB`;
  - las etiquetas de zona en Plex Mono.
- **Interacción:**
  - zoom con rueda y con pellizco, y arrastre;
  - botones +, − y encuadrar;
  - chips de categoría (Proceso, Almacenes, Servicios, Seguridad, Personas) que resaltan su grupo;
  - al tocar un edificio, una ficha con nombre, superficie, dimensiones, el texto `text` y hasta seis equipos.
- **La ruta de materiales**, del 1 al 7 (`route`), se dibuja como una línea `--ion` que recorre la planta.

**Maqueta 3D** (botón "Ver en 3D"; carga three.js con `import()` solo entonces):
- **Geometría.**
  - Volúmenes extruidos desde el mismo JSON con `height_m`.
  - Si una zona no tiene altura, usa 6 m en servicios y 3 m en exteriores. La chimenea mide 30 m.
  - SI son cuatro cilindros de Ø 10,5 m y 16 m.
- **Aspecto.**
  - Materiales mate en la paleta: proceso en oliva, almacenes en ocre, personas en ion y servicios en gris.
  - Sombras suaves con una luz cálida rasante del sureste.
  - Las cubiertas de las naves de proceso llevan un rayado fino de placas fotovoltaicas: son 0,8 MWp.
  - La extractora de El Tejar va en volumen fantasma.
- **Cámara.** Órbita limitada con un `minPolarAngle` y un `maxPolarAngle` razonables y un zoom con tope.
- **Recorrido guiado.** Un botón "Recorrido" vuela con la cámara por las siete paradas de `route`, con una tarjeta por parada; es el equivalente interactivo de la escena s5 del vídeo.
- **Fichas.** Al tocar un edificio se abre la misma ficha que en 2D.
- **Rendimiento.** Si `navigator.hardwareConcurrency` es menor de 4, o no hay WebGL, el botón no aparece y queda el 2D.

**Datos al margen:**
- 40.000 m² de parcela (`superficie` para lo construido y la ocupación);
- alturas supuestas a falta del proyecto de estructuras (dilo en la leyenda).

**Móvil:** el plano a todo el ancho, la ficha en *bottom sheet* arrastrable y la maqueta 3D a pantalla completa con un botón de cerrar claro.

### 5.7 Balances · `#balances` · carbón

**Titular:** "Dónde va cada tonelada y cada kilovatio hora".

**Sankey** con `d3-sankey` y los datos de `balances.json` (`mass.nodes` y `mass.links` en t/año; `energy.nodes` y `energy.links` en GWh/año):
- un selector entre Materia y Energía, con una transición en la que las bandas se reordenan, no un corte;
- partículas que circulan por las bandas;
- *hard carbon* destacado en `--olive-l` y en negrita;
- etiquetas con valor y unidad; al tocar una banda sale su valor y su porcentaje sobre la entrada.

**Bajo el Sankey, tres cifras:**
- el 28,7 % del carbono del hueso queda fijado en *hard carbon* y carbón activo;
- el 100 % del calor de proceso sale de los gases de la propia planta;
- basta una conexión a red de 1,2 MW en lugar de 2,6, algo clave en una provincia con la red saturada.

**Anillo de electricidad** (12,71 GWh/año):
- ORC, 62,6 %;
- fotovoltaica, 10,4 %;
- red, 27,0 %.

**Móvil:** el Sankey en vertical o con desplazamiento horizontal guiado y etiquetas legibles a 12 px como mínimo. Prueba las dos opciones y quédate con la más legible.

### 5.8 Calendario · `#calendario` · papel

**Titular:** "3,7 M€ en juego antes de decidir construir".

**Diagrama de Gantt** con las 25 actividades de `timeline.json`, en meses desde enero de 2027:
- el camino crítico en `--terra`;
- la holgura como bigote;
- las fases como bandas.

**Los hitos son puertas:**
- Hito 1, en diciembre de 2027: rendimiento de al menos el 15 % sobre hueso seco, 330 mAh/g o más, ICE de al menos el 88 % y cartas de intención a 7 €/kg o más;
- Hito 2, en diciembre de 2029: contratos firmes por al menos 1.500 t/año a 7 €/kg o más, la AAI encarrilada, el acuerdo con El Tejar firmado y la financiación resuelta, y con eso la decisión de construir;
- arranque en enero de 2032.

**Capital acumulado** en tres escalones: 0,6, 3,7 y 65,3 M€.
- El salto es enorme; muéstralo con un eje partido bien señalado, o con dos paneles, y nunca con una escala engañosa.
- Mensaje: si el Hito 2 no se cumple, se para con 3,7 M€ gastados y no con 65.

**Móvil:** un Gantt simplificado que solo muestra fases e hitos, con "Ver todas las actividades" en un panel desplegable.

### 5.9 Simulador · `#simulador` · papel · ancla en QR

**Titular:** "¿Cuándo crea valor la planta?".

**Entradilla:** "Es el mismo modelo de la memoria, en euros constantes de 2026, con una tasa real del 8 % y flujos de 2027 a 2051. A 7 €/kg y un 15 % de rendimiento la planta queda en el umbral: VAN de −0,2 M€ y TIR del 7,9 %. Con un 30 % de ayuda regional pasa a +9,4 M€."

La especificación completa está en la sección 6.

### 5.10 Impacto · `#impacto` · papel

**Titular:** "0,21 kg de CO₂ fósil por kilo de ánodo".

**Huella**, en barras horizontales en escala lineal:
- OLEACARB, 0,21 kg CO₂/kg, con la etiqueta "estimación del equipo pendiente de ACV";
- *hard carbon* de coco, 2,6 kg CO₂/kg;
- grafito sintético, 25,1 kg CO₂/kg.

La barra de OLEACARB casi no se ve, y esa es la gracia. Añade las proporciones: unas 13 veces menos que el coco y unas 120 menos que el grafito sintético. Fuente: Voß et al., *Energy & Environmental Science*, 2025.

**Matriz de impactos:** 42 interacciones valoradas con el método de Conesa: 24 moderados, 9 compatibles y 9 positivos, ninguno severo ni crítico. Va en una barra apilada con la leyenda integrada.

**Qué pasa con cada corriente:** los siete destinos de `impact.json → destinos`, como un diagrama circular de economía circular o como una lista diseñada con su etiqueta (Producto, Coproducto, Subproducto, Energía, Valorizable, Emisión). Si es un círculo, que sea legible en el móvil; si no lo es, usa una lista.

**Otros datos:** unas 11.100 t de CO₂ fijadas al año (`co2_fijado_t`) y unos 917 camiones al año en total (`camiones_ano_total`).

### 5.11 Vídeo · `#video` · carbón

**Titular:** "La planta en 79 segundos".

Un reproductor en línea con póster, el mismo componente de `/video` (sección 7), y el enlace "Abrir a pantalla completa" a `/video`.

### 5.12 Equipo · `#equipo` · papel

**Titular:** "Ocho ingenieros industriales".

**Entradilla:** "OLEACARB es el proyecto del grupo T1 de la asignatura Proyectos del Grado en Ingeniería en Tecnologías Industriales de la ETSII, Universidad Politécnica de Madrid, curso 2026-27, con el profesor Francisco Javier Sánchez como promotor."

**Parejas:**

| Área | Integrantes | Qué hicieron |
|---|---|---|
| Alternativas y emplazamiento | Carlos López Parga · Nicolás Jiménez-Carlés Parga | Seis configuraciones, cinco municipios y la decisión de co-ubicar la planta con El Tejar |
| Estudio económico | Ignacio Tubío Ríos · Nicolás Ferreiro Gil | Mercado, precios, escenarios y financiación por fases |
| Modelo de cálculo | Pablo Javier Sánchez Lomba · Darío González Cuello de Oro | El modelo que alimenta el simulador y su revisión |
| Memoria técnica | Alberto Gómez Serrano · Diego Merino García | Proceso, equipos, planos, presupuesto y tramitación |

**Diseño:** no lo resuelvas con cuatro tarjetas iguales. Usa una composición tipográfica, como una lista editorial con números o un cajetín de firmas como el de un plano.

### 5.13 Fuentes y pie · `#fuentes` · carbón

- La lista de fuentes de la sección 14, con enlaces.
- La nota: "Cifras del modelo revisado de la memoria del proyecto, en euros constantes de 2026. Estimación de estudios previos (± 30 %)."
- El crédito de la foto.
- Asignatura, grupo y fecha.
- Si existe `PUBLIC_MEMORIA_URL` en `src/config.ts`, un botón "Descargar la memoria (PDF)". Si no, no se muestra.

---

## 6. Simulador y modelo económico

### 6.1 Modelo

1. Porta `reference/model.js` a `src/lib/model.ts` línea a línea. Solo añade tipos; no simplifiques ni "mejores" ninguna fórmula.
2. Aplica siempre estos valores sobre `BASE`, que en la web actual llegan por `DATA.base`:
   - `civil_pec = 8.712899838299998`
   - `cost_staff = 47008.35` (exacto en `data/model.test.json → base_overrides`)
3. Regla de ayudas: si `aid_ier > 0`, entonces `aid_test = 0.4`.
4. Pruebas en `tests/model.test.ts` con Vitest.
   - Recorre los 11 casos de `data/model.test.json`.
   - Compara `npv`, `irr`, `pb` (null cuando no recupera), `capex`, `sales37`, `ebitda37`, `breakeven` y el vector `fc` (25 años) con una tolerancia absoluta de 1e-6.
   - El CI falla si alguno no cuadra.
5. Referencias que deben salir con los valores por defecto de cada escenario:

| Escenario | VAN (M€) | TIR | Recuperación desde el arranque | Precio mínimo |
|---|---|---|---|---|
| Prudente (6 €/kg, 14 %) | −18,1 | 3,2 % | 15,4 años | 7,34 €/kg |
| Condiciones del Hito 2 (7 €/kg, 15 %) | −0,2 | 7,9 % | 9,3 años | 7,02 €/kg |
| Hito 2 + ayudas (30 %) | +9,4 | 10,6 % | 7,5 años | 6,33 €/kg |
| Optimista (8 €/kg, 16 %, 30 %) | +29,1 | 15,1 % | 5,7 años | 6,07 €/kg |

### 6.2 Controles

Los de `economics.json → sliders`:
- precio del *hard carbon*, de 4 a 10 €/kg;
- capacidad de hueso seco, de 12.000 a 32.000 t/año;
- inversión frente a la estimada, de ×0,70 a ×1,40;
- coste del hueso en origen, de 100 a 230 €/t;
- rendimiento, del 12 al 16 %;
- ayuda regional: 0, 10, 20 o 30 %.

Las notas de cada control están en el JSON; por ejemplo, "Gama alta china 6,1–7,3 €/kg · importado ≈ 10,5–11 €/kg".

**Presets:** los cuatro escenarios, con "Condiciones del Hito 2" marcado al cargar.

**Controles a medida:**
- deslizadores accesibles con `<input type="range">` estilizado y con etiqueta y valor en vivo;
- en el riel del precio, una marca con el precio mínimo para VAN = 0 que se mueve al cambiar los demás parámetros;
- en el riel de capacidad, una nota con el *hard carbon* resultante y el hueso comprado (`ms / 0,89`).

### 6.3 Resultados

**KPI** que ruedan al cambiar (con un *tween* corto de 200 ms):
- VAN real al 8 %, en oliva si es mayor o igual que 0 y en terracota si es negativo;
- TIR real del proyecto;
- recuperación desde el arranque ("no recupera" si es NaN);
- precio mínimo para VAN = 0.

**Veredicto**, como el actual:
- VAN > 2 M€: "Crea valor";
- −2 M€ < VAN ≤ 2 M€: "En el umbral";
- VAN ≤ −2 M€: "Destruye valor".

Cada uno con su frase.

**Gráfico de flujo de caja**, de 2027 a 2051:
- barras anuales en oliva y terracota, con transiciones animadas entre estados;
- una línea del acumulado en `--ion`;
- una marca del año de recuperación y de la exposición máxima (el mínimo del acumulado).

**Cifras pequeñas:**
- inversión total en planta;
- ventas en un año tipo (2037);
- EBITDA en un año tipo.

**Tornado en vivo** alrededor del punto actual:
- usa los once parámetros y rangos de `economics.json → tornado_C`, con sus `lo` y `hi` y las mismas reglas (en `aid_ier`, el valor alto lleva `aid_test = 0,4`; `delay` va en enteros);
- son 22 ejecuciones del modelo, así que cabe en cada cambio con *debounce* de 120 ms.

**Monte Carlo** bajo demanda:
- un botón "Lanzar 4.000 simulaciones" que corre en un Web Worker con las distribuciones triangulares de `economics.json → montecarlo`;
- dos modos, "Hoy" y "Condicionado al Hito 2";
- un histograma que se llena en vivo y la probabilidad de que el VAN sea positivo.
- Con otro generador aleatorio el resultado debe quedar a ±2 puntos de lo que da la memoria: un 15 % hoy y un 88 % condicionado.
- Usa un PRNG con semilla, como mulberry32, para que sea reproducible.

**Estado compartible en la URL:** `?p=7&y=0.15&ms=21500&cx=1&b=150&a=0`. Copia del enlace con un botón, y `#simulador` respetado.

**Pie:** "Modelo revisado de la memoria (capítulo 15 y anexos A y C). Sin financiación: el préstamo no cambia el VAN del proyecto. Las ayudas se tratan como fondos propios no reembolsables."

### 6.4 Móvil

- Una barra fija con el VAN y la TIR en la parte superior de la sección mientras se mueven los deslizadores, para ver el efecto sin hacer scroll.
- El gráfico va debajo.
- El tornado y el Monte Carlo, en pestañas.

---

## 7. Vídeo · ruta `/video`

Es lo que abrirá el QR del vídeo en la memoria. Está pensado para abrirse en frío en un móvil.

**Archivos:**
- `public/video/oleacarb-1080.mp4`: 1920 × 1080, 30 fps, H.264 + AAC, 20,3 MB, *faststart*;
- `public/video/oleacarb-720.mp4`: 1280 × 720, 5,4 MB;
- `public/video/poster.jpg`;
- `public/img/og-video.jpg`: 1200 × 630.

Ya están preparados. No los recomprimas. El de 1080p llega aparte del kit: si no está, usa solo el de 720p y deja preparada la lógica para añadirlo después sin tocar código (que compruebe con un `HEAD` si el archivo existe).

**Selección del archivo:**
- 720p por defecto en pantallas de menos de 1.000 px de ancho o con `navigator.connection.saveData`;
- 1080p en el resto.

Hazlo por JS antes de asignar `src`, con un `<video preload="metadata" playsinline controls poster>`.

**Página**
- Fondo carbón, el logotipo y el título "OLEACARB · La planta en 79 segundos".
- Una frase: "Del hueso de aceituna al ánodo de sodio: el problema, el proceso, un recorrido por la planta y las cifras clave."
- El reproductor grande con controles a medida en la identidad: reproducir, barra de progreso en `--ion`, silencio y pantalla completa. Detrás va el `<video>` nativo, así que sigue siendo accesible.
- Debajo:
  - "Ver la web" (enlace a `/`);
  - "Descargar MP4" (enlace a la versión de 1080p con `download`);
  - la duración, 1:19.
- Los textos del vídeo están quemados en la imagen y no hay voz, así que no hacen falta subtítulos. Añade un `aria-label` descriptivo.

**Etiquetas Open Graph:** `og:type=video.other`, `og:video` apuntando a la URL absoluta del MP4 de 720p, `og:image=og-video.jpg` y `twitter:card=summary_large_image`.

**Caché** en `vercel.json`: `Cache-Control: public, max-age=31536000, immutable` para `/video/*`.

**Configuración opcional:** si algún día se sube a YouTube, se admite `PUBLIC_YOUTUBE_ID` en `src/config.ts`. Si existe, se usa una fachada ligera (una imagen y un botón; el iframe de `youtube-nocookie.com` solo se carga al pulsar). Por defecto está vacío y se usa el MP4 propio.

---

## 8. Stack

- **Astro**, última estable, salida estática y TypeScript estricto.
- **Islas Svelte 5** (`@astrojs/svelte`) para el simulador, la ficha de planta, el reproductor y el selector del Sankey. Lo demás, en scripts de Astro sin framework.
- **GSAP** con ScrollTrigger y SplitText, y **Lenis** para el scroll suave. Sincronízalos: `lenis.on('scroll', ScrollTrigger.update)` y el `ticker` de GSAP llamando a `lenis.raf`.
- **d3**, en módulos sueltos (`d3-scale`, `d3-shape`, `d3-sankey`, `d3-geo`, `topojson-client`), y `es-atlas` para el contorno de Jaén. Nada de bibliotecas de gráficos genéricas (Chart.js, Recharts), que dan un aspecto genérico.
- **three.js** a pelo, sin React, cargado con `import()` solo al pulsar "Ver en 3D".
- **Fuentes:** `@fontsource-variable/source-serif-4`, `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono` y `@fontsource/ibm-plex-sans-condensed`, con los subconjuntos latin y latin-ext.
- **Calidad:**
  - Vitest para el modelo;
  - Playwright para e2e y capturas, con Chromium y WebKit para simular iOS Safari;
  - Lighthouse CI o `@lhci/cli` en local.
- Sin Tailwind: CSS propio con *custom properties* y capas (`@layer tokens, base, components, sections`).
- Versiones fijadas en `package-lock.json`. Node 20 LTS o posterior.

Estructura propuesta:

```
oleacarb-web/
├─ src/
│  ├─ pages/            index.astro · video.astro · 404.astro
│  ├─ sections/         Hero · Reto · Territorio · Viaje · Proceso · Planta · Balances · Calendario · Simulador · Impacto · Video · Equipo · Fuentes
│  ├─ components/       Header · Logo · Figure · Source · Counter · Sheet (hoja de plano con cajetín) · VideoPlayer.svelte · Simulator.svelte …
│  ├─ lib/              model.ts · format.ts · data.ts · motion.ts (Lenis+GSAP, reduced motion) · anchors.ts
│  ├─ workers/          montecarlo.worker.ts
│  ├─ data/             *.json  ← copiados de data/ del kit
│  ├─ styles/           tokens.css · base.css · sections/*.css
│  └─ config.ts         PUBLIC_MEMORIA_URL, PUBLIC_YOUTUBE_ID, SITE_URL
├─ public/              video/ · img/ · favicon.svg · apple-touch-icon.png · og.jpg
├─ tests/               model.test.ts · e2e/*.spec.ts
├─ docs/                BRIEF.md · reference/ · screens/ (capturas de revisión)
├─ .github/workflows/ci.yml
├─ vercel.json
└─ README.md
```

---

## 9. GitHub y Vercel

**GitHub**
- Inicializa git y crea el repositorio con `gh repo create oleacarb-web --private --source . --push`.
  - Puede ser público si el equipo lo prefiere.
  - Si `gh` no está autenticado, pide al usuario que ejecute `gh auth login` y espera.
  - El vídeo de 20 MB cabe en git sin LFS.
- **CI** (`.github/workflows/ci.yml`): en cada *push* y *pull request*, `npm ci`, `npm run check` (`astro check`), `npm test` (Vitest) y `npm run build`.

**Vercel.** Elige la vía que esté disponible:
- **A, recomendada.** El usuario entra en vercel.com con su cuenta de GitHub, Add New → Project, importa `oleacarb-web` y despliega. Astro se detecta solo: `npm run build` y salida `dist`. Cada *push* a `main` despliega a producción y cada PR tiene vista previa.
- **B.** `npx vercel link` y `npx vercel --prod` desde la terminal, con un `vercel login` previo del usuario.

**Dominio y cuenta**
- Nombre del proyecto en Vercel: `oleacarb`, para que la URL sea `https://oleacarb.vercel.app`. Si está cogido, `oleacarb-t1` o similar. Cuanto más corta, mejor sale el QR.
- No hacen falta variables de entorno.
- El plan Hobby de Vercel es para uso no comercial, y un proyecto universitario lo es.

**`vercel.json`:**
- cabeceras de caché para `/video/*`, `/_astro/*` y las fuentes;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`.

**`astro.config`:** pon `site` con la URL final para que las etiquetas OG y el `canonical` sean absolutos.

---

## 10. Calidad

### 10.1 Pruebas automáticas

**Vitest:** los 11 casos del modelo, con el formato `es-ES` incluido (miles con punto, decimales con coma y el signo U+2212).

**Playwright e2e**, con Chromium y WebKit, en viewports de 390 × 844 y 1440 × 900:
- cada ancla de la sección 2, en carga en frío, deja el `h2` de su sección visible bajo la cabecera;
- `document.documentElement.scrollWidth <= innerWidth` en 360, 375, 390, 768, 1024 y 1440 px;
- en el simulador, el preset "Condiciones del Hito 2" muestra «−0,2 M€» y «7,9 %», y "Hito 2 + ayudas" muestra «9,4 M€»;
- `/video` carga, el `<video>` tiene `src` y `poster`, y el MP4 responde 200 con `Accept-Ranges`;
- con `reducedMotion: 'reduce'` no hay secciones fijadas y todo el contenido es visible.

### 10.2 Revisión visual

Haz capturas de página completa y por sección a 390 px y a 1440 px y guárdalas en `docs/screens/`. **Míralas una a una** con tu herramienta de lectura de imágenes.

Busca en cada una:
- texto cortado o solapado;
- etiquetas ilegibles en los diagramas (menos de 11 px en el móvil);
- viudas en los titulares;
- huecos muertos;
- contraste dudoso;
- elementos que se salen del ancho;
- incoherencias de cifras con `data/`;
- y cualquier tic de la sección 3.5.

Corrige y repite hasta que no quede nada. Incluye capturas de estados intermedios del viaje de una tonelada (pasos 1, 3, 5 y final), del Sankey en los dos modos, de la ficha de planta abierta, de la maqueta 3D y del simulador con cada preset.

### 10.3 Lighthouse

En el móvil, sobre la build de producción:
- Rendimiento ≥ 90;
- Accesibilidad ≥ 95;
- Buenas prácticas ≥ 95;
- SEO ≥ 95.

Apunta las cifras en el README.

---

## 11. Terminado quiere decir

- [ ] Las 13 secciones y `/video` están hechas con los datos de `data/` y ninguna cifra inventada.
- [ ] `npm test` pasa los 11 casos del modelo con una tolerancia de 1e-6.
- [ ] `/`, `/#proceso`, `/#planta`, `/#simulador` y `/video` funcionan en carga en frío en Chromium y en WebKit, en el móvil y en escritorio.
- [ ] No hay scroll horizontal entre 360 y 1440 px; la versión móvil del PFD es vertical; la ficha de planta es un *bottom sheet*.
- [ ] Hay alternativa con movimiento reducido en todo; el teclado funciona y el foco se ve.
- [ ] Lighthouse móvil cumple los umbrales de la sección 10.3.
- [ ] Las capturas de revisión están en `docs/screens/` y no se ve nada de la lista de la sección 3.5.
- [ ] El repositorio está en GitHub con el CI en verde, desplegado en Vercel, y la URL de producción anotada en el README.
- [ ] **Informe final al usuario:**
  - la URL de producción;
  - las cinco direcciones probadas, que van a los QR de la memoria;
  - las cifras de Lighthouse;
  - las decisiones de diseño que tomaste, en cinco líneas;
  - lo que no se pudo hacer y por qué.

---

## 12. Inventario del kit

| Ruta | Qué es |
|---|---|
| `BRIEF.md` | Este documento |
| `PROMPT.md` | El encargo para pegar en Claude Code |
| `data/key-figures.json` | Cifras clave de portada y resumen, escenarios y financiación |
| `data/process.json` | Etapas con sus textos, 16 corrientes del PFD, 30 equipos, la tonelada paso a paso, temperaturas y microestructura |
| `data/balances.json` | Sankey de materia y de energía (nodos y enlaces), electricidad, química, carbono y la geometría del Sankey actual |
| `data/plant.json` | Parcela, edificios (m), alturas, categorías, textos, equipos, viales, ruta 1–7 |
| `data/territory.json` | Municipios con coordenadas y t/año de suministro, y referencias |
| `data/economics.json` | Escenarios con sus KPI y series 2027–2051, CAPEX por partidas, tornado C y P, Monte Carlo (distribuciones y 4.000 resultados), presets y controles |
| `data/timeline.json` | 25 actividades del CPM con camino crítico y holguras, fases con capital, hitos |
| `data/impact.json` | Huella comparada, Conesa, destinos de las corrientes, CO₂ fijado |
| `data/model.test.json` | 11 casos de prueba del simulador (valores del modelo Python de la memoria, verificados contra `model.js`) |
| `reference/model.js` | Modelo económico de referencia (JS) |
| `reference/current-site.html` | La web actual completa (una sola página) |
| `reference/video-stage.html` | El código de la animación del vídeo: teselado de almendras, mapa y planta isométrica |
| `reference/figures/*.svg` | Figuras de la memoria: PFD, P&ID, implantación, isométrica, Sankey, Gantt, tornado, Monte Carlo, flujo de caja, situación, bloques, CAPEX, escenarios, suministro |
| `reference/screenshots/*.jpg` | Capturas de la web actual (claro y oscuro, móvil y escritorio) |
| `brand/*.svg` | Marca y logotipo escrito, en claro y en oscuro |
| `public/img/hero-olivar.jpg` | Foto de portada en duotono, 1.600 × 1.280 (CC BY-SA 4.0) |
| `public/img/og-video.jpg` | Imagen OG del vídeo |
| `public/video/*` | MP4 de 720p y el póster. El de 1080p (`oleacarb-1080.mp4`, 20,3 MB) llega aparte por tamaño: si está en la raíz, muévelo a `public/video/`. |

---

## 13. Erratas de la web actual que no hay que copiar

| Web actual | Correcto |
|---|---|
| "1,5 kg de hard carbon por cada kWh" | 1,2–1,5 kg/kWh. El contrato de CATL y HyperStrong se calcula a 1,5. |
| "Hoy se quema como combustible a unos 0,18 € por kilo seco entregado" | Como combustible se vende a ≈ 0,20 €/kg (AVEBIOM 2T-2026, 204 €/t sin IVA, entregado). 0,18 €/kg es lo que le cuesta a la planta, seco y puesto en planta (176 €/t, modelo). |
| "el 5 % de lo que se vende en España" | ≈ 7,5 % de las 323.500 t que se comercializaban en España en 2018 (AVEBIOM), y entre el 8 y el 15 % del hueso que genera Jaén (159.000–289.000 t/año) |
| "hoy se hace sobre todo con cáscara de coco en China" | En 2025 los precursores fueron un 54 % biomasa y un 32 % coco (SPIR 2025). Más del 95 % de la capacidad de celdas de 2030 está en China (IEA). |
| "55 empleos directos en cinco turnos" | 55 empleos directos, en tres turnos diarios con cinco equipos |
| Cifra de la báscula compartida con El Tejar | La planta tiene báscula propia: la de El Tejar está en su entrada norte y se satura en campaña |

---

## 14. Fuentes

Cita cada una junto a su dato. Lista completa para `#fuentes`:

- IEA (2026). *Sodium-ion battery momentum grows, but challenges remain*. 17-02-2026. https://www.iea.org/commentaries/sodium-ion-battery-momentum-grows-but-challenges-remain
- SMM (2026). *Sodium-ion battery included in the strengthened list during the 15th Five-Year Plan*. Sep-2026. https://news.metal.com/newscontent/104121178
- SPIR (Qidian Research Institute), recopilado por NaCells (2026). *Hard carbon anode market report 2026*. https://www.nacells.com/reports/hard-carbon-2026
- Energy-Storage.news (2026). *CATL and HyperStrong sign 60 GWh sodium-ion agreement*. 27-04-2026. https://www.energy-storage.news/a-turning-point-catl-and-hyperstrong-sign-60gwh-sodium-ion-agreement/
- CRU (2026). *Sodium-ion battery technology gains traction in 2026*. 06-03-2026. https://www.crugroup.com/en/communities/thought-leadership/2026/Sodium-ion-battery-technology-gains-traction-in-2026
- ESS News (2026). *Spain's Bihar Batteries targets sodium-ion pilot cell line by 2027*. 18-06-2026. https://www.ess-news.com/2026/06/18/spains-bihar-batteries-targets-sodium-ion-pilot-cell-line-by-2027/
- AVEBIOM (2026). Índice de precios de biocombustibles, 2T-2026. https://garzongreenenergy.es/blog/precio-hueso-de-aceituna-2026/
- Agronews Castilla y León (2018), con datos de AVEBIOM: ventas de hueso de aceituna como biocombustible. https://www.agronewscastillayleon.com/las-ventas-del-hueso-de-aceituna-como-biocombustible-ascienden-casi-51-millones-de-euros-anuales
- El Español · Invertia (2026). *El biochar se pone de moda en España* (Carboliva). 23-08-2026. https://www.elespanol.com/invertia/20260823/biochar-pone-moda-espana-afronta-reto-incrementar-toneladas-produccion/1003744359818_0.html
- Voß, T. et al. (2025). Energy and carbon footprint of hard carbon and graphite anode production. *Energy & Environmental Science*, 18, 8104. https://pubs.rsc.org/en/content/articlepdf/2025/ee/d5ee00415b
- Recio-Ruiz, R. et al. (2025). Olive stone pyrolysis and char properties. *Biomass and Bioenergy*, 196, 107676. https://riuma.uma.es/bitstreams/b2a1b6a5-6ace-411f-80bf-ee83b4cf410b/download
- OLEACARB (2026). Memoria del proyecto: modelo revisado, capítulos 4–16 y anexos A–H. Fuente de todas las cifras de planta y economía.
