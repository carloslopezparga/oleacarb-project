# Kit de la web OLEACARB v2

Lo que hay aquí sirve para que Claude Code construya la web nueva, la suba a GitHub y la despliegue en Vercel.

## Pasos

1. Descomprime este kit en una carpeta vacía, por ejemplo `~/oleacarb-web`.
2. Abre una terminal en esa carpeta y arranca Claude Code: `cd ~/oleacarb-web` y después `claude`.
3. Pega el contenido de `PROMPT.md`.
4. Te pedirá dos cosas como mucho:
   - `gh auth login`, para crear el repositorio en tu GitHub;
   - importar el repositorio en vercel.com: Add New → Project → `oleacarb-web` → Deploy.
5. Al final te dará la URL, del tipo `https://oleacarb.vercel.app`.

## Qué contiene

- `BRIEF.md`: la especificación completa. Es lo que manda.
- `PROMPT.md`: el encargo para Claude Code.
- `data/`: todas las cifras de la memoria en JSON, más los casos de prueba del simulador.
- `reference/`: la web actual, el modelo económico, el código de la animación del vídeo, las figuras de la memoria y las capturas.
- `brand/`: la marca y el logotipo escrito.
- `public/`: la foto de portada y el vídeo en 720p con su póster. El de 1080p va aparte (`oleacarb-1080.mp4`) porque pesa 20 MB; déjalo en la raíz de la carpeta y Claude Code lo coloca.

## La URL de la web en la memoria

Las direcciones que irán en los QR de la memoria son estas:
- `https://<dominio>/` para la web;
- `https://<dominio>/#proceso`, `#planta` y `#simulador` para las llamadas al margen de las figuras;
- `https://<dominio>/video` para el vídeo.
