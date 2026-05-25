import { api } from '@/lib/axios';
import type { User, PaginatedResponse, QueryParams } from '@/types';

export const usersService = {
  async create(payload: { email: string; password: string; nombre: string; apellido: string; telefono?: string; rol?: string }): Promise<User> {
    const { data } = await api.post('/users', payload);
    return data;
  },

  async getAll(params?: QueryParams): Promise<PaginatedResponse<User>> {
    const { data } = await api.get('/users', { params });
    return data;
  },

  async getById(id: string): Promise<User> {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  async update(id: string, payload: Partial<User>): Promise<User> {
    const { data } = await api.patch(`/users/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async changeRole(id: string, role: string): Promise<User> {
    const { data } = await api.patch(`/users/${id}/role`, { rol: role });
    return data;
  },
};
