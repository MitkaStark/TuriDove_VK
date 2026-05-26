import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default async function PagoCanceladoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="bg-white rounded-2xl shadow-card p-8 text-center">
        <XCircle className="w-16 h-16 text-navy-400 mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-navy-800 mb-2">Pago cancelado</h1>
        <p className="text-sm text-navy-500 font-body mb-6">
          El pago fue cancelado. Tu reserva sigue pendiente y puedes reintentarla.
        </p>
        <Link
          href={`/cliente/reservas/${id}`}
          className="inline-flex px-6 py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm"
        >
          Reintentar pago
        </Link>
      </div>
    </div>
  );
}
