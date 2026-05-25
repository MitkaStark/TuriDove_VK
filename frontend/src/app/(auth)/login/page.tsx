"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { useAuth } from "@/hooks/use-auth";
import { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

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
      onError: () => {
        setError("Credenciales inválidas. Verifica tu email y contraseña.");
      },
    });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-center text-xl font-semibold">Iniciar Sesión</h2>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Ingresando..." : "Ingresar"}
          </Button>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            No tienes cuenta?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Regístrate aqui
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
