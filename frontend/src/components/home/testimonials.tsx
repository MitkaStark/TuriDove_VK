import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Sofía Lima',
    city: 'São Paulo',
    rating: 5,
    text: 'París con TuriDove fue una experiencia única. Cada detalle pensado, cada recomendación acertada.',
  },
  {
    name: 'James Chen',
    city: 'Singapur',
    rating: 5,
    text: 'El paquete a Tokio superó todas mis expectativas. Boutique, personalizado, impecable.',
  },
  {
    name: 'Lucía Fernández',
    city: 'Madrid',
    rating: 4,
    text: 'Excelente atención. Santorini fue un sueño, y todo organizado al detalle.',
  },
];

export function Testimonials() {
  return (
    <section className="py-14 sm:py-16 md:py-20 bg-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-sm text-white/50 font-body max-w-md mx-auto">
            Viajeros que confían en nosotros para sus aventuras
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {TESTIMONIALS.map((t) => (
            <article key={t.name} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 sm:p-6">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < t.rating ? 'text-gold-400 fill-gold-400' : 'text-white/20'}`}
                  />
                ))}
              </div>
              <p className="text-sm text-white/80 font-body leading-relaxed mb-4">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-white text-xs font-semibold flex items-center justify-center">
                  {t.name.split(' ').map((s) => s[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-body font-semibold text-white leading-none">{t.name}</p>
                  <p className="text-xs text-white/50 font-body mt-0.5">{t.city}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
