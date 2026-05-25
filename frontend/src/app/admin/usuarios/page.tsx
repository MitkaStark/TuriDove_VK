"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Eye, Pencil, UserCheck, UserX, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersService } from "@/services/users.service";

// --- Schemas ---
const createUserSchema = z.object({
  nombre: z.string().min(2, "Minimo 2 caracteres"),
  apellido: z.string().min(2, "Minimo 2 caracteres"),
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "Minimo 8 caracteres"),
  telefono: z.string().optional(),
});
type CreateUserForm = z.infer<typeof createUserSchema>;

const editUserSchema = z.object({
  nombre: z.string().min(2, "Minimo 2 caracteres"),
  apellido: z.string().min(2, "Minimo 2 caracteres"),
  email: z.string().email("Email invalido"),
  telefono: z.string().optional(),
  password: z.string().min(8, "Minimo 8 caracteres").optional().or(z.literal("")),
});
type EditUserForm = z.infer<typeof editUserSchema>;

// --- Constants ---
const ROLES = [
  { value: "ADMIN", label: "Administrador" },
  { value: "PROVEEDOR", label: "Proveedor" },
  { value: "AGENCIA", label: "Agencia" },
  { value: "OPERADOR", label: "Operador" },
  { value: "CLIENTE", label: "Cliente" },
];

const roleColor: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  PROVEEDOR: "bg-green-100 text-green-800",
  AGENCIA: "bg-blue-100 text-blue-800",
  OPERADOR: "bg-orange-100 text-orange-800",
  CLIENTE: "bg-gray-100 text-gray-800",
};

