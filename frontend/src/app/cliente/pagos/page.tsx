"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/axios";

const estadoColor: Record<string, string> = { COMPLETADO: "bg-green-100 text-green-800", PENDIENTE: "bg-yellow-100 text-yellow-800", REEMBOLSADO: "bg-gray-100 text-gray-800" };
const metodoColor: Record<string, string> = { TARJETA: "bg-blue-50 text-blue-700", YAPPY: "bg-purple-50 text-purple-700", TRANSFERENCIA: "bg-teal-50 text-teal-700", EFECTIVO: "bg-green-50 text-green-700" };

export default function ClientePagosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["cliente", "pagos"],
    queryFn: async () => {
      // Get my reservas first, then get pagos for each
      const { data: resData } = await api.get('/reservas/mis-reservas');
      const reservas = resData?.items || [];
      const allPagos: any[] = [];
      for (const r of reservas) {
        try {
          const { data: pagos } = await api.get(`/pagos/reserva/${r.id}`);
          const pagosList = Array.isArray(pagos) ? pagos : pagos?.data || [];
          pagosList.forEach((p: any) => allPagos.push({ ...p, reservaCodigo: r.codigo }));
        } catch {}
      }
      return allPagos;
    },
  });

  const pagos = Array.isArray(data) ? data : [];

  const columns: DataTableColumn<any>[] = [
    { key: "reserva", header: "Reserva", render: (p) => <span className="font-mono text-xs">{p.reservaCodigo?.substring(0, 8) || "-"}...</span> },
    { key: "monto", header: "Monto", render: (p) => <span className="font-medium">${parseFloat(p.monto).toFixed(2)}</span> },
    { key: "metodo", header: "Método", render: (p) => <Badge variant="outline" className={metodoColor[p.metodo] || ""}>{p.metodo}</Badge> },
    { key: "estado", header: "Estado", render: (p) => <Badge variant="outline" className={estadoColor[p.estado] || ""}>{p.estado}</Badge> },
    { key: "referencia", header: "Referencia", render: (p) => <span className="font-mono text-xs">{p.referencia || "-"}</span> },
    { key: "createdAt", header: "Fecha", render: (p) => new Date(p.createdAt).toLocaleDateString("es-PA") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Mis Pagos" description="Historial de pagos realizados" />
      <DataTable columns={columns} data={pagos} loading={isLoading} emptyMessage="No tienes pagos registrados" />
    </div>
  );
}
