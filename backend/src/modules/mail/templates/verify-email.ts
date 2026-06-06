import { renderEmail, RenderedEmail } from './render.util';

export function verifyEmailTemplate(c: { nombre: string; url: string }): RenderedEmail {
  return renderEmail(
    'Confirma tu cuenta en TuriDove',
    {
      title: 'Confirma tu cuenta',
      preheader: 'Un último paso para activar tu cuenta',
      heading: `Hola ${c.nombre}`,
      bodyHtml: `<p>Gracias por registrarte en TuriDove. Para activar tu cuenta y comenzar a reservar, confirma tu email haciendo click en el botón siguiente.</p><p>El link expira en 24 horas.</p>`,
      ctaUrl: c.url,
      ctaText: 'Confirmar mi cuenta',
      footerText: 'Si no creaste esta cuenta, ignora este email.',
    },
    `Hola ${c.nombre},\n\nConfirma tu cuenta visitando: ${c.url}\n\nEl link expira en 24 horas.\n\nSi no creaste esta cuenta, ignora este email.`,
  );
}
