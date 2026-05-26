'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listPaquetes, deletePaquete } from '@/services/paquetes.service';
import type { Paquete } from '@/types/paquete';
import { formatPrice } from '@/lib/format-price';

export default function AdminPaquetesPage() {
  const [items, setItems] = useState<Paquete[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await listPaquetes({ limit: 100 });
      setItems(r.items ?? []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este paquete?')) return;
    await deletePaquete(id);
    load();
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-800">Paquetes</h1>
          <p className="text-sm text-navy-400 font-body mt-1">
            Gestión de paquetes turísticos
          </p>
        </div>
        <Link
          href="/admin/paquetes/nuevo"
          className="px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-body font-semibold shadow-sm hover:from-gold-500 hover:to-gold-600 transition-all"
        >
          + Nuevo paquete
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-navy-100/50">
          <table className="w-full">
            <thead className="bg-cream-100 border-b border-navy-100/50">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">
                  Nombre
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">
                  Días
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">
                  Descuento
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">
                  Precio desde
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">
                  Estado
                </th>
                <th className="text-right px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-navy-100/30 hover:bg-navy-50/40 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-body text-navy-700">
                    {p.nombre}
                    {p.isFeatured && (
                      <span className="ml-2 text-[10px] bg-gold-100 text-gold-600 px-1.5 py-0.5 rounded-full font-semibold">
                        Destacado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-body text-navy-700">
                    {p.diasDuracion}
                  </td>
                  <td className="px-4 py-3 text-sm font-body text-navy-700">
                    {p.descuentoPorcentaje}%
                  </td>
                  <td className="px-4 py-3 text-sm font-body text-gold-500 font-semibold">
                    {formatPrice(p.precioDesde ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        p.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <Link
                      href={`/admin/paquetes/${p.id}`}
                      className="text-sm text-navy-600 hover:text-navy-800 font-body"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-body"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center text-navy-400 font-body py-12 text-sm"
                  >
                    Sin paquetes creados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
