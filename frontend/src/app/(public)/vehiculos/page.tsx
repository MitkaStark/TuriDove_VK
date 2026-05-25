"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Car, Users, Shield, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { vehiculosService } from "@/services/vehiculos.service";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace('/api/v1', '');
const tipoColor: Record<string, string> = {
  SEDAN: "bg-gray-50 text-gray-700 border-gray-200", SUV: "bg-blue-50 text-blue-700 border-blue-200",
  PICKUP: "bg-amber-50 text-amber-700 border-amber-200", VAN: "bg-green-50 text-green-700 border-green-200",
  BUS: "bg-purple-50 text-purple-700 border-purple-200", MINIBUS: "bg-teal-50 text-teal-700 border-teal-200",
};

export default function VehiculosPage() {
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["public", "vehiculos", search],
    queryFn: () => vehiculosService.getAll({ search: search || undefined, limit: 100 }),
  });

  const items = (data?.data || data || []) as any[];
  const vehiculos = Array.isArray(items) ? items.filter((v: any) => v.activo) : [];

  return (
    <div className="container-page py-12">
      <div className="max-w-2xl">
        <h1 className="section-heading">Alquiler de Vehículos</h1>
        <p className="mt-3 section-subheading mx-0">
          Explora Panamá a tu propio ritmo con nuestra flota de vehículos para todo terreno y ciudad.
        </p>
      </div>

      <div className="mt-8 relative max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar vehículos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11 h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary/30" />
      </div>

      <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {vehiculos.map((v: any) => (
          <Link key={v.id} href={`/vehiculos/${v.id}`} className="group rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
            {/* Image */}
            <div className="aspect-[4/3] bg-muted overflow-hidden relative">
              {v.imagenes?.[0] ? (
                <img src={`${API_URL}${v.imagenes[0]}`} alt={`${v.marca} ${v.modelo}`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/20">
                  <Car className="h-12 w-12 text-primary/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-3 left-3">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold backdrop-blur-sm bg-white/90 ${tipoColor[v.tipo]?.split(' ').slice(1).join(' ') || ''}`}>{v.tipo}</span>
              </div>
              {v.seguroIncluido && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold text-white">
                    <Shield className="h-3 w-3" />Seguro
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="font-semibold tracking-tight group-hover:text-primary transition-colors duration-300">{v.marca} {v.modelo}</h3>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                {v.anio && <span>{v.anio}</span>}
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{v.capacidadPasajeros} pasajeros</span>
              </div>

              {v.caracteristicas?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {v.caracteristicas.slice(0, 3).map((c: string) => (
                    <span key={c} className="rounded-full bg-muted/70 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">{c}</span>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                {v.placa && <span className="text-[10px] font-mono text-muted-foreground/60">{v.placa}</span>}
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all duration-300 ml-auto">
                  Reservar <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {vehiculos.length === 0 && (
        <div className="py-20 text-center">
          <Car className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No se encontraron vehículos.</p>
        </div>
      )}
    </div>
  );
}
