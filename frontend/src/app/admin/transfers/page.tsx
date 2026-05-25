"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Eye, Pencil, Power, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { transfersService } from "@/services/transfers.service";

const TIPOS = ["AEROPUERTO", "HOTEL", "PUNTO_A_PUNTO", "TOUR"];
const tipoColor: Record<string, string> = { AEROPUERTO: "bg-sky-100 text-sky-800", HOTEL: "bg-violet-100 text-violet-800", PUNTO_A_PUNTO: "bg-teal-100 text-teal-800", TOUR: "bg-amber-100 text-amber-800" };

const schema = z.object({
  nombre: z.string().min(2, "Minimo 2 caracteres"),
  origen: z.string().min(2, "Requerido"),
  destino: z.string().min(2, "Requerido"),
  descripcion: z.string().optional(),
  distanciaKm: z.coerce.number().min(0).optional(),
  duracionEstimada: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function AdminTransfersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sel, setSel] = useState<any>(null);
  const [tipo, setTipo] = useState("AEROPUERTO");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "transfers", search],
    queryFn: () => transfersService.getAll({ search: search || undefined, limit: 100 }),
  });

  const createMut = useMutation({
    mutationFn: (p: any) => transfersService.create(p),
    onSuccess: () => { toast.success("Transfer creado"); qc.invalidateQueries({ queryKey: ["admin", "transfers"] }); setCreateOpen(false); createReset(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al crear"),
  });
  const editMut = useMutation({
    mutationFn: ({ id, p }: { id: string; p: any }) => transfersService.update(id, p),
    onSuccess: () => { toast.success("Transfer actualizado"); qc.invalidateQueries({ queryKey: ["admin", "transfers"] }); setEditOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al actualizar"),
  });
  const toggleMut = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => transfersService.update(id, { activo } as any),
    onSuccess: (_, v) => { toast.success(v.activo ? "Activado" : "Desactivado"); qc.invalidateQueries({ queryKey: ["admin", "transfers"] }); },
    onError: () => toast.error("Error al cambiar estado"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => transfersService.delete(id),
    onSuccess: () => { toast.success("Transfer eliminado"); qc.invalidateQueries({ queryKey: ["admin", "transfers"] }); setDeleteOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al eliminar"),
  });

  const { register: cReg, handleSubmit: cSubmit, reset: createReset, formState: { errors: cErr } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const { register: eReg, handleSubmit: eSubmit, reset: editReset, formState: { errors: eErr } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const openEdit = (item: any) => {
    setSel(item); setTipo(item.tipo);
    editReset({ nombre: item.nombre, origen: item.origen, destino: item.destino, descripcion: item.descripcion, distanciaKm: item.distanciaKm, duracionEstimada: item.duracionEstimada });
    setEditOpen(true);
  };

  const items = data?.data || data || [];

  const columns: DataTableColumn<any>[] = [
    { key: "nombre", header: "Nombre" },
    { key: "tipo", header: "Tipo", render: (i) => <Badge variant="outline" className={tipoColor[i.tipo] || ""}>{i.tipo}</Badge> },
    { key: "origen", header: "Origen" },
    { key: "destino", header: "Destino" },
    { key: "activo", header: "Estado", render: (i) => <Badge variant={i.activo ? "default" : "secondary"}>{i.activo ? "Activo" : "Inactivo"}</Badge> },
    {
      key: "acciones", header: "Acciones",
      render: (i) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Ver" onClick={() => { setSel(i); setDetailOpen(true); }}><Eye className="h-4 w-4 text-blue-600" /></Button>
          <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(i)}><Pencil className="h-4 w-4 text-amber-600" /></Button>
          <Button variant="ghost" size="icon" title={i.activo ? "Desactivar" : "Activar"} onClick={() => toggleMut.mutate({ id: i.id, activo: !i.activo })}><Power className={`h-4 w-4 ${i.activo ? "text-red-500" : "text-green-600"}`} /></Button>
          <Button variant="ghost" size="icon" title="Eliminar" onClick={() => { setSel(i); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-red-700" /></Button>
        </div>
      ),
    },
  ];

  const formFields = (reg: any, err: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Nombre *</Label><Input {...reg("nombre")} />{err.nombre && <p className="text-sm text-destructive">{err.nombre.message}</p>}</div>
        <div className="space-y-2"><Label>Tipo *</Label>
          <Select value={tipo} onValueChange={setTipo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Origen *</Label><Input {...reg("origen")} />{err.origen && <p className="text-sm text-destructive">{err.origen.message}</p>}</div>
        <div className="space-y-2"><Label>Destino *</Label><Input {...reg("destino")} />{err.destino && <p className="text-sm text-destructive">{err.destino.message}</p>}</div>
      </div>
      <div className="space-y-2"><Label>Descripción</Label><Input {...reg("descripcion")} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Distancia (km)</Label><Input type="number" step="0.1" {...reg("distanciaKm")} /></div>
        <div className="space-y-2"><Label>Duracion Estimada</Label><Input placeholder="1h 30min" {...reg("duracionEstimada")} /></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Transfers" description="Gestión de transfers del sistema" action={<Button onClick={() => { setTipo("AEROPUERTO"); setCreateOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nuevo Transfer</Button>} />
      <DataTable columns={columns} data={Array.isArray(items) ? items : []} loading={isLoading} searchPlaceholder="Buscar transfer..." onSearch={setSearch} searchValue={search} emptyMessage="No se encontraron transfers" />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo Transfer</DialogTitle><DialogDescription>Completa los datos.</DialogDescription></DialogHeader>
          <form onSubmit={cSubmit((d) => createMut.mutate({ ...d, tipo }))}>{formFields(cReg, cErr)}<DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={createMut.isPending}>{createMut.isPending ? "Creando..." : "Crear"}</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent><DialogHeader><DialogTitle>Editar Transfer</DialogTitle><DialogDescription>Modifica los datos.</DialogDescription></DialogHeader>
          <form onSubmit={eSubmit((d) => sel && editMut.mutate({ id: sel.id, p: { ...d, tipo } }))}>{formFields(eReg, eErr)}<DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={editMut.isPending}>{editMut.isPending ? "Guardando..." : "Guardar"}</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent><DialogHeader><DialogTitle>Detalles del Transfer</DialogTitle><DialogDescription>Información completa.</DialogDescription></DialogHeader>
          {sel && (<div className="space-y-3"><div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm font-medium text-muted-foreground">Nombre</p><p className="text-sm">{sel.nombre}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Tipo</p><Badge variant="outline" className={tipoColor[sel.tipo] || ""}>{sel.tipo}</Badge></div>
            <div><p className="text-sm font-medium text-muted-foreground">Origen</p><p className="text-sm">{sel.origen}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Destino</p><p className="text-sm">{sel.destino}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Distancia</p><p className="text-sm">{sel.distanciaKm ? `${sel.distanciaKm} km` : "-"}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Duracion</p><p className="text-sm">{sel.duracionEstimada || "-"}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Estado</p><Badge variant={sel.activo ? "default" : "secondary"}>{sel.activo ? "Activo" : "Inactivo"}</Badge></div>
            <div className="col-span-2"><p className="text-sm font-medium text-muted-foreground">Descripción</p><p className="text-sm">{sel.descripcion || "-"}</p></div>
          </div><DialogFooter><Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button><Button onClick={() => { setDetailOpen(false); openEdit(sel); }}><Pencil className="mr-2 h-4 w-4" />Editar</Button></DialogFooter></div>)}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent><DialogHeader><DialogTitle>Eliminar Transfer</DialogTitle><DialogDescription>Esta accion no se puede deshacer.</DialogDescription></DialogHeader>
          {sel && (<div className="space-y-4"><div className="rounded-md bg-destructive/10 p-4"><p className="text-sm">Eliminar <strong>{sel.nombre}</strong> permanentemente?</p></div>
            <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button><Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(sel.id)}>{deleteMut.isPending ? "Eliminando..." : "Eliminar"}</Button></DialogFooter></div>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
