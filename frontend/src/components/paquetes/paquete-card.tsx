import Link from 'next/link';
import Image from 'next/image';
import type { Paquete } from '@/types/paquete';
import { formatPrice } from '@/lib/format-price';

export function PaqueteCard({ p }: { p: Paquete }) {
  const ciudad = p.hospedaje?.ciudad ?? p.hospedaje?.provincia ?? '';

  return (
    <Link
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
        {Number(p.descuentoPorcentaje) > 0 && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-gold-400 text-white text-xs font-semibold rounded-full">
            Ahorra {p.descuentoPorcentaje}%
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-body font-semibold text-navy-800 text-base line-clamp-1">
          {p.nombre}
        </h3>
        <p className="text-xs text-navy-400 mt-1">
          {p.diasDuracion} días{ciudad ? ` · ${ciudad}` : ''}
        </p>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-navy-400 font-body">Desde</p>
          <p className="text-base font-display font-bold text-gold-500">
            {formatPrice(p.precioDesde ?? 0)}
          </p>
        </div>
      </div>
    </Link>
  );
}
