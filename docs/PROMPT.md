Vas a construir y desplegar la web v2 de OLEACARB, nuestro proyecto de fin de asignatura: una planta en Mancha Real (Jaén) que convierte hueso de aceituna en hard carbon para baterías de ion-sodio. En esta carpeta tienes un kit con todo lo necesario. Léelo entero antes de escribir código:

- `BRIEF.md` es la especificación y manda sobre todo lo demás. Los datos de `data/*.json` mandan sobre el brief.
- `reference/current-site.html` es la versión actual, publicada en https://claude.ai/artifact/SANawB6uGnCGeiw6aAXYZc. Si no puedes abrir el enlace, usa la copia local y las capturas de `reference/screenshots/`. Los datos de esa versión están bien, pero el diseño es plano y tiene tics de "hecho con IA" que el brief enumera.
- `reference/model.js` y `data/model.test.json` son el modelo económico y sus casos de prueba.
- `reference/video-stage.html` y `reference/figures/` son el lenguaje visual del vídeo y de la memoria.

Qué quiero:
- Una web mucho más estética y dinámica que la actual, que parezca hecha por un estudio de diseño. La dirección de arte está en la sección 3 del brief: capítulos de carbón y hojas de plano.
- Figuras técnicas vivas: el PFD con las corrientes en movimiento, el plano navegable con maqueta 3D y recorrido guiado, el Sankey animado y el simulador financiero en vivo con tornado y Monte Carlo.
- La pieza memorable es "el viaje de una tonelada" (sección 5.4).
- Antes que nada, que sea impecable en el móvil: se abrirá sobre todo desde los QR impresos en la memoria.

Reglas:
1. Ninguna cifra inventada. Todo sale de `data/` y en formato español. Si te falta un dato, calcúlalo desde los JSON y deja la fórmula en un comentario. Si no se puede calcular, no lo pongas.
2. El simulador es una traducción literal de `reference/model.js` a TypeScript. Tiene que pasar los 11 casos de `data/model.test.json` con una tolerancia de 1e-6 en un test de Vitest que corra en el CI.
3. Las direcciones `/`, `/#proceso`, `/#planta`, `/#simulador` y `/video` van impresas en QR. Tienen que funcionar en carga en frío en iOS Safari y en Chrome Android, con la cabecera fija y con las secciones fijadas de GSAP ya montadas. Añade tests e2e de Playwright con Chromium y WebKit.
4. El vídeo se aloja en la propia web (`public/video/`, ya optimizado; no lo recomprimas) con su página `/video`. No uses YouTube.
5. Respeta la identidad (tokens, tipografías y logotipo de la sección 3.2), `prefers-reduced-motion`, el contraste AA y el teclado. Nada de scroll horizontal a 360 px.
6. Stack de la sección 8: Astro, TypeScript, islas Svelte 5, GSAP con ScrollTrigger, Lenis, d3 y three.js bajo demanda, y fuentes con @fontsource. Sin Tailwind ni bibliotecas de gráficos genéricas.

Cómo trabajar:
1. **Lee y planifica.** Lee el kit y escribe en `docs/DIRECCION.md`, en una página, tu dirección de arte concreta: retícula, ritmo de secciones, los cuatro momentos de movimiento y cómo resuelves cada sección en el móvil. No me preguntes salvo que algo te bloquee de verdad; decide y documenta.
2. **Monta la base.** Si en la raíz hay un `oleacarb-1080.mp4`, muévelo a `public/video/`; si no está, sigue con el de 720p. Crea el proyecto Astro en esta carpeta. Mueve `data/` a `src/data/`, conserva `public/` y lleva `BRIEF.md`, `PROMPT.md`, `reference/` y `brand/` a `docs/`. Haz primero los tokens, la tipografía, el formato numérico, el modelo con sus tests y las anclas.
3. **Construye las secciones** en el orden del brief. Después de cada una, haz capturas con Playwright a 390 × 844 y a 1440 × 900 y míralas. No avances con defectos visibles.
4. **Pule y revisa.** Pule el movimiento y haz la alternativa de movimiento reducido. Pasa la revisión visual completa de la sección 10.2 y repite hasta que no encuentres nada. Pasa Lighthouse móvil, con los umbrales de la sección 10.3.
5. **Publica en GitHub.** Ejecuta `git init`, haz commits con sentido y crea el repositorio con `gh repo create oleacarb-web --private --source . --push`. Si `gh` no está autenticado, dime que ejecute `gh auth login` y espera. Añade el CI de la sección 9.
6. **Despliega en Vercel.** Si tengo la CLI con sesión iniciada, hazlo tú con `npx vercel link` y `npx vercel --prod`, con el proyecto llamado `oleacarb`. Si no, dame los tres pasos para importarlo desde vercel.com y espera la URL. Cuando tengas la URL definitiva, ponla en `site` de `astro.config` y en el README, vuelve a desplegar y pasa los tests e2e contra producción.
7. **Infórmame** con:
   - la URL de producción;
   - las cinco direcciones probadas;
   - las cifras de Lighthouse;
   - cinco líneas sobre tus decisiones de diseño;
   - lo que haya quedado fuera, con el motivo.
