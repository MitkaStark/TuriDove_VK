import { renderEmail, RenderedEmail } from './render.util';

export function welcomeTemplate(c: { nombre: string }): RenderedEmail {
  return renderEmail(
    'Bienvenido a TuriDove',
    {
      title: 'Bienvenido',
      preheader: 'Tu cuenta está lista',
      heading: `¡Bienvenido a TuriDove, ${c.nombre}!`,
      bodyHtml: `<p>Tu cuenta ya está activada. Explora nuestros hoteles boutique, actividades curadas, vehículos y paquetes turísticos.</p>`,
      ctaUrl: 'http://localhost:3003',
      ctaText: 'Explorar TuriDove',
    },
    `¡Bienvenido a TuriDove, ${c.nombre}!\n\nTu cuenta ya está activada. Explora hoteles, actividades, vehículos y paquetes en http://localhost:3003`,
  );
}
