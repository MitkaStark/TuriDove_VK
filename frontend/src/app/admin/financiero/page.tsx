"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Calendar, CreditCard, Home, Activity, Bus, Car, Percent, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/lib/axios";

function getMargins() {
  if (typeof window === "undefined") return { hospedajes: 15, actividades: 12, transfers: 10, vehiculos: 10, global: 15 };
  try {
    const saved = localStorage.getItem("admin-margins");
    return saved ? JSON.parse(saved) : { hospedajes: 15, actividades: 12, transfers: 10, vehiculos: 10, global: 15 };
  } catch { return { hospedajes: 15, actividades: 12, transfers: 10, vehiculos: 10, global: 15 }; }
}

export default function AdminFinancieroPage() {
  const { language } = useTranslation();
  const [margins, setMargins] = useState(getMargins());

  useEffect(() => { setMargins(getMargins()); }, []);

  const { data: resumen } = useQuery({
    queryKey: ["admin", "financiero", "resumen"],
    queryFn: async () => { const { data } = await api.get('/financiero/resumen'); return data; },
  });

  const { data: proveedores } = useQuery({
    queryKey: ["admin", "financiero", "proveedores"],
    queryFn: async () => { const { data } = await api.get('/financiero/proveedores'); return data; },
  });

  const r = resumen || {} as any;
  const ingresos = r.ingresos || {};
  const reservas = r.reservas || {};
  const pagos = r.pagos || {};

  // Calculate margin profits per service type
  const gananciaHosp = (ingresos.hospedajes || 0) * (margins.hospedajes / 100);
  const gananciaAct = (ingresos.actividades || 0) * (margins.actividades / 100);
  const gananciaTrans = (ingresos.transfers || 0) * (margins.transfers / 100);
  const gananciaVeh = (ingresos.vehiculos || 0) * (margins.vehiculos / 100);
  const gananciaTotal = gananciaHosp + gananciaAct + gananciaTrans + gananciaVeh;

  const ingresosBrutos = (ingresos.hospedajes || 0) + (ingresos.actividades || 0) + (ingresos.transfers || 0) + (ingresos.vehiculos || 0);
  const pagoProveedores = ingresosBrutos - gananciaTotal;

  const en = language === 'en';

  const stats = [
    { title: en ? "Total Revenue" : "Ingresos Totales", value: `$${(ingresos.total || 0).toFixed(2)}`, icon: DollarSign },
    { title: en ? "Lodging" : "Hoteles", value: `$${(ingresos.hospedajes || 0).toFixed(2)}`, icon: Home },
    { title: en ? "Activities" : "Actividades", value: `$${(ingresos.actividades || 0).toFixed(2)}`, icon: Activity },
    { title: "Transfers", value: `$${(ingresos.transfers || 0).toFixed(2)}`, icon: Bus },
    { title: en ? "Vehicles" : "Vehiculos", value: `$${(ingresos.vehiculos || 0).toFixed(2)}`, icon: Car },
    { title: en ? "Total Reservations" : "Total Reservas", value: String(reservas.total || 0), icon: Calendar },
    { title: en ? "Completed Payments" : "Pagos Completados", value: String(pagos.completados || 0), icon: CreditCard },
    { title: en ? "Payment Amount" : "Monto Pagos", value: `$${(pagos.montoTotal || 0).toFixed(2)}`, icon: DollarSign },
  ];

  const provList = (proveedores as any)?.proveedores || [];

  const columns: DataTableColumn<any>[] = [
    { key: "nombre", header: en ? "Provider" : "Proveedor" },
    { key: "email", header: "Email" },
    { key: "role", header: en ? "Role" : "Rol", render: (p) => <Badge variant="outline">{p.role}</Badge> },
    { key: "hospedajes", header: en ? "Lodging" : "Hoteles" },
    { key: "actividades", header: en ? "Activities" : "Actividades" },
    { key: "transfers", header: "Transfers" },
    { key: "vehiculos", header: en ? "Vehicles" : "Vehiculos" },
    { key: "totalRecursos", header: "Total", render: (p) => <span className="font-semibold">{p.totalRecursos}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={en ? "Finances" : "Finanzas"} description={en ? "Global financial summary" : "Resumen financiero global del sistema"} />

      {/* Revenue Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>

      {/* Margin Profits Section */}
      <div className="card-base border-primary/20 border-2 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold">{en ? "Profit Margins" : "Ganancias por Margen"}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {en
            ? "Calculated profits based on the margin percentages configured in Settings."
            : "Ganancias calculadas basadas en los porcentajes de margen configurados en Configuración."}
        </p>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
            <Wallet className="mx-auto h-8 w-8 text-green-600" />
            <p className="mt-2 text-sm text-green-700">{en ? "Total Profit" : "Ganancia Total"}</p>
            <p className="text-3xl font-bold text-green-700">${gananciaTotal.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
            <DollarSign className="mx-auto h-8 w-8 text-blue-600" />
            <p className="mt-2 text-sm text-blue-700">{en ? "Gross Revenue" : "Ingresos Brutos"}</p>
            <p className="text-3xl font-bold text-blue-700">${ingresosBrutos.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-amber-600" />
            <p className="mt-2 text-sm text-amber-700">{en ? "Pay to Providers" : "Pago a Proveedores"}</p>
            <p className="text-3xl font-bold text-amber-700">${pagoProveedores.toFixed(2)}</p>
          </div>
        </div>

        {/* Breakdown table */}
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">{en ? "Service" : "Servicio"}</th>
                <th className="p-3 text-right font-medium">{en ? "Revenue" : "Ingresos"}</th>
                <th className="p-3 text-center font-medium">{en ? "Margin" : "Margen"}</th>
                <th className="p-3 text-right font-medium">{en ? "Profit" : "Ganancia"}</th>
                <th className="p-3 text-right font-medium">{en ? "To Provider" : "A Proveedor"}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3 flex items-center gap-2"><Home className="h-4 w-4 text-green-600" />{en ? "Lodging" : "Hoteles"}</td>
                <td className="p-3 text-right">${(ingresos.hospedajes || 0).toFixed(2)}</td>
                <td className="p-3 text-center"><Badge variant="outline" className="bg-green-50">{margins.hospedajes}%</Badge></td>
                <td className="p-3 text-right font-semibold text-green-700">${gananciaHosp.toFixed(2)}</td>
                <td className="p-3 text-right text-muted-foreground">${((ingresos.hospedajes || 0) - gananciaHosp).toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 flex items-center gap-2"><Activity className="h-4 w-4 text-blue-600" />{en ? "Activities" : "Actividades"}</td>
                <td className="p-3 text-right">${(ingresos.actividades || 0).toFixed(2)}</td>
                <td className="p-3 text-center"><Badge variant="outline" className="bg-blue-50">{margins.actividades}%</Badge></td>
                <td className="p-3 text-right font-semibold text-green-700">${gananciaAct.toFixed(2)}</td>
                <td className="p-3 text-right text-muted-foreground">${((ingresos.actividades || 0) - gananciaAct).toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 flex items-center gap-2"><Bus className="h-4 w-4 text-amber-600" />Transfers</td>
                <td className="p-3 text-right">${(ingresos.transfers || 0).toFixed(2)}</td>
                <td className="p-3 text-center"><Badge variant="outline" className="bg-amber-50">{margins.transfers}%</Badge></td>
                <td className="p-3 text-right font-semibold text-green-700">${gananciaTrans.toFixed(2)}</td>
                <td className="p-3 text-right text-muted-foreground">${((ingresos.transfers || 0) - gananciaTrans).toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 flex items-center gap-2"><Car className="h-4 w-4 text-purple-600" />{en ? "Vehicles" : "Vehiculos"}</td>
                <td className="p-3 text-right">${(ingresos.vehiculos || 0).toFixed(2)}</td>
                <td className="p-3 text-center"><Badge variant="outline" className="bg-purple-50">{margins.vehiculos}%</Badge></td>
                <td className="p-3 text-right font-semibold text-green-700">${gananciaVeh.toFixed(2)}</td>
                <td className="p-3 text-right text-muted-foreground">${((ingresos.vehiculos || 0) - gananciaVeh).toFixed(2)}</td>
              </tr>
              <tr className="bg-muted/30 font-semibold">
                <td className="p-3 flex items-center gap-2"><Percent className="h-4 w-4 text-primary" />TOTAL</td>
                <td className="p-3 text-right">${ingresosBrutos.toFixed(2)}</td>
                <td className="p-3 text-center">-</td>
                <td className="p-3 text-right text-green-700">${gananciaTotal.toFixed(2)}</td>
                <td className="p-3 text-right text-muted-foreground">${pagoProveedores.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Reservation Status */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-base p-4 text-center">
          <p className="text-sm text-muted-foreground">{en ? "Confirmed" : "Confirmadas"}</p>
          <p className="text-2xl font-bold text-green-600">{reservas.confirmadas || 0}</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-sm text-muted-foreground">{en ? "Pending" : "Pendientes"}</p>
          <p className="text-2xl font-bold text-yellow-600">{reservas.pendientes || 0}</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-sm text-muted-foreground">{en ? "Completed" : "Completadas"}</p>
          <p className="text-2xl font-bold text-blue-600">{reservas.completadas || 0}</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-sm text-muted-foreground">{en ? "Cancelled" : "Canceladas"}</p>
          <p className="text-2xl font-bold text-red-600">{reservas.canceladas || 0}</p>
        </div>
      </div>

      {/* Providers Table */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">{en ? "Resources by Provider/Agency" : "Recursos por Proveedor/Agencia"}</h3>
        <DataTable columns={columns} data={provList} emptyMessage={en ? "No providers registered" : "No hay proveedores registrados"} />
      </div>
    </div>
  );
}
