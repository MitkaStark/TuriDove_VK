import { z } from 'zod';

// ---- Auth ----
export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
    nombre: z.string().min(1, 'El nombre es requerido'),
    apellido: z.string().min(1, 'El apellido es requerido'),
    telefono: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

// ---- Hospedaje ----
export const hospedajeSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  direccion: z.string().optional(),
  provincia: z.string().optional(),
  distrito: z.string().optional(),
  corregimiento: z.string().optional(),
  latitud: z.coerce.number().optional(),
  longitud: z.coerce.number().optional(),
  tipo: z.string().optional(),
  capacidadTotal: z.coerce.number().int().positive().optional(),
  servicios: z.array(z.string()).optional(),
});
export type HospedajeInput = z.infer<typeof hospedajeSchema>;

// ---- Actividad ----
export const actividadSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  tipo: z.string().optional(),
  duracionMinutos: z.coerce.number().int().positive().optional(),
  capacidadMaxima: z.coerce.number().int().positive().optional(),
  ubicacion: z.string().optional(),
  provincia: z.string().optional(),
  distrito: z.string().optional(),
  latitud: z.coerce.number().optional(),
  longitud: z.coerce.number().optional(),
  requisitos: z.array(z.string()).optional(),
  incluye: z.array(z.string()).optional(),
});
export type ActividadInput = z.infer<typeof actividadSchema>;

// ---- Transfer ----
export const transferSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  origen: z.string().optional(),
  destino: z.string().optional(),
  distanciaKm: z.coerce.number().positive().optional(),
  duracionMinutos: z.coerce.number().int().positive().optional(),
  tipo: z.string().optional(),
});
export type TransferInput = z.infer<typeof transferSchema>;

// ---- Vehiculo ----
export const vehiculoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  anio: z.coerce.number().int().optional(),
  placa: z.string().optional(),
  capacidadPasajeros: z.coerce.number().int().positive('La capacidad es requerida'),
  tipo: z.string().optional(),
});
export type VehiculoInput = z.infer<typeof vehiculoSchema>;

// ---- Reserva ----
export const reservaSchema = z.object({
  tipo: z.enum(['hospedaje', 'actividad', 'transfer', 'vehiculo']),
  entidadId: z.string().min(1, 'La entidad es requerida'),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaFin: z.string().optional(),
  cantidadPersonas: z.coerce.number().int().positive('La cantidad de personas es requerida'),
  notas: z.string().optional(),
  habitacionId: z.string().optional(),
  calendarioId: z.string().optional(),
  vehiculoId: z.string().optional(),
});
export type ReservaInput = z.infer<typeof reservaSchema>;

// ---- Pago ----
export const pagoSchema = z.object({
  reservaId: z.string().min(1, 'La reserva es requerida'),
  monto: z.coerce.number().positive('El monto debe ser positivo'),
  moneda: z.string().default('USD'),
  metodo: z.string().min(1, 'El método de pago es requerido'),
  referencia: z.string().optional(),
});
export type PagoInput = z.infer<typeof pagoSchema>;
