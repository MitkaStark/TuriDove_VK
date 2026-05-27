"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Car, Users, Shield, Search, ArrowRight } from "lucide-react";
import { vehiculosService } from "@/services/vehiculos.service";

export default function VehiculosPage() {
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["public", "vehiculos", search],
    queryFn: () => vehiculosService.getAll({ search: search || undefined, limit: 100 }),
  });

  const items = (data?.data || data || []) as any[];
  const vehiculos = Array.isArray(items) ? items.filter((v: any) => v.activo) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Header centrado */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-navy-800 mb-2">
          Alquiler de Vehículos
        </h1>
        <p className="text-sm text-navy-400 font-body max-w-xl mx-auto">
          Explora tu destino a tu propio ritmo con nuestra flota de vehículos para ciudad y aventura.
        </p>
      </div>

      {/* Buscador centrado */}
      <div className="flex justify-center mb-10 sm:mb-12">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
          <input
            placeholder="Buscar vehículos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors bg-white"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {vehiculos.map((v: any) => {
          const img = v.imagenPrincipal || v.imagenes?.[0];
          return (
            <Link
              key={v.id}
              href={`/vehiculos/${v.id}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-cream-200 to-navy-100 overflow-hidden">
                {img ? (
                  <Image
                    src={img}
                    alt={`${v.marca} ${v.modelo}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Car className="h-10 w-10 text-navy-300" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium text-navy-700 shadow-sm">
                    {v.tipo}
                  </span>
                </div>
                {v.seguroIncluido && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-400/90 backdrop-blur-sm px-2 py-1 text-[10px] font-semibold text-white">
                      <Shield className="h-3 w-3" />
                      Seguro
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5">
                <h3 className="font-body font-semibold text-navy-800 text-sm sm:text-base group-hover:text-gold-600 transition-colors">
                  {v.marca} {v.modelo}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-navy-400 font-body">
                  {v.anio && <span>{v.anio}</span>}
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {v.capacidadPasajeros} pasajeros
                  </span>
                </div>

                {v.caracteristicas?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {v.caracteristicas.slice(0, 3).map((c: string) => (
                      <span
                        key={c}
                        className="rounded-full bg-gold-50 text-gold-700 px-2 py-0.5 text-[10px] font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-navy-100/50 flex items-center justify-between">
                  {v.placa && (
                    <span className="text-[10px] font-mono text-navy-300">{v.placa}</span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-body font-semibold text-gold-500 group-hover:text-gold-600 group-hover:gap-1.5 transition-all ml-auto">
                    Reservar <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {vehiculos.length === 0 && (
        <div className="py-20 text-center">
          <Car className="mx-auto h-12 w-12 text-navy-300" />
          <p className="mt-4 text-sm text-navy-400 font-body">No se encontraron vehículos.</p>
        </div>
      )}
    </div>
  );
}
