import Link from 'next/link';
import Image from 'next/image';
import { Users } from 'lucide-react';
import { formatPrice } from '@/lib/format-price';

async function fetchVehiculos(): Promise<any[]> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://backend:3001/api/v1';
    const res = await fetch(`${base}/vehiculos?limit=3`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.data ?? data?.data ?? data?.items ?? data ?? [];
  } catch {
    return [];
  }
}

export async function AvailableVehicles() {
  const items = await fetchVehiculos();
  if (!items.length) return null;

  return (
    <section className="py-14 sm:py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-navy-800 mb-2">
              Vehículos disponibles
            </h2>
            <p className="text-sm text-navy-400 font-body">
              Alquila el vehículo perfecto para tu aventura
            </p>
          </div>
          <Link href="/vehiculos" className="text-sm font-body font-medium text-gold-500 hover:text-gold-600 transition-colors">
            Ver todos →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {items.slice(0, 3).map((v: any) => (
            <Link
              key={v.id}
              href={`/vehiculos/${v.slug ?? v.id}`}
              className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-40 sm:h-44 overflow-hidden bg-gradient-to-br from-cream-200 to-navy-100">
                {v.imagenPrincipal && (
                  <Image
                    src={v.imagenPrincipal}
                    alt={`${v.marca ?? ''} ${v.modelo ?? ''}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="font-body font-semibold text-navy-800 text-sm sm:text-base">
                  {v.marca} {v.modelo}
                </h3>
                <div className="flex items-center gap-1 text-xs text-navy-400 mt-1">
                  <Users className="w-3.5 h-3.5" />
                  {v.capacidad ?? '—'} pasajeros
                </div>
                <p className="text-base font-display font-bold text-gold-500 mt-3">
                  {formatPrice(v.precioPorDia ?? v.pricePerDay ?? 0)}
                  <span className="text-xs text-navy-400 font-body font-normal ml-1">/ día</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
