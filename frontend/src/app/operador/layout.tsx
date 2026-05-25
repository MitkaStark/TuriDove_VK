"use client";

import { AuthGuard } from "@/components/shared/auth-guard";
import { DashboardLayout } from "@/components/shared/dashboard-layout";
import { Role } from "@/types";
import { LayoutDashboard, Calendar, Bus, ClipboardList } from "lucide-react";

const sidebarItems = [
  { title: "Dashboard", href: "/operador", icon: LayoutDashboard },
  { title: "Reservas", href: "/operador/reservas", icon: Calendar },
  { title: "Transfers Hoy", href: "/operador/transfers", icon: Bus },
  { title: "Reportes", href: "/operador/reportes", icon: ClipboardList },
];

export default function OperadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.OPERADOR]}>
      <DashboardLayout sidebarItems={sidebarItems} title="Panel Operaciones">
        {children}
      </DashboardLayout>
    </AuthGuard>
  );
}
