import { api } from '@/lib/axios';
import type { Paquete } from '@/types/paquete';

function unwrap<T>(data: any): T {
  return (data?.data?.data ?? data?.data ?? data?.items ?? data) as T;
}

export async function listPaquetes(
  params: {
    search?: string;
    featured?: boolean;
    limit?: number;
    page?: number;
  } = {},
) {
  const { data } = await api.get('/paquetes', {
    params: {
      ...params,
      featured: params.featured === undefined ? undefined : String(params.featured),
    },
  });
  return unwrap<{ items: Paquete[]; total: number; page: number; limit: number }>(data);
}

export async function getPaqueteBySlug(slug: string): Promise<Paquete> {
  const { data } = await api.get(`/paquetes/${slug}`);
  return unwrap<Paquete>(data);
}

export async function getPaqueteById(id: string): Promise<Paquete> {
  const { data } = await api.get(`/paquetes/id/${id}`);
  return unwrap<Paquete>(data);
}

export async function getPrecioPaquete(id: string, fechaInicio?: string): Promise<number> {
  const { data } = await api.get(`/paquetes/${id}/precio`, {
    params: { fechaInicio },
  });
  const unwrapped: any = unwrap<{ precio: number }>(data);
  return unwrapped?.precio ?? 0;
}

export async function createPaquete(payload: Partial<Paquete>) {
  const { data } = await api.post('/paquetes', payload);
  return unwrap<Paquete>(data);
}

export async function updatePaquete(id: string, payload: Partial<Paquete>) {
  const { data } = await api.patch(`/paquetes/${id}`, payload);
  return unwrap<Paquete>(data);
}

export async function deletePaquete(id: string) {
  await api.delete(`/paquetes/${id}`);
}
