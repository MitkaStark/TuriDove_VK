import { renderEmail, RenderedEmail } from './render.util';

export function reservaCanceladaTiempoTemplate(c: { nombre: string; codigo: string }): RenderedEmail {
  return renderEmail(
    `Tu reserva expiró · ${c.codigo}`,
    {
      title: 'Reserva expirada',
      preheader: 'No completaste el pago a tiempo',
      heading: `Hola ${c.nombre}`,
      bodyHtml: `<p>Tu reserva <strong>${c.codigo}</strong> fue cancelada automáticamente porque no completaste el pago dentro del tiempo límite (15 minutos).</p><p>El inventario fue liberado. Si aún quieres reservar, vuelve a iniciar el proceso.</p>`,
      ctaUrl: 'http://localhost:3003',
      ctaText: 'Volver a reservar',
    },
    `Hola ${c.nombre},\n\nTu reserva ${c.codigo} fue cancelada porque no completaste el pago a tiempo. El inventario fue liberado.\n\nVuelve a reservar en: http://localhost:3003`,
  );
}
