import { Badge } from "@/components/ui/badge";
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
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  },
  [Role.PROVEEDOR]: {
    label: "Proveedor",
    className:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  },
  [Role.AGENCIA]: {
    label: "Agencia",
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  },
  [Role.OPERADOR]: {
    label: "Operador",
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
  },
  [Role.CLIENTE]: {
    label: "Cliente",
    className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
  },
};

interface RoleBadgeProps {
  role: Role | string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role as Role] ?? {
    label: role,
    className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
  };

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
