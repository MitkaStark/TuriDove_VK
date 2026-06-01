// ──────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────

export enum Role {
  ADMIN = 'ADMIN',
  PROVEEDOR = 'PROVEEDOR',
  AGENCIA = 'AGENCIA',
  OPERADOR = 'OPERADOR',
  CLIENTE = 'CLIENTE',
}

export enum EstadoReserva {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  CANCELADA = 'CANCELADA',
  COMPLETADA = 'COMPLETADA',
  REEMBOLSADA = 'REEMBOLSADA',
}

export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  PROCESANDO = 'PROCESANDO',
  COMPLETADO = 'COMPLETADO',
  FALLIDO = 'FALLIDO',
  REEMBOLSADO = 'REEMBOLSADO',
}

export enum TipoHabitacion {
  INDIVIDUAL = 'INDIVIDUAL',
  DOBLE = 'DOBLE',
  SUITE = 'SUITE',
  FAMILIAR = 'FAMILIAR',
  DORMITORIO = 'DORMITORIO',
}


export enum TipoVehiculo {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  PICKUP = 'PICKUP',
  VAN = 'VAN',
  BUS = 'BUS',
  MINIBUS = 'MINIBUS',
}

export enum TipoTransfer {
  AEROPUERTO = 'AEROPUERTO',
  HOTEL = 'HOTEL',
  PUNTO_A_PUNTO = 'PUNTO_A_PUNTO',
  TOUR = 'TOUR',
}

export enum Temporada {
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAJA = 'BAJA',
}

export enum MetodoPago {
  TARJETA = 'TARJETA',
  YAPPY = 'YAPPY',
  TRANSFERENCIA = 'TRANSFERENCIA',
  EFECTIVO = 'EFECTIVO',
}

// ──────────────────────────────────────────────
// Base Models
// ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  role: Role;
  activo: boolean;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────
// Hospedajes
// ──────────────────────────────────────────────

export interface Hospedaje {
  id: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  provincia: string;
  distrito: string;
  corregimiento: string;
  latitud: number | null;
  longitud: number | null;
  imagenes: string[];
  amenidades: string[];
  politicas: string | null;
  checkIn: string;
  checkOut: string;
  activo: boolean;
  proveedorId: string;
  createdAt: string;
  updatedAt: string;
  proveedor?: User;
  habitaciones?: Habitacion[];
  tarifas?: TarifaHospedaje[];
}

export interface Habitacion {
  id: string;
  nombre: string;
  tipo: TipoHabitacion;
  capacidad: number;
  descripcion: string | null;
  amenidades: string[];
  imagenes: string[];
  activo: boolean;
  hospedajeId: string;
  createdAt: string;
  updatedAt: string;
  hospedaje?: Hospedaje;
  disponibilidades?: DisponibilidadHospedaje[];
  tarifas?: TarifaHospedaje[];
}

export interface TarifaHospedaje {
  id: string;
  hospedajeId: string;
  habitacionId: string | null;
  temporada: Temporada;
  precioNoche: number;
  precioPersonaExtra: number;
  moneda: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  hospedaje?: Hospedaje;
  habitacion?: Habitacion | null;
}

export interface DisponibilidadHospedaje {
  id: string;
  habitacionId: string;
  fecha: string;
  disponible: boolean;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  habitacion?: Habitacion;
}

// ──────────────────────────────────────────────
// Actividades
// ──────────────────────────────────────────────

