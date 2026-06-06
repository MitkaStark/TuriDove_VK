import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { decryptSecret, encryptSecret, maskKey } from '../../common/utils/crypto.util';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import { RenderedEmail } from './templates/render.util';

export interface MailConfig {
  provider: 'resend' | 'smtp' | 'none';
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail: string;
  fromName: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private cachedConfig: MailConfig | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async loadConfig(): Promise<MailConfig> {
    let row: any = null;
    try {
      row = await this.prisma.configuracionEmail.findUnique({ where: { id: 'singleton' } });
    } catch (e) {
      this.logger.warn(`No se pudo leer configuracion_email: ${(e as Error).message}`);
    }

    const fromEnv = (v: string | undefined, ph: string) => v && !v.includes('REPLACE_ME') ? v : ph;

    const provider = (row?.provider ?? (process.env.RESEND_API_KEY ? 'resend' : 'none')) as MailConfig['provider'];
    const resendApiKey = row?.resendApiKeyEnc ? safeDecrypt(row.resendApiKeyEnc) : fromEnv(process.env.RESEND_API_KEY, '');
    const fromEmail = row?.fromEmail ?? process.env.EMAIL_FROM ?? 'noreply@turidove.com';
    const fromName  = row?.fromName  ?? process.env.EMAIL_FROM_NAME ?? 'TuriDove';

    const cfg: MailConfig = { provider, resendApiKey, fromEmail, fromName };
    if (provider === 'smtp') {
      cfg.smtpHost = row?.smtpHost ?? process.env.SMTP_HOST;
      cfg.smtpPort = row?.smtpPort ?? parseInt(process.env.SMTP_PORT ?? '587', 10);
      cfg.smtpUser = row?.smtpUserEnc ? safeDecrypt(row.smtpUserEnc) : process.env.SMTP_USER;
      cfg.smtpPass = row?.smtpPassEnc ? safeDecrypt(row.smtpPassEnc) : process.env.SMTP_PASS;
    }
    this.cachedConfig = cfg;
    return cfg;
  }

  async refresh(): Promise<MailConfig> {
    return this.loadConfig();
  }

  async getStatus() {
    const cfg = this.cachedConfig ?? (await this.loadConfig());
    return {
      configured: cfg.provider !== 'none' && !!(cfg.resendApiKey || (cfg.smtpHost && cfg.smtpUser && cfg.smtpPass)),
      provider: cfg.provider,
      fromEmail: cfg.fromEmail,
      fromName: cfg.fromName,
      resendKeyMasked: cfg.resendApiKey ? maskKey(cfg.resendApiKey) : null,
      smtpHost: cfg.smtpHost ?? null,
      smtpPort: cfg.smtpPort ?? null,
      smtpUserMasked: cfg.smtpUser ? maskKey(cfg.smtpUser) : null,
    };
  }

  async updateConfig(
    payload: {
      provider?: 'resend' | 'smtp';
      resendApiKey?: string;
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpPass?: string;
      fromEmail?: string;
      fromName?: string;
    },
    updatedBy: string,
  ): Promise<MailConfig> {
    const data: any = { updatedBy };
    if (payload.provider !== undefined) data.provider = payload.provider;
    if (payload.resendApiKey !== undefined) {
      data.resendApiKeyEnc = payload.resendApiKey ? encryptSecret(payload.resendApiKey) : null;
    }
    if (payload.smtpHost !== undefined) data.smtpHost = payload.smtpHost || null;
    if (payload.smtpPort !== undefined) data.smtpPort = payload.smtpPort || null;
    if (payload.smtpUser !== undefined) {
      data.smtpUserEnc = payload.smtpUser ? encryptSecret(payload.smtpUser) : null;
    }
    if (payload.smtpPass !== undefined) {
      data.smtpPassEnc = payload.smtpPass ? encryptSecret(payload.smtpPass) : null;
    }
    if (payload.fromEmail !== undefined) data.fromEmail = payload.fromEmail || null;
    if (payload.fromName !== undefined) data.fromName = payload.fromName || null;

    await this.prisma.configuracionEmail.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });
    return this.refresh();
  }

  async sendNow(to: string, email: RenderedEmail, template: string): Promise<{ ok: boolean; id?: string; error?: string }> {
    const cfg = this.cachedConfig ?? (await this.loadConfig());
    if (cfg.provider === 'none') {
      const err = 'Mail provider no configurado';
      await this.logEmail(to, email.subject, template, 'failed', err, null);
      return { ok: false, error: err };
    }

    try {
      let providerId: string | null = null;
      if (cfg.provider === 'resend') {
        if (!cfg.resendApiKey) throw new Error('Resend API key vacía');
        const resend = new Resend(cfg.resendApiKey);
        const { data, error } = await resend.emails.send({
          from: `${cfg.fromName} <${cfg.fromEmail}>`,
          to,
          subject: email.subject,
          html: email.html,
          text: email.text,
        });
        if (error) throw new Error(error.message);
        providerId = data?.id ?? null;
      } else if (cfg.provider === 'smtp') {
        const transporter = nodemailer.createTransport({
          host: cfg.smtpHost,
          port: cfg.smtpPort ?? 587,
          secure: (cfg.smtpPort ?? 587) === 465,
          auth: { user: cfg.smtpUser!, pass: cfg.smtpPass! },
        });
        const info = await transporter.sendMail({
          from: `${cfg.fromName} <${cfg.fromEmail}>`,
          to,
          subject: email.subject,
          html: email.html,
          text: email.text,
        });
        providerId = info.messageId;
      }
      await this.logEmail(to, email.subject, template, 'sent', null, providerId);
      return { ok: true, id: providerId ?? undefined };
    } catch (e: any) {
      const msg = e?.message ?? 'Error desconocido';
      this.logger.error(`Email a ${to} (${template}) falló: ${msg}`);
      await this.logEmail(to, email.subject, template, 'failed', msg, null);
      return { ok: false, error: msg };
    }
  }

  private async logEmail(to: string, subject: string, template: string, status: 'sent'|'failed', errorMsg: string | null, providerId: string | null) {
    try {
      await this.prisma.emailLog.create({
        data: { toEmail: to, subject, template, status, errorMsg, providerId },
      });
    } catch (e) {
      this.logger.warn(`No se pudo registrar email_log: ${(e as Error).message}`);
    }
  }
}

function safeDecrypt(enc: string): string {
  try {
    return decryptSecret(enc);
  } catch {
    return '';
  }
}
