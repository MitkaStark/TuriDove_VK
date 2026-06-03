import { api } from '@/lib/axios';

export interface StripeStatus {
  configured: boolean;
  mode: 'test' | 'live' | 'unset' | 'invalid';
  currency: string;
  secret: { configured: boolean; masked: string | null };
  public: { configured: boolean; masked: string | null };
  webhook: { configured: boolean; masked: string | null; endpointPath: string };
  redirects: { successUrl: string; cancelUrl: string };
  eventsHandled: string[];
}

export const stripeAdminService = {
  async getStatus(): Promise<StripeStatus> {
    const { data } = await api.get('/admin/stripe/status');
    return data as StripeStatus;
  },
};
