"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, Car, Users, Shield, Calendar, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { vehiculosService } from "@/services/vehiculos.service";
import { reservasService } from "@/services/reservas.service";
import { useAuthStore } from "@/store/auth.store";
import { CheckoutSummary } from "@/components/shared/checkout-summary";
import { applyMargin } from "@/lib/margins";

const tipoColor: Record<string, string> = { SEDAN: "bg-gray-100 text-gray-800", SUV: "bg-blue-100 text-blue-800", PICKUP: "bg-amber-100 text-amber-800", VAN: "bg-green-100 text-green-800", BUS: "bg-purple-100 text-purple-800", MINIBUS: "bg-teal-100 text-teal-800" };

export default function VehiculoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [reservaOpen, setReservaOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [lastReservaId, setLastReservaId] = useState("");
  const [lastTotal, setLastTotal] = useState(0);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [notas, setNotas] = useState("");

  const { data: vehiculo, isLoading } = useQuery({
    queryKey: ["public", "vehiculo", id],
    queryFn: () => vehiculosService.getById(id),
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
      setFechaInicio(""); setFechaFin(""); setNotas("");
      setPaymentOpen(true);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al crear la reserva"),
  });

  const handleReservar = () => {
    if (!isAuthenticated) { toast.error("Debes iniciar sesión para reservar"); router.push("/login"); return; }
    setReservaOpen(true);
  };

  const submitReserva = () => {
    if (!fechaInicio || !fechaFin) { toast.error("Selecciona las fechas de inicio y fin"); return; }
    if (new Date(fechaFin) <= new Date(fechaInicio)) { toast.error("La fecha de fin debe ser posterior a la de inicio"); return; }
    reservaMut.mutate({
      vehiculos: [{ vehiculoId: id, fechaInicio, fechaFin }],
      notas: notas || undefined,
    });
  };

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex min-h-[50vh] items-center justify-center"><p className="text-sm text-navy-400 font-body">Cargando...</p></div>;
  if (!vehiculo) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex min-h-[50vh] flex-col items-center justify-center gap-4"><p className="text-sm text-navy-400 font-body">Vehiculo no encontrado.</p><Link href="/vehiculos" className="inline-flex items-center gap-2 text-sm text-gold-600 hover:text-gold-700 font-body font-semibold"><ArrowLeft className="h-4 w-4" />Volver</Link></div>;

  const v = vehiculo as any;
  const imgSrc = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return path.startsWith('/') ? path : `/${path}`;
  };
  const dias = fechaInicio && fechaFin ? Math.max(1, Math.ceil((new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const precioDia = applyMargin(60, 'vehiculos');
  const totalEstimado = dias * precioDia;
  const mainImg = v.imagenes?.[0];
  const otherImgs = (v.imagenes || []).slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link href="/vehiculos" className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-navy-800 font-body transition-colors group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />Volver a vehículos
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Main image */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-gradient-to-br from-cream-200 to-navy-100">
            {mainImg ? (
              <img src={imgSrc(mainImg)} alt={`${v.marca} ${v.modelo}`} className="h-full w-full object-cover hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="flex h-full items-center justify-center"><Car className="h-24 w-24 text-navy-300" /></div>
            )}
          </div>
          {/* Gallery */}
          {otherImgs.length > 0 && (
            <div className="grid grid-cols-3 gap-2">{otherImgs.map((img: string, i: number) => <div key={i} className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-cream-200 to-navy-100"><img src={imgSrc(img)} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform duration-500" /></div>)}</div>
          )}

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{letterSpacing:'-0.03em'}}>{v.marca} {v.modelo}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-border px-3 py-0.5 text-xs font-semibold">{v.tipo}</span>
              {v.anio && <span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{v.anio}</span>}
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" />{v.capacidadPasajeros} pasajeros</span>
              {v.seguroIncluido && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-0.5 text-xs font-semibold"><Shield className="h-3 w-3" />Seguro incluido</span>}
            </div>
          </div>

          {/* Characteristics */}
          {v.caracteristicas?.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Características</h2>
              <div className="mt-3 flex flex-wrap gap-2">{v.caracteristicas.map((c: string) => <span key={c} className="inline-flex items-center rounded-full bg-primary/8 text-primary px-3 py-1 text-xs font-medium">{c}</span>)}</div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5 sticky top-20 shadow-sm">
            <h3 className="font-semibold">Información</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Marca</span><span className="font-semibold">{v.marca}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Modelo</span><span className="font-semibold">{v.modelo}</span></div>
              {v.placa && <div className="flex items-center justify-between"><span className="text-muted-foreground">Placa</span><span className="font-mono font-semibold">{v.placa}</span></div>}
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Capacidad</span><span className="font-semibold">{v.capacidadPasajeros} pasajeros</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Seguro</span><span className={`font-semibold ${v.seguroIncluido ? 'text-emerald-600' : 'text-muted-foreground'}`}>{v.seguroIncluido ? "Incluido" : "No incluido"}</span></div>
            </div>
            <Button className="w-full rounded-xl h-12 text-base font-semibold shadow-md shadow-primary/20" onClick={handleReservar}><CalendarDays className="mr-2 h-5 w-5" />Reservar Vehículo</Button>
            {!isAuthenticated && <p className="text-xs text-center text-muted-foreground">Debes iniciar sesión para reservar</p>}
          </div>
        </div>
      </div>

      <Dialog open={reservaOpen} onOpenChange={setReservaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reservar Vehiculo</DialogTitle><DialogDescription>{v.marca} {v.modelo} ({v.placa})</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Fecha inicio *</Label><Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} min={new Date().toISOString().split('T')[0]} /></div>
              <div className="space-y-2"><Label>Fecha fin *</Label><Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} min={fechaInicio || new Date().toISOString().split('T')[0]} /></div>
            </div>
            <div className="space-y-2"><Label>Notas (opcional)</Label><Input placeholder="Lugar de entrega, hora..." value={notas} onChange={(e) => setNotas(e.target.value)} /></div>
            {dias > 0 && (
              <div className="rounded-md bg-primary/5 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">{dias} dia(s) x ${precioDia.toFixed(2)}</span><span>${totalEstimado.toFixed(2)}</span></div>
                <div className="flex justify-between border-t pt-1 font-semibold"><span>Total estimado</span><span className="text-primary">${totalEstimado.toFixed(2)}</span></div>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setReservaOpen(false)}>Cancelar</Button><Button onClick={submitReserva} disabled={reservaMut.isPending}>{reservaMut.isPending ? "Reservando..." : "Confirmar Reserva"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <CheckoutSummary reservaId={lastReservaId} total={lastTotal} description={`Vehiculo: ${v.marca} ${v.modelo}`} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
