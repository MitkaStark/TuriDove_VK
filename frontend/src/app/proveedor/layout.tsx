"use client";

import { AuthGuard } from "@/components/shared/auth-guard";
import { DashboardLayout } from "@/components/shared/dashboard-layout";
import { Role } from "@/types";
import { LayoutDashboard, Home, Activity, Bus, Car, Calendar, BarChart3, Package } from "lucide-react";

const sidebarItems = [
  { title: "Dashboard", href: "/proveedor", icon: LayoutDashboard },
  { title: "Mis Hoteles", href: "/proveedor/hospedajes", icon: Home },
  { title: "Mis Actividades", href: "/proveedor/actividades", icon: Activity },
  { title: "Mis Transfers", href: "/proveedor/transfers", icon: Bus },
  { title: "Mis Vehiculos", href: "/proveedor/vehiculos", icon: Car },
  { title: "Mis Paquetes", href: "/proveedor/paquetes", icon: Package },
  { title: "Reservas", href: "/proveedor/reservas", icon: Calendar },
  { title: "Finanzas", href: "/proveedor/financiero", icon: BarChart3 },
];

export default function ProveedorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.PROVEEDOR]}>
      <DashboardLayout sidebarItems={sidebarItems} title="Panel Proveedor">
        {children}
      </DashboardLayout>
    </AuthGuard>
  );
}
