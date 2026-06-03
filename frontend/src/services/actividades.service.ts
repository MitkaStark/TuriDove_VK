import { api } from '@/lib/axios';
import type {
  Actividad,
  TarifaActividad,
  PaqueteActividad,
  CalendarioActividad,
  QueryParams,
} from '@/types';

interface ActividadQueryParams {
  page?: number;
  limit?: number;
  categoriaId?: string;
  provincia?: string;
  search?: string;
  isFeatured?: boolean;
  estado?: string;
}

function cleanParams<T extends Record<string, any>>(params: T): Partial<T> {
  const out: any = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export const actividadesService = {
  async getAll(params: ActividadQueryParams = {}) {
    const { data } = await api.get('/actividades', { params: cleanParams(params) });
    return data as { data: Actividad[]; meta: { page: number; limit: number; total: number; totalPages: number } };
  },

  async getById(id: string) {
    const { data } = await api.get(`/actividades/${id}`);
    return data as Actividad;
  },

  async getBySlug(slug: string) {
    const { data } = await api.get(`/actividades/slug/${slug}`);
    return data as Actividad;
  },

  async getMine(): Promise<Actividad[]> {
    const { data } = await api.get('/actividades/mis-actividades');
    return data;
  },

  async create(payload: Partial<Actividad>) {
    const { data } = await api.post('/actividades', payload);
    return data as Actividad;
  },

  async update(id: string, payload: Partial<Actividad>) {
    const { data } = await api.patch(`/actividades/${id}`, payload);
    return data as Actividad;
  },

  async remove(id: string) {
    await api.delete(`/actividades/${id}`);
  },

  // Keep backward-compat alias
  async delete(id: string): Promise<void> {
    await api.delete(`/actividades/${id}`);
  },

  // Tarifas
  async getTarifas(actividadId: string): Promise<TarifaActividad[]> {
    const { data } = await api.get(`/actividades/${actividadId}/tarifas`);
    return data;
  },

  async createTarifa(actividadId: string, payload: Partial<TarifaActividad>): Promise<TarifaActividad> {
    const { data } = await api.post(`/actividades/${actividadId}/tarifas`, payload);
    return data;
  },

  // Calendario
  async getCalendario(actividadId: string, params?: QueryParams): Promise<CalendarioActividad[]> {
    const { data } = await api.get(`/actividades/${actividadId}/calendario`, { params });
    return data;
  },

  async createCalendario(actividadId: string, payload: Partial<CalendarioActividad>): Promise<CalendarioActividad> {
    const { data } = await api.post(`/actividades/${actividadId}/calendario`, payload);
    return data;
  },

  // Paquetes
  async getPaquetes(params?: QueryParams): Promise<PaqueteActividad[]> {
    const { data } = await api.get('/actividades/paquetes', { params });
    return data;
  },

  async createPaquete(payload: Partial<PaqueteActividad>): Promise<PaqueteActividad> {
    const { data } = await api.post('/actividades/paquetes', payload);
    return data;
  },
};

// Helper for the home: actividades destacadas
export async function getFeaturedActividades(limit = 3) {
  const { data } = await api.get('/actividades', {
    params: { featured: 'true', limit, estado: 'ACTIVE' },
  });
  return (data?.data?.data ?? data?.data ?? data?.items ?? data ?? []) as any[];
}
