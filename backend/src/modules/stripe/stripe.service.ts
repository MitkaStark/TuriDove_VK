import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      this.logger.warn('STRIPE_SECRET_KEY not configured — Stripe calls will fail');
    }
    this.stripe = new Stripe(key ?? 'sk_test_placeholder', { apiVersion: '2026-04-22.dahlia' as any });
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

  verifyWebhook(rawBody: Buffer, signature: string): Stripe.Event {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET no configurada');
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }

  async refund(paymentIntentId: string): Promise<Stripe.Refund> {
    return this.stripe.refunds.create({ payment_intent: paymentIntentId });
  }
}
