/* ---------- Datos de la demo pública ----------
   Se completan al armar el juego con variables de entorno (en GitHub: Settings → Secrets and variables →
   Actions → Variables). También se pueden escribir acá directamente.
   - VITE_POSTHOG_KEY: la "Project API key" de PostHog (empieza con phc_). Es pública: solo sirve para mandar
     datos, no para leerlos. Sin clave, el juego no manda nada.
   - VITE_POSTHOG_HOST: https://us.i.posthog.com (Estados Unidos, la de fábrica) o https://eu.i.posthog.com (Europa),
     según dónde hayas creado el proyecto.
   - VITE_FEEDBACK_URL: el enlace al formulario de opiniones. Sin enlace, no aparece el botón "Dar tu opinión". */
export const APP_VERSION = __APP_VERSION__;
export const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || '';
export const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
export const FEEDBACK_URL = import.meta.env.VITE_FEEDBACK_URL || '';
