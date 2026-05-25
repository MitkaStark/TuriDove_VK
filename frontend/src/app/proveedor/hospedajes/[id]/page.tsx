"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ArrowLeft, Plus, Pencil, Trash2, Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/axios";
import { hospedajesService } from "@/services/hospedajes.service";
import { uploadsService } from "@/services/uploads.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
const TIPOS_HAB = ["INDIVIDUAL", "DOBLE", "SUITE", "FAMILIAR", "DORMITORIO", "CABANA"];
const TEMPORADAS = ["ALTA", "MEDIA", "BAJA"];

// --- Schemas ---
const habSchema = z.object({
  nombre: z.string().min(2, "Minimo 2 caracteres"),
  capacidad: z.coerce.number().min(1, "Minimo 1"),
  descripcion: z.string().optional(),
});
type HabForm = z.infer<typeof habSchema>;

const tarifaSchema = z.object({
  precioNoche: z.coerce.number().min(0, "Minimo 0"),
  precioPersonaExtra: z.coerce.number().min(0).optional(),
  fechaInicio: z.string().min(1, "Requerido"),
  fechaFin: z.string().min(1, "Requerido"),
});
type TarifaForm = z.infer<typeof tarifaSchema>;

// --- Image Uploader for Habitación ---
function HabImageUploader({ images, setImages }: { images: string[]; setImages: (imgs: string[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const result = await uploadsService.uploadImages(files);
      setImages([...images, ...result.urls]);
      toast.success(`${result.count} imagen(es) subida(s)`);
    } catch { toast.error("Error al subir imagenes"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>Imagenes</Label>
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
          <Upload className="mr-1 h-3 w-3" />{uploading ? "Subiendo..." : "Subir"}
        </Button>
        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((url) => (
            <div key={url} className="group relative h-16 w-16 overflow-hidden rounded border">
              <img src={`${API_URL}${url}`} alt="" className="h-full w-full object-cover" />
              <button type="button" className="absolute right-0 top-0 rounded-bl bg-red-500 p-0.5 text-white opacity-0 group-hover:opacity-100" onClick={() => setImages(images.filter(i => i !== url))}>
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProveedorHospedajeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  // Dialog states
  const [habOpen, setHabOpen] = useState(false);
  const [editHabOpen, setEditHabOpen] = useState(false);
  const [deleteHabOpen, setDeleteHabOpen] = useState(false);
  const [tarifaOpen, setTarifaOpen] = useState(false);
  const [selHab, setSelHab] = useState<any>(null);
  const [habTipo, setHabTipo] = useState("DOBLE");
  const [habImages, setHabImages] = useState<string[]>([]);
  const [createTarifaRows, setCreateTarifaRows] = useState([
    { temporada: "ALTA", precioNoche: "", precioExtra: "0", fechaInicio: "2026-01-01", fechaFin: "2026-04-30" },
    { temporada: "BAJA", precioNoche: "", precioExtra: "0", fechaInicio: "2026-05-01", fechaFin: "2026-12-31" },
  ]);
  const [editHabTipo, setEditHabTipo] = useState("DOBLE");
  const [editHabImages, setEditHabImages] = useState<string[]>([]);
  const [editTarifaRows, setEditTarifaRows] = useState<any[]>([]);
  const [tarifaTemp, setTarifaTemp] = useState("ALTA");
  const [tarifaHabId, setTarifaHabId] = useState("");

  // Queries
  const { data: hospedaje } = useQuery({
    queryKey: ["proveedor", "hospedaje", id],
    queryFn: () => hospedajesService.getById(id),
    enabled: !!id,
  });
  const { data: habitaciones } = useQuery({
    queryKey: ["proveedor", "hospedaje", id, "habitaciones"],
    queryFn: () => hospedajesService.getHabitaciones(id),
    enabled: !!id,
  });
  const { data: tarifas } = useQuery({
    queryKey: ["proveedor", "hospedaje", id, "tarifas"],
    queryFn: () => hospedajesService.getTarifas(id),
    enabled: !!id,
  });

  // Mutations
  const createHabMut = useMutation({
    mutationFn: async (p: any) => {
      const { tarifasData, ...habData } = p;
      const hab = await hospedajesService.createHabitacion(id, habData);
      const habResult = (hab as any)?.data || hab;
      if (tarifasData?.length > 0 && habResult?.id) {
        for (const t of tarifasData) {
          if (t.precioNoche && parseFloat(t.precioNoche) > 0) {
            await hospedajesService.createTarifa(id, {
              habitacionId: habResult.id, temporada: t.temporada,
              precioNoche: parseFloat(t.precioNoche),
              precioPersonaExtra: parseFloat(t.precioExtra || "0"),
              fechaInicio: t.fechaInicio, fechaFin: t.fechaFin,
            });
          }
        }
      }
      return habResult;
    },
    onSuccess: () => {
      toast.success("Habitación y tarifas creadas");
      qc.invalidateQueries({ queryKey: ["proveedor", "hospedaje", id] });
      setHabOpen(false); habReset(); setHabImages([]);
      setCreateTarifaRows([
        { temporada: "ALTA", precioNoche: "", precioExtra: "0", fechaInicio: "2026-01-01", fechaFin: "2026-04-30" },
        { temporada: "BAJA", precioNoche: "", precioExtra: "0", fechaInicio: "2026-05-01", fechaFin: "2026-12-31" },
      ]);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al crear"),
  });

  const editHabMut = useMutation({
    mutationFn: async ({ habId, habData, tarifasData }: { habId: string; habData: any; tarifasData: any[] }) => {
      await api.patch(`/hospedajes/${id}/habitaciones/${habId}`, habData);
      for (const t of tarifasData) {
        if (!t.precioNoche || parseFloat(t.precioNoche) <= 0) continue;
        const payload = {
          habitacionId: habId, temporada: t.temporada,
          precioNoche: parseFloat(t.precioNoche),
          precioPersonaExtra: parseFloat(t.precioExtra || "0"),
          fechaInicio: t.fechaInicio, fechaFin: t.fechaFin,
        };
        if (t.id) {
          await api.patch(`/hospedajes/${id}/tarifas/${t.id}`, payload);
        } else {
          await hospedajesService.createTarifa(id, payload);
        }
      }
    },
    onSuccess: () => { toast.success("Habitación y tarifas actualizadas"); qc.invalidateQueries({ queryKey: ["proveedor", "hospedaje", id] }); setEditHabOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al actualizar"),
  });

  const deleteHabMut = useMutation({
    mutationFn: (habId: string) => api.delete(`/hospedajes/${id}/habitaciones/${habId}`),
    onSuccess: () => { toast.success("Habitación eliminada"); qc.invalidateQueries({ queryKey: ["proveedor", "hospedaje", id] }); setDeleteHabOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al eliminar"),
  });

  const createTarifaMut = useMutation({
    mutationFn: (p: any) => hospedajesService.createTarifa(id, p),
    onSuccess: () => { toast.success("Tarifa creada"); qc.invalidateQueries({ queryKey: ["proveedor", "hospedaje", id] }); setTarifaOpen(false); tarifaReset(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al crear tarifa"),
  });

  // Forms
  const { register: habReg, handleSubmit: habSubmit, reset: habReset, formState: { errors: habErr } } = useForm<HabForm>({ resolver: zodResolver(habSchema) });
  const { register: editHabReg, handleSubmit: editHabSubmit, reset: editHabReset, formState: { errors: editHabErr } } = useForm<HabForm>({ resolver: zodResolver(habSchema) });
  const { register: tarifaReg, handleSubmit: tarifaSubmit, reset: tarifaReset, formState: { errors: tarifaErr } } = useForm<TarifaForm>({ resolver: zodResolver(tarifaSchema) });

  const h = hospedaje as any;
  const habs = Array.isArray(habitaciones) ? habitaciones : (habitaciones as any)?.data || [];
  const tarList = Array.isArray(tarifas) ? tarifas : (tarifas as any)?.data || [];

  const openEditHab = (hab: any) => {
    setSelHab(hab);
    setEditHabTipo(hab.tipo);
    setEditHabImages(hab.imagenes || []);
    editHabReset({ nombre: hab.nombre, capacidad: hab.capacidad, descripcion: hab.descripcion || "" });
    // Load existing tarifas for this habitación
    const existingTarifas = tarList
      .filter((t: any) => t.habitacionId === hab.id)
      .map((t: any) => ({
        id: t.id,
        temporada: t.temporada,
        precioNoche: parseFloat(t.precioNoche).toString(),
        precioExtra: parseFloat(t.precioPersonaExtra || 0).toString(),
        fechaInicio: t.fechaInicio.split("T")[0],
        fechaFin: t.fechaFin.split("T")[0],
      }));
    setEditTarifaRows(existingTarifas.length > 0 ? existingTarifas : [
      { temporada: "ALTA", precioNoche: "", precioExtra: "0", fechaInicio: "2026-01-01", fechaFin: "2026-04-30" },
      { temporada: "BAJA", precioNoche: "", precioExtra: "0", fechaInicio: "2026-05-01", fechaFin: "2026-12-31" },
    ]);
    setEditHabOpen(true);
  };

  if (!h) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/proveedor/hospedajes"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">{h.nombre}</h1>
          <p className="text-sm text-muted-foreground">{h.distrito}, {h.provincia}</p>
        </div>
      </div>

      <Tabs defaultValue="habitaciones">
        <TabsList>
          <TabsTrigger value="habitaciones">Habitaciones ({habs.length})</TabsTrigger>
          <TabsTrigger value="tarifas">Tarifas ({tarList.length})</TabsTrigger>
        </TabsList>

        {/* --- TAB: HABITACIONES --- */}
        <TabsContent value="habitaciones" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { habReset(); setHabTipo("DOBLE"); setHabImages([]); setHabOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Nueva Habitación
            </Button>
          </div>

          {habs.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No hay habitaciones. Agrega la primera.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {habs.map((hab: any) => {
                const habTarifas = tarList.filter((t: any) => t.habitacionId === hab.id);
                const img = hab.imagenes?.[0];
                return (
                  <div key={hab.id} className="card-base overflow-hidden">
                    <div className="aspect-[3/1] bg-muted">
                      {img ? (
                        <img src={img.startsWith('/') ? `${API_URL}${img}` : img} alt={hab.nombre} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground/40" /></div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{hab.nombre}</h3>
                          <div className="mt-1 flex items-center gap-2 text-sm">
                            <Badge variant="outline">{hab.tipo}</Badge>
                            <span className="text-muted-foreground">Cap. {hab.capacidad}</span>
                            <Badge variant={hab.activo ? "default" : "secondary"} className="text-xs">{hab.activo ? "Activo" : "Inactivo"}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditHab(hab)}><Pencil className="h-4 w-4 text-amber-600" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelHab(hab); setDeleteHabOpen(true); }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                        </div>
                      </div>
                      {hab.descripcion && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{hab.descripcion}</p>}
                      {hab.amenidades?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {hab.amenidades.map((a: string) => <span key={a} className="rounded-full bg-muted px-2 py-0.5 text-xs">{a}</span>)}
                        </div>
                      )}
                      {/* Tarifas de esta habitación */}
                      {habTarifas.length > 0 && (
                        <div className="mt-3 border-t pt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Tarifas:</p>
                          <div className="space-y-1">
                            {habTarifas.map((t: any) => (
                              <div key={t.id} className="flex items-center justify-between text-xs">
                                <Badge variant="outline" className="text-xs">{t.temporada}</Badge>
                                <span className="font-medium">${parseFloat(t.precioNoche).toFixed(2)}/noche</span>
                                {parseFloat(t.precioPersonaExtra) > 0 && <span className="text-muted-foreground">+${parseFloat(t.precioPersonaExtra).toFixed(2)} extra</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* --- TAB: TARIFAS --- */}
        <TabsContent value="tarifas" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { tarifaReset(); setTarifaTemp("ALTA"); setTarifaHabId(habs[0]?.id || ""); setTarifaOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Nueva Tarifa
            </Button>
          </div>

          {tarList.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No hay tarifas. Agrega la primera.
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Habitación</th>
                  <th className="p-3 text-left font-medium">Temporada</th>
                  <th className="p-3 text-left font-medium">Precio/Noche</th>
                  <th className="p-3 text-left font-medium">Extra/Persona</th>
                  <th className="p-3 text-left font-medium">Periodo</th>
                </tr></thead>
                <tbody>
                  {tarList.map((t: any) => {
                    const hab = habs.find((h: any) => h.id === t.habitacionId);
                    return (
                      <tr key={t.id} className="border-b">
                        <td className="p-3">{hab?.nombre || "General"}</td>
                        <td className="p-3"><Badge variant="outline">{t.temporada}</Badge></td>
                        <td className="p-3 font-medium">${parseFloat(t.precioNoche).toFixed(2)}</td>
                        <td className="p-3">${parseFloat(t.precioPersonaExtra || 0).toFixed(2)}</td>
                        <td className="p-3 text-muted-foreground">{new Date(t.fechaInicio).toLocaleDateString("es-PA")} - {new Date(t.fechaFin).toLocaleDateString("es-PA")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* --- Modal: Crear Habitación --- */}
      <Dialog open={habOpen} onOpenChange={setHabOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Habitación</DialogTitle><DialogDescription>Agrega una habitación con tarifas a {h.nombre}.</DialogDescription></DialogHeader>
          <form onSubmit={habSubmit((d) => createHabMut.mutate({ ...d, tipo: habTipo, imagenes: habImages, tarifasData: createTarifaRows }))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nombre *</Label><Input {...habReg("nombre")} placeholder="Ej: Suite Familiar" />{habErr.nombre && <p className="text-sm text-destructive">{habErr.nombre.message}</p>}</div>
              <div className="space-y-2"><Label>Tipo *</Label>
                <Select value={habTipo} onValueChange={setHabTipo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIPOS_HAB.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Capacidad (huespedes) *</Label><Input type="number" min="1" {...habReg("capacidad")} />{habErr.capacidad && <p className="text-sm text-destructive">{habErr.capacidad.message}</p>}</div>
              <div className="space-y-2"><Label>Descripción</Label><Input {...habReg("descripcion")} placeholder="Breve descripción" /></div>
            </div>
            <HabImageUploader images={habImages} setImages={setHabImages} />
            {/* Tarifas */}
            <div className="space-y-3 border-t pt-3">
              <Label className="text-sm font-semibold">Tarifas por Temporada</Label>
              {createTarifaRows.map((t, idx) => (
                <div key={idx} className="rounded border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{t.temporada}</Badge>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCreateTarifaRows(createTarifaRows.filter((_, i) => i !== idx))}><X className="h-3 w-3 text-red-500" /></Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className="text-xs">Temporada</Label><Select value={t.temporada} onValueChange={(v) => { const u = [...createTarifaRows]; u[idx] = { ...u[idx], temporada: v }; setCreateTarifaRows(u); }}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{TEMPORADAS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label className="text-xs">Precio/Noche ($)</Label><Input className="h-8 text-xs" type="number" step="0.01" min="0" value={t.precioNoche} onChange={(e) => { const u = [...createTarifaRows]; u[idx] = { ...u[idx], precioNoche: e.target.value }; setCreateTarifaRows(u); }} /></div>
                    <div><Label className="text-xs">Extra/Persona ($)</Label><Input className="h-8 text-xs" type="number" step="0.01" min="0" value={t.precioExtra} onChange={(e) => { const u = [...createTarifaRows]; u[idx] = { ...u[idx], precioExtra: e.target.value }; setCreateTarifaRows(u); }} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Desde</Label><Input className="h-8 text-xs" type="date" value={t.fechaInicio} onChange={(e) => { const u = [...createTarifaRows]; u[idx] = { ...u[idx], fechaInicio: e.target.value }; setCreateTarifaRows(u); }} /></div>
                    <div><Label className="text-xs">Hasta</Label><Input className="h-8 text-xs" type="date" value={t.fechaFin} onChange={(e) => { const u = [...createTarifaRows]; u[idx] = { ...u[idx], fechaFin: e.target.value }; setCreateTarifaRows(u); }} /></div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateTarifaRows([...createTarifaRows, { temporada: "MEDIA", precioNoche: "", precioExtra: "0", fechaInicio: "", fechaFin: "" }])}><Plus className="mr-1 h-3 w-3" />Agregar tarifa</Button>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setHabOpen(false)}>Cancelar</Button><Button type="submit" disabled={createHabMut.isPending}>{createHabMut.isPending ? "Creando..." : "Crear Habitación"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Modal: Editar Habitación --- */}
      <Dialog open={editHabOpen} onOpenChange={setEditHabOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Habitación</DialogTitle><DialogDescription>Modifica los datos y tarifas de la habitación.</DialogDescription></DialogHeader>
          <form onSubmit={editHabSubmit((d) => selHab && editHabMut.mutate({ habId: selHab.id, habData: { ...d, tipo: editHabTipo, imagenes: editHabImages }, tarifasData: editTarifaRows }))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nombre *</Label><Input {...editHabReg("nombre")} />{editHabErr.nombre && <p className="text-sm text-destructive">{editHabErr.nombre.message}</p>}</div>
              <div className="space-y-2"><Label>Tipo *</Label>
                <Select value={editHabTipo} onValueChange={setEditHabTipo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIPOS_HAB.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Capacidad *</Label><Input type="number" min="1" {...editHabReg("capacidad")} /></div>
              <div className="space-y-2"><Label>Descripción</Label><Input {...editHabReg("descripcion")} /></div>
            </div>
            <HabImageUploader images={editHabImages} setImages={setEditHabImages} />
            {/* Tarifas */}
            <div className="space-y-3 border-t pt-3">
              <Label className="text-sm font-semibold">Tarifas por Temporada</Label>
              {editTarifaRows.map((t: any, idx: number) => (
                <div key={idx} className="rounded border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{t.temporada}{t.id ? "" : " (nueva)"}</Badge>
                    {!t.id && <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditTarifaRows(editTarifaRows.filter((_: any, i: number) => i !== idx))}><X className="h-3 w-3 text-red-500" /></Button>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className="text-xs">Temporada</Label><Select value={t.temporada} onValueChange={(v) => { const u = [...editTarifaRows]; u[idx] = { ...u[idx], temporada: v }; setEditTarifaRows(u); }}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{TEMPORADAS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label className="text-xs">Precio/Noche ($)</Label><Input className="h-8 text-xs" type="number" step="0.01" min="0" value={t.precioNoche} onChange={(e) => { const u = [...editTarifaRows]; u[idx] = { ...u[idx], precioNoche: e.target.value }; setEditTarifaRows(u); }} /></div>
                    <div><Label className="text-xs">Extra/Persona ($)</Label><Input className="h-8 text-xs" type="number" step="0.01" min="0" value={t.precioExtra} onChange={(e) => { const u = [...editTarifaRows]; u[idx] = { ...u[idx], precioExtra: e.target.value }; setEditTarifaRows(u); }} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Desde</Label><Input className="h-8 text-xs" type="date" value={t.fechaInicio} onChange={(e) => { const u = [...editTarifaRows]; u[idx] = { ...u[idx], fechaInicio: e.target.value }; setEditTarifaRows(u); }} /></div>
                    <div><Label className="text-xs">Hasta</Label><Input className="h-8 text-xs" type="date" value={t.fechaFin} onChange={(e) => { const u = [...editTarifaRows]; u[idx] = { ...u[idx], fechaFin: e.target.value }; setEditTarifaRows(u); }} /></div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setEditTarifaRows([...editTarifaRows, { temporada: "MEDIA", precioNoche: "", precioExtra: "0", fechaInicio: "", fechaFin: "" }])}><Plus className="mr-1 h-3 w-3" />Agregar tarifa</Button>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditHabOpen(false)}>Cancelar</Button><Button type="submit" disabled={editHabMut.isPending}>{editHabMut.isPending ? "Guardando..." : "Guardar Cambios"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Modal: Eliminar Habitación --- */}
      <Dialog open={deleteHabOpen} onOpenChange={setDeleteHabOpen}>
        <DialogContent><DialogHeader><DialogTitle>Eliminar Habitación</DialogTitle><DialogDescription>Esta accion no se puede deshacer.</DialogDescription></DialogHeader>
          {selHab && (<div className="space-y-4"><div className="rounded-md bg-destructive/10 p-4"><p className="text-sm">Eliminar <strong>{selHab.nombre}</strong> ({selHab.tipo}) permanentemente?</p></div>
            <DialogFooter><Button variant="outline" onClick={() => setDeleteHabOpen(false)}>Cancelar</Button><Button variant="destructive" disabled={deleteHabMut.isPending} onClick={() => deleteHabMut.mutate(selHab.id)}>{deleteHabMut.isPending ? "Eliminando..." : "Eliminar"}</Button></DialogFooter></div>)}
        </DialogContent>
      </Dialog>

      {/* --- Modal: Crear Tarifa --- */}
      <Dialog open={tarifaOpen} onOpenChange={setTarifaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Tarifa</DialogTitle><DialogDescription>Define precio por temporada para una habitación.</DialogDescription></DialogHeader>
          <form onSubmit={tarifaSubmit((d) => createTarifaMut.mutate({ ...d, temporada: tarifaTemp, habitacionId: tarifaHabId || undefined }))} className="space-y-4">
            <div className="space-y-2">
              <Label>Habitación *</Label>
              <Select value={tarifaHabId} onValueChange={setTarifaHabId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar habitación" /></SelectTrigger>
                <SelectContent>
                  {habs.map((hab: any) => <SelectItem key={hab.id} value={hab.id}>{hab.nombre} - {hab.tipo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Temporada *</Label>
              <Select value={tarifaTemp} onValueChange={setTarifaTemp}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TEMPORADAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Precio/Noche ($) *</Label><Input type="number" step="0.01" min="0" {...tarifaReg("precioNoche")} />{tarifaErr.precioNoche && <p className="text-sm text-destructive">{tarifaErr.precioNoche.message}</p>}</div>
              <div className="space-y-2"><Label>Extra/Persona ($)</Label><Input type="number" step="0.01" min="0" {...tarifaReg("precioPersonaExtra")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Fecha Inicio *</Label><Input type="date" {...tarifaReg("fechaInicio")} />{tarifaErr.fechaInicio && <p className="text-sm text-destructive">{tarifaErr.fechaInicio.message}</p>}</div>
              <div className="space-y-2"><Label>Fecha Fin *</Label><Input type="date" {...tarifaReg("fechaFin")} />{tarifaErr.fechaFin && <p className="text-sm text-destructive">{tarifaErr.fechaFin.message}</p>}</div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setTarifaOpen(false)}>Cancelar</Button><Button type="submit" disabled={createTarifaMut.isPending}>{createTarifaMut.isPending ? "Creando..." : "Crear Tarifa"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
