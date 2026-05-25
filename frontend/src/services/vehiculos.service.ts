import { api } from '@/lib/axios';
import type {
  Vehiculo,
  TarifaVehiculo,
  PaginatedResponse,
  QueryParams,
} from '@/types';

export const vehiculosService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Vehiculo>> {
    const { data } = await api.get('/vehiculos', { params });
    return data;
  },

  async getById(id: string): Promise<Vehiculo> {
    const { data } = await api.get(`/vehiculos/${id}`);
    return data;
  },

  async getMine(): Promise<Vehiculo[]> {
    const { data } = await api.get('/vehiculos/mis-vehiculos');
    return data;
  },

  async create(payload: Partial<Vehiculo>): Promise<Vehiculo> {
    const { data } = await api.post('/vehiculos', payload);
    return data;
  },

  async update(id: string, payload: Partial<Vehiculo>): Promise<Vehiculo> {
    const { data } = await api.patch(`/vehiculos/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/vehiculos/${id}`);
  },

  async getTarifas(vehiculoId: string): Promise<TarifaVehiculo[]> {
    const { data } = await api.get(`/vehiculos/${vehiculoId}/tarifas`);
    return data;
  },

  async createTarifa(vehiculoId: string, payload: Partial<TarifaVehiculo>): Promise<TarifaVehiculo> {
    const { data } = await api.post(`/vehiculos/${vehiculoId}/tarifas`, payload);
    return data;
  },

  async checkDisponibilidad(vehiculoId: string, fechaInicio: string, fechaFin: string): Promise<any> {
    const { data } = await api.get(`/vehiculos/${vehiculoId}/disponibilidad`, {
      params: { fechaInicio, fechaFin },
    });
    return data;
  },

  async setDisponibilidad(vehiculoId: string, payload: any): Promise<void> {
    await api.post(`/vehiculos/${vehiculoId}/disponibilidad`, payload);
  },
};
