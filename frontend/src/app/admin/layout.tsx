"use client";

import { AuthGuard } from "@/components/shared/auth-guard";
import { DashboardLayout } from "@/components/shared/dashboard-layout";
import { Role } from "@/types";
import {
  LayoutDashboard, Users, Home, Activity, Bus, Car,
  Calendar, CreditCard, BarChart3, Shield, Package, ServerCog,
} from "lucide-react";

const sidebarItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Usuarios", href: "/admin/usuarios", icon: Users },
  { title: "Hoteles", href: "/admin/hospedajes", icon: Home },
  { title: "Actividades", href: "/admin/actividades", icon: Activity },
  { title: "Transfers", href: "/admin/transfers", icon: Bus },
  { title: "Vehiculos", href: "/admin/vehiculos", icon: Car },
  { title: "Paquetes", href: "/admin/paquetes", icon: Package },
  { title: "Reservas", href: "/admin/reservas", icon: Calendar },
  { title: "Pagos", href: "/admin/pagos", icon: CreditCard },
  { title: "Finanzas", href: "/admin/financiero", icon: BarChart3 },
  { title: "Auditoria", href: "/admin/auditoria", icon: Shield },
  { title: "Sistema", href: "/admin/sistema", icon: ServerCog },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.ADMIN]}>
      <DashboardLayout sidebarItems={sidebarItems} title="Admin Panel">
        {children}
      </DashboardLayout>
    </AuthGuard>
  );
}
