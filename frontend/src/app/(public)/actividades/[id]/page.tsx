"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, MapPin, Clock, Users, Mountain, Sun, TreePine, Waves, GraduationCap, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { actividadesService } from "@/services/actividades.service";
import { reservasService } from "@/services/reservas.service";
import { useAuthStore } from "@/store/auth.store";
import { PaymentModal } from "@/components/shared/payment-modal";
import { applyMargin } from "@/lib/margins";

const tipoIcons: Record<string, any> = {
  AVENTURA: Mountain, GASTRONOMICA: Sun, NATURALEZA: TreePine, CULTURAL: Users, DEPORTIVA: Waves, EDUCATIVA: GraduationCap,
};

export default function ActividadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [reservaOpen, setReservaOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [lastReservaId, setLastReservaId] = useState("");
  const [lastTotal, setLastTotal] = useState(0);
  const [fecha, setFecha] = useState("");
  const [adultos, setAdultos] = useState("1");
  const [ninos, setNinos] = useState("0");
  const [notas, setNotas] = useState("");

  const { data: actividad, isLoading } = useQuery({
    queryKey: ["public", "actividad", id],
    queryFn: () => actividadesService.getById(id),
    enabled: !!id,
  });

  const reservaMut = useMutation({
    mutationFn: (payload: any) => reservasService.create(payload),
    onSuccess: (data: any) => {
      const r = data?.data || data;
      setLastReservaId(r?.id || "");
      setLastTotal(parseFloat(r?.total || totalEstimado));
      toast.success("Reserva creada! Procede al pago.");
      setReservaOpen(false);
      setFecha(""); setAdultos("1"); setNinos("0"); setNotas("");
      setPaymentOpen(true);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al crear la reserva"),
  });

  const handleReservar = () => {
    if (!isAuthenticated) { toast.error("Debes iniciar sesión para reservar"); router.push("/login"); return; }
    setReservaOpen(true);
  };

  const submitReserva = () => {
    if (!fecha) { toast.error("Selecciona una fecha"); return; }
    if (parseInt(adultos) < 1) { toast.error("Debe haber al menos 1 adulto"); return; }
    reservaMut.mutate({
      actividades: [{ actividadId: id, fecha, adultos: parseInt(adultos), ninos: parseInt(ninos) }],
      notas: notas || undefined,
    });
  };

  if (isLoading) return <div className="container-page flex min-h-[50vh] items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!actividad) return <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4"><p className="text-muted-foreground">Actividad no encontrada.</p><Link href="/actividades"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button></Link></div>;

  const a = actividad as any;
  const Icon = tipoIcons[a.tipo] || Mountain;
  const numAdultos = parseInt(adultos) || 0;
  const numNinos = parseInt(ninos) || 0;
  const precioAdulto = applyMargin(45, 'actividades');
  const precioNino = applyMargin(25, 'actividades');
  const totalEstimado = (numAdultos * precioAdulto) + (numNinos * precioNino);

  return (
    <div className="container-page py-10">
      <Link href="/actividades" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />Volver a actividades
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10"><Icon className="h-8 w-8 text-primary" /></div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{letterSpacing:'-0.03em'}}>{a.nombre}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-border px-3 py-0.5 text-xs font-semibold">{a.tipo}</span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-3.5 w-3.5" />{a.duracionHoras} horas</span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-primary" />{a.ubicacion}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Descripción</h2>
            <p className="mt-3 text-foreground/80 leading-relaxed">{a.descripcion}</p>
          </div>

          {/* Includes grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            {a.incluye?.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
                <h2 className="text-sm font-semibold text-emerald-800">Incluye</h2>
                <ul className="mt-3 space-y-2">{a.incluye.map((item: string) => <li key={item} className="flex items-start gap-2 text-sm text-emerald-700"><span className="mt-0.5 text-emerald-500">✓</span>{item}</li>)}</ul>
              </div>
            )}
            {a.noIncluye?.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
                <h2 className="text-sm font-semibold text-red-800">No Incluye</h2>
                <ul className="mt-3 space-y-2">{a.noIncluye.map((item: string) => <li key={item} className="flex items-start gap-2 text-sm text-red-700"><span className="mt-0.5 text-red-400">✗</span>{item}</li>)}</ul>
              </div>
            )}
          </div>

          {a.requisitos?.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Requisitos</h2>
              <ul className="mt-3 space-y-2">{a.requisitos.map((item: string) => <li key={item} className="flex items-start gap-2 text-sm text-foreground/70"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0"></span>{item}</li>)}</ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5 sticky top-20 shadow-sm">
            <h3 className="font-semibold">Información</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Duración</span><span className="font-semibold">{a.duracionHoras} horas</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Provincia</span><span className="font-semibold">{a.provincia}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Capacidad</span><span className="font-semibold">{a.capacidadMaxima || "-"} personas</span></div>
              {a.edadMinima > 0 && <div className="flex items-center justify-between"><span className="text-muted-foreground">Edad mínima</span><span className="font-semibold">{a.edadMinima} años</span></div>}
            </div>
            <Button className="w-full rounded-xl h-12 text-base font-semibold shadow-md shadow-primary/20" onClick={handleReservar}><CalendarDays className="mr-2 h-5 w-5" />Reservar Ahora</Button>
            {!isAuthenticated && <p className="text-xs text-center text-muted-foreground">Debes iniciar sesión para reservar</p>}
          </div>
        </div>
      </div>

      <Dialog open={reservaOpen} onOpenChange={setReservaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reservar: {a.nombre}</DialogTitle><DialogDescription>Completa los datos para tu reserva.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Fecha de la actividad *</Label><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} min={new Date().toISOString().split('T')[0]} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Adultos *</Label><Input type="number" min="1" max={a.capacidadMaxima || 20} value={adultos} onChange={(e) => setAdultos(e.target.value)} /></div>
              <div className="space-y-2"><Label>Ninos</Label><Input type="number" min="0" max="10" value={ninos} onChange={(e) => setNinos(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Notas (opcional)</Label><Input placeholder="Alergias, preferencias..." value={notas} onChange={(e) => setNotas(e.target.value)} /></div>
            {fecha && (
              <div className="rounded-md bg-primary/5 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">{numAdultos} adulto(s) x ${precioAdulto.toFixed(2)}</span><span>${(numAdultos * precioAdulto).toFixed(2)}</span></div>
                {numNinos > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{numNinos} nino(s) x ${precioNino.toFixed(2)}</span><span>${(numNinos * precioNino).toFixed(2)}</span></div>}
                <div className="flex justify-between border-t pt-1 font-semibold"><span>Total estimado</span><span className="text-primary">${totalEstimado.toFixed(2)}</span></div>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setReservaOpen(false)}>Cancelar</Button><Button onClick={submitReserva} disabled={reservaMut.isPending}>{reservaMut.isPending ? "Reservando..." : "Confirmar Reserva"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentModal open={paymentOpen} onOpenChange={setPaymentOpen} reservaId={lastReservaId} monto={lastTotal} descripcion={`Actividad: ${a.nombre}`} />
    </div>
  );
}
