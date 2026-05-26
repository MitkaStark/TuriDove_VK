"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { reservasService } from "@/services/reservas.service";

const estadoColor: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADA: "bg-green-100 text-green-800",
  COMPLETADA: "bg-blue-100 text-blue-800",
  CANCELADA: "bg-red-100 text-red-800",
  REEMBOLSADA: "bg-gray-100 text-gray-800",
};

const ESTADOS = ["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA", "REEMBOLSADA"];

function getReservaTipo(r: any): string {
  const tipos: string[] = [];
  if (r.reservaHospedajes?.length > 0) tipos.push("Hotel");
  if (r.reservaActividades?.length > 0) tipos.push("Actividad");
  if (r.reservaTransfers?.length > 0) tipos.push("Transfer");
  if (r.reservaVehiculos?.length > 0) tipos.push("Vehiculo");
  return tipos.join(" + ") || "-";
}

export default function AdminReservasPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [sel, setSel] = useState<any>(null);
  const [newEstado, setNewEstado] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reservas", search],
    queryFn: () => reservasService.getAll({ search: search || undefined, limit: 100 }),
  });

  const estadoMut = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      reservasService.changeEstado(id, estado),
    onSuccess: () => {
      toast.success("Estado de reserva actualizado");
      qc.invalidateQueries({ queryKey: ["admin", "reservas"] });
      setEstadoOpen(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al actualizar estado"),
  });

  const items = data?.items || data?.data || data || [];

  const columns: DataTableColumn<any>[] = [
    {
      key: "codigo", header: "Código",
      render: (r) => <span className="font-mono text-xs">{r.codigo?.substring(0, 8)}...</span>,
    },
    {
      key: "cliente", header: "Cliente",
      render: (r) => r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : "-",
    },
    {
      key: "tipo", header: "Tipo",
      render: (r) => getReservaTipo(r),
    },
    {
      key: "total", header: "Total",
      render: (r) => `$${parseFloat(r.total).toFixed(2)}`,
    },
    {
      key: "estado", header: "Estado",
      render: (r) => <Badge variant="outline" className={estadoColor[r.estado] || ""}>{r.estado}</Badge>,
    },
    {
      key: "createdAt", header: "Fecha",
      render: (r) => new Date(r.createdAt).toLocaleDateString("es-PA"),
    },
    {
      key: "acciones", header: "Acciones",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Ver detalles" onClick={() => { setSel(r); setDetailOpen(true); }}>
            <Eye className="h-4 w-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" title="Cambiar estado" onClick={() => { setSel(r); setNewEstado(r.estado); setEstadoOpen(true); }}>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reservas" description="Todas las reservas del sistema" />
      <DataTable
        columns={columns}
        data={Array.isArray(items) ? items : []}
        loading={isLoading}
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Buscar por código o cliente..."
        emptyMessage="No hay reservas"
      />

      {/* Detalle */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Reserva</DialogTitle>
            <DialogDescription>Información completa de la reserva.</DialogDescription>
          </DialogHeader>
          {sel && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="font-medium text-muted-foreground">Código</p><p className="font-mono">{sel.codigo}</p></div>
                <div><p className="font-medium text-muted-foreground">Estado</p><Badge variant="outline" className={estadoColor[sel.estado] || ""}>{sel.estado}</Badge></div>
                <div><p className="font-medium text-muted-foreground">Cliente</p><p>{sel.cliente ? `${sel.cliente.nombre} ${sel.cliente.apellido}` : "-"}</p></div>
                <div><p className="font-medium text-muted-foreground">Email</p><p>{sel.cliente?.email || "-"}</p></div>
                <div><p className="font-medium text-muted-foreground">Total</p><p className="text-lg font-bold text-primary">${parseFloat(sel.total).toFixed(2)}</p></div>
                <div><p className="font-medium text-muted-foreground">Fecha</p><p>{new Date(sel.createdAt).toLocaleDateString("es-PA", { year: "numeric", month: "long", day: "numeric" })}</p></div>
              </div>

              {sel.notas && (
                <div><p className="text-sm font-medium text-muted-foreground">Notas</p><p className="text-sm">{sel.notas}</p></div>
              )}

              {sel.reservaHospedajes?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold">Hoteles</p>
                  {sel.reservaHospedajes.map((rh: any, i: number) => (
                    <div key={i} className="mt-1 rounded bg-muted/50 p-2 text-sm">
                      <p className="font-medium">{rh.hospedaje?.nombre || rh.hospedajeId}</p>
                      <p className="text-muted-foreground">{new Date(rh.fechaEntrada).toLocaleDateString("es-PA")} - {new Date(rh.fechaSalida).toLocaleDateString("es-PA")} | {rh.huespedes} huesped(es) | ${parseFloat(rh.precioTotal).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}

              {sel.reservaActividades?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold">Actividades</p>
                  {sel.reservaActividades.map((ra: any, i: number) => (
                    <div key={i} className="mt-1 rounded bg-muted/50 p-2 text-sm">
                      <p className="font-medium">{ra.actividad?.nombre || ra.actividadId}</p>
                      <p className="text-muted-foreground">{new Date(ra.fecha).toLocaleDateString("es-PA")} | {ra.adultos} adulto(s), {ra.ninos} nino(s) | ${parseFloat(ra.precioTotal).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}

              {sel.reservaTransfers?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold">Transfers</p>
                  {sel.reservaTransfers.map((rt: any, i: number) => (
                    <div key={i} className="mt-1 rounded bg-muted/50 p-2 text-sm">
                      <p className="font-medium">{rt.transfer?.nombre || rt.transferId}</p>
                      <p className="text-muted-foreground">{new Date(rt.fecha).toLocaleDateString("es-PA")} | {rt.pasajeros} pasajero(s) | ${parseFloat(rt.precioTotal).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}

              {sel.reservaVehiculos?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold">Vehiculos</p>
                  {sel.reservaVehiculos.map((rv: any, i: number) => (
                    <div key={i} className="mt-1 rounded bg-muted/50 p-2 text-sm">
                      <p className="font-medium">{rv.vehiculo ? `${rv.vehiculo.marca} ${rv.vehiculo.modelo}` : rv.vehiculoId}</p>
                      <p className="text-muted-foreground">{new Date(rv.fechaInicio).toLocaleDateString("es-PA")} - {new Date(rv.fechaFin).toLocaleDateString("es-PA")} | ${parseFloat(rv.precioTotal).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
                <Button onClick={() => { setDetailOpen(false); setNewEstado(sel.estado); setEstadoOpen(true); }}>
                  <CheckCircle className="mr-2 h-4 w-4" />Cambiar Estado
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cambiar Estado */}
      <Dialog open={estadoOpen} onOpenChange={setEstadoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Estado de Reserva</DialogTitle>
            <DialogDescription>
              {sel && <>Reserva <span className="font-mono">{sel.codigo?.substring(0, 8)}</span> - {sel.cliente?.nombre} {sel.cliente?.apellido}</>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nuevo Estado</Label>
              <Select value={newEstado} onValueChange={setNewEstado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e} value={e}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${estadoColor[e]?.split(" ")[0] || "bg-gray-200"}`} />
                        {e}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEstadoOpen(false)}>Cancelar</Button>
            <Button disabled={estadoMut.isPending} onClick={() => sel && estadoMut.mutate({ id: sel.id, estado: newEstado })}>
              {estadoMut.isPending ? "Actualizando..." : "Actualizar Estado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
