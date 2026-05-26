"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hospedajeSchema, type HospedajeInput } from "@/lib/validators";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function NuevoHospedajePage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<HospedajeInput>({
    resolver: zodResolver(hospedajeSchema),
  });

  const onSubmit = (data: HospedajeInput) => {
    console.log("Creating hospedaje:", data);
    router.push("/proveedor/hospedajes");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Nuevo Hotel" description="Registra un nuevo alojamiento" />
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input {...register("nombre")} placeholder="Nombre del hotel" />
                {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Provincia</Label>
                <Input {...register("provincia")} placeholder="Ej: Chiriqui" />
              </div>
              <div className="space-y-2">
                <Label>Distrito</Label>
                <Input {...register("distrito")} placeholder="Ej: Boquete" />
              </div>
              <div className="space-y-2">
                <Label>Corregimiento</Label>
                <Input {...register("corregimiento")} placeholder="Ej: Palmira" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Direccion</Label>
                <Input {...register("direccion")} placeholder="Direccion completa" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Descripción</Label>
                <textarea {...register("descripcion")} className="input-base min-h-[100px] w-full" placeholder="Describe tu hotel..." />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit">Crear Hotel</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
