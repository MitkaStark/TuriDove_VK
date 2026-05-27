"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Home, MapPin, Search, ArrowRight, Clock } from "lucide-react";
import { hospedajesService } from "@/services/hospedajes.service";

export default function HospedajesPage() {
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["public", "hospedajes", search],
    queryFn: () => hospedajesService.getAll({ search: search || undefined, limit: 100 }),
  });

  const items = (data?.data || data || []) as any[];
  const hospedajes = Array.isArray(items) ? items.filter((h: any) => h.activo) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Header centrado */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-navy-800 mb-2">
          Hoteles y Alojamientos
        </h1>
        <p className="text-sm text-navy-400 font-body max-w-xl mx-auto">
          Descubre alojamientos únicos en los destinos más cuidados, desde boutique hoteles urbanos hasta retiros con vista al mar.
        </p>
      </div>

      {/* Search centrado */}
      <div className="flex justify-center mb-10 sm:mb-12">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
          <input
            placeholder="Buscar por nombre, provincia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors bg-white"
          />
        </div>
      </div>

      {/* Grid de cards (más pequeñas: hasta 4 por fila en xl) */}
      <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {hospedajes.map((h: any) => {
          const img = h.imagenPrincipal || h.imagenes?.[0];
          return (
            <Link
              key={h.id}
              href={`/hospedajes/${h.id}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-cream-200 to-navy-100 overflow-hidden">
                {img ? (
                  <Image
                    src={img}
                    alt={h.nombre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Home className="h-10 w-10 text-navy-300" />
                  </div>
                )}
                {/* Province badge */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-navy-700 shadow-sm">
                    <MapPin className="h-3 w-3" />
                    {h.provincia}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5">
                <h3 className="font-body font-semibold text-navy-800 text-sm sm:text-base group-hover:text-gold-600 transition-colors">
                  {h.nombre}
                </h3>
                <p className="mt-1 text-xs text-navy-400 font-body">
                  {h.distrito}{h.distrito && h.provincia ? ", " : ""}{h.provincia}
                </p>

                {h.descripcion && (
                  <p className="mt-2 text-xs text-navy-500 font-body line-clamp-2 leading-relaxed">
                    {h.descripcion}
                  </p>
                )}

                {h.amenidades?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {h.amenidades.slice(0, 3).map((a: string) => (
                      <span
                        key={a}
                        className="rounded-full bg-gold-50 text-gold-700 px-2 py-0.5 text-[10px] font-medium"
                      >
                        {a}
                      </span>
                    ))}
                    {h.amenidades.length > 3 && (
                      <span className="rounded-full bg-navy-50 text-navy-500 px-2 py-0.5 text-[10px]">
                        +{h.amenidades.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-navy-100/50 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-navy-400 font-body">
                    <Clock className="h-3 w-3" />
                    <span>{h.checkIn} - {h.checkOut}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-body font-semibold text-gold-500 group-hover:text-gold-600 group-hover:gap-1.5 transition-all">
                    Ver <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {hospedajes.length === 0 && (
        <div className="py-20 text-center">
          <Home className="mx-auto h-12 w-12 text-navy-300" />
          <p className="mt-4 text-sm text-navy-400 font-body">No se encontraron hoteles.</p>
        </div>
      )}
    </div>
  );
}
