'use client';

import { useState } from 'react';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { createCheckoutSession } from '@/services/stripe.service';
import { formatPriceWithCents } from '@/lib/format-price';

interface CheckoutSummaryProps {
  reservaId: string;
  total: number;
  description: string;
}

export function CheckoutSummary({ reservaId, total, description }: CheckoutSummaryProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const { url } = await createCheckoutSession(reservaId);
      window.location.href = url;
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al iniciar el pago');
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8 max-w-md w-full">
      <h2 className="text-xl font-display font-bold text-navy-800 mb-1">Resumen del pago</h2>
      <p className="text-sm text-navy-400 font-body mb-6">{description}</p>

      <div className="flex items-center justify-between py-4 border-y border-navy-100/50 mb-6">
        <span className="text-sm text-navy-600 font-body">Total a pagar</span>
        <span className="text-2xl font-display font-bold text-navy-800">
          {formatPriceWithCents(total)}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <CreditCard className="w-4 h-4" />
        {loading ? 'Redirigiendo...' : 'Pagar con tarjeta'}
      </button>

      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-navy-400 font-body">
        <ShieldCheck className="w-3.5 h-3.5" />
        Procesado de forma segura por Stripe
      </div>
    </div>
  );
}
