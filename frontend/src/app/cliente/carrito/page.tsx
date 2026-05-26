"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function ClienteCarritoPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Mi Carrito" description="Revisa tu selección antes de reservar" />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">Tu carrito está vacío</h3>
          <p className="mt-1 text-sm text-muted-foreground">Explora nuestros hoteles, actividades y más</p>
          <p className="mt-2 text-xs text-muted-foreground">Las reservas se realizan directamente desde cada servicio</p>
          <div className="mt-4 flex gap-3">
            <Link href="/hospedajes"><Button>Explorar Hoteles</Button></Link>
            <Link href="/actividades"><Button variant="outline">Ver Actividades</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
