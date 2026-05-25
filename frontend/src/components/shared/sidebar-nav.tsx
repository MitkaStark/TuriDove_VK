"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";

export interface SidebarNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface SidebarNavGroup {
  label?: string;
  items: SidebarNavItem[];
}

interface SidebarNavProps {
  items: SidebarNavItem[];
  className?: string;
  /** Role kicker shown in the logo area: ADMIN | PROVEEDOR | AGENCIA | OPERADOR | MI CUENTA */
  kicker?: string;
}

export function SidebarNav({ items, className, kicker }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "w-[260px] shrink-0 border-r border-navy-100/50 bg-white flex flex-col h-full",
        className
      )}
    >
      {/* Logo header */}
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-navy-100/50">
        <Logo variant="admin" kicker={kicker} href="/" />
      </div>

      {/* Nav body */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          if (isActive) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body bg-gold-50/80 text-navy-800 font-medium"
              >
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gold-400" />
                <Icon className="text-gold-500 w-[18px] h-[18px] shrink-0" />
                <span className="flex-1">{item.title}</span>
                {item.badge !== undefined && (
                  <span className="ml-auto rounded-full bg-gold-400 px-2 py-0.5 text-xs text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body text-navy-500 hover:bg-navy-50/60 hover:text-navy-700 transition-colors"
            >
              <Icon className="text-navy-400 group-hover:text-navy-500 w-[18px] h-[18px] shrink-0" />
              <span className="flex-1">{item.title}</span>
              {item.badge !== undefined && (
                <span className="ml-auto rounded-full bg-navy-100 px-2 py-0.5 text-xs text-navy-600">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
