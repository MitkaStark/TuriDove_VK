import { api } from '@/lib/axios';
import type { CategoriaActividad } from '@/types';

export const categoriasActividadService = {
  async getAll(opts: { soloActivas?: boolean } = {}) {
    const { data } = await api.get('/actividades/categorias', {
      params: { soloActivas: opts.soloActivas === false ? 'false' : 'true' },
    });
    return data as CategoriaActividad[];
  },

  async getById(id: string) {
    const { data } = await api.get(`/actividades/categorias/${id}`);
    return data as CategoriaActividad;
  },

  async create(payload: { nombre: string; icono?: string; descripcion?: string; activo?: boolean }) {
    const { data } = await api.post('/actividades/categorias', payload);
    return data as CategoriaActividad;
  },

  async update(id: string, payload: { nombre?: string; icono?: string; descripcion?: string; activo?: boolean }) {
    const { data } = await api.patch(`/actividades/categorias/${id}`, payload);
    return data as CategoriaActividad;
  },

  async remove(id: string) {
    await api.delete(`/actividades/categorias/${id}`);
  },
};
