import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/format-price';

async function fetchPaquetes(): Promise<any[]> {
  try {
    const base = process.env.API_URL_INTERNAL ?? 'http://backend:3001/api/v1';
    const res = await fetch(`${base}/paquetes?featured=true&limit=3`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.data ?? data?.data ?? data?.items ?? data ?? [];
  } catch {
    return [];
  }
}

export async function FeaturedPackages() {
  const items = await fetchPaquetes();
  if (!items.length) return null;

  return (
    <section id="paquetes" className="py-14 sm:py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-navy-800 mb-2">
              Paquetes destacados
            </h2>
            <p className="text-sm text-navy-400 font-body">
              Combos exclusivos al mejor precio
            </p>
          </div>
          <Link href="/paquetes" className="text-sm font-body font-medium text-gold-500 hover:text-gold-600 transition-colors">
            Ver todos →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {items.slice(0, 3).map((p: any) => (
            <Link
              key={p.id}
              href={`/paquetes/${p.slug}`}
              className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-44 overflow-hidden bg-gradient-to-br from-cream-200 to-navy-100">
                {p.imagenPrincipal && (
                  <Image
                    src={p.imagenPrincipal}
                    alt={p.nombre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
                {Number(p.descuentoPorcentaje ?? 0) > 0 && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-gold-400 text-white text-xs font-semibold rounded-full">
                    Ahorra {p.descuentoPorcentaje}%
                  </span>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-body font-semibold text-navy-800 text-base">{p.nombre}</h3>
                <p className="text-xs text-navy-400 mt-1">
                  {p.diasDuracion} días · {p.hospedaje?.ciudad ?? ''}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-navy-400 font-body">Desde</p>
                  <p className="text-base font-display font-bold text-gold-500">
                    {formatPrice(p.precioDesde ?? 0)}
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
