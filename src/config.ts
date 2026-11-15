/* Configuración pública de la web. Todo opcional salvo SITE_URL. */
import { SITE_URL as SITE } from '../site.mjs';

/** URL de producción (también en astro.config.mjs → site). */
export const SITE_URL: string = SITE;

/** Si se rellena, aparece el botón «Descargar la memoria (PDF)» en #fuentes. */
export const PUBLIC_MEMORIA_URL: string = import.meta.env.PUBLIC_MEMORIA_URL ?? '';

/** Si algún día el vídeo se sube a YouTube: con un ID aquí se usa una fachada ligera (youtube-nocookie). Vacío = MP4 propio. */
export const PUBLIC_YOUTUBE_ID: string = import.meta.env.PUBLIC_YOUTUBE_ID ?? '';

export const VIDEO = {
  hd: '/video/oleacarb-1080.mp4',
  sd: '/video/oleacarb-720.mp4',
  poster: '/video/poster.jpg',
  og: '/img/og-video.jpg',
  seconds: 79,
  duration: '1:19'
};
