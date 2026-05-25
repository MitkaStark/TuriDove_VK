"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { pagosService } from "@/services/pagos.service";

const estadoColor: Record<string, string> = {
  COMPLETADO: "bg-green-100 text-green-800",
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  PROCESANDO: "bg-blue-100 text-blue-800",
  FALLIDO: "bg-red-100 text-red-800",
  REEMBOLSADO: "bg-gray-100 text-gray-800",
};

const metodoColor: Record<string, string> = {
  TARJETA: "bg-blue-50 text-blue-700",
  YAPPY: "bg-purple-50 text-purple-700",
  TRANSFERENCIA: "bg-teal-50 text-teal-700",
  EFECTIVO: "bg-green-50 text-green-700",
};

export default function AdminPagosPage() {
  const [search, setSearch] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [sel, setSel] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pagos", search],
    queryFn: () => pagosService.getAll({ search: search || undefined, limit: 100 }),
  });

  const items = data?.items || data?.data || data || [];

  const columns: DataTableColumn<any>[] = [
    {
      key: "reserva", header: "Reserva",
      render: (p) => <span className="font-mono text-xs">{p.reserva?.codigo?.substring(0, 8) || "-"}...</span>,
    },
    {
      key: "usuario", header: "Usuario",
      render: (p) => p.user ? `${p.user.nombre} ${p.user.apellido}` : "-",
    },
    {
      key: "monto", header: "Monto",
      render: (p) => <span className="font-medium">${parseFloat(p.monto).toFixed(2)}</span>,
    },
    {
      key: "metodo", header: "Metodo",
      render: (p) => <Badge variant="outline" className={metodoColor[p.metodo] || ""}>{p.metodo}</Badge>,
    },
    {
      key: "estado", header: "Estado",
      render: (p) => <Badge variant="outline" className={estadoColor[p.estado] || ""}>{p.estado}</Badge>,
    },
    {
      key: "referencia", header: "Referencia",
      render: (p) => <span className="font-mono text-xs">{p.referencia || "-"}</span>,
    },
    {
      key: "createdAt", header: "Fecha",
      render: (p) => new Date(p.createdAt).toLocaleDateString("es-PA"),
    },
    {
      key: "acciones", header: "",
      render: (p) => (
        <Button variant="ghost" size="icon" onClick={() => { setSel(p); setDetailOpen(true); }}><Eye className="h-4 w-4 text-blue-600" /></Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Pagos" description="Todos los pagos del sistema" />
      <DataTable columns={columns} data={Array.isArray(items) ? items : []} loading={isLoading} onSearch={setSearch} searchValue={search} searchPlaceholder="Buscar por referencia..." emptyMessage="No hay pagos registrados" />

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalle del Pago</DialogTitle><DialogDescription>Información completa del pago.</DialogDescription></DialogHeader>
          {sel && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="font-medium text-muted-foreground">Monto</p><p className="text-2xl font-bold text-primary">${parseFloat(sel.monto).toFixed(2)}</p></div>
                <div><p className="font-medium text-muted-foreground">Estado</p><Badge variant="outline" className={estadoColor[sel.estado] || ""}>{sel.estado}</Badge></div>
                <div><p className="font-medium text-muted-foreground">Metodo</p><Badge variant="outline" className={metodoColor[sel.metodo] || ""}>{sel.metodo}</Badge></div>
                <div><p className="font-medium text-muted-foreground">Referencia</p><p className="font-mono">{sel.referencia || "-"}</p></div>
                <div><p className="font-medium text-muted-foreground">Usuario</p><p>{sel.user ? `${sel.user.nombre} ${sel.user.apellido}` : "-"}</p></div>
                <div><p className="font-medium text-muted-foreground">Email</p><p>{sel.user?.email || "-"}</p></div>
                <div><p className="font-medium text-muted-foreground">Reserva</p><p className="font-mono text-xs">{sel.reserva?.codigo || sel.reservaId}</p></div>
                <div><p className="font-medium text-muted-foreground">Fecha</p><p>{new Date(sel.createdAt).toLocaleDateString("es-PA", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p></div>
              </div>
              {sel.detalles && (
                <div><p className="text-sm font-medium text-muted-foreground">Detalles</p><pre className="mt-1 rounded bg-muted p-2 text-xs overflow-auto">{JSON.stringify(sel.detalles, null, 2)}</pre></div>
              )}
              <DialogFooter><Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
