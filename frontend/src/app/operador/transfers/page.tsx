"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { reservasService } from "@/services/reservas.service";

const estadoColor: Record<string, string> = { CONFIRMADA: "bg-green-100 text-green-800", PENDIENTE: "bg-yellow-100 text-yellow-800", COMPLETADA: "bg-blue-100 text-blue-800", CANCELADA: "bg-red-100 text-red-800" };

export default function OperadorTransfersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["operador", "transfers"],
    queryFn: () => reservasService.getAll({ limit: 100 }),
  });

  const reservas = (data as any)?.items || [];
  // Filter only reservas that have transfers
  const transferReservas = reservas.filter((r: any) => r.reservaTransfers?.length > 0);

  const columns: DataTableColumn<any>[] = [
    { key: "codigo", header: "Reserva", render: (r) => <span className="font-mono text-xs">{r.codigo?.substring(0, 8)}...</span> },
    { key: "cliente", header: "Cliente", render: (r) => r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : "-" },
    {
      key: "transfer", header: "Transfer",
      render: (r) => r.reservaTransfers?.map((rt: any) => rt.transfer?.nombre || "-").join(", "),
    },
    {
      key: "fecha", header: "Fecha Transfer",
      render: (r) => r.reservaTransfers?.map((rt: any) => new Date(rt.fecha).toLocaleDateString("es-PA")).join(", "),
    },
    {
      key: "pasajeros", header: "Pasajeros",
      render: (r) => r.reservaTransfers?.reduce((s: number, rt: any) => s + rt.pasajeros, 0),
    },
    { key: "estado", header: "Estado", render: (r) => <Badge variant="outline" className={estadoColor[r.estado] || ""}>{r.estado}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Transfers" description="Transfers programados" />
      <DataTable columns={columns} data={transferReservas} loading={isLoading} emptyMessage="No hay transfers programados" />
    </div>
  );
}