export type EstadoActividad = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export interface CategoriaActividad {
  id: string;
  nombre: string;
  slug: string;
  icono: string | null;
  descripcion: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItinerarioItem {
  id: string;
  actividadId: string;
  dia: number;
  titulo: string;
  descripcion: string;
  lat: number | null;
  lng: number | null;
  nombreUbicacion: string | null;
  createdAt: string;
}

export interface Actividad {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  categoriaId: string;
  categoria?: CategoriaActividad;
  duracionHoras: number;
  ubicacion: string;
  provincia: string;
  distrito: string;
  imagenPrincipal: string | null;
  imagenes: string[];
  incluye: string[];
  noIncluye: string[];
  requisitos: string[];
  edadMinima: number;
  capacidadMaxima: number;
  estado: EstadoActividad;
  proveedorId: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  tarifas?: any[];
  itinerario?: ItinerarioItem[];
}

export interface TarifaActividad {
  id: string;
  actividadId: string;
  temporada: Temporada;
  precioAdulto: number;
  precioNino: number;
  precioGrupo: number | null;
  minimoPersonas: number;
  moneda: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  actividad?: Actividad;
}

export interface PaqueteActividad {
  id: string;
  nombre: string;
  descripcion: string | null;
  descuento: number;
  activo: boolean;
  proveedorId: string;
  createdAt: string;
  updatedAt: string;
  proveedor?: User;
  actividades?: Actividad[];
}

export interface CalendarioActividad {
  id: string;
  actividadId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cuposDisponibles: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  actividad?: Actividad;
}

// ──────────────────────────────────────────────
// Transfers
// ──────────────────────────────────────────────

export interface Transfer {
  id: string;
  nombre: string;
  tipo: TipoTransfer;
  origen: string;
  destino: string;
  descripcion: string | null;
  distanciaKm: number | null;
  duracionEstimada: string | null;
  activo: boolean;
  proveedorId: string;
  createdAt: string;
  updatedAt: string;
  proveedor?: User;
  tarifas?: TarifaTransfer[];
  vehiculoTransfers?: VehiculoTransfer[];
}

export interface TarifaTransfer {
  id: string;
  transferId: string;
  temporada: Temporada;
  precioPorPersona: number;
  precioVehiculo: number | null;
  minimoPersonas: number;
  moneda: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  transfer?: Transfer;
}

export interface VehiculoTransfer {
  id: string;
  transferId: string;
  vehiculoId: string;
  createdAt: string;
  transfer?: Transfer;
  vehiculo?: Vehiculo;
}

// ──────────────────────────────────────────────
// Vehiculos
// ──────────────────────────────────────────────

export interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  tipo: TipoVehiculo;
  capacidadPasajeros: number;
  caracteristicas: string[];
  imagenes: string[];
  seguroIncluido: boolean;
  activo: boolean;
  proveedorId: string;
  createdAt: string;
  updatedAt: string;
  proveedor?: User;
  tarifas?: TarifaVehiculo[];
  disponibilidades?: DisponibilidadVehiculo[];
}

export interface TarifaVehiculo {
  id: string;
  vehiculoId: string;
  temporada: Temporada;
  precioDia: number;
  precioSemana: number | null;
  deposito: number;
  moneda: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  vehiculo?: Vehiculo;
}

export interface DisponibilidadVehiculo {
  id: string;
  vehiculoId: string;
  fecha: string;
  disponible: boolean;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  vehiculo?: Vehiculo;
}

// ──────────────────────────────────────────────
// Reservas
// ──────────────────────────────────────────────

export interface Reserva {
  id: string;
  codigo: string;
  clienteId: string;
  estado: EstadoReserva;
  total: number;
  moneda: string;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  cliente?: User;
  reservaHospedajes?: ReservaHospedaje[];
  reservaActividades?: ReservaActividad[];
  reservaTransfers?: ReservaTransfer[];
  reservaVehiculos?: ReservaVehiculo[];
  pagos?: Pago[];
  comisiones?: Comision[];
}

export interface ReservaHospedaje {
  id: string;
  reservaId: string;
  hospedajeId: string;
  habitacionId: string;
  fechaEntrada: string;
  fechaSalida: string;
  huespedes: number;
  precioTotal: number;
  createdAt: string;
  reserva?: Reserva;
  hospedaje?: Hospedaje;
  habitacion?: Habitacion;
}

export interface ReservaActividad {
  id: string;
  reservaId: string;
  actividadId: string;
  fecha: string;
  adultos: number;
  ninos: number;
  precioTotal: number;
  createdAt: string;
  reserva?: Reserva;
  actividad?: Actividad;
}

export interface ReservaTransfer {
  id: string;
  reservaId: string;
  transferId: string;
  fecha: string;
  pasajeros: number;
  precioTotal: number;
  createdAt: string;
  reserva?: Reserva;
  transfer?: Transfer;
}

