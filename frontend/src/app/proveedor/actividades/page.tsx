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
import { actividadesService } from "@/services/actividades.service";

const TIPOS = ["AVENTURA", "CULTURAL", "GASTRONOMICA", "NATURALEZA", "EDUCATIVA", "DEPORTIVA"];
const tipoColor: Record<string, string> = { AVENTURA: "bg-red-100 text-red-800", CULTURAL: "bg-purple-100 text-purple-800", GASTRONOMICA: "bg-amber-100 text-amber-800", NATURALEZA: "bg-green-100 text-green-800", EDUCATIVA: "bg-blue-100 text-blue-800", DEPORTIVA: "bg-orange-100 text-orange-800" };

const schema = z.object({
  nombre: z.string().min(2, "Minimo 2 caracteres"),
  descripcion: z.string().min(2, "Requerido"),
  ubicacion: z.string().min(2, "Requerido"),
  provincia: z.string().min(2, "Requerido"),
  distrito: z.string().min(2, "Requerido"),
  duracionHoras: z.coerce.number().min(0.5).max(72),
  capacidadMaxima: z.coerce.number().min(1).max(500).optional(),
  edadMinima: z.coerce.number().min(0).max(100).optional(),
});
type FormData = z.infer<typeof schema>;

export default function ProveedorActividadesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sel, setSel] = useState<any>(null);
  const [tipo, setTipo] = useState("NATURALEZA");

  const { data, isLoading } = useQuery({
    queryKey: ["proveedor", "actividades", search],
    queryFn: () => actividadesService.getMine(),
  });

  const createMut = useMutation({
    mutationFn: (p: any) => actividadesService.create(p),
    onSuccess: () => { toast.success("Actividad creada"); qc.invalidateQueries({ queryKey: ["proveedor", "actividades"] }); setCreateOpen(false); createReset(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al crear"),
  });
  const editMut = useMutation({
    mutationFn: ({ id, p }: { id: string; p: any }) => actividadesService.update(id, p),
    onSuccess: () => { toast.success("Actividad actualizada"); qc.invalidateQueries({ queryKey: ["proveedor", "actividades"] }); setEditOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al actualizar"),
  });
  const toggleMut = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => actividadesService.update(id, { activo } as any),
    onSuccess: (_, v) => { toast.success(v.activo ? "Activada" : "Desactivada"); qc.invalidateQueries({ queryKey: ["proveedor", "actividades"] }); },
    onError: () => toast.error("Error al cambiar estado"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => actividadesService.delete(id),
    onSuccess: () => { toast.success("Actividad eliminada"); qc.invalidateQueries({ queryKey: ["proveedor", "actividades"] }); setDeleteOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al eliminar"),
  });

  const { register: cReg, handleSubmit: cSubmit, reset: createReset, formState: { errors: cErr } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const { register: eReg, handleSubmit: eSubmit, reset: editReset, formState: { errors: eErr } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const openEdit = (item: any) => {
    setSel(item); setTipo(item.tipo);
    editReset({ nombre: item.nombre, descripcion: item.descripcion, ubicacion: item.ubicacion, provincia: item.provincia, distrito: item.distrito, duracionHoras: item.duracionHoras, capacidadMaxima: item.capacidadMaxima, edadMinima: item.edadMinima });
    setEditOpen(true);
  };

  const items = data?.data || data || [];

  const columns: DataTableColumn<any>[] = [
    { key: "nombre", header: "Nombre" },
    { key: "tipo", header: "Tipo", render: (i) => <Badge variant="outline" className={tipoColor[i.tipo] || ""}>{i.tipo}</Badge> },
    { key: "provincia", header: "Provincia" },
    { key: "duracionHoras", header: "Duracion", render: (i) => `${i.duracionHoras}h` },
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

  const formFields = (reg: any, err: any, isEdit = false) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Nombre *</Label><Input {...reg("nombre")} />{err.nombre && <p className="text-sm text-destructive">{err.nombre.message}</p>}</div>
        <div className="space-y-2"><Label>Tipo *</Label>
          <Select value={tipo} onValueChange={setTipo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>
      <div className="space-y-2"><Label>Descripción *</Label><Input {...reg("descripcion")} />{err.descripcion && <p className="text-sm text-destructive">{err.descripcion.message}</p>}</div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Ubicacion *</Label><Input {...reg("ubicacion")} />{err.ubicacion && <p className="text-sm text-destructive">{err.ubicacion.message}</p>}</div>
        <div className="space-y-2"><Label>Provincia *</Label><Input {...reg("provincia")} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Distrito *</Label><Input {...reg("distrito")} /></div>
        <div className="space-y-2"><Label>Duracion (horas) *</Label><Input type="number" step="0.5" {...reg("duracionHoras")} /></div>
        <div className="space-y-2"><Label>Capacidad Max</Label><Input type="number" {...reg("capacidadMaxima")} /></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Mis Actividades" description="Gestiona tus actividades" action={<Button onClick={() => { setTipo("NATURALEZA"); setCreateOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nueva Actividad</Button>} />
      <DataTable columns={columns} data={Array.isArray(items) ? items : []} loading={isLoading} searchPlaceholder="Buscar actividad..." onSearch={setSearch} searchValue={search} emptyMessage="No tienes actividades" />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nueva Actividad</DialogTitle><DialogDescription>Completa los datos.</DialogDescription></DialogHeader>
          <form onSubmit={cSubmit((d) => createMut.mutate({ ...d, tipo }))}>{formFields(cReg, cErr)}<DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={createMut.isPending}>{createMut.isPending ? "Creando..." : "Crear"}</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent><DialogHeader><DialogTitle>Editar Actividad</DialogTitle><DialogDescription>Modifica los datos.</DialogDescription></DialogHeader>
          <form onSubmit={eSubmit((d) => sel && editMut.mutate({ id: sel.id, p: { ...d, tipo } }))}>{formFields(eReg, eErr, true)}<DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={editMut.isPending}>{editMut.isPending ? "Guardando..." : "Guardar"}</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent><DialogHeader><DialogTitle>Detalles de la Actividad</DialogTitle><DialogDescription>Información completa.</DialogDescription></DialogHeader>
          {sel && (<div className="space-y-3"><div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm font-medium text-muted-foreground">Nombre</p><p className="text-sm">{sel.nombre}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Tipo</p><Badge variant="outline" className={tipoColor[sel.tipo] || ""}>{sel.tipo}</Badge></div>
            <div><p className="text-sm font-medium text-muted-foreground">Ubicacion</p><p className="text-sm">{sel.ubicacion}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Duracion</p><p className="text-sm">{sel.duracionHoras}h</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Capacidad</p><p className="text-sm">{sel.capacidadMaxima} personas</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Estado</p><Badge variant={sel.activo ? "default" : "secondary"}>{sel.activo ? "Activo" : "Inactivo"}</Badge></div>
            <div className="col-span-2"><p className="text-sm font-medium text-muted-foreground">Descripción</p><p className="text-sm">{sel.descripcion}</p></div>
          </div><DialogFooter><Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button><Button onClick={() => { setDetailOpen(false); openEdit(sel); }}><Pencil className="mr-2 h-4 w-4" />Editar</Button></DialogFooter></div>)}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent><DialogHeader><DialogTitle>Eliminar Actividad</DialogTitle><DialogDescription>Esta accion no se puede deshacer.</DialogDescription></DialogHeader>
          {sel && (<div className="space-y-4"><div className="rounded-md bg-destructive/10 p-4"><p className="text-sm">Eliminar <strong>{sel.nombre}</strong> permanentemente?</p></div>
            <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button><Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(sel.id)}>{deleteMut.isPending ? "Eliminando..." : "Eliminar"}</Button></DialogFooter></div>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
