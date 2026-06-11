"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validators";
import { useAuth } from "@/hooks/use-auth";
import { Role } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegisterPage() {
  const router = useRouter();
  const { registerMutation } = useAuth();
  const [error, setError] = useState("");
  const [role, setRole] = useState<string>(Role.CLIENTE);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterInput) => {
    setError("");
    const { confirmPassword, ...payload } = data;
    registerMutation.mutate(
      { ...payload, role: role as Role },
      {
        onSuccess: () => {
          // No auto-login: el backend exige verificar el email antes de loguear.
          router.push(`/verify-email?email=${encodeURIComponent(payload.email)}`);
        },
        onError: (err: any) => {
          setError(
            err?.response?.data?.message || "Error al registrar. Intenta de nuevo."
          );
        },
      }
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-navy-100/50 p-8 max-w-md w-full">
      <h1 className="text-2xl font-display font-bold text-navy-800 text-center mb-2">
        Crear cuenta
      </h1>
      <p className="text-sm text-navy-400 font-body text-center mb-8">
        Únete a TuriDove
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="nombre" className="block text-sm font-body font-medium text-navy-700 mb-1.5">
              Nombre
            </label>
            <input
              id="nombre"
              placeholder="Juan"
              className="w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors"
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="apellido" className="block text-sm font-body font-medium text-navy-700 mb-1.5">
              Apellido
            </label>
            <input
              id="apellido"
              placeholder="Perez"
              className="w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors"
              {...register("apellido")}
            />
            {errors.apellido && (
              <p className="mt-1 text-sm text-red-600">{errors.apellido.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-body font-medium text-navy-700 mb-1.5">
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            className="w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-body font-medium text-navy-700 mb-1.5">
            Teléfono (opcional)
          </label>
          <input
            id="telefono"
            placeholder="+507-6000-0000"
            className="w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors"
            {...register("telefono")}
          />
        </div>

        <div>
          <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">
            Tipo de Cuenta
          </label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full border-navy-200 text-sm font-body text-navy-800 focus:ring-gold-400/50 focus:border-gold-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Role.CLIENTE}>Cliente - Reservar experiencias</SelectItem>
              <SelectItem value={Role.PROVEEDOR}>Proveedor - Ofrecer servicios</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-body font-medium text-navy-700 mb-1.5">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            placeholder="Min. 8 caracteres"
            className="w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-body font-medium text-navy-700 mb-1.5">
            Confirmar Contraseña
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Repetir contraseña"
            className="w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full py-2.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {registerMutation.isPending ? "Registrando..." : "Crear Cuenta"}
        </button>

        <p className="text-sm text-navy-400 font-body text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-gold-600 hover:text-gold-700 font-semibold">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