export interface ReservaVehiculo {
  id: string;
  reservaId: string;
  vehiculoId: string;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  createdAt: string;
  reserva?: Reserva;
  vehiculo?: Vehiculo;
}

// ──────────────────────────────────────────────
// Pagos & Comisiones
// ──────────────────────────────────────────────

export interface Pago {
  id: string;
  reservaId: string;
  monto: number;
  moneda: string;
  metodo: MetodoPago;
  estado: EstadoPago;
  referencia: string | null;
  stripePaymentId: string | null;
  detalles: Record<string, unknown> | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  reserva?: Reserva;
  user?: User;
}

export interface Comision {
  id: string;
  reservaId: string;
  proveedorId: string;
  montoTotal: number;
  porcentajeComision: number;
  montoComision: number;
  montoProveedor: number;
  estado: string;
  liquidadoEn: string | null;
  createdAt: string;
  updatedAt: string;
  reserva?: Reserva;
  proveedor?: User;
}

// ──────────────────────────────────────────────
// Audit
// ──────────────────────────────────────────────

export interface AuditLog {
  id: string;
  accion: string;
  entidad: string;
  entidadId: string;
  datos: Record<string, unknown> | null;
  userId: string;
  ip: string | null;
  createdAt: string;
  user?: User;
}

// ──────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ──────────────────────────────────────────────
// DTOs & Cart
// ──────────────────────────────────────────────

export interface CreateReservaHospedajeDto {
  hospedajeId: string;
  habitacionId: string;
  fechaEntrada: string;
  fechaSalida: string;
  huespedes: number;
}

export interface CreateReservaActividadDto {
  actividadId: string;
  fecha: string;
  adultos: number;
  ninos: number;
}

export interface CreateReservaTransferDto {
  transferId: string;
  fecha: string;
  pasajeros: number;
}

export interface CreateReservaVehiculoDto {
  vehiculoId: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface CreateReservaDto {
  notas?: string;
  hospedajes?: CreateReservaHospedajeDto[];
  actividades?: CreateReservaActividadDto[];
  transfers?: CreateReservaTransferDto[];
  vehiculos?: CreateReservaVehiculoDto[];
}

export type CartItemType = 'hospedaje' | 'actividad' | 'transfer' | 'vehiculo';

export interface CartItem {
  id: string;
  type: CartItemType;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  imagen?: string;
  metadata: Record<string, unknown>;
}

export interface CartState {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
}

// ──────────────────────────────────────────────
// Query & Auth helpers
// ──────────────────────────────────────────────

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  role?: Role;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ──────────────────────────────────────────────
// Cart item types (used by cart store)
// ──────────────────────────────────────────────

export interface CartHospedaje {
  hospedajeId: string;
  habitacionId: string;
  nombre: string;
  habitacionNombre: string;
  fechaEntrada: string;
  fechaSalida: string;
  huespedes: number;
  precioTotal: number;
  imagen?: string;
}

export interface CartActividad {
  actividadId: string;
  nombre: string;
  fecha: string;
  adultos: number;
  ninos: number;
  precioTotal: number;
  imagen?: string;
}

export interface CartTransfer {
  transferId: string;
  nombre: string;
  fecha: string;
  pasajeros: number;
  precioTotal: number;
}

export interface CartVehiculo {
  vehiculoId: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  imagen?: string;
}

// ──────────────────────────────────────────────
// Financiero
// ──────────────────────────────────────────────

export interface ResumenFinanciero {
  totalIngresos: number;
  totalComisiones: number;
  totalPendiente: number;
  totalReservas: number;
}

export interface Liquidacion {
  id: string;
  comisionId: string;
  monto: number;
  fecha: string;
  referencia: string | null;
  createdAt: string;
  comision?: Comision;
}

export interface ReporteIngresos {
  periodo: string;
  ingresos: number;
  comisiones: number;
  neto: number;
}

export interface ReporteReservas {
  periodo: string;
  total: number;
  confirmadas: number;
  canceladas: number;
  completadas: number;
}
