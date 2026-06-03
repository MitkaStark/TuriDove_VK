import { api } from '@/lib/axios';

export interface StripeStatus {
  configured: boolean;
  mode: 'test' | 'live' | 'unset' | 'invalid';
  source: 'db' | 'env' | 'mixed';
  currency: string;
  secret: { configured: boolean; masked: string | null };
  public: { configured: boolean; masked: string | null };
  webhook: { configured: boolean; masked: string | null; endpointPath: string };
  redirects: { successUrl: string; cancelUrl: string };
  eventsHandled: string[];
}

export interface TestConnectionResult {
  ok: boolean;
  message: string;
  livemode?: boolean;
}

export const stripeAdminService = {
  async getStatus(): Promise<StripeStatus> {
    const { data } = await api.get('/admin/stripe/status');
    return data as StripeStatus;
  },

  async updateConfig(payload: { secretKey?: string; publicKey?: string; webhookSecret?: string }) {
    const { data } = await api.patch('/admin/stripe/config', payload);
    return data as StripeStatus;
  },

  async resetConfig() {
    const { data } = await api.delete('/admin/stripe/config');
    return data as StripeStatus;
  },

  async testConnection(): Promise<TestConnectionResult> {
    const { data } = await api.post('/admin/stripe/test-connection');
    return data as TestConnectionResult;
  },
};
