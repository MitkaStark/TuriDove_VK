'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Package } from 'lucide-react';
import { listPaquetes } from '@/services/paquetes.service';
import { PaqueteCard } from '@/components/paquetes/paquete-card';

export default function PaquetesPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['public', 'paquetes', search],
    queryFn: () => listPaquetes({ search: search || undefined, limit: 24 }),
  });

  const items = data?.items ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-navy-800">
          Paquetes turísticos
        </h1>
        <p className="text-sm text-navy-400 font-body mt-2">
          Combos exclusivos al mejor precio — hospedaje, actividades y transporte en uno
        </p>
      </div>

      {/* Search bar */}
      <div className="max-w-md mx-auto mb-10 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
        <input
          type="text"
          placeholder="Buscar paquetes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors bg-white"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <Package className="mx-auto h-12 w-12 text-navy-200 mb-4" />
          <p className="text-navy-400 font-body">
            No hay paquetes disponibles en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {items.map((p) => (
            <PaqueteCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
