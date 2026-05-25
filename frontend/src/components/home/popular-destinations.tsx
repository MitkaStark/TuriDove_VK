import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/site-config';

const GRADIENTS = [
  'from-sky-400 to-blue-600',
  'from-amber-300 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-emerald-400 to-teal-600',
  'from-violet-400 to-purple-600',
  'from-yellow-400 to-amber-600',
];

export function PopularDestinations() {
  return (
    <section id="destinos" className="py-14 sm:py-16 md:py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-navy-800 mb-2">
            Destinos populares
          </h2>
          <p className="text-sm text-navy-400 font-body max-w-md mx-auto">
            Los destinos más buscados. Elige tu próxima aventura.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {SITE_CONFIG.destinations.map((d, i) => (
            <Link
              key={d.slug}
              href={`/hospedajes?search=${encodeURIComponent(d.city)}`}
              className="group relative h-36 sm:h-44 md:h-52 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 via-navy-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-block text-[10px] sm:text-xs font-body font-medium text-gold-300 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  {d.label}
                </span>
                <h3 className="font-display font-bold text-white text-sm sm:text-base md:text-lg mt-2 group-hover:translate-x-1 transition-transform duration-300">
                  {d.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
