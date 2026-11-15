# OLEACARB · web v2

Web del proyecto OLEACARB (Grupo T1, Proyectos 55000037, GITI, ETSII-UPM): una planta en Mancha Real (Jaén) que convierte hueso de aceituna en *hard carbon* para el ánodo de las baterías de ion-sodio.

**Producción:** https://oleacarb.vercel.app

## Direcciones de los QR de la memoria

| Dirección | Qué abre |
|---|---|
| `/` | La web completa |
| `/#proceso` | El diagrama de flujo vivo |
| `/#planta` | El plano navegable y la maqueta 3D |
| `/#simulador` | El simulador financiero |
| `/video` | El vídeo de 79 segundos, alojado en la propia web |

Las cinco funcionan en carga en frío (iOS Safari y Chrome Android): la página espera a las fuentes y a que GSAP monte la sección fijada del viaje, y salta al titular de la sección dejando libre la cabecera. Está cubierto por las pruebas e2e.

## Puesta en marcha

Requiere Node 22.23.4 o posterior.

```bash
npm ci
npm run dev        # desarrollo en http://localhost:4321
npm run build      # build estática en dist/
npm run preview    # sirve dist/
npm test           # Vitest: 11 casos del modelo (1e-6), formato es-ES y Monte Carlo
npm run check      # astro check (TypeScript estricto)
npm run test:e2e   # Playwright (Chromium y WebKit), contra la build servida en :4321
npm run lhci       # Lighthouse móvil sobre dist/ con los umbrales del brief
npm run screens    # capturas de revisión en docs/screens/
```

Para pasar las e2e contra producción: `E2E_BASE_URL=https://oleacarb.vercel.app npx playwright test`.

## Stack

- **Astro 7** con salida estática y TypeScript estricto.
- **Islas Svelte 5**: simulador, ficha de planta, Sankey y reproductor de vídeo. El resto, scripts de Astro sin framework.
- **GSAP + ScrollTrigger + SplitText** y **Lenis** (solo con ratón; en pantallas táctiles, scroll nativo), sincronizados por el ticker de GSAP.
- **d3** en módulos sueltos (`d3-sankey`, `d3-geo`, `d3-scale`, `d3-shape`) y `es-atlas`. El Sankey, el mapa, el PFD, el plano y el Gantt se calculan en la compilación: no cuestan JS en el cliente.
- **three.js** a pelo, cargado con `import()` solo al pulsar «Ver en 3D».
- **Fuentes** de `@fontsource` (Source Serif 4 variable con eje óptico, IBM Plex Sans, Mono y Sans Condensed), solo latin y latin-ext.
- CSS propio con *custom properties* y capas (`tokens`, `base`, `components`, `sections`). Sin Tailwind ni bibliotecas de gráficos genéricas.

## Estructura

```
src/
  pages/        index.astro · video.astro · 404.astro
  sections/     Hero · Reto · Territorio · Viaje · Proceso · Planta · Balances · Calendario · Simulador · Impacto · Video · Fuentes
  components/   Header · Logo · SectionHead · Cajetin · Pfd · Fonts · Simulator.svelte · Sankey.svelte · PlantSheet.svelte · VideoPlayer.svelte …
  scripts/      hero · viaje · proceso · planta · plant3d (three.js) · inview
  lib/          model.ts · sim.ts · montecarlo.ts · format.ts · data.ts · pfd.ts · sankey.ts · motion.ts · anchors.ts · sheet.ts
  workers/      montecarlo.worker.ts
  data/         *.json del kit (mandan sobre todo lo demás)
  styles/       tokens.css · base.css · components.css
public/         video/ (720p, 1080p y póster) · img/ · favicon.svg · apple-touch-icon.png
tests/          model.test.ts · montecarlo.test.ts · e2e/*.spec.ts
docs/           BRIEF.md · PROMPT.md · DIRECCION.md · reference/ · brand/ · screens/
```

## Datos y modelo

- Todas las cifras salen de `src/data/*.json` o de la sección 5 del brief. Las derivadas se calculan en `src/lib/data.ts` con su fórmula en un comentario (por ejemplo, 1,02 €/kg = 21,98 M€ de ventas de 2037 ÷ 21.500 t; 83–104 kWh = 124,6 kg ÷ 1,5–1,2 kg/kWh).
- Formato español centralizado en `src/lib/format.ts`: miles con punto también en cuatro cifras, coma decimal, signo menos U+2212 y espacio fino duro antes de la unidad.
- `src/lib/model.ts` es la traducción literal de `docs/reference/model.js`; `src/lib/sim.ts` aplica `civil_pec` y `cost_staff` de la memoria y la regla de ayudas (`aid_test = 0,4` si `aid_ier > 0`).
- `tests/model.test.ts` recorre los 11 casos de `model.test.json` (VAN, TIR, recuperación, inversión, ventas y EBITDA de 2037, precio mínimo y los 25 flujos) con tolerancia absoluta 1e-6.
- Monte Carlo con mulberry32 (semillas 7 y 8): 15,4 % de VAN positivo hoy (memoria: 14,9 %) y 87,3 % condicionado al Hito 2 (memoria: 87,6 %).

## Calidad

**Lighthouse móvil** (build de producción, 4G lento simulado, tres pasadas, `npm run lhci`):

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 97–99 | 100 | 100 | 100 | 1,8–2,0 s | 0 | 50–140 ms |
| `/video` | 100 | 100 | 100 | 100 | 1,1–1,6 s | 0 | 0 ms |

JS de la carga inicial: 67 kB comprimidos (GSAP, ScrollTrigger, SplitText, Lenis y el código de la página). Las islas, three.js y el *worker* de Monte Carlo se cargan cuando hacen falta.

**Pruebas e2e** (Playwright, Chromium y WebKit en 390 × 844 y 1440 × 900): las 12 anclas en carga en frío, ausencia de scroll horizontal de 360 a 1440 px, los cuatro escenarios del simulador y el estado en la URL, `/video` (src, póster, rangos y Open Graph), la página 404 y el modo de movimiento reducido.

## Despliegue en Vercel

1. vercel.com → **Add New → Project** → importar `oleacarb-project` desde GitHub.
2. Nombre del proyecto: **oleacarb** (la URL queda en `https://oleacarb.vercel.app`). Astro se detecta solo; `vercel.json` fija la build, las cabeceras de caché y seguridad y las URL limpias (`/video`).
3. **Deploy.** Cada *push* a `main` publica en producción y cada PR tiene vista previa.

Con la URL definitiva, se cambia en `site.mjs` (la usan `astro.config.mjs` y `src/config.ts`) y en este README.

## Configuración opcional (`src/config.ts`)

- `PUBLIC_MEMORIA_URL`: si se define (variable de entorno o en el archivo), aparece «Descargar la memoria (PDF)» en `#fuentes`.
- `PUBLIC_YOUTUBE_ID`: si algún día el vídeo se sube a YouTube, se usa una fachada ligera de `youtube-nocookie.com`. Por defecto está vacío y se sirve el MP4 propio.

Sin cookies ni rastreadores.

## Créditos

Foto de portada: Veinticuatro de Jahén, CC BY-SA 4.0, virada a duotono. Cifras del modelo revisado de la memoria del proyecto, en euros constantes de 2026; estimación de estudios previos (± 30 %).