export default function AdminUsuariosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [createRole, setCreateRole] = useState("CLIENTE");
  const [editRole, setEditRole] = useState("CLIENTE");

  // --- Queries ---
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => usersService.getAll({ search: search || undefined, limit: 100 }),
  });

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: (payload: CreateUserForm & { rol: string }) =>
      usersService.create(payload),
    onSuccess: () => {
      toast.success("Usuario creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setCreateOpen(false);
      createReset();
      setCreateRole("CLIENTE");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Error al crear usuario");
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      usersService.update(id, payload),
    onSuccess: () => {
      toast.success("Usuario actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setEditOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Error al actualizar usuario");
    },
  });

  const toggleActivoMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      usersService.update(id, { activo }),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.activo ? "Usuario activado" : "Usuario desactivado"
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => {
      toast.error("Error al cambiar estado del usuario");
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersService.changeRole(id, role),
    onSuccess: () => {
      toast.success("Rol actualizado");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => {
      toast.error("Error al cambiar rol");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      toast.success("Usuario eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setDeleteOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Error al eliminar usuario");
    },
  });

  // --- Forms ---
  const {
    register: createRegister,
    handleSubmit: handleCreateSubmit,
    reset: createReset,
    formState: { errors: createErrors },
  } = useForm<CreateUserForm>({ resolver: zodResolver(createUserSchema) });

  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    reset: editReset,
    formState: { errors: editErrors },
  } = useForm<EditUserForm>({ resolver: zodResolver(editUserSchema) });

  // --- Handlers ---
  const onCreateSubmit = (formData: CreateUserForm) => {
    createMutation.mutate({ ...formData, rol: createRole });
  };

  const onEditSubmit = (formData: EditUserForm) => {
    if (!selectedUser) return;
    const payload: any = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      email: formData.email,
      telefono: formData.telefono || undefined,
    };
    if (formData.password && formData.password.length >= 8) {
      payload.password = formData.password;
    }
    editMutation.mutate({ id: selectedUser.id, payload });
    // Also update role if changed
    if (editRole !== selectedUser.role) {
      changeRoleMutation.mutate({ id: selectedUser.id, role: editRole });
    }
  };

  const openEdit = (user: any) => {
    setSelectedUser(user);
    setEditRole(user.role);
    editReset({
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      telefono: user.telefono || "",
      password: "",
    });
    setEditOpen(true);
  };

  const openDetail = (user: any) => {
    setSelectedUser(user);
    setDetailOpen(true);
  };

  const users = data?.data || data || [];

  // --- Columns ---
  const columns: DataTableColumn<any>[] = [
    {
      key: "nombre",
      header: "Nombre",
      render: (item) => `${item.nombre} ${item.apellido}`,
    },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Rol",
      render: (item) => (
        <Badge variant="outline" className={roleColor[item.role] || ""}>
          {item.role}
        </Badge>
      ),
    },
    {
      key: "activo",
      header: "Estado",
      render: (item) => (
        <Badge variant={item.activo ? "default" : "secondary"}>
          {item.activo ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Creado",
      render: (item) => new Date(item.createdAt).toLocaleDateString("es-PA"),
    },
    {
      key: "acciones",
      header: "Acciones",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Ver detalles"
            onClick={() => openDetail(item)}
          >
            <Eye className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Editar"
            onClick={() => openEdit(item)}
          >
            <Pencil className="h-4 w-4 text-amber-600" />
          </Button>
          {item.role !== "ADMIN" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                title={item.activo ? "Desactivar" : "Activar"}
                onClick={() =>
                  toggleActivoMutation.mutate({
                    id: item.id,
                    activo: !item.activo,
                  })
                }
              >
                {item.activo ? (
                  <UserX className="h-4 w-4 text-red-500" />
                ) : (
                  <UserCheck className="h-4 w-4 text-green-600" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Eliminar usuario"
                onClick={() => {
                  setSelectedUser(item);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-700" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestión de usuarios del sistema"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={Array.isArray(users) ? users : []}
        loading={isLoading}
        searchPlaceholder="Buscar por nombre o email..."
        onSearch={setSearch}
        searchValue={search}
        emptyMessage="No se encontraron usuarios"
      />

      {/* ── Modal: Crear Usuario ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Completa los datos para registrar un nuevo usuario en el sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input placeholder="Juan" {...createRegister("nombre")} />
                {createErrors.nombre && (
                  <p className="text-sm text-destructive">{createErrors.nombre.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input placeholder="Perez" {...createRegister("apellido")} />
                {createErrors.apellido && (
                  <p className="text-sm text-destructive">{createErrors.apellido.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="correo@ejemplo.com" {...createRegister("email")} />
              {createErrors.email && (
                <p className="text-sm text-destructive">{createErrors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input type="password" placeholder="Minimo 8 caracteres" {...createRegister("password")} />
              {createErrors.password && (
                <p className="text-sm text-destructive">{createErrors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Teléfono (opcional)</Label>
              <Input placeholder="+507 6000-0000" {...createRegister("telefono")} />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={createRole} onValueChange={setCreateRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Editar Usuario ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario. Deja la contraseña vacia para no cambiarla.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input {...editRegister("nombre")} />
                {editErrors.nombre && (
                  <p className="text-sm text-destructive">{editErrors.nombre.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input {...editRegister("apellido")} />
                {editErrors.apellido && (
                  <p className="text-sm text-destructive">{editErrors.apellido.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...editRegister("email")} />
              {editErrors.email && (
                <p className="text-sm text-destructive">{editErrors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nueva Contraseña (opcional)</Label>
              <Input type="password" placeholder="Dejar vacio para no cambiar" {...editRegister("password")} />
              {editErrors.password && (
                <p className="text-sm text-destructive">{editErrors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input placeholder="+507 6000-0000" {...editRegister("telefono")} />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editMutation.isPending}>
                {editMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Ver Detalles ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription>
              Información completa del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-sm">{selectedUser.nombre} {selectedUser.apellido}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p className="text-sm">{selectedUser.telefono || "No registrado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rol</p>
                  <Badge variant="outline" className={roleColor[selectedUser.role] || ""}>
                    {selectedUser.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge variant={selectedUser.activo ? "default" : "secondary"}>
                    {selectedUser.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Registrado</p>
                  <p className="text-sm">
                    {new Date(selectedUser.createdAt).toLocaleDateString("es-PA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ultima actualizacion</p>
                  <p className="text-sm">
                    {new Date(selectedUser.updatedAt).toLocaleDateString("es-PA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="text-xs font-mono text-muted-foreground">{selectedUser.id}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setDetailOpen(false);
                    openEdit(selectedUser);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Confirmar Eliminacion ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              Esta accion no se puede deshacer. Se eliminara permanentemente al usuario del sistema.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="rounded-md bg-destructive/10 p-4">
                <p className="text-sm">
                  Estas a punto de eliminar a <strong>{selectedUser.nombre} {selectedUser.apellido}</strong> ({selectedUser.email}).
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(selectedUser.id)}
                >
                  {deleteMutation.isPending ? "Eliminando..." : "Eliminar Usuario"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
