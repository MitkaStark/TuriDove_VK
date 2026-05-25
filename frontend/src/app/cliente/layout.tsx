"use client";

import { AuthGuard } from "@/components/shared/auth-guard";
import { DashboardLayout } from "@/components/shared/dashboard-layout";
import { Role } from "@/types";
import { LayoutDashboard, Calendar, CreditCard, ShoppingCart, User } from "lucide-react";

const sidebarItems = [
  { title: "Mi Panel", href: "/cliente", icon: LayoutDashboard },
  { title: "Mis Reservas", href: "/cliente/reservas", icon: Calendar },
  { title: "Mis Pagos", href: "/cliente/pagos", icon: CreditCard },
  { title: "Carrito", href: "/cliente/carrito", icon: ShoppingCart },
  { title: "Perfil", href: "/cliente/perfil", icon: User },
];

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.CLIENTE]}>
      <DashboardLayout sidebarItems={sidebarItems} title="Mi Cuenta">
        {children}
      </DashboardLayout>
    </AuthGuard>
  );
}
