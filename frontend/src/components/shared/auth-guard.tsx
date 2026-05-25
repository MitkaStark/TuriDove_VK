"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Role } from "@/types";
import { LoadingSpinner } from "./loading-spinner";

const roleDashboardMap: Record<string, string> = {
  [Role.ADMIN]: "/admin",
  [Role.PROVEEDOR]: "/proveedor",
  [Role.AGENCIA]: "/agencia",
  [Role.OPERADOR]: "/operador",
  [Role.CLIENTE]: "/cliente",
};

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [checked, setChecked] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand to rehydrate from localStorage before checking auth
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    // If already hydrated (e.g. navigating between pages)
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    // Check if session expired
    const { checkSession } = useAuthStore.getState();
    const sessionValid = checkSession();

    if (!isAuthenticated || !sessionValid) {
      router.replace("/login");
      return;
    }

    if (user && !allowedRoles.includes(user.role)) {
      const dashboard = roleDashboardMap[user.role] || "/";
      router.replace(dashboard);
      return;
    }

    setChecked(true);
  }, [hydrated, isAuthenticated, user, allowedRoles, router]);

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
