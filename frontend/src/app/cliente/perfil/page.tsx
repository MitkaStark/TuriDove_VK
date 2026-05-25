"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { User, Mail, Phone, Shield, Save, Camera } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth.store";
import { usersService } from "@/services/users.service";
import { uploadsService } from "@/services/uploads.service";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace('/api/v1', '');

export default function PerfilPage() {
  const { user, updateUser } = useAuthStore();
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [apellido, setApellido] = useState(user?.apellido || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateMut = useMutation({
    mutationFn: (payload: any) => usersService.update(user!.id, payload),
    onSuccess: (data: any) => {
      const updated = data?.data || data;
      if (updated) updateUser({ ...user!, ...updated });
      toast.success("Perfil actualizado");
      setPassword(""); setConfirmPassword("");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error al actualizar"),
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const result = await uploadsService.uploadImages(files);
      const url = result.urls[0];
      setAvatarUrl(url);
      // Save avatar immediately
      await usersService.update(user!.id, { avatar: url });
      updateUser({ ...user!, avatar: url });
      toast.success("Avatar actualizado");
    } catch {
      toast.error("Error al subir imagen");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = () => {
    const payload: any = { nombre, apellido, telefono: telefono || undefined };
    if (avatarUrl !== (user?.avatar || "")) payload.avatar = avatarUrl || null;
    if (password) {
      if (password.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres"); return; }
      if (password !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return; }
      payload.password = password;
    }
    updateMut.mutate(payload);
  };

  if (!user) return null;

  const initials = `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader title="Mi Perfil" description="Administra tu información personal" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info card */}
        <div className="card-base p-6 space-y-4">
          <div className="flex flex-col items-center text-center">
            {/* Avatar with upload */}
            <div className="relative group">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary/10 border-2 border-primary/20">
                {avatarUrl ? (
                  <img src={`${API_URL}${avatarUrl}`} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary">{initials}</span>
                )}
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            {uploading && <p className="text-xs text-muted-foreground mt-1">Subiendo...</p>}
            <h2 className="mt-3 text-xl font-semibold">{user.nombre} {user.apellido}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge variant="outline" className="mt-2">{user.role}</Badge>
          </div>
          <div className="space-y-3 border-t pt-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{user.email}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{user.telefono || "No registrado"}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Shield className="h-4 w-4" />Cuenta {user.activo ? "Activa" : "Inactiva"}</div>
          </div>
        </div>

        {/* Edit form */}
        <div className="card-base p-6 space-y-4 lg:col-span-2">
          <h3 className="text-lg font-semibold">Editar Información</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nombre</Label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
            <div className="space-y-2"><Label>Apellido</Label><Input value={apellido} onChange={(e) => setApellido(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Email</Label><Input value={user.email} disabled className="bg-muted" /><p className="text-xs text-muted-foreground">El email no se puede cambiar</p></div>
          <div className="space-y-2"><Label>Teléfono</Label><Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+507 6000-0000" /></div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Cambiar Contraseña</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nueva Contraseña</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Dejar vacio para no cambiar" /></div>
              <div className="space-y-2"><Label>Confirmar Contraseña</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repetir contraseña" /></div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateMut.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateMut.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
