"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Home, MapPin, Search, ArrowRight, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { hospedajesService } from "@/services/hospedajes.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

export default function HospedajesPage() {
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["public", "hospedajes", search],
    queryFn: () => hospedajesService.getAll({ search: search || undefined, limit: 100 }),
  });

  const items = (data?.data || data || []) as any[];
  const hospedajes = Array.isArray(items) ? items.filter((h: any) => h.activo) : [];

  return (
    <div className="container-page py-12">
      {/* Header */}
      <div className="max-w-2xl">
        <h1 className="section-heading">Hoteles y Alojamientos</h1>
        <p className="mt-3 section-subheading mx-0">
          Descubre alojamientos únicos en la naturaleza panameña, desde cabañas en el bosque nuboso hasta eco-lodges frente al mar.
        </p>
      </div>

      {/* Search */}
      <div className="mt-8">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, provincia..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11 h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary/30" />
        </div>
      </div>

      {/* Grid */}
      <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {hospedajes.map((h: any) => {
          const img = h.imagenPrincipal || h.imagenes?.[0];
          return (
            <Link key={h.id} href={`/hospedajes/${h.id}`} className="group rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
              {/* Image */}
              <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                {img ? (
                  <img src={`${API_URL}${img}`} alt={h.nombre} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/20">
                    <Home className="h-12 w-12 text-primary/30" />
                  </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {/* Province badge */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                    <MapPin className="h-3 w-3" />{h.provincia}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors duration-300">{h.nombre}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{h.distrito}, {h.provincia}</p>

                {h.descripcion && (
                  <p className="mt-3 text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">{h.descripcion}</p>
                )}

                {h.amenidades?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {h.amenidades.slice(0, 3).map((a: string) => (
                      <span key={a} className="rounded-full bg-primary/8 text-primary px-2.5 py-0.5 text-[11px] font-medium">{a}</span>
                    ))}
                    {h.amenidades.length > 3 && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">+{h.amenidades.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{h.checkIn} - {h.checkOut}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all duration-300">
                    Ver detalles <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {hospedajes.length === 0 && (
        <div className="py-20 text-center">
          <Home className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No se encontraron hoteles.</p>
        </div>
      )}
    </div>
  );
}
