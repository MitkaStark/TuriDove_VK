"use client";

import { useQuery } from "@tanstack/react-query";
import { DollarSign, Home, Activity, Bus, Car, Calendar } from "lucide-react";
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

export default function ProveedorFinancieroPage() {
  const { data: hospData } = useQuery({ queryKey: ["prov", "fin", "hosp"], queryFn: () => hospedajesService.getMine() });
  const { data: actData } = useQuery({ queryKey: ["prov", "fin", "act"], queryFn: () => actividadesService.getMine() });
  const { data: transData } = useQuery({ queryKey: ["prov", "fin", "trans"], queryFn: () => transfersService.getMine() });
  const { data: vehData } = useQuery({ queryKey: ["prov", "fin", "veh"], queryFn: () => vehiculosService.getMine() });
  const { data: resData } = useQuery({ queryKey: ["prov", "fin", "res"], queryFn: async () => { const { data } = await api.get('/reservas/mis-reservas?limit=100'); return data; } });

  const hospList = Array.isArray(hospData) ? hospData : (hospData as any)?.data || [];
  const actList = Array.isArray(actData) ? actData : (actData as any)?.data || [];
  const transList = Array.isArray(transData) ? transData : (transData as any)?.data || [];
  const vehList = Array.isArray(vehData) ? vehData : (vehData as any)?.data || [];
  const reservas = (resData as any)?.items || [];
  const totalIngresos = reservas.filter((r: any) => r.estado === 'CONFIRMADA' || r.estado === 'COMPLETADA').reduce((s: number, r: any) => s + parseFloat(r.total || 0), 0);
  const pendientes = reservas.filter((r: any) => r.estado === 'PENDIENTE');

  const stats = [
    { title: "Ingresos", value: `$${totalIngresos.toFixed(2)}`, icon: DollarSign },
    { title: "Mis Hoteles", value: String(hospList.length), icon: Home },
    { title: "Mis Actividades", value: String(actList.length), icon: Activity },
    { title: "Mis Transfers", value: String(transList.length), icon: Bus },
    { title: "Mis Vehiculos", value: String(vehList.length), icon: Car },
    { title: "Reservas", value: String(reservas.length), icon: Calendar },
  ];

  const columns: DataTableColumn<any>[] = [
    { key: "codigo", header: "Código", render: (r) => <span className="font-mono text-xs">{r.codigo?.substring(0, 8)}...</span> },
    { key: "cliente", header: "Cliente", render: (r) => r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : "-" },
    { key: "total", header: "Monto", render: (r) => <span className="font-medium">${parseFloat(r.total).toFixed(2)}</span> },
    { key: "estado", header: "Estado", render: (r) => <Badge variant="outline" className={estadoColor[r.estado] || ""}>{r.estado}</Badge> },
    { key: "createdAt", header: "Fecha", render: (r) => new Date(r.createdAt).toLocaleDateString("es-PA") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Finanzas" description="Resumen de ingresos y recursos" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Reservas Confirmadas y Pendientes</h3>
        <DataTable columns={columns} data={reservas.filter((r: any) => r.estado !== 'CANCELADA')} emptyMessage="Sin reservas" />
      </div>
    </div>
  );
}
