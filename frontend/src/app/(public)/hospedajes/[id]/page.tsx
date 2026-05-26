"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, MapPin, Clock, Home, CalendarDays, Users, Eye, BedDouble, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { hospedajesService } from "@/services/hospedajes.service";
import { CheckoutSummary } from "@/components/shared/checkout-summary";
import { applyMargin, getMarginPercent } from "@/lib/margins";
import { reservasService } from "@/services/reservas.service";
import { useAuthStore } from "@/store/auth.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

export default function HospedajeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [reservaOpen, setReservaOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [lastReservaId, setLastReservaId] = useState("");
  const [lastTotal, setLastTotal] = useState(0);
  const [habitacionId, setHabitacionId] = useState("");
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [huespedes, setHuespedes] = useState("1");
  const [notas, setNotas] = useState("");
  const [habDetailOpen, setHabDetailOpen] = useState(false);
  const [habDetailData, setHabDetailData] = useState<any>(null);
  const [habImgIndex, setHabImgIndex] = useState(0);

  const { data: hospedaje, isLoading } = useQuery({
    queryKey: ["public", "hospedaje", id],
    queryFn: () => hospedajesService.getById(id),
    enabled: !!id,
  });

  const { data: habitaciones } = useQuery({
    queryKey: ["public", "hospedaje", id, "habitaciones"],
    queryFn: () => hospedajesService.getHabitaciones(id),
    enabled: !!id,
  });

  const reservaMut = useMutation({
    mutationFn: (payload: any) => reservasService.create(payload),
    onSuccess: (data: any) => {
      const reservaData = data?.data || data;
      setLastReservaId(reservaData?.id || "");
      setLastTotal(parseFloat(reservaData?.total || totalEstimado));
      toast.success("Reserva creada! Procede al pago.");
      setReservaOpen(false);
      setHabitacionId(""); setFechaEntrada(""); setFechaSalida(""); setHuespedes("1"); setNotas("");
      setPaymentOpen(true);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Error al crear la reserva");
    },
  });

  const handleReservar = () => {
    if (!isAuthenticated) {
      toast.error("Debes iniciar sesión para reservar");
      router.push("/login");
      return;
    }
    setReservaOpen(true);
  };

  const submitReserva = () => {
    if (!habitacionId || !fechaEntrada || !fechaSalida) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    if (new Date(fechaSalida) <= new Date(fechaEntrada)) {
      toast.error("La fecha de salida debe ser posterior a la de entrada");
      return;
    }

    reservaMut.mutate({
      hospedajes: [{
        hospedajeId: id,
        habitacionId,
        fechaEntrada,
        fechaSalida,
        huespedes: parseInt(huespedes),
      }],
      notas: notas || undefined,
    });
  };

  if (isLoading) {
    return <div className="container-page flex min-h-[50vh] items-center justify-center"><p className="text-muted-foreground">Cargando hotel...</p></div>;
  }

  if (!hospedaje) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Hotel no encontrado.</p>
        <Link href="/hospedajes"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Volver a hoteles</Button></Link>
      </div>
    );
  }

  const h = hospedaje as any;
  const mainImg = h.imagenPrincipal || h.imagenes?.[0];
  const otherImgs = (h.imagenes || []).filter((img: string) => img !== mainImg);
  const habs = Array.isArray(habitaciones) ? habitaciones : (habitaciones as any)?.data || [];

  // Calculate nights for display
  const noches = fechaEntrada && fechaSalida
    ? Math.max(1, Math.ceil((new Date(fechaSalida).getTime() - new Date(fechaEntrada).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Find selected habitación and its cheapest tarifa + apply margin
  const selectedHab = habs.find((hab: any) => hab.id === habitacionId);
  const tarifaBase = selectedHab?.tarifas?.[0];
  const precioNocheBase = tarifaBase ? parseFloat(tarifaBase.precioNoche) : 0;
  const precioExtraBase = tarifaBase ? parseFloat(tarifaBase.precioPersonaExtra || 0) : 0;
  const precioNoche = applyMargin(precioNocheBase, 'hospedajes');
  const precioExtra = applyMargin(precioExtraBase, 'hospedajes');
  const marginPct = getMarginPercent('hospedajes');
  const numHuespedes = parseInt(huespedes) || 1;
  const huespedesExtra = Math.max(0, numHuespedes - 1);
  const precioPorNoche = precioNoche + (precioExtra * huespedesExtra);
  const totalEstimado = precioPorNoche * noches;

  return (
    <div className="container-page py-10">
      {/* Back */}
      <Link href="/hospedajes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />Volver a hoteles
      </Link>

      {/* Image Gallery */}
      <div className="mt-6 grid gap-2 md:grid-cols-2 rounded-2xl overflow-hidden">
        <div className="aspect-[4/3] bg-muted">
          {mainImg ? (
            <img src={`${API_URL}${mainImg}`} alt={h.nombre} className="h-full w-full object-cover hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/20">
              <Home className="h-16 w-16 text-primary/30" />
            </div>
          )}
        </div>
        {otherImgs.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {otherImgs.slice(0, 4).map((img: string, i: number) => (
              <div key={i} className="aspect-[4/3] bg-muted overflow-hidden">
                <img src={`${API_URL}${img}`} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{letterSpacing: '-0.03em'}}>{h.nombre}</h1>
            <div className="mt-3 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm">{[h.corregimiento, h.distrito, h.provincia].filter(Boolean).join(", ")}</span>
            </div>
          </div>

          {/* Description */}
          {h.descripcion && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Descripción</h2>
              <p className="mt-3 text-foreground/80 leading-relaxed">{h.descripcion}</p>
            </div>
          )}

          {h.direccion && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Dirección</h2>
              <p className="mt-2 text-foreground/80">{h.direccion}</p>
            </div>
          )}

          {/* Amenidades */}
          {h.amenidades?.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Amenidades</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {h.amenidades.map((a: string) => (
                  <span key={a} className="inline-flex items-center rounded-full bg-primary/8 text-primary px-3 py-1 text-xs font-medium">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Habitaciones */}
          {habs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Habitaciones Disponibles</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {habs.filter((hab: any) => hab.activo).map((hab: any) => {
                  const img = hab.imagenes?.[0];
                  const tarifa = hab.tarifas?.[0];
                  const precio = tarifa ? applyMargin(parseFloat(tarifa.precioNoche), 'hospedajes') : 0;
                  return (
                    <div key={hab.id} className="rounded-xl border border-border/60 overflow-hidden hover:shadow-lg transition-all duration-300 bg-card">
                      {img && (
                        <div className="aspect-[2.5/1] bg-muted overflow-hidden">
                          <img src={img.startsWith('/') ? `${API_URL}${img}` : img} alt={hab.nombre} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm">{hab.nombre}</h3>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold">{hab.tipo}</span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{hab.capacidad}</span>
                            </div>
                          </div>
                          {precio > 0 && (
                            <div className="text-right shrink-0">
                              <span className="text-xl font-bold text-primary">${precio.toFixed(0)}</span>
                              <p className="text-[10px] text-muted-foreground">/noche</p>
                            </div>
                          )}
                        </div>
                        {hab.descripcion && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{hab.descripcion}</p>}
                        {hab.amenidades?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {hab.amenidades.slice(0, 4).map((a: string) => <span key={a} className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px]">{a}</span>)}
                          </div>
                        )}
                        {hab.tarifas?.length > 1 && (
                          <div className="mt-3 pt-2 border-t border-border/50 flex gap-2">
                            {hab.tarifas.map((t: any) => (
                              <span key={t.id} className="rounded-full bg-primary/8 text-primary px-2.5 py-0.5 text-[10px] font-medium">
                                {t.temporada}: ${applyMargin(parseFloat(t.precioNoche), 'hospedajes').toFixed(0)}
                              </span>
                            ))}
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full text-xs"
                          onClick={() => { setHabDetailData(hab); setHabImgIndex(0); setHabDetailOpen(true); }}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />Ver Detalles
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5 sticky top-20 shadow-sm">
            <h3 className="font-semibold">Información</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" />Check-in</span>
                <span className="font-semibold">{h.checkIn || "14:00"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" />Check-out</span>
                <span className="font-semibold">{h.checkOut || "12:00"}</span>
              </div>
              {habs.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Habitaciones</span>
                  <span className="font-semibold">{habs.filter((hab: any) => hab.activo).length} disponibles</span>
                </div>
              )}
            </div>
            <Button className="w-full rounded-xl h-12 text-base font-semibold shadow-md shadow-primary/20" onClick={handleReservar}>
              <CalendarDays className="mr-2 h-5 w-5" />
              Reservar Ahora
            </Button>
            {!isAuthenticated && (
              <p className="text-xs text-center text-muted-foreground">Debes iniciar sesión para reservar</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Detalle Habitación */}
      <Dialog open={habDetailOpen} onOpenChange={setHabDetailOpen}>
        <DialogContent className="max-w-lg">
          {habDetailData && (() => {
            const habImgs: string[] = habDetailData.imagenes || [];
            const habTarifas = habDetailData.tarifas || [];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BedDouble className="h-5 w-5 text-primary" />
                    {habDetailData.nombre}
                  </DialogTitle>
                  <DialogDescription>
                    {habDetailData.tipo} · Capacidad: {habDetailData.capacidad} persona(s)
                  </DialogDescription>
                </DialogHeader>

                {/* Image carousel */}
                {habImgs.length > 0 && (
                  <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-muted">
                    <img
                      src={habImgs[habImgIndex]?.startsWith('/') ? `${API_URL}${habImgs[habImgIndex]}` : habImgs[habImgIndex]}
                      alt={habDetailData.nombre}
                      className="h-full w-full object-cover"
                    />
                    {habImgs.length > 1 && (
                      <>
                        <button
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white p-1.5 transition-colors"
                          onClick={() => setHabImgIndex((habImgIndex - 1 + habImgs.length) % habImgs.length)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white p-1.5 transition-colors"
                          onClick={() => setHabImgIndex((habImgIndex + 1) % habImgs.length)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {habImgs.map((_: string, i: number) => (
                            <button key={i} onClick={() => setHabImgIndex(i)}
                              className={`h-2 w-2 rounded-full transition-colors ${i === habImgIndex ? 'bg-white' : 'bg-white/40'}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Description */}
                  {habDetailData.descripcion && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Descripción</h4>
                      <p className="text-sm text-foreground/80 leading-relaxed">{habDetailData.descripcion}</p>
                    </div>
                  )}

                  {/* Amenidades */}
                  {habDetailData.amenidades?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Amenidades</h4>
                      <div className="flex flex-wrap gap-2">
                        {habDetailData.amenidades.map((a: string) => (
                          <span key={a} className="inline-flex items-center rounded-full bg-primary/8 text-primary px-3 py-1 text-xs font-medium">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tarifas */}
                  {habTarifas.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Tarifas</h4>
                      <div className="rounded-lg border border-border/60 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50 text-xs text-muted-foreground">
                              <th className="text-left px-3 py-2 font-medium">Temporada</th>
                              <th className="text-right px-3 py-2 font-medium">Precio/Noche</th>
                              <th className="text-right px-3 py-2 font-medium">Extra/Persona</th>
                            </tr>
                          </thead>
                          <tbody>
                            {habTarifas.map((t: any) => (
                              <tr key={t.id} className="border-t border-border/40">
                                <td className="px-3 py-2">
                                  <span className="inline-flex items-center rounded-full bg-primary/8 text-primary px-2.5 py-0.5 text-xs font-medium">{t.temporada}</span>
                                </td>
                                <td className="px-3 py-2 text-right font-semibold">${applyMargin(parseFloat(t.precioNoche), 'hospedajes').toFixed(2)}</td>
                                <td className="px-3 py-2 text-right text-muted-foreground">
                                  {parseFloat(t.precioPersonaExtra || 0) > 0 ? `$${applyMargin(parseFloat(t.precioPersonaExtra), 'hospedajes').toFixed(2)}` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setHabDetailOpen(false)}>Cerrar</Button>
                  <Button onClick={() => { setHabDetailOpen(false); setHabitacionId(habDetailData.id); handleReservar(); }}>
                    <CalendarDays className="mr-2 h-4 w-4" />Reservar esta habitación
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal de Reserva */}
      <Dialog open={reservaOpen} onOpenChange={setReservaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reservar en {h.nombre}</DialogTitle>
            <DialogDescription>Completa los datos para tu reserva.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {habs.length > 0 && (
              <div className="space-y-2">
                <Label>Habitación *</Label>
                <Select value={habitacionId} onValueChange={(v) => { setHabitacionId(v); setHuespedes("1"); }}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar habitación" /></SelectTrigger>
                  <SelectContent>
                    {habs.filter((hab: any) => hab.activo).map((hab: any) => {
                      const t = hab.tarifas?.[0];
                      const precio = t ? applyMargin(parseFloat(t.precioNoche), 'hospedajes') : 0;
                      return (
                        <SelectItem key={hab.id} value={hab.id}>
                          {hab.nombre} - {hab.tipo} (cap. {hab.capacidad}) {precio > 0 ? `- $${precio.toFixed(2)}/noche` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedHab && (
                  <p className="text-xs text-muted-foreground">
                    Capacidad: {selectedHab.capacidad} persona(s) | Precio base: ${precioNoche.toFixed(2)}/noche
                    {precioExtra > 0 && ` | Extra por huesped: $${precioExtra.toFixed(2)}/noche`}
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha entrada *</Label>
                <Input type="date" value={fechaEntrada} onChange={(e) => setFechaEntrada(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label>Fecha salida *</Label>
                <Input type="date" value={fechaSalida} onChange={(e) => setFechaSalida(e.target.value)} min={fechaEntrada || new Date().toISOString().split('T')[0]} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Huespedes *</Label>
              <Input type="number" min="1" max={selectedHab?.capacidad || 10} value={huespedes} onChange={(e) => setHuespedes(e.target.value)} />
              {selectedHab && <p className="text-xs text-muted-foreground">Maximo {selectedHab.capacidad} huesped(es) para esta habitación</p>}
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Input placeholder="Alergias, preferencias, hora de llegada..." value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>

            {noches > 0 && precioNoche > 0 && (
              <div className="rounded-md bg-primary/5 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio base/noche</span>
                  <span className="font-medium">${precioNoche.toFixed(2)}</span>
                </div>
                {huespedesExtra > 0 && precioExtra > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{huespedesExtra} huesped(es) extra x ${precioExtra.toFixed(2)}</span>
                    <span className="font-medium">${(precioExtra * huespedesExtra).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio por noche total</span>
                  <span className="font-medium">${precioPorNoche.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">x {noches} noche(s)</span>
                  <span></span>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Total estimado</span>
                  <span className="text-primary">${totalEstimado.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReservaOpen(false)}>Cancelar</Button>
            <Button onClick={submitReserva} disabled={reservaMut.isPending}>
              {reservaMut.isPending ? "Reservando..." : "Confirmar Reserva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stripe Checkout Summary */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <CheckoutSummary reservaId={lastReservaId} total={lastTotal} description={`Hospedaje: ${h.nombre}`} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
