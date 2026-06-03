import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

/**
 * Endpoints administrativos para inspeccionar el estado de la integración Stripe.
 * No exponen las claves completas — solo metadatos.
 */
@ApiTags('admin/stripe')
@Controller('admin/stripe')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class StripeController {
  @Get('status')
  @ApiOperation({ summary: 'Estado de configuración de Stripe (solo ADMIN). NO expone secrets.' })
  status() {
    const secretKey = process.env.STRIPE_SECRET_KEY ?? '';
    const publicKey = process.env.STRIPE_PUBLIC_KEY ?? '';
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
    const successUrl = process.env.STRIPE_SUCCESS_URL ?? '';
    const cancelUrl = process.env.STRIPE_CANCEL_URL ?? '';
    const currency = process.env.STRIPE_CURRENCY ?? 'usd';

    const isPlaceholder = (v: string) => !v || v.includes('REPLACE_ME');
    const mode = (() => {
      if (isPlaceholder(secretKey)) return 'unset';
      if (secretKey.startsWith('sk_live_')) return 'live';
      if (secretKey.startsWith('sk_test_')) return 'test';
      return 'invalid';
    })();

    const mask = (v: string) => {
      if (!v || v.length < 8) return null;
      // Conserva prefijo (sk_test_) y los últimos 4
      const lastFour = v.slice(-4);
      const prefix = v.split('_').slice(0, 2).join('_') + '_';
      return `${prefix}...${lastFour}`;
    };

    const secretConfigured = !isPlaceholder(secretKey);
    const publicConfigured = !isPlaceholder(publicKey);
    const webhookConfigured = !isPlaceholder(webhookSecret);
    const configured = secretConfigured && publicConfigured && webhookConfigured;

    return {
      configured,
      mode,
      currency,
      secret: {
        configured: secretConfigured,
        masked: secretConfigured ? mask(secretKey) : null,
      },
      public: {
        configured: publicConfigured,
        masked: publicConfigured ? mask(publicKey) : null,
      },
      webhook: {
        configured: webhookConfigured,
        masked: webhookConfigured ? mask(webhookSecret) : null,
        // Útil para configurar el endpoint en el dashboard de Stripe en producción
        endpointPath: '/api/v1/pagos/webhook',
      },
      redirects: {
        successUrl,
        cancelUrl,
      },
      eventsHandled: [
        'checkout.session.completed',
        'checkout.session.expired',
        'payment_intent.payment_failed',
        'charge.refunded',
      ],
    };
  }
}
