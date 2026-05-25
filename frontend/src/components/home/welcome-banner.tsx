import Link from 'next/link';

export function WelcomeBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-700 via-navy-500 to-navy-400 py-14 sm:py-16 md:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,168,83,0.15),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-4">
          Bienvenido a <span className="text-gold-300 italic">TuriDove</span>
        </h2>
        <p className="text-sm sm:text-base text-white/80 font-body max-w-xl mx-auto mb-8 leading-relaxed">
          Descubre experiencias boutique en los destinos más cuidados. Comienza tu próximo viaje hoy.
        </p>
        <Link
          href="/register"
          className="inline-flex px-6 py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm"
        >
          Comenzar viaje
        </Link>
      </div>
    </section>
  );
}
