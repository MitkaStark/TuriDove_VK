"use client";

import { useQuery } from "@tanstack/react-query";
import { Home, Activity, Bus, Car, Calendar, DollarSign } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { hospedajesService } from "@/services/hospedajes.service";
import { actividadesService } from "@/services/actividades.service";
import { transfersService } from "@/services/transfers.service";
import { vehiculosService } from "@/services/vehiculos.service";
import { api } from "@/lib/axios";

const estadoColor: Record<string, string> = { CONFIRMADA: "bg-green-100 text-green-800", PENDIENTE: "bg-yellow-100 text-yellow-800", COMPLETADA: "bg-blue-100 text-blue-800", CANCELADA: "bg-red-100 text-red-800" };

export default function AgenciaDashboard() {
  const { data: hospData } = useQuery({ queryKey: ["agencia", "dash", "hosp"], queryFn: () => hospedajesService.getMine() });
  const { data: actData } = useQuery({ queryKey: ["agencia", "dash", "act"], queryFn: () => actividadesService.getMine() });
  const { data: transData } = useQuery({ queryKey: ["agencia", "dash", "trans"], queryFn: () => transfersService.getMine() });
  const { data: vehData } = useQuery({ queryKey: ["agencia", "dash", "veh"], queryFn: () => vehiculosService.getMine() });
  const { data: resData } = useQuery({ queryKey: ["agencia", "dash", "res"], queryFn: async () => { const { data } = await api.get('/reservas/mis-reservas?limit=100'); return data; } });

  const hospList = Array.isArray(hospData) ? hospData : (hospData as any)?.data || [];
  const actList = Array.isArray(actData) ? actData : (actData as any)?.data || [];
  const transList = Array.isArray(transData) ? transData : (transData as any)?.data || [];
  const vehList = Array.isArray(vehData) ? vehData : (vehData as any)?.data || [];
  const reservas = (resData as any)?.items || [];
  const totalIngresos = reservas.reduce((sum: number, r: any) => sum + parseFloat(r.total || 0), 0);
  const pendientes = reservas.filter((r: any) => r.estado === "PENDIENTE").length;

  const stats = [
    { title: "Mis Hoteles", value: String(hospList.length), icon: Home },
    { title: "Mis Actividades", value: String(actList.length), icon: Activity },
    { title: "Mis Transfers", value: String(transList.length), icon: Bus },
    { title: "Mis Vehiculos", value: String(vehList.length), icon: Car },
    { title: "Reservas", value: String(reservas.length), icon: Calendar },
    { title: "Pendientes", value: String(pendientes), icon: Calendar },
    { title: "Ingresos", value: `$${totalIngresos.toFixed(2)}`, icon: DollarSign },
  ];

  const columns: DataTableColumn<any>[] = [
    { key: "codigo", header: "Código", render: (r) => <span className="font-mono text-xs">{r.codigo?.substring(0, 8)}...</span> },
    { key: "cliente", header: "Cliente", render: (r) => r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : "-" },
    { key: "total", header: "Total", render: (r) => `$${parseFloat(r.total).toFixed(2)}` },
    { key: "estado", header: "Estado", render: (r) => <Badge variant="outline" className={estadoColor[r.estado] || ""}>{r.estado}</Badge> },
    { key: "createdAt", header: "Fecha", render: (r) => new Date(r.createdAt).toLocaleDateString("es-PA") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Agencia" description="Resumen de tu agencia turistica" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Reservas Recientes</h3>
        <DataTable columns={columns} data={Array.isArray(reservas) ? reservas.slice(0, 5) : []} emptyMessage="Sin reservas" />
      </div>
    </div>
  );
}
