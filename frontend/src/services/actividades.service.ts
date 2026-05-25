import { api } from '@/lib/axios';
import type {
  Actividad,
  TarifaActividad,
  PaqueteActividad,
  CalendarioActividad,
  PaginatedResponse,
  QueryParams,
} from '@/types';

export const actividadesService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Actividad>> {
    const { data } = await api.get('/actividades', { params });
    return data;
  },

  async getById(id: string): Promise<Actividad> {
    const { data } = await api.get(`/actividades/${id}`);
    return data;
  },

  async getMine(): Promise<Actividad[]> {
    const { data } = await api.get('/actividades/mis-actividades');
    return data;
  },

  async create(payload: Partial<Actividad>): Promise<Actividad> {
    const { data } = await api.post('/actividades', payload);
    return data;
  },

  async update(id: string, payload: Partial<Actividad>): Promise<Actividad> {
    const { data } = await api.patch(`/actividades/${id}`, payload);
    return data;
  },

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
