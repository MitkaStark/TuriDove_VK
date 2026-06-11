import { renderEmail, RenderedEmail } from './render.util';

export function reservaConfirmadaTemplate(c: { nombre: string; codigo: string; total: string; moneda: string }): RenderedEmail {
  return renderEmail(
    `Reserva confirmada · ${c.codigo}`,
    {
      title: 'Reserva confirmada',
      preheader: 'Tu pago fue recibido',
      heading: `¡Tu reserva está confirmada, ${c.nombre}!`,
      bodyHtml: `<p>Recibimos tu pago y tu reserva está lista.</p><p style="margin:24px 0;padding:16px;background:#FDF8ED;border-radius:8px;font-family:monospace;font-size:13px;"><strong>Código de reserva:</strong> ${c.codigo}<br><strong>Total cobrado:</strong> ${c.moneda} ${c.total}</p><p>Puedes revisar el detalle desde tu panel de cliente.</p>`,
      ctaUrl: 'http://localhost:3003/cliente/reservas',
      ctaText: 'Ver mis reservas',
    },
    `¡Tu reserva está confirmada, ${c.nombre}!\n\nCódigo: ${c.codigo}\nTotal cobrado: ${c.moneda} ${c.total}\n\nVe el detalle: http://localhost:3003/cliente/reservas`,
  );
}
