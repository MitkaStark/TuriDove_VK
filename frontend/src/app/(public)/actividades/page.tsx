"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Mountain, Sun, TreePine, Users, Waves, GraduationCap, Search, Clock, MapPin, ArrowRight, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { actividadesService } from "@/services/actividades.service";

const tipoIcons: Record<string, any> = {
  AVENTURA: Mountain, GASTRONOMICA: Sun, NATURALEZA: TreePine, CULTURAL: Users, DEPORTIVA: Waves, EDUCATIVA: GraduationCap,
};
const tipoColor: Record<string, string> = {
  AVENTURA: "bg-red-50 text-red-700 border-red-200", CULTURAL: "bg-purple-50 text-purple-700 border-purple-200",
  GASTRONOMICA: "bg-amber-50 text-amber-700 border-amber-200", NATURALEZA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  EDUCATIVA: "bg-blue-50 text-blue-700 border-blue-200", DEPORTIVA: "bg-orange-50 text-orange-700 border-orange-200",
};
const tipos = ["Todas", "AVENTURA", "GASTRONOMICA", "NATURALEZA", "CULTURAL", "DEPORTIVA", "EDUCATIVA"];

export default function ActividadesPage() {
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("Todas");

  const { data } = useQuery({
    queryKey: ["public", "actividades", search],
    queryFn: () => actividadesService.getAll({ search: search || undefined, limit: 100 }),
  });

  const items = (data?.data || data || []) as any[];
  const actividades = Array.isArray(items)
    ? items.filter((a: any) => a.activo && (tipo === "Todas" || a.tipo === tipo))
    : [];

  return (
    <div className="container-page py-12">
      <div className="max-w-2xl">
        <h1 className="section-heading">Actividades</h1>
        <p className="mt-3 section-subheading mx-0">
          Experiencias auténticas que te conectan con la naturaleza, la cultura y las tradiciones de Panamá.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar actividades..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11 h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary/30" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tipos.map((t) => (
            <button key={t} onClick={() => setTipo(t)} className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${tipo === t ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              {t === "Todas" ? t : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {actividades.map((a: any) => {
          const Icon = tipoIcons[a.tipo] || Mountain;
          return (
            <Link key={a.id} href={`/actividades/${a.id}`} className="group rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 p-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tipoColor[a.tipo]?.split(' ')[0] || 'bg-primary/10'} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-6 w-6 ${tipoColor[a.tipo]?.split(' ')[1] || 'text-primary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold tracking-tight group-hover:text-primary transition-colors duration-300 line-clamp-2">{a.nombre}</h3>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${tipoColor[a.tipo] || ''}`}>{a.tipo}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{a.duracionHoras}h</span>
                  </div>
                </div>
              </div>

              {a.descripcion && (
                <p className="mt-4 text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">{a.descripcion}</p>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{a.ubicacion || a.distrito}, {a.provincia}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Capacidad: {a.capacidadMaxima || "-"} personas</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all duration-300">
                  Reservar <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {actividades.length === 0 && (
        <div className="py-20 text-center">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No se encontraron actividades.</p>
        </div>
      )}
    </div>
  );
}
