"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Eye, Pencil, Power, Trash2, Upload, Star, X, ImageIcon, BedDouble } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { hospedajesService } from "@/services/hospedajes.service";
import { uploadsService } from "@/services/uploads.service";
import { AmenidadesSelector } from "@/components/shared/amenidades-selector";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

const schema = z.object({
  nombre: z.string().min(2, "Minimo 2 caracteres"),
  descripcion: z.string().optional(),
  direccion: z.string().optional(),
  provincia: z.string().optional(),
  distrito: z.string().optional(),
  corregimiento: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function ImageUploader({ images, setImages, principal, setPrincipal }: {
  images: string[];
  setImages: (imgs: string[]) => void;
  principal: string;
  setPrincipal: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const result = await uploadsService.uploadImages(files);
      const newImages = [...images, ...result.urls];
      setImages(newImages);
      if (!principal && newImages.length > 0) {
        setPrincipal(newImages[0]);
      }
      toast.success(`${result.count} imagen(es) subida(s)`);
    } catch {
      toast.error("Error al subir imagenes");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (url: string) => {
    const updated = images.filter((i) => i !== url);
    setImages(updated);
    if (principal === url) {
      setPrincipal(updated[0] || "");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Label>Imagenes</Label>
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Subiendo..." : "Subir imagenes"}
        </Button>
        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {images.length > 0 && (
        <p className="text-xs text-muted-foreground">Haz clic en la estrella para seleccionar la imagen principal</p>
      )}

      <div className="grid grid-cols-4 gap-3">
        {images.map((url) => (
          <div key={url} className={`group relative aspect-square overflow-hidden rounded-lg border-2 ${principal === url ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
            <img src={`${API_URL}${url}`} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
            <button type="button" className={`absolute left-1 top-1 rounded-full p-1 transition-colors ${principal === url ? "bg-primary text-white" : "bg-white/80 text-muted-foreground hover:text-primary"}`}
              onClick={() => setPrincipal(url)} title="Imagen principal">
              <Star className="h-4 w-4" fill={principal === url ? "currentColor" : "none"} />
            </button>
            <button type="button" className="absolute right-1 top-1 rounded-full bg-white/80 p-1 text-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50"
              onClick={() => removeImage(url)} title="Eliminar">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminHospedajesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sel, setSel] = useState<any>(null);

  // Image state for create/edit
  const [createImages, setCreateImages] = useState<string[]>([]);
  const [createPrincipal, setCreatePrincipal] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editPrincipal, setEditPrincipal] = useState("");
  // Amenidades state
  const [createAmenidades, setCreateAmenidades] = useState<string[]>([]);
  const [editAmenidades, setEditAmenidades] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "hospedajes", search],
    queryFn: () => hospedajesService.getAll({ search: search || undefined, limit: 100 }),
  });

  const createMut = useMutation({
    mutationFn: (p: any) => hospedajesService.create(p),
    onSuccess: () => { toast.success("Hospedaje creado"); qc.invalidateQueries({ queryKey: ["admin", "hospedajes"] }); setCreateOpen(false); createReset(); setCreateImages([]); setCreatePrincipal(""); setCreateAmenidades([]); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al crear"),
  });
  const editMut = useMutation({
    mutationFn: ({ id, p }: { id: string; p: any }) => hospedajesService.update(id, p),
    onSuccess: () => { toast.success("Hospedaje actualizado"); qc.invalidateQueries({ queryKey: ["admin", "hospedajes"] }); setEditOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al actualizar"),
  });
  const toggleMut = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => hospedajesService.update(id, { activo } as any),
    onSuccess: (_, v) => { toast.success(v.activo ? "Activado" : "Desactivado"); qc.invalidateQueries({ queryKey: ["admin", "hospedajes"] }); },
    onError: () => toast.error("Error al cambiar estado"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => hospedajesService.delete(id),
    onSuccess: () => { toast.success("Hospedaje eliminado"); qc.invalidateQueries({ queryKey: ["admin", "hospedajes"] }); setDeleteOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al eliminar"),
  });

  const { register: cReg, handleSubmit: cSubmit, reset: createReset, formState: { errors: cErr } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const { register: eReg, handleSubmit: eSubmit, reset: editReset, formState: { errors: eErr } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const openCreate = () => {
    createReset(); setCreateImages([]); setCreatePrincipal(""); setCreateAmenidades([]); setCreateOpen(true);
  };

  const openEdit = (item: any) => {
    setSel(item);
    editReset({ nombre: item.nombre, descripcion: item.descripcion, direccion: item.direccion, provincia: item.provincia, distrito: item.distrito, corregimiento: item.corregimiento, checkIn: item.checkIn, checkOut: item.checkOut });
    setEditImages(item.imagenes || []);
    setEditPrincipal(item.imagenPrincipal || (item.imagenes?.[0] || ""));
    setEditAmenidades(item.amenidades || []);
    setEditOpen(true);
  };

  const items = data?.data || data || [];

  const columns: DataTableColumn<any>[] = [
    {
      key: "imagen", header: "",
      render: (i) => {
        const img = i.imagenPrincipal || i.imagenes?.[0];
        return img ? (
          <img src={`${API_URL}${img}`} alt={i.nombre} className="h-10 w-10 rounded object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>
        );
      },
    },
    { key: "nombre", header: "Nombre" },
    { key: "provincia", header: "Provincia" },
    { key: "distrito", header: "Distrito" },
    { key: "activo", header: "Estado", render: (i) => <Badge variant={i.activo ? "default" : "secondary"}>{i.activo ? "Activo" : "Inactivo"}</Badge> },
    { key: "createdAt", header: "Creado", render: (i) => new Date(i.createdAt).toLocaleDateString("es-PA") },
    {
      key: "acciones", header: "Acciones",
      render: (i) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Ver" onClick={() => { setSel(i); setDetailOpen(true); }}><Eye className="h-4 w-4 text-blue-600" /></Button>
          <Button variant="ghost" size="icon" title="Habitaciones" onClick={() => router.push(`/admin/hospedajes/${i.id}`)}><BedDouble className="h-4 w-4 text-violet-600" /></Button>
          <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(i)}><Pencil className="h-4 w-4 text-amber-600" /></Button>
          <Button variant="ghost" size="icon" title={i.activo ? "Desactivar" : "Activar"} onClick={() => toggleMut.mutate({ id: i.id, activo: !i.activo })}>
            <Power className={`h-4 w-4 ${i.activo ? "text-red-500" : "text-green-600"}`} />
          </Button>
          <Button variant="ghost" size="icon" title="Eliminar" onClick={() => { setSel(i); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-red-700" /></Button>
        </div>
      ),
    },
  ];

  const formFields = (reg: any, err: any, amenidades: string[], setAmenidades: (a: string[]) => void) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Nombre *</Label><Input {...reg("nombre")} />{err.nombre && <p className="text-sm text-destructive">{err.nombre.message}</p>}</div>
        <div className="space-y-2"><Label>Provincia</Label><Input {...reg("provincia")} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Distrito</Label><Input {...reg("distrito")} /></div>
        <div className="space-y-2"><Label>Corregimiento</Label><Input {...reg("corregimiento")} /></div>
      </div>
      <div className="space-y-2"><Label>Direccion</Label><Input {...reg("direccion")} /></div>
      <div className="space-y-2"><Label>Descripción</Label><Input {...reg("descripcion")} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Check-in</Label><Input placeholder="14:00" {...reg("checkIn")} /></div>
        <div className="space-y-2"><Label>Check-out</Label><Input placeholder="12:00" {...reg("checkOut")} /></div>
      </div>
      <AmenidadesSelector value={amenidades} onChange={setAmenidades} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Hospedajes" description="Gestión de hospedajes del sistema" action={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nuevo Hospedaje</Button>} />
      <DataTable columns={columns} data={Array.isArray(items) ? items : []} loading={isLoading} searchPlaceholder="Buscar hospedaje..." onSearch={setSearch} searchValue={search} emptyMessage="No se encontraron hospedajes" />

      {/* Crear */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo Hospedaje</DialogTitle><DialogDescription>Completa los datos del hospedaje.</DialogDescription></DialogHeader>
          <form onSubmit={cSubmit((d) => createMut.mutate({ ...d, imagenes: createImages, imagenPrincipal: createPrincipal || undefined, amenidades: createAmenidades }))}>
            {formFields(cReg, cErr, createAmenidades, setCreateAmenidades)}
            <div className="mt-4">
              <ImageUploader images={createImages} setImages={setCreateImages} principal={createPrincipal} setPrincipal={setCreatePrincipal} />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMut.isPending}>{createMut.isPending ? "Creando..." : "Crear"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Hospedaje</DialogTitle><DialogDescription>Modifica los datos del hospedaje.</DialogDescription></DialogHeader>
          <form onSubmit={eSubmit((d) => sel && editMut.mutate({ id: sel.id, p: { ...d, imagenes: editImages, imagenPrincipal: editPrincipal || undefined, amenidades: editAmenidades } }))}>
            {formFields(eReg, eErr, editAmenidades, setEditAmenidades)}
            <div className="mt-4">
              <ImageUploader images={editImages} setImages={setEditImages} principal={editPrincipal} setPrincipal={setEditPrincipal} />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={editMut.isPending}>{editMut.isPending ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detalles */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalles del Hospedaje</DialogTitle><DialogDescription>Información completa.</DialogDescription></DialogHeader>
          {sel && (
            <div className="space-y-4">
              {/* Gallery */}
              {sel.imagenes?.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {sel.imagenes.map((url: string) => (
                    <div key={url} className={`relative aspect-square overflow-hidden rounded-lg border-2 ${sel.imagenPrincipal === url ? "border-primary" : "border-border"}`}>
                      <img src={`${API_URL}${url}`} alt="" className="h-full w-full object-cover" />
                      {sel.imagenPrincipal === url && (
                        <div className="absolute left-1 top-1 rounded-full bg-primary p-1 text-white"><Star className="h-3 w-3" fill="currentColor" /></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm font-medium text-muted-foreground">Nombre</p><p className="text-sm">{sel.nombre}</p></div>
                <div><p className="text-sm font-medium text-muted-foreground">Estado</p><Badge variant={sel.activo ? "default" : "secondary"}>{sel.activo ? "Activo" : "Inactivo"}</Badge></div>
                <div><p className="text-sm font-medium text-muted-foreground">Provincia</p><p className="text-sm">{sel.provincia}</p></div>
                <div><p className="text-sm font-medium text-muted-foreground">Distrito</p><p className="text-sm">{sel.distrito}</p></div>
                <div><p className="text-sm font-medium text-muted-foreground">Corregimiento</p><p className="text-sm">{sel.corregimiento}</p></div>
                <div><p className="text-sm font-medium text-muted-foreground">Check-in / Check-out</p><p className="text-sm">{sel.checkIn} / {sel.checkOut}</p></div>
                <div className="col-span-2"><p className="text-sm font-medium text-muted-foreground">Direccion</p><p className="text-sm">{sel.direccion}</p></div>
                <div className="col-span-2"><p className="text-sm font-medium text-muted-foreground">Descripción</p><p className="text-sm">{sel.descripcion}</p></div>
                {sel.amenidades?.length > 0 && (
                  <div className="col-span-2"><p className="text-sm font-medium text-muted-foreground mb-1">Amenidades</p><div className="flex flex-wrap gap-1.5">{sel.amenidades.map((a: string) => <span key={a} className="rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">{a}</span>)}</div></div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
                <Button onClick={() => { setDetailOpen(false); openEdit(sel); }}><Pencil className="mr-2 h-4 w-4" />Editar</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Eliminar */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent><DialogHeader><DialogTitle>Eliminar Hospedaje</DialogTitle><DialogDescription>Esta accion no se puede deshacer.</DialogDescription></DialogHeader>
          {sel && (<div className="space-y-4"><div className="rounded-md bg-destructive/10 p-4"><p className="text-sm">Eliminar <strong>{sel.nombre}</strong> permanentemente?</p></div>
            <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button><Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(sel.id)}>{deleteMut.isPending ? "Eliminando..." : "Eliminar"}</Button></DialogFooter></div>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
