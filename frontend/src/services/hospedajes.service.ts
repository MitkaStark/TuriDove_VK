import { api } from '@/lib/axios';
import type {
  Hospedaje,
  Habitacion,
  TarifaHospedaje,
  PaginatedResponse,
  QueryParams,
} from '@/types';

export const hospedajesService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Hospedaje>> {
    const { data } = await api.get('/hospedajes', { params });
    return data;
  },

  async getById(id: string): Promise<Hospedaje> {
    const { data } = await api.get(`/hospedajes/${id}`);
    return data;
  },

  async getMine(): Promise<Hospedaje[]> {
    const { data } = await api.get('/hospedajes/mis-hospedajes');
    return data;
  },

  async create(payload: Partial<Hospedaje>): Promise<Hospedaje> {
    const { data } = await api.post('/hospedajes', payload);
    return data;
  },

  async update(id: string, payload: Partial<Hospedaje>): Promise<Hospedaje> {
    const { data } = await api.patch(`/hospedajes/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/hospedajes/${id}`);
  },

  async getHabitaciones(hospedajeId: string): Promise<Habitacion[]> {
    const { data } = await api.get(`/hospedajes/${hospedajeId}/habitaciones`);
    return data;
  },

  async createHabitacion(hospedajeId: string, payload: Partial<Habitacion>): Promise<Habitacion> {
    const { data } = await api.post(`/hospedajes/${hospedajeId}/habitaciones`, payload);
    return data;
  },

  async getTarifas(hospedajeId: string): Promise<TarifaHospedaje[]> {
    const { data } = await api.get(`/hospedajes/${hospedajeId}/tarifas`);
    return data;
  },

  async createTarifa(hospedajeId: string, payload: Partial<TarifaHospedaje>): Promise<TarifaHospedaje> {
    const { data } = await api.post(`/hospedajes/${hospedajeId}/tarifas`, payload);
    return data;
  },

  async checkDisponibilidad(hospedajeId: string, fechaInicio: string, fechaFin: string): Promise<any[]> {
    const { data } = await api.get(`/hospedajes/${hospedajeId}/disponibilidad`, {
      params: { fechaInicio, fechaFin },
    });
    return data;
  },

  async setDisponibilidad(hospedajeId: string, payload: any): Promise<void> {
    await api.post(`/hospedajes/${hospedajeId}/disponibilidad`, payload);
  },
};
