"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { reservasService } from "@/services/reservas.service";

export default function OperadorReportesPage() {
  const { data } = useQuery({
    queryKey: ["operador", "reportes"],
    queryFn: () => reservasService.getAll({ limit: 100 }),
  });

  const reservas = (data as any)?.items || [];
  const totalIngresos = reservas.filter((r: any) => r.estado === "CONFIRMADA" || r.estado === "COMPLETADA").reduce((s: number, r: any) => s + parseFloat(r.total || 0), 0);

  const stats = [
    { title: "Total Reservas", value: String(reservas.length), icon: Calendar },
    { title: "Confirmadas", value: String(reservas.filter((r: any) => r.estado === "CONFIRMADA").length), icon: CheckCircle },
    { title: "Pendientes", value: String(reservas.filter((r: any) => r.estado === "PENDIENTE").length), icon: AlertCircle },
    { title: "Ingresos", value: `$${totalIngresos.toFixed(2)}`, icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" description="Reportes operativos" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>
    </div>
  );
}
