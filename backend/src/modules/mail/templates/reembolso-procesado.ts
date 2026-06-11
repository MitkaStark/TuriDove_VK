import { renderEmail, RenderedEmail } from './render.util';

export function reembolsoProcesadoTemplate(c: { nombre: string; codigo: string; total: string; moneda: string }): RenderedEmail {
  return renderEmail(
    `Reembolso procesado · ${c.codigo}`,
    {
      title: 'Reembolso procesado',
      preheader: 'Tu dinero está en camino',
      heading: `Hola ${c.nombre}`,
      bodyHtml: `<p>Procesamos el reembolso de tu reserva <strong>${c.codigo}</strong>.</p><p style="margin:24px 0;padding:16px;background:#FDF8ED;border-radius:8px;font-family:monospace;font-size:13px;"><strong>Monto reembolsado:</strong> ${c.moneda} ${c.total}</p><p>El dinero estará disponible en tu medio de pago en 5-10 días hábiles, dependiendo de tu banco.</p>`,
    },
    `Hola ${c.nombre},\n\nProcesamos el reembolso de tu reserva ${c.codigo}.\nMonto: ${c.moneda} ${c.total}\n\nEl dinero estará disponible en 5-10 días hábiles.`,
  );
}
