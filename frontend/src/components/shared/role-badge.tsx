import { cn } from "@/lib/utils";

export enum Role {
  ADMIN = "ADMIN",
  PROVEEDOR = "PROVEEDOR",
  AGENCIA = "AGENCIA",
  OPERADOR = "OPERADOR",
  CLIENTE = "CLIENTE",
}

const roleConfig: Record<Role, { label: string; className: string }> = {
  [Role.ADMIN]: {
    label: "Admin",
    className: "bg-navy-100 text-navy-800 border-navy-200",
  },
  [Role.PROVEEDOR]: {
    label: "Proveedor",
    className: "bg-gold-100 text-gold-800 border-gold-200",
  },
  [Role.AGENCIA]: {
    label: "Agencia",
    className: "bg-gold-100 text-gold-800 border-gold-200",
  },
  [Role.OPERADOR]: {
    label: "Operador",
    className: "bg-navy-50 text-navy-600 border-navy-100",
  },
  [Role.CLIENTE]: {
    label: "Cliente",
    className: "bg-cream-200 text-navy-700 border-cream-200",
  },
};

interface RoleBadgeProps {
  role: Role | string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role as Role] ?? {
    label: role,
    className: "bg-navy-50 text-navy-600 border-navy-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
