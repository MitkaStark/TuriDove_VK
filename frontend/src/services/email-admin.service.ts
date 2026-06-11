import { api } from '@/lib/axios';

export interface EmailStatus {
  configured: boolean;
  provider: 'resend' | 'smtp' | 'none';
  fromEmail: string;
  fromName: string;
  resendKeyMasked: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUserMasked: string | null;
}

export const emailAdminService = {
  async getStatus(): Promise<EmailStatus> {
    const { data } = await api.get('/admin/email/status');
    return data as EmailStatus;
  },
  async updateConfig(payload: Partial<{ provider: 'resend' | 'smtp'; resendApiKey: string; smtpHost: string; smtpPort: number; smtpUser: string; smtpPass: string; fromEmail: string; fromName: string }>) {
    const { data } = await api.patch('/admin/email/config', payload);
    return data as EmailStatus;
  },
  async test(): Promise<{ ok: boolean; id?: string; error?: string }> {
    const { data } = await api.post('/admin/email/test', {});
    return data;
  },
};
