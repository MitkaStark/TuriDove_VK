import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import StripeLib = require('stripe');
import { PrismaService } from '../../prisma/prisma.service';
import { decryptSecret, encryptSecret, maskKey } from '../../common/utils/crypto.util';

type StripeInstance = InstanceType<typeof StripeLib>;

export interface StripeRuntimeConfig {
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
  source: 'db' | 'env' | 'mixed';
  modo: 'test' | 'live' | 'unset' | 'invalid';
}

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe!: StripeInstance;
  private cachedConfig: StripeRuntimeConfig | null = null;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.refresh();
  }

  /**
   * Carga la configuración efectiva (DB con fallback a env vars) y reinstancia el cliente Stripe.
   * Llamar después de actualizar la config desde admin.
   */
  async refresh(): Promise<StripeRuntimeConfig> {
    const config = await this.loadConfig();
    this.cachedConfig = config;
    this.stripe = new StripeLib(config.secretKey || 'sk_test_placeholder', {
      apiVersion: '2026-04-22.dahlia' as any,
    });
    this.logger.log(`Stripe client (re)cargado: mode=${config.modo} source=${config.source}`);
    return config;
  }

  private async loadConfig(): Promise<StripeRuntimeConfig> {
    // 1. Intentar leer de DB
    let dbSecret = '';
    let dbPublic = '';
    let dbWebhook = '';
    try {
      const row = await this.prisma.configuracionStripe.findUnique({
        where: { id: 'singleton' },
      });
      if (row) {
        if (row.secretKeyEnc) {
          try {
            dbSecret = decryptSecret(row.secretKeyEnc);
          } catch (e) {
            this.logger.warn(`No se pudo descifrar secretKey de BD: ${(e as Error).message}`);
          }
        }
        if (row.publicKey) dbPublic = row.publicKey;
        if (row.webhookSecretEnc) {
          try {
            dbWebhook = decryptSecret(row.webhookSecretEnc);
          } catch (e) {
            this.logger.warn(`No se pudo descifrar webhookSecret de BD: ${(e as Error).message}`);
          }
        }
      }
    } catch (e) {
      this.logger.warn(`No se pudo leer configuracion_stripe: ${(e as Error).message}`);
    }

    // 2. Fallback a env vars cuando un campo está vacío o es placeholder
    const fromEnv = (v: string | undefined, placeholder: string) =>
      v && !v.includes('REPLACE_ME') ? v : placeholder;

    const envSecret = fromEnv(process.env.STRIPE_SECRET_KEY, '');
    const envPublic = fromEnv(process.env.STRIPE_PUBLIC_KEY, '');
    const envWebhook = fromEnv(process.env.STRIPE_WEBHOOK_SECRET, '');

    const secretKey = dbSecret || envSecret;
    const publicKey = dbPublic || envPublic;
    const webhookSecret = dbWebhook || envWebhook;

    // 3. Fuente y modo
    const usedDb = !!(dbSecret || dbPublic || dbWebhook);
    const usedEnv = !dbSecret || !dbPublic || !dbWebhook;
    const source: 'db' | 'env' | 'mixed' =
      usedDb && usedEnv ? 'mixed' : usedDb ? 'db' : 'env';

    let modo: 'test' | 'live' | 'unset' | 'invalid' = 'unset';
    if (secretKey) {
      if (secretKey.startsWith('sk_live_')) modo = 'live';
      else if (secretKey.startsWith('sk_test_')) modo = 'test';
      else modo = 'invalid';
    }

    return { secretKey, publicKey, webhookSecret, source, modo };
  }

  /** Estado actual sin secretos completos. Útil para endpoint admin status. */
  async getStatus() {
    const cfg = this.cachedConfig ?? (await this.refresh());
    const isPlaceholder = (v: string) => !v || v.includes('REPLACE_ME');
    return {
      configured: !isPlaceholder(cfg.secretKey) && !isPlaceholder(cfg.publicKey) && !isPlaceholder(cfg.webhookSecret),
      mode: cfg.modo,
      source: cfg.source,
      currency: process.env.STRIPE_CURRENCY ?? 'usd',
      secret: {
        configured: !isPlaceholder(cfg.secretKey),
        masked: !isPlaceholder(cfg.secretKey) ? maskKey(cfg.secretKey) : null,
      },
      public: {
        configured: !isPlaceholder(cfg.publicKey),
        masked: !isPlaceholder(cfg.publicKey) ? maskKey(cfg.publicKey) : null,
      },
      webhook: {
        configured: !isPlaceholder(cfg.webhookSecret),
        masked: !isPlaceholder(cfg.webhookSecret) ? maskKey(cfg.webhookSecret) : null,
        endpointPath: '/api/v1/pagos/webhook',
      },
      redirects: {
        successUrl: process.env.STRIPE_SUCCESS_URL ?? '',
        cancelUrl: process.env.STRIPE_CANCEL_URL ?? '',
      },
      eventsHandled: [
        'checkout.session.completed',
        'checkout.session.expired',
        'payment_intent.payment_failed',
        'charge.refunded',
      ],
    };
  }

  /** Guarda nueva config en BD (cifrando secretos) y refresca el cliente. */
  async updateConfig(
    payload: { secretKey?: string; publicKey?: string; webhookSecret?: string },
    updatedBy: string,
  ): Promise<StripeRuntimeConfig> {
    const data: any = { updatedBy };
    let modo: string | undefined;
    if (payload.secretKey !== undefined) {
      const v = payload.secretKey.trim();
      data.secretKeyEnc = v ? encryptSecret(v) : null;
      if (v.startsWith('sk_live_')) modo = 'live';
      else if (v.startsWith('sk_test_')) modo = 'test';
    }
    if (payload.publicKey !== undefined) {
      data.publicKey = payload.publicKey.trim() || null;
    }
    if (payload.webhookSecret !== undefined) {
      const v = payload.webhookSecret.trim();
      data.webhookSecretEnc = v ? encryptSecret(v) : null;
    }
    if (modo) data.modo = modo;

    await this.prisma.configuracionStripe.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });

    return this.refresh();
  }

  /** Borra la configuración de BD (vuelve a usar env vars). */
  async resetConfig(updatedBy: string): Promise<StripeRuntimeConfig> {
    await this.prisma.configuracionStripe.upsert({
      where: { id: 'singleton' },
      update: { secretKeyEnc: null, publicKey: null, webhookSecretEnc: null, modo: null, updatedBy },
      create: { id: 'singleton', updatedBy },
    });
    return this.refresh();
  }

  /** Hace una llamada read-only a Stripe (balance.retrieve) para validar las claves. */
  async testConnection(): Promise<{ ok: boolean; message: string; livemode?: boolean }> {
    if (!this.cachedConfig?.secretKey || this.cachedConfig.secretKey.includes('placeholder')) {
      return { ok: false, message: 'Secret key no configurada' };
    }
    try {
      const balance = await this.stripe.balance.retrieve();
      return {
        ok: true,
        message: 'Conexión exitosa con Stripe',
        livemode: balance.livemode,
      };
    } catch (e: any) {
      return { ok: false, message: e?.message ?? 'Error desconocido al conectar con Stripe' };
    }
  }

  toCents(amountUsd: number): number {
    return Math.round(amountUsd * 100);
  }

  async createCheckoutSession(params: {
    reservaId: string;
    amount: number;
    description?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string; sessionId: string }> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: process.env.STRIPE_CURRENCY ?? 'usd',
            product_data: { name: params.description ?? `Reserva ${params.reservaId}` },
            unit_amount: this.toCents(params.amount),
          },
          quantity: 1,
        },
      ],
      metadata: { reservaId: params.reservaId },
      success_url: params.successUrl.replace('{RESERVA_ID}', params.reservaId),
      cancel_url: params.cancelUrl.replace('{RESERVA_ID}', params.reservaId),
    });
    if (!session.url) throw new Error('Stripe devolvio session sin URL');
    return { url: session.url, sessionId: session.id };
  }

  verifyWebhook(rawBody: Buffer, signature: string): any {
    const secret = this.cachedConfig?.webhookSecret;
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET no configurada (ni en BD ni env)');
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }

  async refund(paymentIntentId: string): Promise<any> {
    return this.stripe.refunds.create({ payment_intent: paymentIntentId });
  }
}
