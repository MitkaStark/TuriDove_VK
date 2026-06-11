import { api } from '@/lib/axios';

export interface SystemHealth {
  status: 'ok' | 'degraded';
  version: string;
  uptimeSeconds: number;
  checkedAt: string;
  totalLatencyMs: number;
  checks: {
    database: { ok: boolean; latencyMs: number };
    redis: { ok: boolean; latencyMs: number };
    stripe: any;
    email: any;
    queues: Record<string, Record<string, number>>;
  };
}

export interface StripeEventRow {
  id: string;
  stripeEventId: string;
  type: string;
  processedAt: string;
  processedSuccessfully: boolean;
  errorMessage: string | null;
  retries: number;
}

export interface EmailLogRow {
  id: string;
  toEmail: string;
  subject: string;
  template: string;
  status: 'sent' | 'failed';
  errorMsg: string | null;
  providerId: string | null;
  createdAt: string;
}

export const sistemaService = {
  async getHealth(): Promise<SystemHealth> {
    // health vive fuera del prefix /api/v1, asi que se llama al host base
    const base = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1').replace('/api/v1', '');
    const r = await fetch(`${base}/health`);
    return r.json();
  },

  async listStripeEvents(status: 'all' | 'failed' | 'ok' = 'all'): Promise<StripeEventRow[]> {
    const { data } = await api.get('/admin/system/stripe-events', { params: { status } });
    return data as StripeEventRow[];
  },

  async retryStripeEvent(id: string): Promise<{ ok: boolean }> {
    const { data } = await api.post(`/admin/system/stripe-events/${id}/retry`);
    return data as { ok: boolean };
  },

  async listEmailLogs(status: 'all' | 'sent' | 'failed' = 'all'): Promise<EmailLogRow[]> {
    const { data } = await api.get('/admin/system/email-logs', { params: { status } });
    return data as EmailLogRow[];
  },
};
