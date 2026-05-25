import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  change?: number;
  trend?: "up" | "down";
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  trend,
  className,
}: StatCardProps) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-card p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs text-navy-400 font-body uppercase tracking-[0.1em]">{title}</p>
        {Icon && <Icon className="h-4 w-4 text-navy-300 shrink-0" />}
      </div>
      <p className="text-3xl font-display font-bold text-navy-800 mt-2">{value}</p>
      {change !== undefined && trend && (
        <p className="text-xs text-gold-500 font-medium mt-1">
          {trend === "up" ? "+" : "-"}
          {Math.abs(change)}% vs. período anterior
        </p>
      )}
    </div>
  );
}
