import { ShieldCheck, Headphones, Tag, MapPin, Mail, Phone } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/site-config';

const FEATURES = [
  { Icon: ShieldCheck, title: 'Reserva segura', desc: 'Pagos protegidos con Stripe y confirmación inmediata' },
  { Icon: Headphones, title: 'Soporte 24/7', desc: 'Atención personalizada en todo momento' },
  { Icon: Tag, title: 'Mejores precios', desc: 'Garantía del mejor precio disponible' },
  { Icon: MapPin, title: 'Destinos únicos', desc: 'Experiencias exclusivas alrededor del mundo' },
];

export function WhyChooseSection() {
  return (
    <section id="contacto" className="py-14 sm:py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-navy-800 mb-2">
            ¿Por qué elegir TuriDove?
          </h2>
          <p className="text-sm text-navy-400 font-body max-w-md mx-auto">
            Viajamos por ti. Los mejores destinos, los mejores precios y la mejor atención.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="group text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-navy-50 group-hover:bg-gold-50 flex items-center justify-center mb-3 transition-colors">
                <Icon className="w-7 h-7 text-navy-500 group-hover:text-gold-500 transition-colors" />
              </div>
              <h3 className="font-body font-semibold text-navy-800 text-sm sm:text-base">{title}</h3>
              <p className="text-xs text-navy-400 font-body mt-1 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-navy-100/50 pt-10 sm:pt-12">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-navy-800 mb-2">
              Estamos para ayudarte
            </h3>
            <p className="text-sm text-navy-400 font-body max-w-md mx-auto">
              ¿Tienes preguntas sobre tu próximo viaje? Conversemos.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="flex items-center gap-3 text-sm font-body text-navy-700 hover:text-gold-600 transition-colors"
            >
              <span className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center">
                <Mail className="w-4 h-4 text-gold-500" />
              </span>
              {SITE_CONFIG.email}
            </a>
            <a
              href="tel:+10000000000"
              className="flex items-center gap-3 text-sm font-body text-navy-700 hover:text-gold-600 transition-colors"
            >
              <span className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center">
                <Phone className="w-4 h-4 text-gold-500" />
              </span>
              +1 (000) 000-0000
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
