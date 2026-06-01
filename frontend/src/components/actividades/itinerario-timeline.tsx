import { MapPin } from 'lucide-react';
import type { ItinerarioItem } from '@/types';

export function ItinerarioTimeline({ items }: { items: ItinerarioItem[] }) {
  if (!items?.length) return null;
  const sorted = [...items].sort((a, b) => a.dia - b.dia);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-display font-bold text-navy-800">Itinerario</h2>
      <ol className="relative border-l-2 border-gold-200 space-y-6 pl-6">
        {sorted.map((it) => (
          <li key={it.id} className="relative">
            <span className="absolute -left-[33px] top-1 flex w-8 h-8 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-white text-xs font-display font-bold">
              {it.dia}
            </span>
            <h3 className="font-body font-semibold text-navy-800 text-base">
              Día {it.dia} · {it.titulo}
            </h3>
            {it.nombreUbicacion && (
              <p className="text-xs text-gold-600 font-body mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {it.nombreUbicacion}
              </p>
            )}
            <p className="text-sm text-navy-600 font-body leading-relaxed mt-2">{it.descripcion}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
