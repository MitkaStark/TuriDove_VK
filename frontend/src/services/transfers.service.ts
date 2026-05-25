import { api } from '@/lib/axios';
import type {
  Transfer,
  TarifaTransfer,
  PaginatedResponse,
  QueryParams,
} from '@/types';

export const transfersService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Transfer>> {
    const { data } = await api.get('/transfers', { params });
    return data;
  },

  async getById(id: string): Promise<Transfer> {
    const { data } = await api.get(`/transfers/${id}`);
    return data;
  },

  async getMine(): Promise<Transfer[]> {
    const { data } = await api.get('/transfers/mis-transfers');
    return data;
  },

  async create(payload: Partial<Transfer>): Promise<Transfer> {
    const { data } = await api.post('/transfers', payload);
    return data;
  },

  async update(id: string, payload: Partial<Transfer>): Promise<Transfer> {
    const { data } = await api.patch(`/transfers/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/transfers/${id}`);
  },

  async getTarifas(transferId: string): Promise<TarifaTransfer[]> {
    const { data } = await api.get(`/transfers/${transferId}/tarifas`);
    return data;
  },

  async createTarifa(transferId: string, payload: Partial<TarifaTransfer>): Promise<TarifaTransfer> {
    const { data } = await api.post(`/transfers/${transferId}/tarifas`, payload);
    return data;
  },

  async assignVehiculo(transferId: string, vehiculoId: string): Promise<void> {
    await api.post(`/transfers/${transferId}/vehiculos`, { vehiculoId });
  },

  async removeVehiculo(transferId: string, vehiculoId: string): Promise<void> {
    await api.delete(`/transfers/${transferId}/vehiculos/${vehiculoId}`);
  },
};
