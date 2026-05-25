import Link from 'next/link';
import { Hotel, Package, Compass, Car } from 'lucide-react';

const SERVICES = [
  { Icon: Hotel, title: 'Hoteles', desc: 'Los mejores alojamientos', href: '/hospedajes' },
  { Icon: Package, title: 'Paquetes', desc: 'Todo incluido al mejor precio', href: '/paquetes' },
  { Icon: Compass, title: 'Actividades', desc: 'Experiencias inolvidables', href: '/actividades' },
  { Icon: Car, title: 'Vehículos', desc: 'Viaja a tu ritmo', href: '/vehiculos' },
];

export function ServicesSection() {
  return (
    <section className="py-14 sm:py-16 md:py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-navy-800 mb-2">
            Nuestros servicios
          </h2>
          <p className="text-sm text-navy-400 font-body max-w-md mx-auto">
            Todo lo que necesitas para tu viaje perfecto
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {SERVICES.map(({ Icon, title, desc, href }) => (
            <Link
              key={href}
              href={href}
              className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 p-4 sm:p-5 text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-navy-50 group-hover:bg-gold-50 flex items-center justify-center mb-3 transition-colors">
                <Icon className="w-8 h-8 text-navy-500 group-hover:text-gold-500 transition-colors" />
              </div>
              <h3 className="font-body font-semibold text-navy-800 text-xs sm:text-sm">{title}</h3>
              <p className="text-[11px] sm:text-xs text-navy-400 font-body mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
