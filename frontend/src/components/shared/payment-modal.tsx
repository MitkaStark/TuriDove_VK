"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CreditCard, Smartphone, Building2, Banknote, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { pagosService } from "@/services/pagos.service";

const METODOS = [
  { id: "TARJETA", label: "Tarjeta de Credito/Debito", icon: CreditCard, color: "text-blue-600" },
  { id: "YAPPY", label: "Yappy", icon: Smartphone, color: "text-purple-600" },
  { id: "TRANSFERENCIA", label: "Transferencia Bancaria", icon: Building2, color: "text-teal-600" },
  { id: "EFECTIVO", label: "Efectivo (pagar al llegar)", icon: Banknote, color: "text-green-600" },
];

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservaId: string;
  monto: number;
  descripcion: string;
  onSuccess?: () => void;
}

export function PaymentModal({ open, onOpenChange, reservaId, monto, descripcion, onSuccess }: PaymentModalProps) {
  const [metodo, setMetodo] = useState("TARJETA");
  const [step, setStep] = useState<"method" | "details" | "processing" | "success">("method");

  // Card details (simulated)
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const pagoMut = useMutation({
    mutationFn: () => pagosService.create({
      reservaId,
      monto,
      metodo,
    } as any),
    onSuccess: () => {
      setStep("success");
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Error al procesar el pago");
      setStep("details");
    },
  });

  const handleSelectMethod = (id: string) => {
    setMetodo(id);
    setStep("details");
  };

  const handlePay = () => {
    // Validate card details for TARJETA
    if (metodo === "TARJETA") {
      if (!cardNumber || cardNumber.replace(/\s/g, "").length < 16) { toast.error("Numero de tarjeta invalido"); return; }
      if (!cardName) { toast.error("Nombre del titular requerido"); return; }
      if (!cardExpiry) { toast.error("Fecha de expiracion requerida"); return; }
      if (!cardCvv || cardCvv.length < 3) { toast.error("CVV invalido"); return; }
    }
    setStep("processing");
    // Simulate processing delay
    setTimeout(() => pagoMut.mutate(), 2000);
  };

  const handleClose = () => {
    if (step === "success" && onSuccess) onSuccess();
    onOpenChange(false);
    // Reset state after close
    setTimeout(() => {
      setStep("method"); setMetodo("TARJETA");
      setCardNumber(""); setCardName(""); setCardExpiry(""); setCardCvv("");
    }, 300);
  };

  const formatCard = (value: string) => {
    const v = value.replace(/\D/g, "").substring(0, 16);
    return v.replace(/(.{4})/g, "$1 ").trim();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {/* Step 1: Select Method */}
        {step === "method" && (
          <>
            <DialogHeader>
              <DialogTitle>Seleccionar Metodo de Pago</DialogTitle>
              <DialogDescription>{descripcion}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <div className="rounded-md bg-primary/5 p-3 text-center">
                <p className="text-sm text-muted-foreground">Total a pagar</p>
                <p className="text-3xl font-bold text-primary">${monto.toFixed(2)}</p>
              </div>
              {METODOS.map((m) => {
                const Icon = m.icon;
                return (
                  <button key={m.id} onClick={() => handleSelectMethod(m.id)}
                    className="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                    <Icon className={`h-6 w-6 ${m.color}`} />
                    <span className="font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
            <DialogFooter><Button variant="outline" onClick={handleClose}>Cancelar</Button></DialogFooter>
          </>
        )}

        {/* Step 2: Payment Details */}
        {step === "details" && (
          <>
            <DialogHeader>
              <DialogTitle>Datos de Pago</DialogTitle>
              <DialogDescription>
                {METODOS.find(m => m.id === metodo)?.label} - ${monto.toFixed(2)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {metodo === "TARJETA" && (
                <>
                  <div className="space-y-2">
                    <Label>Numero de tarjeta</Label>
                    <Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} maxLength={19} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre del titular</Label>
                    <Input placeholder="JUAN PEREZ" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Expiracion</Label>
                      <Input placeholder="MM/AA" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} maxLength={5} />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input type="password" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))} maxLength={4} />
                    </div>
                  </div>
                </>
              )}

              {metodo === "YAPPY" && (
                <div className="rounded-lg border-2 border-dashed p-6 text-center space-y-2">
                  <Smartphone className="mx-auto h-12 w-12 text-purple-500" />
                  <p className="font-medium">Pago con Yappy</p>
                  <p className="text-sm text-muted-foreground">Al confirmar, se simulara la aprobacion del pago via Yappy.</p>
                  <p className="text-xs text-muted-foreground">(En produccion: se generara un QR o link de pago Yappy)</p>
                </div>
              )}

              {metodo === "TRANSFERENCIA" && (
                <div className="rounded-lg border p-4 space-y-2 text-sm">
                  <p className="font-medium">Datos para transferencia:</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p>Banco: <span className="font-medium text-foreground">Banco General</span></p>
                    <p>Cuenta: <span className="font-medium text-foreground">01-23-45-678901-2</span></p>
                    <p>Tipo: <span className="font-medium text-foreground">Corriente</span></p>
                    <p>Titular: <span className="font-medium text-foreground">TuriDove S.A.</span></p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">(Simulado - al confirmar se registrara el pago)</p>
                </div>
              )}

              {metodo === "EFECTIVO" && (
                <div className="rounded-lg border-2 border-dashed p-6 text-center space-y-2">
                  <Banknote className="mx-auto h-12 w-12 text-green-500" />
                  <p className="font-medium">Pago en Efectivo</p>
                  <p className="text-sm text-muted-foreground">Pagaras al momento de llegar al hospedaje/actividad.</p>
                  <p className="text-xs text-muted-foreground">Tu reserva quedara confirmada al registrar el pago.</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span>Pago seguro simulado. En produccion se integrara con pasarelas reales.</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("method")}>Atras</Button>
              <Button onClick={handlePay}>Pagar ${monto.toFixed(2)}</Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Processing */}
        {step === "processing" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <div>
              <p className="text-lg font-semibold">Procesando pago...</p>
              <p className="text-sm text-muted-foreground">No cierres esta ventana</p>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <>
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-green-700">Pago Exitoso!</p>
                <p className="text-sm text-muted-foreground mt-1">Tu pago de <strong>${monto.toFixed(2)}</strong> ha sido procesado.</p>
                <p className="text-sm text-muted-foreground">Tu reserva ha sido confirmada.</p>
              </div>
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                <p>Metodo: {METODOS.find(m => m.id === metodo)?.label}</p>
                <p>Referencia: SIM-{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
              </div>
            </div>
            <DialogFooter><Button className="w-full" onClick={handleClose}>Cerrar</Button></DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
