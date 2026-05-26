"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Home, Activity, Bus, Car, Calendar, CreditCard, DollarSign } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { usersService } from "@/services/users.service";
import { hospedajesService } from "@/services/hospedajes.service";
import { actividadesService } from "@/services/actividades.service";
import { transfersService } from "@/services/transfers.service";
import { vehiculosService } from "@/services/vehiculos.service";
import { reservasService } from "@/services/reservas.service";
import { pagosService } from "@/services/pagos.service";

const estadoColor: Record<string, string> = { CONFIRMADA: "bg-green-100 text-green-800", PENDIENTE: "bg-yellow-100 text-yellow-800", COMPLETADA: "bg-blue-100 text-blue-800", CANCELADA: "bg-red-100 text-red-800" };

function getReservaTipo(r: any): string {
  const t: string[] = [];
  if (r.reservaHospedajes?.length) t.push("Hotel");
  if (r.reservaActividades?.length) t.push("Actividad");
  if (r.reservaTransfers?.length) t.push("Transfer");
  if (r.reservaVehiculos?.length) t.push("Vehiculo");
  return t.join(" + ") || "-";
}

export default function AdminDashboard() {
  const { data: usersData } = useQuery({ queryKey: ["admin", "dash", "users"], queryFn: () => usersService.getAll({ limit: 1 }) });
  const { data: hospData } = useQuery({ queryKey: ["admin", "dash", "hosp"], queryFn: () => hospedajesService.getAll({ limit: 1 }) });
  const { data: actData } = useQuery({ queryKey: ["admin", "dash", "act"], queryFn: () => actividadesService.getAll({ limit: 1 }) });
  const { data: transData } = useQuery({ queryKey: ["admin", "dash", "trans"], queryFn: () => transfersService.getAll({ limit: 1 }) });
  const { data: vehData } = useQuery({ queryKey: ["admin", "dash", "veh"], queryFn: () => vehiculosService.getAll({ limit: 1 }) });
  const { data: resData } = useQuery({ queryKey: ["admin", "dash", "res"], queryFn: () => reservasService.getAll({ limit: 5 }) });
  const { data: pagData } = useQuery({ queryKey: ["admin", "dash", "pag"], queryFn: () => pagosService.getAll({ limit: 1 }) });

  const totalUsers = (usersData as any)?.meta?.total || (usersData as any)?.total || 0;
  const totalHosp = (hospData as any)?.meta?.total || (hospData as any)?.total || 0;
  const totalAct = (actData as any)?.meta?.total || (actData as any)?.total || 0;
  const totalTrans = (transData as any)?.meta?.total || (transData as any)?.total || 0;
  const totalVeh = (vehData as any)?.meta?.total || (vehData as any)?.total || 0;
  const totalRes = (resData as any)?.total || 0;
  const totalPag = (pagData as any)?.total || 0;

  const reservas = (resData as any)?.items || [];
  const totalIngresos = reservas.reduce((sum: number, r: any) => sum + parseFloat(r.total || 0), 0);

  const stats = [
    { title: "Usuarios", value: String(totalUsers), icon: Users },
    { title: "Hoteles", value: String(totalHosp), icon: Home },
    { title: "Actividades", value: String(totalAct), icon: Activity },
    { title: "Transfers", value: String(totalTrans), icon: Bus },
    { title: "Vehiculos", value: String(totalVeh), icon: Car },
    { title: "Reservas", value: String(totalRes), icon: Calendar },
    { title: "Pagos", value: String(totalPag), icon: CreditCard },
    { title: "Ingresos", value: `$${totalIngresos.toFixed(2)}`, icon: DollarSign },
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
      <PageHeader title="Dashboard" description="Resumen general del sistema" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Reservas Recientes</h3>
        <DataTable columns={columns} data={Array.isArray(reservas) ? reservas : []} emptyMessage="No hay reservas" />
      </div>
    </div>
  );
}
