"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bus, ArrowRight, Search, Clock, MapPin, Route } from "lucide-react";
import { Input } from "@/components/ui/input";
import { transfersService } from "@/services/transfers.service";

const tipoLabel: Record<string, string> = { AEROPUERTO: "Aeropuerto", TOUR: "Tour", PUNTO_A_PUNTO: "Punto a Punto", HOTEL: "Hotel" };
const tipoColor: Record<string, string> = {
  AEROPUERTO: "bg-sky-50 text-sky-700 border-sky-200", HOTEL: "bg-violet-50 text-violet-700 border-violet-200",
  PUNTO_A_PUNTO: "bg-teal-50 text-teal-700 border-teal-200", TOUR: "bg-amber-50 text-amber-700 border-amber-200",
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
    <div className="container-page py-12">
      <div className="max-w-2xl">
        <h1 className="section-heading">Transfers</h1>
        <p className="mt-3 section-subheading mx-0">
          Servicios de transporte cómodos y seguros para moverte por todo Panamá.
        </p>
      </div>

      <div className="mt-8 relative max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar transfers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11 h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary/30" />
      </div>

      <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {transfers.map((t: any) => (
          <Link key={t.id} href={`/transfers/${t.id}`} className="group rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                <Bus className="h-5 w-5 text-primary" />
              </div>
              <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-[10px] font-semibold ${tipoColor[t.tipo] || ''}`}>{tipoLabel[t.tipo] || t.tipo}</span>
            </div>

            <h3 className="mt-4 text-lg font-semibold tracking-tight group-hover:text-primary transition-colors duration-300">{t.nombre}</h3>

            {/* Route visualization */}
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted/40 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Origen</p>
                <p className="text-sm font-medium truncate">{t.origen}</p>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Destino</p>
                <p className="text-sm font-medium truncate">{t.destino}</p>
              </div>
            </div>

            {t.descripcion && (
              <p className="mt-3 text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">{t.descripcion}</p>
            )}

            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {t.distanciaKm && <span className="flex items-center gap-1"><Route className="h-3.5 w-3.5" />{t.distanciaKm} km</span>}
                {t.duracionEstimada && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t.duracionEstimada}</span>}
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all duration-300">
                Reservar <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {transfers.length === 0 && (
        <div className="py-20 text-center">
          <Bus className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No se encontraron transfers.</p>
        </div>
      )}
    </div>
  );
}
