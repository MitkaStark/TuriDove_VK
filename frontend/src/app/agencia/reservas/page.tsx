"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { api } from "@/lib/axios";

const estadoColor: Record<string, string> = { PENDIENTE: "bg-yellow-100 text-yellow-800", CONFIRMADA: "bg-green-100 text-green-800", COMPLETADA: "bg-blue-100 text-blue-800", CANCELADA: "bg-red-100 text-red-800" };

function getReservaTipo(r: any): string {
  const tipos: string[] = [];
  if (r.reservaHospedajes?.length > 0) tipos.push("Hotel");
  if (r.reservaActividades?.length > 0) tipos.push("Actividad");
  if (r.reservaTransfers?.length > 0) tipos.push("Transfer");
  if (r.reservaVehiculos?.length > 0) tipos.push("Vehiculo");
  return tipos.join(" + ") || "-";
}

export default function AgenciaReservasPage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [sel, setSel] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["agencia", "reservas"],
    queryFn: async () => { const { data } = await api.get('/reservas/mis-reservas?limit=100'); return data; },
  });

  // mis-reservas returns paginated for proveedor
  const items = data?.items || data?.data || data || [];

  const columns: DataTableColumn<any>[] = [
    { key: "codigo", header: "Código", render: (r) => <span className="font-mono text-xs">{r.codigo?.substring(0, 8)}...</span> },
    { key: "cliente", header: "Cliente", render: (r) => r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : "-" },
    { key: "tipo", header: "Tipo", render: (r) => getReservaTipo(r) },
    { key: "total", header: "Total", render: (r) => `$${parseFloat(r.total).toFixed(2)}` },
    { key: "estado", header: "Estado", render: (r) => <Badge variant="outline" className={estadoColor[r.estado] || ""}>{r.estado}</Badge> },
    { key: "createdAt", header: "Fecha", render: (r) => new Date(r.createdAt).toLocaleDateString("es-PA") },
    { key: "acciones", header: "", render: (r) => <Button variant="ghost" size="icon" onClick={() => { setSel(r); setDetailOpen(true); }}><Eye className="h-4 w-4 text-blue-600" /></Button> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reservas" description="Reservas de tus recursos" />
      <DataTable columns={columns} data={Array.isArray(items) ? items : []} loading={isLoading} emptyMessage="No hay reservas para tus recursos" />

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalle de Reserva</DialogTitle><DialogDescription>Información de la reserva.</DialogDescription></DialogHeader>
          {sel && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="font-medium text-muted-foreground">Código</p><p className="font-mono">{sel.codigo}</p></div>
                <div><p className="font-medium text-muted-foreground">Estado</p><Badge variant="outline" className={estadoColor[sel.estado] || ""}>{sel.estado}</Badge></div>
                <div><p className="font-medium text-muted-foreground">Cliente</p><p>{sel.cliente ? `${sel.cliente.nombre} ${sel.cliente.apellido}` : "-"}</p></div>
                <div><p className="font-medium text-muted-foreground">Total</p><p className="text-lg font-bold text-primary">${parseFloat(sel.total).toFixed(2)}</p></div>
              </div>
              {sel.reservaHospedajes?.length > 0 && <div><p className="text-sm font-semibold">Hoteles</p>{sel.reservaHospedajes.map((rh: any, i: number) => <div key={i} className="mt-1 rounded bg-muted/50 p-2 text-sm"><p className="font-medium">{rh.hospedaje?.nombre}</p><p className="text-muted-foreground">{new Date(rh.fechaEntrada).toLocaleDateString("es-PA")} - {new Date(rh.fechaSalida).toLocaleDateString("es-PA")} | {rh.huespedes} huesped(es) | ${parseFloat(rh.precioTotal).toFixed(2)}</p></div>)}</div>}
              {sel.reservaActividades?.length > 0 && <div><p className="text-sm font-semibold">Actividades</p>{sel.reservaActividades.map((ra: any, i: number) => <div key={i} className="mt-1 rounded bg-muted/50 p-2 text-sm"><p className="font-medium">{ra.actividad?.nombre}</p><p className="text-muted-foreground">{new Date(ra.fecha).toLocaleDateString("es-PA")} | {ra.adultos} adulto(s) | ${parseFloat(ra.precioTotal).toFixed(2)}</p></div>)}</div>}
              {sel.reservaTransfers?.length > 0 && <div><p className="text-sm font-semibold">Transfers</p>{sel.reservaTransfers.map((rt: any, i: number) => <div key={i} className="mt-1 rounded bg-muted/50 p-2 text-sm"><p className="font-medium">{rt.transfer?.nombre}</p><p className="text-muted-foreground">{new Date(rt.fecha).toLocaleDateString("es-PA")} | {rt.pasajeros} pasajero(s) | ${parseFloat(rt.precioTotal).toFixed(2)}</p></div>)}</div>}
              {sel.reservaVehiculos?.length > 0 && <div><p className="text-sm font-semibold">Vehiculos</p>{sel.reservaVehiculos.map((rv: any, i: number) => <div key={i} className="mt-1 rounded bg-muted/50 p-2 text-sm"><p className="font-medium">{rv.vehiculo ? `${rv.vehiculo.marca} ${rv.vehiculo.modelo}` : "-"}</p><p className="text-muted-foreground">{new Date(rv.fechaInicio).toLocaleDateString("es-PA")} - {new Date(rv.fechaFin).toLocaleDateString("es-PA")} | ${parseFloat(rv.precioTotal).toFixed(2)}</p></div>)}</div>}
              <DialogFooter><Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
