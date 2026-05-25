import { api } from '@/lib/axios';
import type { Reserva, PaginatedResponse, QueryParams } from '@/types';

export const reservasService = {
  async create(payload: Partial<Reserva>): Promise<Reserva> {
    const { data } = await api.post('/reservas', payload);
    return data;
  },

  async getAll(params?: QueryParams): Promise<PaginatedResponse<Reserva>> {
    const { data } = await api.get('/reservas', { params });
    return data;
  },

  async getById(id: string): Promise<Reserva> {
    const { data } = await api.get(`/reservas/${id}`);
    return data;
  },

  async changeEstado(id: string, estado: string): Promise<Reserva> {
    const { data } = await api.patch(`/reservas/${id}/estado`, { estado });
    return data;
  },

  async cancel(id: string): Promise<Reserva> {
    const { data } = await api.post(`/reservas/${id}/cancel`);
    return data;
  },

  async getCalendario(params?: QueryParams): Promise<Reserva[]> {
    const { data } = await api.get('/reservas/calendario', { params });
    return data;
  },
};
