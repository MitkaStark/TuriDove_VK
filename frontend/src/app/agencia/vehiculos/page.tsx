"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Eye, Pencil, Power, Trash2, Upload, X, Car, ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehiculosService } from "@/services/vehiculos.service";
import { uploadsService } from "@/services/uploads.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
const TIPOS = ["SEDAN", "SUV", "PICKUP", "VAN", "BUS", "MINIBUS"];
const tipoColor: Record<string, string> = { SEDAN: "bg-gray-100 text-gray-800", SUV: "bg-blue-100 text-blue-800", PICKUP: "bg-amber-100 text-amber-800", VAN: "bg-green-100 text-green-800", BUS: "bg-purple-100 text-purple-800", MINIBUS: "bg-teal-100 text-teal-800" };

const schema = z.object({
  marca: z.string().min(2, "Requerido"),
  modelo: z.string().min(1, "Requerido"),
  anio: z.coerce.number().min(1990).max(2030).optional(),
  placa: z.string().optional(),
  capacidadPasajeros: z.coerce.number().min(1, "Minimo 1"),
});
type FormData = z.infer<typeof schema>;

function ImageUploader({ images, setImages }: { images: string[]; setImages: (imgs: string[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    setUploading(true);
    try { const r = await uploadsService.uploadImages(files); setImages([...images, ...r.urls]); toast.success(`${r.count} imagen(es) subida(s)`); } catch { toast.error("Error al subir"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2"><Label>Imagenes</Label><Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}><Upload className="mr-1 h-3 w-3" />{uploading ? "Subiendo..." : "Subir imagenes"}</Button><input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} /></div>
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((url) => (
            <div key={url} className="group relative aspect-video overflow-hidden rounded-lg border">
              <img src={`${API_URL}${url}`} alt="" className="h-full w-full object-cover" />
              <button type="button" className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 group-hover:opacity-100" onClick={() => setImages(images.filter(i => i !== url))}><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgenciaVehiculosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false); const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false); const [deleteOpen, setDeleteOpen] = useState(false);
  const [sel, setSel] = useState<any>(null);
  const [tipo, setTipo] = useState("SUV"); const [seguro, setSeguro] = useState(false);
  const [createImages, setCreateImages] = useState<string[]>([]);
  const [editImages, setEditImages] = useState<string[]>([]);

  const { data, isLoading } = useQuery({ queryKey: ["agencia", "vehiculos", search], queryFn: () => vehiculosService.getMine() });

  const createMut = useMutation({ mutationFn: (p: any) => vehiculosService.create(p), onSuccess: () => { toast.success("Vehiculo creado"); qc.invalidateQueries({ queryKey: ["agencia", "vehiculos"] }); setCreateOpen(false); createReset(); setCreateImages([]); }, onError: (e: any) => toast.error(e?.response?.data?.message || "Error") });
  const editMut = useMutation({ mutationFn: ({ id, p }: { id: string; p: any }) => vehiculosService.update(id, p), onSuccess: () => { toast.success("Vehiculo actualizado"); qc.invalidateQueries({ queryKey: ["agencia", "vehiculos"] }); setEditOpen(false); }, onError: (e: any) => toast.error(e?.response?.data?.message || "Error") });
  const toggleMut = useMutation({ mutationFn: ({ id, activo }: { id: string; activo: boolean }) => vehiculosService.update(id, { activo } as any), onSuccess: (_, v) => { toast.success(v.activo ? "Activado" : "Desactivado"); qc.invalidateQueries({ queryKey: ["agencia", "vehiculos"] }); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => vehiculosService.delete(id), onSuccess: () => { toast.success("Vehiculo eliminado"); qc.invalidateQueries({ queryKey: ["agencia", "vehiculos"] }); setDeleteOpen(false); } });

  const { register: cReg, handleSubmit: cSubmit, reset: createReset, formState: { errors: cErr } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const { register: eReg, handleSubmit: eSubmit, reset: editReset, formState: { errors: eErr } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const openCreate = () => { createReset(); setTipo("SUV"); setSeguro(false); setCreateImages([]); setCreateOpen(true); };
  const openEdit = (item: any) => { setSel(item); setTipo(item.tipo); setSeguro(item.seguroIncluido); setEditImages(item.imagenes || []); editReset({ marca: item.marca, modelo: item.modelo, anio: item.anio, placa: item.placa, capacidadPasajeros: item.capacidadPasajeros }); setEditOpen(true); };

  const items = data?.data || data || [];

  const columns: DataTableColumn<any>[] = [
    { key: "img", header: "", render: (i) => { const img = i.imagenes?.[0]; return img ? <img src={`${API_URL}${img}`} alt="" className="h-10 w-14 rounded object-cover" /> : <div className="flex h-10 w-14 items-center justify-center rounded bg-muted"><Car className="h-5 w-5 text-muted-foreground" /></div>; } },
    { key: "vehiculo", header: "Vehiculo", render: (i) => `${i.marca} ${i.modelo} (${i.anio || "-"})` },
    { key: "placa", header: "Placa" },
    { key: "tipo", header: "Tipo", render: (i) => <Badge variant="outline" className={tipoColor[i.tipo] || ""}>{i.tipo}</Badge> },
    { key: "capacidadPasajeros", header: "Capacidad" },
    { key: "activo", header: "Estado", render: (i) => <Badge variant={i.activo ? "default" : "secondary"}>{i.activo ? "Activo" : "Inactivo"}</Badge> },
    { key: "acciones", header: "Acciones", render: (i) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" title="Ver" onClick={() => { setSel(i); setDetailOpen(true); }}><Eye className="h-4 w-4 text-blue-600" /></Button>
        <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(i)}><Pencil className="h-4 w-4 text-amber-600" /></Button>
        <Button variant="ghost" size="icon" title={i.activo ? "Desactivar" : "Activar"} onClick={() => toggleMut.mutate({ id: i.id, activo: !i.activo })}><Power className={`h-4 w-4 ${i.activo ? "text-red-500" : "text-green-600"}`} /></Button>
        <Button variant="ghost" size="icon" title="Eliminar" onClick={() => { setSel(i); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-red-700" /></Button>
      </div>
    )},
  ];

  const formFields = (reg: any, err: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Marca *</Label><Input {...reg("marca")} />{err.marca && <p className="text-sm text-destructive">{err.marca.message}</p>}</div>
        <div className="space-y-2"><Label>Modelo *</Label><Input {...reg("modelo")} />{err.modelo && <p className="text-sm text-destructive">{err.modelo.message}</p>}</div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Ano</Label><Input type="number" {...reg("anio")} /></div>
        <div className="space-y-2"><Label>Placa</Label><Input {...reg("placa")} /></div>
        <div className="space-y-2"><Label>Tipo *</Label><Select value={tipo} onValueChange={setTipo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Capacidad Pasajeros *</Label><Input type="number" {...reg("capacidadPasajeros")} />{err.capacidadPasajeros && <p className="text-sm text-destructive">{err.capacidadPasajeros.message}</p>}</div>
        <div className="space-y-2"><Label>Seguro Incluido</Label><Select value={seguro ? "true" : "false"} onValueChange={(v) => setSeguro(v === "true")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Si</SelectItem><SelectItem value="false">No</SelectItem></SelectContent></Select></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Mis Vehiculos" description="Gestiona tus vehiculos" action={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nuevo Vehiculo</Button>} />
      <DataTable columns={columns} data={Array.isArray(items) ? items : []} loading={isLoading} searchPlaceholder="Buscar vehiculo..." onSearch={setSearch} searchValue={search} emptyMessage="No tienes vehiculos" />

      {/* Crear */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nuevo Vehiculo</DialogTitle><DialogDescription>Completa los datos del vehiculo.</DialogDescription></DialogHeader>
          <form onSubmit={cSubmit((d) => createMut.mutate({ ...d, tipo, seguroIncluido: seguro, imagenes: createImages }))}>
            {formFields(cReg, cErr)}
            <div className="mt-4"><ImageUploader images={createImages} setImages={setCreateImages} /></div>
            <DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={createMut.isPending}>{createMut.isPending ? "Creando..." : "Crear"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Editar Vehiculo</DialogTitle><DialogDescription>Modifica los datos del vehiculo.</DialogDescription></DialogHeader>
          <form onSubmit={eSubmit((d) => sel && editMut.mutate({ id: sel.id, p: { ...d, tipo, seguroIncluido: seguro, imagenes: editImages } }))}>
            {formFields(eReg, eErr)}
            <div className="mt-4"><ImageUploader images={editImages} setImages={setEditImages} /></div>
            <DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={editMut.isPending}>{editMut.isPending ? "Guardando..." : "Guardar"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detalles */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Detalles del Vehiculo</DialogTitle><DialogDescription>Información completa.</DialogDescription></DialogHeader>
          {sel && (<div className="space-y-4">
            {sel.imagenes?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">{sel.imagenes.map((url: string) => <div key={url} className="aspect-video overflow-hidden rounded-lg border"><img src={`${API_URL}${url}`} alt="" className="h-full w-full object-cover" /></div>)}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm font-medium text-muted-foreground">Vehiculo</p><p className="text-sm">{sel.marca} {sel.modelo}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Ano</p><p className="text-sm">{sel.anio || "-"}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Placa</p><p className="text-sm">{sel.placa || "-"}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Tipo</p><Badge variant="outline" className={tipoColor[sel.tipo] || ""}>{sel.tipo}</Badge></div>
              <div><p className="text-sm font-medium text-muted-foreground">Capacidad</p><p className="text-sm">{sel.capacidadPasajeros} pasajeros</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Seguro</p><p className="text-sm">{sel.seguroIncluido ? "Si" : "No"}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Estado</p><Badge variant={sel.activo ? "default" : "secondary"}>{sel.activo ? "Activo" : "Inactivo"}</Badge></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button><Button onClick={() => { setDetailOpen(false); openEdit(sel); }}><Pencil className="mr-2 h-4 w-4" />Editar</Button></DialogFooter>
          </div>)}
        </DialogContent>
      </Dialog>

      {/* Eliminar */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent><DialogHeader><DialogTitle>Eliminar Vehiculo</DialogTitle><DialogDescription>Esta accion no se puede deshacer.</DialogDescription></DialogHeader>
          {sel && (<div className="space-y-4"><div className="rounded-md bg-destructive/10 p-4"><p className="text-sm">Eliminar <strong>{sel.marca} {sel.modelo} ({sel.placa})</strong> permanentemente?</p></div>
            <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button><Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(sel.id)}>{deleteMut.isPending ? "Eliminando..." : "Eliminar"}</Button></DialogFooter></div>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
