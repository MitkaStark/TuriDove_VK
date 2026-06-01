"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Mountain, Search, Clock, MapPin, ArrowRight, Activity } from "lucide-react";
import { actividadesService } from "@/services/actividades.service";
import { categoriasActividadService } from "@/services/categorias-actividad.service";

export default function ActividadesPage() {
  const [search, setSearch] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | undefined>(undefined);

  const { data: categorias = [] } = useQuery({
    queryKey: ['public', 'categorias-actividad'],
    queryFn: () => categoriasActividadService.getAll({ soloActivas: true }),
  });

  const { data } = useQuery({
    queryKey: ["public", "actividades", search, categoriaId],
    queryFn: () => actividadesService.getAll({ search: search || undefined, categoriaId, limit: 100 }),
  });

  const items = (data?.data || data || []) as any[];
  const actividades = Array.isArray(items)
    ? items.filter((a: any) => a.activo)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Header centrado */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-navy-800 mb-2">
          Actividades
        </h1>
        <p className="text-sm text-navy-400 font-body max-w-xl mx-auto">
          Experiencias únicas que te conectan con la cultura, la naturaleza y los lugares más cuidados del mundo.
        </p>
      </div>

      {/* Buscador centrado */}
      <div className="flex justify-center mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
          <input
            placeholder="Buscar actividades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors bg-white"
          />
        </div>
      </div>

      {/* Filtros categorias */}
      <div className="flex flex-wrap justify-center gap-2 mb-10 sm:mb-12">
        <button
          onClick={() => setCategoriaId(undefined)}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-body font-medium transition-colors ${!categoriaId ? 'bg-navy-600 text-white' : 'bg-navy-50 text-navy-500 hover:bg-navy-100'}`}
        >
          Todas
        </button>
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoriaId(c.id)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-body font-medium transition-colors ${categoriaId === c.id ? 'bg-navy-600 text-white' : 'bg-navy-50 text-navy-500 hover:bg-navy-100'}`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {actividades.map((a: any) => {
          const img = a.imagenPrincipal || a.imagenes?.[0];
          return (
            <Link
              key={a.id}
              href={`/actividades/${a.slug ?? a.id}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <div className="relative aspect-[4/3] bg-gradient-to-br from-cream-200 to-navy-100 overflow-hidden">
                {img ? (
                  <Image
                    src={img}
                    alt={a.nombre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Mountain className="h-10 w-10 text-navy-300" />
                  </div>
                )}
                {a.categoria?.nombre && (
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-50 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium text-gold-700 shadow-sm">
                      {a.categoria.nombre}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5">
                <h3 className="font-body font-semibold text-navy-800 text-sm sm:text-base group-hover:text-gold-600 transition-colors line-clamp-2">
                  {a.nombre}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-navy-400 font-body">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {a.duracionHoras}h
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {a.ubicacion || a.provincia}
                  </span>
                </div>

                {a.descripcion && (
                  <p className="mt-2 text-xs text-navy-500 font-body line-clamp-2 leading-relaxed">
                    {a.descripcion}
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-navy-100/50 flex items-center justify-between">
                  <span className="text-[11px] text-navy-400 font-body">
                    Cap. {a.capacidadMaxima || "-"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-body font-semibold text-gold-500 group-hover:text-gold-600 group-hover:gap-1.5 transition-all">
                    Reservar <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {actividades.length === 0 && (
        <div className="py-20 text-center">
          <Activity className="mx-auto h-12 w-12 text-navy-300" />
          <p className="mt-4 text-sm text-navy-400 font-body">No se encontraron actividades.</p>
        </div>
      )}
    </div>
  );
}
