"use client";

import { AuthGuard } from "@/components/shared/auth-guard";
import { DashboardLayout } from "@/components/shared/dashboard-layout";
import { Role } from "@/types";
import { LayoutDashboard, Home, Activity, Bus, Car, Calendar, BarChart3 } from "lucide-react";

const sidebarItems = [
  { title: "Dashboard", href: "/agencia", icon: LayoutDashboard },
  { title: "Hoteles", href: "/agencia/hospedajes", icon: Home },
  { title: "Actividades", href: "/agencia/actividades", icon: Activity },
  { title: "Transfers", href: "/agencia/transfers", icon: Bus },
  { title: "Vehiculos", href: "/agencia/vehiculos", icon: Car },
  { title: "Reservas", href: "/agencia/reservas", icon: Calendar },
  { title: "Finanzas", href: "/agencia/financiero", icon: BarChart3 },
];

export default function AgenciaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.AGENCIA]}>
      <DashboardLayout sidebarItems={sidebarItems} title="Panel Agencia">
        {children}
      </DashboardLayout>
    </AuthGuard>
  );
}
