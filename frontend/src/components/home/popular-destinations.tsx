import Link from 'next/link';
import Image from 'next/image';

interface HospedajeDestino {
  id: string;
  nombre: string;
  provincia?: string;
  distrito?: string;
  imagenPrincipal?: string | null;
}

const GRADIENTS = [
  'from-sky-400 to-blue-600',
  'from-amber-300 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-emerald-400 to-teal-600',
  'from-violet-400 to-purple-600',
  'from-yellow-400 to-amber-600',
];

const API_PUBLIC = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
const API_INTERNAL = process.env.NEXT_PUBLIC_API_URL ?? 'http://backend:3001/api/v1';

function resolveImage(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = API_PUBLIC.replace(/\/api\/v1\/?$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function fetchDestinos(): Promise<HospedajeDestino[]> {
  try {
    const res = await fetch(`${API_INTERNAL}/hospedajes?featured=true&limit=6`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.data?.data ?? data?.data ?? data?.items ?? data ?? [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export async function PopularDestinations() {
  const items = await fetchDestinos();

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

        {items.length === 0 ? (
          <p className="text-center text-sm text-navy-400 font-body py-12">
            Pronto sumaremos destinos destacados.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {items.map((d, i) => {
              const imageUrl = resolveImage(d.imagenPrincipal);
              const label = d.distrito || 'Destino';
              const name = d.provincia || d.nombre;
              return (
                <Link
                  key={d.id}
                  href={`/hospedajes?search=${encodeURIComponent(d.provincia ?? d.nombre)}`}
                  className="group relative h-36 sm:h-44 md:h-52 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 via-navy-900/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="inline-block text-[10px] sm:text-xs font-body font-medium text-gold-300 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      {label}
                    </span>
                    <h3 className="font-display font-bold text-white text-sm sm:text-base md:text-lg mt-2 group-hover:translate-x-1 transition-transform duration-300">
                      {name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
