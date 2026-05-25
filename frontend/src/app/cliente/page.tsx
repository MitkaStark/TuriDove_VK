"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, CreditCard, DollarSign } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/axios";

const estadoColor: Record<string, string> = { CONFIRMADA: "bg-green-100 text-green-800", PENDIENTE: "bg-yellow-100 text-yellow-800", COMPLETADA: "bg-blue-100 text-blue-800", CANCELADA: "bg-red-100 text-red-800" };

function getReservaDesc(r: any): string {
  const items: string[] = [];
  r.reservaHospedajes?.forEach((rh: any) => items.push(rh.hospedaje?.nombre || "Hospedaje"));
  r.reservaActividades?.forEach((ra: any) => items.push(ra.actividad?.nombre || "Actividad"));
  r.reservaTransfers?.forEach((rt: any) => items.push(rt.transfer?.nombre || "Transfer"));
  r.reservaVehiculos?.forEach((rv: any) => items.push(rv.vehiculo ? `${rv.vehiculo.marca} ${rv.vehiculo.modelo}` : "Vehiculo"));
  return items.join(", ") || "Reserva";
}

export default function ClienteDashboard() {
  const { data: resData } = useQuery({
    queryKey: ["cliente", "dash", "res"],
    queryFn: async () => { const { data } = await api.get('/reservas/mis-reservas?limit=100'); return data; },
  });

  const reservas = (resData as any)?.items || [];
  const activas = reservas.filter((r: any) => r.estado === "PENDIENTE" || r.estado === "CONFIRMADA");
  const totalPagado = reservas
    .filter((r: any) => r.estado === "CONFIRMADA" || r.estado === "COMPLETADA")
    .reduce((sum: number, r: any) => sum + parseFloat(r.total || 0), 0);

  const stats = [
    { title: "Reservas Activas", value: String(activas.length), icon: Calendar },
    { title: "Total Reservas", value: String(reservas.length), icon: Calendar },
    { title: "Total Pagado", value: `$${totalPagado.toFixed(2)}`, icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Mi Panel" description="Bienvenido a tu espacio de agroturismo" />
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>
      <Card>
        <CardHeader><CardTitle>Reservas Activas</CardTitle></CardHeader>
        <CardContent>
          {activas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes reservas activas. Explora nuestros hospedajes y actividades!</p>
          ) : (
            <div className="space-y-3">
              {activas.slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{getReservaDesc(r)}</p>
                    <p className="text-sm text-muted-foreground">{r.codigo?.substring(0, 8)}... | ${parseFloat(r.total).toFixed(2)} | {new Date(r.createdAt).toLocaleDateString("es-PA")}</p>
                  </div>
                  <Badge variant="outline" className={estadoColor[r.estado] || ""}>{r.estado}</Badge>
                </div>
              ))}
            </div>
          )}
          <Link href="/cliente/reservas"><Button variant="outline" className="mt-4">Ver Todas mis Reservas</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
