import { renderEmail, RenderedEmail } from './render.util';

export function pagoFallidoTemplate(c: { nombre: string; codigo: string }): RenderedEmail {
  return renderEmail(
    `Pago no completado · ${c.codigo}`,
    {
      title: 'Pago no completado',
      preheader: 'Tu pago no pudo procesarse',
      heading: `Hola ${c.nombre}`,
      bodyHtml: `<p>El intento de pago para la reserva <strong>${c.codigo}</strong> no se pudo procesar.</p><p>Puedes reintentar desde tu panel de reservas. La reserva sigue activa hasta que expire el tiempo límite.</p>`,
      ctaUrl: `http://localhost:3003/cliente/reservas`,
      ctaText: 'Reintentar pago',
    },
    `Hola ${c.nombre},\n\nEl intento de pago para la reserva ${c.codigo} no se pudo procesar. Reintenta en: http://localhost:3003/cliente/reservas`,
  );
}
