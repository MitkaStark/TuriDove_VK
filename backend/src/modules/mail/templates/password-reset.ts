import { renderEmail, RenderedEmail } from './render.util';

export function passwordResetTemplate(c: { nombre: string; url: string }): RenderedEmail {
  return renderEmail(
    'Recupera tu contraseña en TuriDove',
    {
      title: 'Recupera tu contraseña',
      preheader: 'Solicitud de cambio de contraseña',
      heading: `Hola ${c.nombre}`,
      bodyHtml: `<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú, haz click en el botón siguiente. El link expira en 1 hora.</p>`,
      ctaUrl: c.url,
      ctaText: 'Restablecer contraseña',
      footerText: 'Si no solicitaste el cambio, ignora este email. Tu contraseña permanece intacta.',
    },
    `Hola ${c.nombre},\n\nRestablece tu contraseña visitando: ${c.url}\n\nEl link expira en 1 hora. Si no solicitaste el cambio, ignora este email.`,
  );
}
