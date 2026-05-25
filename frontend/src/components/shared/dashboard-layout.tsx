"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Menu, X, LogOut, User, Settings } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <SidebarNav
          items={sidebarItems}
          className="h-screen"
          header={
            <Link href="/" className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">
                Agro<span className="text-primary">turismo</span>
              </span>
            </Link>
          }
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 h-full w-64 bg-background shadow-lg">
            <div className="flex items-center justify-between p-4">
              <Link href="/" className="flex items-center gap-2">
                <Leaf className="h-6 w-6 text-primary" />
                <span className="font-bold">Agroturismo</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Separator />
            <SidebarNav items={sidebarItems} className="border-r-0" />
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>

          <div className="flex items-center gap-3">
            {user && <RoleBadge role={user.role} />}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {user?.avatar ? (
                      <img src={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace('/api/v1', '')}${user.avatar}`} alt="" className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">
                    {user?.nombre} {user?.apellido}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
