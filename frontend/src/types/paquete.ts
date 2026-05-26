export interface Paquete {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  hospedajeId: string;
  habitacionId: string;
  actividadId?: string | null;
  vehiculoId?: string | null;
  diasDuracion: number;
  noches: number;
  descuentoPorcentaje: number;
  imagenPrincipal?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  validoDesde: string;
  validoHasta: string;
  precioDesde?: number;
  hospedaje?: { nombre: string; ciudad?: string; provincia?: string };
  habitacion?: { nombre: string };
  actividad?: { nombre: string };
  vehiculo?: { marca: string; modelo: string };
}
