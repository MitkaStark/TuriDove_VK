"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { reservasService } from "@/services/reservas.service";

const estadoColor: Record<string, string> = { CONFIRMADA: "bg-green-100 text-green-800", PENDIENTE: "bg-yellow-100 text-yellow-800", COMPLETADA: "bg-blue-100 text-blue-800", CANCELADA: "bg-red-100 text-red-800" };

function getReservaTipo(r: any): string {
  const t: string[] = [];
  if (r.reservaHospedajes?.length) t.push("Hospedaje");
  if (r.reservaActividades?.length) t.push("Actividad");
  if (r.reservaTransfers?.length) t.push("Transfer");
  if (r.reservaVehiculos?.length) t.push("Vehiculo");
  return t.join(" + ") || "-";
}

export default function OperadorDashboard() {
  const { data: resData } = useQuery({
    queryKey: ["operador", "dash", "res"],
    queryFn: () => reservasService.getAll({ limit: 100 }),
  });

  const reservas = (resData as any)?.items || [];
  const pendientes = reservas.filter((r: any) => r.estado === "PENDIENTE");
  const confirmadas = reservas.filter((r: any) => r.estado === "CONFIRMADA");
  const completadas = reservas.filter((r: any) => r.estado === "COMPLETADA");

  const stats = [
    { title: "Total Reservas", value: String(reservas.length), icon: Calendar },
    { title: "Pendientes", value: String(pendientes.length), icon: AlertCircle },
    { title: "Confirmadas", value: String(confirmadas.length), icon: Clock },
    { title: "Completadas", value: String(completadas.length), icon: CheckCircle },
  ];

  const columns: DataTableColumn<any>[] = [
    { key: "codigo", header: "Código", render: (r) => <span className="font-mono text-xs">{r.codigo?.substring(0, 8)}...</span> },
    { key: "cliente", header: "Cliente", render: (r) => r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : "-" },
    { key: "tipo", header: "Tipo", render: (r) => getReservaTipo(r) },
    { key: "total", header: "Total", render: (r) => `$${parseFloat(r.total).toFixed(2)}` },
    { key: "estado", header: "Estado", render: (r) => <Badge variant="outline" className={estadoColor[r.estado] || ""}>{r.estado}</Badge> },
    { key: "createdAt", header: "Fecha", render: (r) => new Date(r.createdAt).toLocaleDateString("es-PA") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Operaciones" description="Panel operativo - gestión de reservas" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Reservas Pendientes</h3>
        <DataTable columns={columns} data={pendientes.slice(0, 10)} emptyMessage="No hay reservas pendientes" />
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Reservas Recientes</h3>
        <DataTable columns={columns} data={reservas.slice(0, 10)} emptyMessage="No hay reservas" />
      </div>
    </div>
  );
}
