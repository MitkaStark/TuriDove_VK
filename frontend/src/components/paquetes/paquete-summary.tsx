'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/format-price';
import type { Paquete } from '@/types/paquete';

export function PaqueteSummary({ paquete }: { paquete: Paquete }) {
  const router = useRouter();
  const [fecha, setFecha] = useState('');

  function reservar() {
    if (!fecha) {
      alert('Selecciona una fecha de inicio');
      return;
    }
    router.push(
      `/reservas/nueva?tipo=PAQUETE&paqueteId=${paquete.id}&fechaInicio=${fecha}`,
    );
  }

  return (
    <aside className="bg-white rounded-2xl shadow-card p-6 sticky top-24">
      <p className="text-xs text-navy-400 font-body">Desde</p>
      <p className="text-3xl font-display font-bold text-gold-500">
        {formatPrice(paquete.precioDesde ?? 0)}
      </p>
      <p className="text-xs text-navy-400 font-body mt-1">
        {paquete.diasDuracion} días · descuento {paquete.descuentoPorcentaje}%
      </p>

      <div className="mt-6 space-y-3">
        <label className="block text-sm font-body font-medium text-navy-700">
          Fecha de inicio
        </label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          min={paquete.validoDesde.slice(0, 10)}
          max={paquete.validoHasta.slice(0, 10)}
          className="w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors"
        />
        <button
          type="button"
          onClick={reservar}
          className="w-full py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm"
        >
          Reservar paquete
        </button>
      </div>

      <p className="text-xs text-navy-400 font-body mt-4">
        Válido del {new Date(paquete.validoDesde).toLocaleDateString('es')} al{' '}
        {new Date(paquete.validoHasta).toLocaleDateString('es')}.
      </p>
    </aside>
  );
}
