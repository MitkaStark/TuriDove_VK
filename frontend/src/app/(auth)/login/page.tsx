"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { useAuth } from "@/hooks/use-auth";
import { authService } from "@/services/auth.service";
import { Role } from "@/types";

const roleDashboard: Record<string, string> = {
  [Role.ADMIN]: "/admin",
  [Role.PROVEEDOR]: "/proveedor",
  [Role.AGENCIA]: "/agencia",
  [Role.OPERADOR]: "/operador",
  [Role.CLIENTE]: "/",
};

export default function LoginPage() {
  const router = useRouter();
  const { loginMutation } = useAuth();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    setError("");
    loginMutation.mutate(data, {
      onSuccess: (response) => {
        const role = response.user.role as string;
        router.push(roleDashboard[role] || "/");
      },
      onError: (e: any) => {
        const status = e?.response?.status;
        const code = e?.response?.data?.code ?? e?.response?.data?.message?.code;
        const blockedEmail = e?.response?.data?.email ?? e?.response?.data?.message?.email;
        if (status === 403 && code === 'EMAIL_NOT_VERIFIED') {
          toast((t) => (
            <div className="text-sm">
              Debes verificar tu email antes de iniciar sesión.{' '}
              <button
                onClick={() => {
                  authService.resendVerification(blockedEmail);
                  toast.dismiss(t.id);
                  toast.success('Te reenviamos el link');
                }}
                className="underline text-gold-600"
              >
                Reenviar link
              </button>
            </div>
          ), { duration: 8000 });
          return;
        }
        setError("Credenciales inválidas. Verifica tu email y contraseña.");
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-navy-100/50 p-8 max-w-md w-full">
      <h1 className="text-2xl font-display font-bold text-navy-800 text-center mb-2">
        Iniciar sesión
      </h1>
      <p className="text-sm text-navy-400 font-body text-center mb-8">
        Accede a tu cuenta de TuriDove
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

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
          <label htmlFor="password" className="block text-sm font-body font-medium text-navy-700 mb-1.5">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            placeholder="********"
            className="w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full py-2.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white font-body font-semibold text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loginMutation.isPending ? "Ingresando..." : "Ingresar"}
        </button>

        <p className="text-sm text-navy-400 font-body text-center">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-gold-600 hover:text-gold-700 font-semibold">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}
