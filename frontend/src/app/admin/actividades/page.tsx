"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Eye, Pencil, Power, Trash2 } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { actividadesService } from "@/services/actividades.service";
import { categoriasActividadService } from "@/services/categorias-actividad.service";
import { ItinerarioEditor } from "@/components/actividades/itinerario-editor";

const schema = z.object({
  nombre: z.string().min(2, "Minimo 2 caracteres"),
  descripcion: z.string().min(2, "Requerido"),
  ubicacion: z.string().min(2, "Requerido"),
  provincia: z.string().min(2, "Requerido"),
  distrito: z.string().min(2, "Requerido"),
  duracionHoras: z.coerce.number().min(0.5).max(168),
  capacidadMaxima: z.coerce.number().min(1).max(1000),
  edadMinima: z.coerce.number().min(0).max(100).optional(),
});
type FormData = z.infer<typeof schema>;

export default function AdminActividadesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sel, setSel] = useState<any>(null);
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [estado, setEstado] = useState<'DRAFT' | 'ACTIVE' | 'INACTIVE'>('DRAFT');

  const { data: categorias = [] } = useQuery({
    queryKey: ['admin', 'categorias-actividad'],
    queryFn: () => categoriasActividadService.getAll({ soloActivas: true }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "actividades", search],
    queryFn: () => actividadesService.getAll({ search: search || undefined, estado: 'ALL', limit: 100 }),
  });

  const createMut = useMutation({
    mutationFn: (p: any) => actividadesService.create(p),
    onSuccess: () => { toast.success("Actividad creada"); qc.invalidateQueries({ queryKey: ["admin", "actividades"] }); setCreateOpen(false); createReset(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al crear"),
  });
  const editMut = useMutation({
    mutationFn: ({ id, p }: { id: string; p: any }) => actividadesService.update(id, p),
    onSuccess: () => { toast.success("Actividad actualizada"); qc.invalidateQueries({ queryKey: ["admin", "actividades"] }); setEditOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al actualizar"),
  });
  const toggleMut = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'ACTIVE' | 'INACTIVE' }) => actividadesService.update(id, { estado } as any),
    onSuccess: (_, v) => { toast.success(v.estado === 'ACTIVE' ? "Activada" : "Desactivada"); qc.invalidateQueries({ queryKey: ["admin", "actividades"] }); },
    onError: () => toast.error("Error al cambiar estado"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => actividadesService.delete(id),
    onSuccess: () => { toast.success("Actividad eliminada"); qc.invalidateQueries({ queryKey: ["admin", "actividades"] }); setDeleteOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al eliminar"),
  });

  const { register: cReg, handleSubmit: cSubmit, reset: createReset, formState: { errors: cErr } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const { register: eReg, handleSubmit: eSubmit, reset: editReset, formState: { errors: eErr } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const openEdit = (item: any) => {
    setSel(item);
    setCategoriaId(item.categoriaId ?? item.categoria?.id ?? '');
    setEstado(item.estado ?? 'DRAFT');
    editReset({ nombre: item.nombre, descripcion: item.descripcion, ubicacion: item.ubicacion, provincia: item.provincia, distrito: item.distrito, duracionHoras: item.duracionHoras, capacidadMaxima: item.capacidadMaxima, edadMinima: item.edadMinima });
    setEditOpen(true);
  };

  const items = data?.data || data || [];

  const columns: DataTableColumn<any>[] = [
    { key: "nombre", header: "Nombre" },
    { key: "categoria", header: "Categoría", render: (i: any) => <span className="text-sm font-body text-navy-700">{i.categoria?.nombre ?? '—'}</span> },
    { key: "estado", header: "Estado", render: (i: any) => {
      const cls = { DRAFT: 'bg-navy-50 text-navy-500', ACTIVE: 'bg-green-50 text-green-700', INACTIVE: 'bg-red-50 text-red-700' }[i.estado as 'DRAFT'|'ACTIVE'|'INACTIVE'] ?? 'bg-navy-50 text-navy-500';
      return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>{i.estado}</span>;
    }},
    { key: "provincia", header: "Provincia" },
    { key: "duracionHoras", header: "Duracion", render: (i) => `${i.duracionHoras}h` },
    {
      key: "acciones", header: "Acciones",
      render: (i) => {
        const isActive = i.estado === 'ACTIVE';
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" title="Ver" onClick={() => { setSel(i); setDetailOpen(true); }}><Eye className="h-4 w-4 text-blue-600" /></Button>
            <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(i)}><Pencil className="h-4 w-4 text-amber-600" /></Button>
            <Button variant="ghost" size="icon" title={isActive ? "Desactivar" : "Activar"} onClick={() => toggleMut.mutate({ id: i.id, estado: isActive ? 'INACTIVE' : 'ACTIVE' })}><Power className={`h-4 w-4 ${isActive ? "text-red-500" : "text-green-600"}`} /></Button>
            <Button variant="ghost" size="icon" title="Eliminar" onClick={() => { setSel(i); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-red-700" /></Button>
          </div>
        );
      },
    },
  ];

  const formFields = (reg: any, err: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Nombre *</Label><Input {...reg("nombre")} />{err.nombre && <p className="text-sm text-destructive">{err.nombre.message}</p>}</div>
        <div className="space-y-1">
          <Label>Categoría</Label>
          <Select value={categoriaId} onValueChange={setCategoriaId}>
            <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Estado</Label>
        <Select value={estado} onValueChange={(v) => setEstado(v as 'DRAFT' | 'ACTIVE' | 'INACTIVE')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">Borrador</SelectItem>
            <SelectItem value="ACTIVE">Activa</SelectItem>
            <SelectItem value="INACTIVE">Inactiva</SelectItem>
          </SelectContent>
        </Select>
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
      <PageHeader
        title="Actividades"
        description="Gestión de actividades del sistema"
        action={
          <div className="flex items-center gap-3">
            <Link href="/admin/actividades/categorias" className="text-sm font-body text-gold-600 hover:text-gold-700">
              Gestionar categorías →
            </Link>
            <Button onClick={() => { setCategoriaId(""); setEstado("DRAFT"); setCreateOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nueva Actividad</Button>
          </div>
        }
      />
      <DataTable columns={columns} data={Array.isArray(items) ? items : []} loading={isLoading} searchPlaceholder="Buscar actividad..." onSearch={setSearch} searchValue={search} emptyMessage="No se encontraron actividades" />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nueva Actividad</DialogTitle><DialogDescription>Completa los datos.</DialogDescription></DialogHeader>
          <form onSubmit={cSubmit((d) => {
            if (!categoriaId) { toast.error("Selecciona una categoría"); return; }
            createMut.mutate({ ...d, categoriaId, estado });
          })}>{formFields(cReg, cErr)}<DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={createMut.isPending}>{createMut.isPending ? "Creando..." : "Crear"}</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Editar Actividad</DialogTitle><DialogDescription>Modifica los datos.</DialogDescription></DialogHeader>
          <form onSubmit={eSubmit((d) => {
            if (!sel) return;
            if (!categoriaId) { toast.error("Selecciona una categoría"); return; }
            editMut.mutate({ id: sel.id, p: { ...d, categoriaId, estado } });
          })}>{formFields(eReg, eErr)}<DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={editMut.isPending}>{editMut.isPending ? "Guardando..." : "Guardar"}</Button></DialogFooter></form>
          {sel?.id && (
            <div className="mt-6 pt-6 border-t border-navy-100/50">
              <ItinerarioEditor
                actividadId={sel.id}
                initialItems={(sel.itinerario ?? []).map((i: any) => ({
                  dia: i.dia, titulo: i.titulo, descripcion: i.descripcion,
                  lat: i.lat ?? undefined, lng: i.lng ?? undefined, nombreUbicacion: i.nombreUbicacion ?? undefined,
                }))}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent><DialogHeader><DialogTitle>Detalles de la Actividad</DialogTitle><DialogDescription>Información completa.</DialogDescription></DialogHeader>
          {sel && (<div className="space-y-3"><div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm font-medium text-muted-foreground">Nombre</p><p className="text-sm">{sel.nombre}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Categoría</p><span className="text-sm">{sel.categoria?.nombre ?? '—'}</span></div>
            <div><p className="text-sm font-medium text-muted-foreground">Estado</p><span className="text-sm">{sel.estado}</span></div>
            <div><p className="text-sm font-medium text-muted-foreground">Ubicacion</p><p className="text-sm">{sel.ubicacion}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Duracion</p><p className="text-sm">{sel.duracionHoras}h</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Capacidad</p><p className="text-sm">{sel.capacidadMaxima} personas</p></div>
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
