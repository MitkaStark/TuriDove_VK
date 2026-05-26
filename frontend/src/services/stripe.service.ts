import { api } from '@/lib/axios';

export async function createCheckoutSession(reservaId: string): Promise<{ url: string }> {
  const { data } = await api.post(`/pagos/checkout/${reservaId}`);
  return data?.data ?? data;
}
