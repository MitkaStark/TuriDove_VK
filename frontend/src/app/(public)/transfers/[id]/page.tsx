"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, Bus, MapPin, Clock, Route, CalendarDays, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { transfersService } from "@/services/transfers.service";
import { reservasService } from "@/services/reservas.service";
import { useAuthStore } from "@/store/auth.store";
import { CheckoutSummary } from "@/components/shared/checkout-summary";
import { applyMargin } from "@/lib/margins";

const tipoLabel: Record<string, string> = { AEROPUERTO: "Aeropuerto", TOUR: "Tour", PUNTO_A_PUNTO: "Punto a Punto", HOTEL: "Hotel" };

export default function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [reservaOpen, setReservaOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [lastReservaId, setLastReservaId] = useState("");
  const [lastTotal, setLastTotal] = useState(0);
  const [fecha, setFecha] = useState("");
  const [pasajeros, setPasajeros] = useState("1");
  const [notas, setNotas] = useState("");

  const { data: transfer, isLoading } = useQuery({
    queryKey: ["public", "transfer", id],
    queryFn: () => transfersService.getById(id),
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
      setFecha(""); setPasajeros("1"); setNotas("");
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
    if (parseInt(pasajeros) < 1) { toast.error("Debe haber al menos 1 pasajero"); return; }
    reservaMut.mutate({
      transfers: [{ transferId: id, fecha, pasajeros: parseInt(pasajeros) }],
      notas: notas || undefined,
    });
  };

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex min-h-[50vh] items-center justify-center"><p className="text-sm text-navy-400 font-body">Cargando...</p></div>;
  if (!transfer) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex min-h-[50vh] flex-col items-center justify-center gap-4"><p className="text-sm text-navy-400 font-body">Transfer no encontrado.</p><Link href="/transfers" className="inline-flex items-center gap-2 text-sm text-gold-600 hover:text-gold-700 font-body font-semibold"><ArrowLeft className="h-4 w-4" />Volver</Link></div>;

  const t = transfer as any;
  const numPasajeros = parseInt(pasajeros) || 0;
  const precioPasajero = applyMargin(20, 'transfers');
  const totalEstimado = numPasajeros * precioPasajero;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link href="/transfers" className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-navy-800 font-body transition-colors group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />Volver a transfers
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><Bus className="h-6 w-6 text-primary" /></div>
              <span className="inline-flex items-center rounded-full border border-border px-3 py-0.5 text-xs font-semibold">{tipoLabel[t.tipo] || t.tipo}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight" style={{letterSpacing:'-0.03em'}}>{t.nombre}</h1>
          </div>

          {/* Route card */}
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Origen</p>
                <p className="mt-1 text-lg font-semibold">{t.origen}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-px w-12 bg-primary/20"></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
                <div className="h-px w-12 bg-primary/20"></div>
              </div>
              <div className="flex-1 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Destino</p>
                <p className="mt-1 text-lg font-semibold">{t.destino}</p>
              </div>
            </div>
          </div>

          {t.descripcion && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Descripción</h2>
              <p className="mt-3 text-foreground/80 leading-relaxed">{t.descripcion}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5 sticky top-20 shadow-sm">
            <h3 className="font-semibold">Información del Trayecto</h3>
            <div className="space-y-3 text-sm">
              {t.distanciaKm && <div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-2"><Route className="h-4 w-4" />Distancia</span><span className="font-semibold">{t.distanciaKm} km</span></div>}
              {t.duracionEstimada && <div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" />Duración</span><span className="font-semibold">{t.duracionEstimada}</span></div>}
            </div>
            <Button className="w-full rounded-xl h-12 text-base font-semibold shadow-md shadow-primary/20" onClick={handleReservar}><CalendarDays className="mr-2 h-5 w-5" />Reservar Transfer</Button>
            {!isAuthenticated && <p className="text-xs text-center text-muted-foreground">Debes iniciar sesión para reservar</p>}
          </div>
        </div>
      </div>

      <Dialog open={reservaOpen} onOpenChange={setReservaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reservar Transfer</DialogTitle><DialogDescription>{t.origen} → {t.destino}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Fecha del transfer *</Label><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} min={new Date().toISOString().split('T')[0]} /></div>
            <div className="space-y-2"><Label>Número de pasajeros *</Label><Input type="number" min="1" max="30" value={pasajeros} onChange={(e) => setPasajeros(e.target.value)} /></div>
            <div className="space-y-2"><Label>Notas (opcional)</Label><Input placeholder="Hora de vuelo, equipaje especial..." value={notas} onChange={(e) => setNotas(e.target.value)} /></div>
            {fecha && numPasajeros > 0 && (
              <div className="rounded-md bg-primary/5 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">{numPasajeros} pasajero(s) x ${precioPasajero.toFixed(2)}</span><span>${totalEstimado.toFixed(2)}</span></div>
                <div className="flex justify-between border-t pt-1 font-semibold"><span>Total estimado</span><span className="text-primary">${totalEstimado.toFixed(2)}</span></div>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setReservaOpen(false)}>Cancelar</Button><Button onClick={submitReserva} disabled={reservaMut.isPending}>{reservaMut.isPending ? "Reservando..." : "Confirmar Reserva"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <CheckoutSummary reservaId={lastReservaId} total={lastTotal} description={`Transfer: ${t.nombre}`} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
