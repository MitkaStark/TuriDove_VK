'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Hotel, Compass, Car } from 'lucide-react';
import { getPaqueteBySlug } from '@/services/paquetes.service';
import { PaqueteSummary } from '@/components/paquetes/paquete-summary';

export default function PaqueteDetallePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';

  const { data: p, isLoading } = useQuery({
    queryKey: ['paquete', slug],
    queryFn: () => getPaqueteBySlug(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-display font-bold text-navy-800">
          Paquete no encontrado
        </h1>
      </div>
    );
  }

  const ciudad = p.hospedaje?.ciudad ?? p.hospedaje?.provincia ?? '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-navy-800">
          {p.nombre}
        </h1>
        <p className="text-sm text-navy-400 font-body mt-2">
          {ciudad && `${ciudad} · `}{p.diasDuracion} días
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero image placeholder */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            {p.imagenPrincipal ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.imagenPrincipal}
                alt={p.nombre}
                className="w-full h-72 object-cover"
              />
            ) : (
              <div className="h-72 bg-gradient-to-br from-cream-200 to-navy-100" />
            )}
          </div>

          {/* What's included */}
          <section>
            <h2 className="text-xl font-display font-bold text-navy-800 mb-4">
              Qué incluye
            </h2>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-navy-700 font-body">
                <Hotel className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                <span>
                  Hospedaje en{' '}
                  <strong>{p.hospedaje?.nombre ?? 'N/A'}</strong> —{' '}
                  {p.habitacion?.nombre ?? 'habitación'}, {p.noches} noches.
                </span>
              </li>
              {p.actividad && (
                <li className="flex gap-3 text-sm text-navy-700 font-body">
                  <Compass className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                  <span>
                    Actividad: <strong>{p.actividad.nombre}</strong>.
                  </span>
                </li>
              )}
              {p.vehiculo && (
                <li className="flex gap-3 text-sm text-navy-700 font-body">
                  <Car className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                  <span>
                    Vehículo:{' '}
                    <strong>
                      {p.vehiculo.marca} {p.vehiculo.modelo}
                    </strong>
                    , {p.diasDuracion} días.
                  </span>
                </li>
              )}
            </ul>
          </section>

          {/* Description */}
          <section>
            <h2 className="text-xl font-display font-bold text-navy-800 mb-3">
              Sobre este paquete
            </h2>
            <p className="text-sm text-navy-600 font-body leading-relaxed">
              {p.descripcion}
            </p>
          </section>
        </div>

        {/* Sticky sidebar CTA */}
        <PaqueteSummary paquete={p} />
      </div>
    </div>
  );
}
