'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'hoteles' | 'paquetes' | 'actividades' | 'vehiculos';

const TABS: { key: Tab; label: string }[] = [
  { key: 'hoteles', label: 'Hoteles' },
  { key: 'paquetes', label: 'Paquetes' },
  { key: 'actividades', label: 'Actividades' },
  { key: 'vehiculos', label: 'Vehículos' },
];

export function SearchWidget() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('hoteles');
  const [destino, setDestino] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const route = {
      hoteles: '/hospedajes',
      paquetes: '/paquetes',
      actividades: '/actividades',
      vehiculos: '/vehiculos',
    }[tab];
    const params = new URLSearchParams();
    if (destino) params.set('search', destino);
    router.push(`${route}?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xl">
      <h2 className="font-display font-bold text-navy-800 text-lg sm:text-xl mb-4">
        ¿A dónde vamos?
      </h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-body font-medium transition-colors ${
              tab === t.key ? 'bg-navy-600 text-white' : 'bg-navy-50 text-navy-500 hover:bg-navy-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          placeholder="¿A dónde quieres ir?"
          className="w-full px-4 py-3 rounded-lg border border-navy-100 bg-cream/50 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition-colors"
        />
        <button
          type="submit"
          className="w-full py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}
