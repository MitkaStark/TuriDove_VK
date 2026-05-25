import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { formatPrice } from '@/lib/format-price';

async function fetchActividades(): Promise<any[]> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://backend:3001/api/v1';
    const res = await fetch(`${base}/actividades?featured=true&limit=3`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.data ?? data?.data ?? data?.items ?? data ?? [];
  } catch {
    return [];
  }
}

export async function FeaturedActivities() {
  const items = await fetchActividades();
  if (!items?.length) return null;

  return (
    <section className="py-14 sm:py-16 md:py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-navy-800 mb-2">
              Actividades destacadas
            </h2>
            <p className="text-sm text-navy-400 font-body">
              Experiencias únicas que no te puedes perder
            </p>
          </div>
          <Link href="/actividades" className="text-sm font-body font-medium text-gold-500 hover:text-gold-600 transition-colors">
            Ver todas →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {items.map((a: any) => (
            <Link
              key={a.id}
              href={`/actividades/${a.slug ?? a.id}`}
              className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-40 sm:h-44 overflow-hidden bg-gradient-to-br from-cream-200 to-navy-100">
                {a.imagenPrincipal && (
                  <Image
                    src={a.imagenPrincipal}
                    alt={a.nombre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="font-body font-semibold text-navy-800 text-sm sm:text-base">{a.nombre}</h3>
                <p className="text-[11px] sm:text-xs text-navy-400 font-body mt-1">{a.ciudad ?? ''}</p>
                <div className="flex items-center justify-between mt-3">
                  {a.rating ? (
                    <div className="flex items-center gap-1 text-xs text-navy-500">
                      <Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
                      {a.rating}
                    </div>
                  ) : <span />}
                  <p className="text-base font-display font-bold text-gold-500">
                    {formatPrice(a.precio ?? 0)}
                    <span className="text-xs text-navy-400 font-body font-normal ml-1">/ persona</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
