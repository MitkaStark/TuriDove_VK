"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bus, ArrowRight, Search, Clock, Route } from "lucide-react";
import { transfersService } from "@/services/transfers.service";

const tipoLabel: Record<string, string> = {
  AEROPUERTO: "Aeropuerto",
  TOUR: "Tour",
  PUNTO_A_PUNTO: "Punto a Punto",
  HOTEL: "Hotel",
};

export default function TransfersPage() {
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["public", "transfers", search],
    queryFn: () => transfersService.getAll({ search: search || undefined, limit: 100 }),
  });

  const items = (data?.data || data || []) as any[];
  const transfers = Array.isArray(items) ? items.filter((t: any) => t.activo) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Header centrado */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-navy-800 mb-2">
          Transfers
        </h1>
        <p className="text-sm text-navy-400 font-body max-w-xl mx-auto">
          Servicios de transporte cómodos y seguros para llegar a tu destino con tranquilidad.
        </p>
      </div>

      {/* Buscador centrado */}
      <div className="flex justify-center mb-10 sm:mb-12">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
          <input
            placeholder="Buscar transfers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors bg-white"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {transfers.map((t: any) => (
          <Link
            key={t.id}
            href={`/transfers/${t.id}`}
            className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-50 group-hover:bg-gold-50 transition-colors">
                <Bus className="h-5 w-5 text-navy-500 group-hover:text-gold-500 transition-colors" />
              </div>
              <span className="inline-flex items-center rounded-full bg-gold-50 text-gold-700 px-2 py-0.5 text-[10px] font-medium">
                {tipoLabel[t.tipo] || t.tipo}
              </span>
            </div>

            <h3 className="mt-3 font-body font-semibold text-navy-800 text-sm sm:text-base group-hover:text-gold-600 transition-colors line-clamp-2">
              {t.nombre}
            </h3>

            {/* Route visualization */}
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-cream-100 p-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-medium text-navy-400 uppercase tracking-wider">Origen</p>
                <p className="text-xs font-medium text-navy-700 truncate">{t.origen}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-gold-500 shrink-0" />
              <div className="flex-1 min-w-0 text-right">
                <p className="text-[9px] font-medium text-navy-400 uppercase tracking-wider">Destino</p>
                <p className="text-xs font-medium text-navy-700 truncate">{t.destino}</p>
              </div>
            </div>

            {t.descripcion && (
              <p className="mt-2 text-xs text-navy-500 font-body line-clamp-2 leading-relaxed">
                {t.descripcion}
              </p>
            )}

            <div className="mt-3 pt-3 border-t border-navy-100/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-navy-400 font-body">
                {t.distanciaKm && (
                  <span className="flex items-center gap-1">
                    <Route className="h-3 w-3" />
                    {t.distanciaKm} km
                  </span>
                )}
                {t.duracionEstimada && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t.duracionEstimada}
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-body font-semibold text-gold-500 group-hover:text-gold-600 group-hover:gap-1.5 transition-all">
                Reservar <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {transfers.length === 0 && (
        <div className="py-20 text-center">
          <Bus className="mx-auto h-12 w-12 text-navy-300" />
          <p className="mt-4 text-sm text-navy-400 font-body">No se encontraron transfers.</p>
        </div>
      )}
    </div>
  );
}
