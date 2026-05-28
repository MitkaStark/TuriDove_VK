"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut, User, Settings } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useTranslation } from "@/hooks/use-translation";
import { Role } from "@/types";

const rolePaths: Record<string, string> = {
  [Role.ADMIN]: "/admin",
  [Role.PROVEEDOR]: "/proveedor",
  [Role.AGENCIA]: "/agencia",
  [Role.OPERADOR]: "/operador",
  [Role.CLIENTE]: "/cliente",
};

const roleKickers: Record<string, string> = {
  [Role.ADMIN]: "ADMIN",
  [Role.PROVEEDOR]: "PROVEEDOR",
  [Role.AGENCIA]: "AGENCIA",
  [Role.OPERADOR]: "OPERADOR",
  [Role.CLIENTE]: "MI CUENTA",
};

import { SidebarNav, type SidebarNavItem } from "./sidebar-nav";
import { RoleBadge } from "./role-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/layout/logo";

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems: SidebarNavItem[];
  title: string;
}

export function DashboardLayout({
  children,
  sidebarItems,
  title,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = user
    ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase()
    : "??";

  const kicker = roleKickers[user?.role || ""] || "PANEL";

  return (
    <div className="fixed inset-0 z-0 flex bg-cream">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <SidebarNav
          items={sidebarItems}
          kicker={kicker}
          className="h-screen"
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 h-full w-[260px] bg-white shadow-lg flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-navy-100/50">
              <Logo variant="admin" kicker={kicker} href="/" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(false)}
                className="text-navy-500"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarNav items={sidebarItems} kicker={kicker} className="border-r-0 w-full" />
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 shrink-0 flex items-center justify-between px-8 border-b border-navy-100/50 bg-white">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-navy-500"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-display font-bold text-navy-800">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {user && <RoleBadge role={user.role} />}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    {user?.avatar ? (
                      <img src={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace('/api/v1', '')}${user.avatar}`} alt="" className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-gold-400 to-gold-500 text-white text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-navy-800">
                    {user?.nombre} {user?.apellido}
                  </p>
                  <p className="text-xs text-navy-400">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push(`${rolePaths[user?.role || "CLIENTE"]}/perfil`)}>
                  <User className="mr-2 h-4 w-4" />
                  {t('dash.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push(`${rolePaths[user?.role || "CLIENTE"]}/configuracion`)}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('dash.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('dash.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
