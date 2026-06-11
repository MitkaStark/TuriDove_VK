import { renderEmail, RenderedEmail } from './render.util';

export function passwordChangedTemplate(c: { nombre: string }): RenderedEmail {
  return renderEmail(
    'Tu contraseña fue actualizada',
    {
      title: 'Contraseña actualizada',
      preheader: 'Confirmación de cambio',
      heading: `Hola ${c.nombre}`,
      bodyHtml: `<p>Tu contraseña en TuriDove fue actualizada exitosamente.</p><p>Si no realizaste este cambio, contacta a soporte inmediatamente.</p>`,
    },
    `Hola ${c.nombre},\n\nTu contraseña en TuriDove fue actualizada exitosamente. Si no realizaste este cambio, contacta a soporte inmediatamente.`,
  );
}
