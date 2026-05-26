import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default async function PagoExitoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="bg-white rounded-2xl shadow-card p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-gold-400 mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-navy-800 mb-2">¡Pago recibido!</h1>
        <p className="text-sm text-navy-500 font-body mb-6">
          Recibimos tu pago. Tu reserva está confirmada y te enviaremos los detalles por email.
        </p>
        <Link
          href="/cliente/reservas"
          className="inline-flex px-6 py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm"
        >
          Ver mis reservas
        </Link>
        <p className="text-xs text-navy-400 font-body mt-4">Referencia: {id}</p>
      </div>
    </div>
  );
}
