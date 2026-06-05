"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Eye, Undo2 } from "lucide-react";
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
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmReembolso, setConfirmReembolso] = useState<any>(null);
  const [sel, setSel] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pagos", search],
    queryFn: () => pagosService.getAll({ search: search || undefined, limit: 100 }),
  });

  const reembolsarMut = useMutation({
    mutationFn: (id: string) => pagosService.reembolsar(id),
    onSuccess: () => {
      toast.success("Reembolso procesado. El estado se actualizará al recibir el webhook de Stripe.");
      qc.invalidateQueries({ queryKey: ["admin", "pagos"] });
      setConfirmReembolso(null);
      setDetailOpen(false);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Error al procesar el reembolso");
    },
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
      render: (p) => {
        const isStripeRefundable = p.estado === 'COMPLETADO' && p.metodo === 'STRIPE' && p.stripePaymentId;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" title="Ver detalle" onClick={() => { setSel(p); setDetailOpen(true); }}>
              <Eye className="h-4 w-4 text-blue-600" />
            </Button>
            {isStripeRefundable && (
              <Button
                variant="ghost"
                size="icon"
                title="Reembolsar via Stripe"
                onClick={() => setConfirmReembolso(p)}
                disabled={reembolsarMut.isPending}
              >
                <Undo2 className="h-4 w-4 text-amber-600" />
              </Button>
            )}
          </div>
        );
      },
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
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
                {sel.estado === 'COMPLETADO' && sel.metodo === 'STRIPE' && sel.stripePaymentId && (
                  <Button
                    variant="default"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => setConfirmReembolso(sel)}
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    Reembolsar via Stripe
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmacion de reembolso */}
      <Dialog open={!!confirmReembolso} onOpenChange={(open) => !open && setConfirmReembolso(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reembolso</DialogTitle>
            <DialogDescription>
              Vas a reembolsar este pago a través de Stripe. La transacción es irreversible.
            </DialogDescription>
          </DialogHeader>
          {confirmReembolso && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Monto:</span><span className="font-semibold">${parseFloat(confirmReembolso.monto).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Usuario:</span><span>{confirmReembolso.user ? `${confirmReembolso.user.nombre} ${confirmReembolso.user.apellido}` : "-"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reserva:</span><span className="font-mono text-xs">{confirmReembolso.reserva?.codigo || confirmReembolso.reservaId}</span></div>
              </div>
              <p className="text-xs text-muted-foreground">
                El estado quedará en REEMBOLSADO cuando Stripe envíe el webhook <code>charge.refunded</code> (normalmente en segundos).
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmReembolso(null)} disabled={reembolsarMut.isPending}>Cancelar</Button>
            <Button
              variant="default"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => confirmReembolso && reembolsarMut.mutate(confirmReembolso.id)}
              disabled={reembolsarMut.isPending}
            >
              {reembolsarMut.isPending ? "Procesando..." : "Confirmar reembolso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
