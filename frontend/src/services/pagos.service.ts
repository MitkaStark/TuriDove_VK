import { api } from '@/lib/axios';
import type { Pago, PaginatedResponse, QueryParams } from '@/types';

export const pagosService = {
  async create(payload: Partial<Pago>): Promise<Pago> {
    const { data } = await api.post('/pagos', payload);
    return data;
  },

  async getAll(params?: QueryParams): Promise<PaginatedResponse<Pago>> {
    const { data } = await api.get('/pagos', { params });
    return data;
  },

  async getById(id: string): Promise<Pago> {
    const { data } = await api.get(`/pagos/${id}`);
    return data;
  },

  async getByReserva(reservaId: string): Promise<Pago[]> {
    const { data } = await api.get(`/pagos/reserva/${reservaId}`);
    return data;
  },
};
