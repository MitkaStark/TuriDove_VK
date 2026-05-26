"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/axios";

const estadoColor: Record<string, string> = { CONFIRMADA: "bg-green-100 text-green-800", PENDIENTE: "bg-yellow-100 text-yellow-800", COMPLETADA: "bg-blue-100 text-blue-800", CANCELADA: "bg-red-100 text-red-800" };

function getDesc(r: any): string {
  const items: string[] = [];
  r.reservaHospedajes?.forEach((rh: any) => items.push(rh.hospedaje?.nombre || "Hotel"));
  r.reservaActividades?.forEach((ra: any) => items.push(ra.actividad?.nombre || "Actividad"));
  r.reservaTransfers?.forEach((rt: any) => items.push(rt.transfer?.nombre || "Transfer"));
  r.reservaVehiculos?.forEach((rv: any) => items.push(rv.vehiculo ? `${rv.vehiculo.marca} ${rv.vehiculo.modelo}` : "Vehículo"));
  return items.join(", ") || "-";
}

export default function ClienteReservasPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["cliente", "reservas"],
    queryFn: async () => { const { data } = await api.get('/reservas/mis-reservas?limit=100'); return data; },
  });

  const reservas = (data as any)?.items || [];

  const columns: DataTableColumn<any>[] = [
    { key: "codigo", header: "Código", render: (r) => <span className="font-mono text-xs">{r.codigo?.substring(0, 8)}...</span> },
    { key: "servicio", header: "Servicio", render: (r) => getDesc(r) },
    { key: "total", header: "Total", render: (r) => `$${parseFloat(r.total).toFixed(2)}` },
    { key: "estado", header: "Estado", render: (r) => <Badge variant="outline" className={estadoColor[r.estado] || ""}>{r.estado}</Badge> },
    { key: "createdAt", header: "Fecha", render: (r) => new Date(r.createdAt).toLocaleDateString("es-PA") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Mis Reservas" description="Historial de tus reservas" />
      <DataTable columns={columns} data={reservas} loading={isLoading} emptyMessage="No tienes reservas aún" />
    </div>
  );
}
