import Link from 'next/link';
import { SearchWidget } from './search-widget';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-700 via-navy-500 to-navy-400">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,168,83,0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-800/40 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6">
              Descubre el mundo con <span className="text-gold-300 italic">TuriDove</span>
            </h1>
            <p className="text-sm sm:text-base text-white/80 font-body max-w-md mb-6 sm:mb-8 leading-relaxed">
              Viajes boutique con destinos únicos al mejor precio. Hoteles, actividades, vehículos y paquetes curados.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#destinos"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm"
              >
                Buscar destinos
              </Link>
              <Link
                href="#paquetes"
                className="px-6 py-3 rounded-lg border-2 border-white/30 text-white font-body font-semibold text-sm hover:bg-white/10 transition-all"
              >
                Ver paquetes
              </Link>
            </div>
          </div>
          <div>
            <SearchWidget />
          </div>
        </div>
      </div>
    </section>
  );
}
