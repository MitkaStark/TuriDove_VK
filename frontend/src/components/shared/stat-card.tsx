import { type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && trend && (
          <p
            className={cn(
              "text-xs",
              trend === "up" ? "text-green-600" : "text-red-600"
            )}
          >
            {trend === "up" ? "+" : "-"}
            {Math.abs(change)}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
