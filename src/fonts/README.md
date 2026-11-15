# Subconjuntos de glifos

Flechas, signos y subíndices que no traen los subconjuntos latin y latin-ext de @fontsource (← ↑ → ↓ ↗ ↺ ≈ ≤ ≥, N₂, CO₂, CH₄).
Cubren `U+2070–209F, U+2190–21FF, U+2248, U+2264–2265` y solo se descargan si la página usa alguno de esos caracteres.

- `source-serif-4-glyphs-*.woff2`: Source Serif 4 variable (ejes `wght` y `opsz`), versión 4.005 de adobe-fonts/source-serif. Esta fuente no tiene ↺.
- `ibm-plex-*-glyphs-*.woff2`: IBM Plex Sans 1.1.0, Plex Mono 2.5.0 y Plex Sans Condensed 2.0.0 (paquetes `@ibm/plex-*`, carpeta `complete`).

Hechos con fontTools:

```bash
pyftsubset <fuente> --unicodes="U+2070-209F,U+2190-21FF,U+2248,U+2264-2265" --flavor=woff2 \
  --layout-features='' --no-hinting --desubroutinize --name-IDs='*' --notdef-outline --output-file=<salida>
```

Licencia SIL Open Font License 1.1 (ver los LICENSE de esta carpeta).
