import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { v4 as uuid } from 'uuid';
import { MailService } from '../mail/mail.service';
import { reservaConfirmadaTemplate } from '../mail/templates/reserva-confirmada';
import { pagoFallidoTemplate } from '../mail/templates/pago-fallido';
import { reembolsoProcesadoTemplate } from '../mail/templates/reembolso-procesado';

@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly mail: MailService,
  ) {}

  async create(userId: string, dto: CreatePagoDto) {
    // Validate reserva exists
    const reserva = await this.prisma.reserva.findUnique({
      where: { id: dto.reservaId },
    });
    if (!reserva) {
      throw new NotFoundException(`Reserva ${dto.reservaId} no encontrada`);
    }

    this.logger.log(
      `Processing simulated payment of $${dto.monto} for reserva ${dto.reservaId} via ${dto.metodo}`,
    );

    // Simulate payment processing (in production: integrate with Stripe/Yappy)
    const simulatedRef = `SIM-${uuid().substring(0, 8).toUpperCase()}`;

    // Create pago record
    const pago = await this.prisma.pago.create({
      data: {
        reservaId: dto.reservaId,
        monto: dto.monto,
        metodo: dto.metodo as any,
        estado: 'COMPLETADO',
        referencia: dto.referencia || simulatedRef,
        stripePaymentId: dto.metodo === 'TARJETA' ? `sim_${uuid()}` : null,
        detalles: {
          simulado: true,
          procesadoEn: new Date().toISOString(),
          metodo: dto.metodo,
          nota: 'Pago simulado - integrar con pasarela real en produccion',
        },
        userId,
      },
      include: {
        reserva: {
          select: { id: true, codigo: true, estado: true, total: true },
        },
      },
    });

    // Update reserva status to CONFIRMADA after successful payment
    await this.prisma.reserva.update({
      where: { id: dto.reservaId },
      data: { estado: 'CONFIRMADA' },
    });

    return pago;
  }

  async createCheckoutSession(reservaId: string, userId: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { cliente: true },
    });
    if (!reserva) throw new NotFoundException('Reserva no encontrada');
    if (reserva.clienteId !== userId) throw new ForbiddenException();
    if (reserva.estado !== 'PENDIENTE') {
      throw new BadRequestException('La reserva no esta pendiente de pago');
    }
    if (reserva.expiresAt && reserva.expiresAt < new Date()) {
      throw new BadRequestException('La reserva expiró. Crea una nueva.');
    }

    let idempotencyKey = reserva.idempotencyKey;
    if (!idempotencyKey) {
      idempotencyKey = `reserva-${reservaId}-${Date.now()}`;
      await this.prisma.reserva.update({
        where: { id: reservaId },
        data: { idempotencyKey },
      });
    }

    const session = await this.stripe.createCheckoutSession({
      reservaId,
      amount: Number(reserva.total),
      description: `TuriDove — Reserva ${reserva.codigo}`,
      successUrl:
        process.env.STRIPE_SUCCESS_URL ??
        'http://localhost:3003/reservas/{RESERVA_ID}/pago/exito',
      cancelUrl:
        process.env.STRIPE_CANCEL_URL ??
        'http://localhost:3003/reservas/{RESERVA_ID}/pago/cancelado',
      idempotencyKey,
    });

    await this.prisma.pago.create({
      data: {
        reservaId,
        userId,
        monto: reserva.total,
        moneda: 'USD',
        metodo: 'STRIPE' as any,
        estado: 'PENDIENTE',
        stripeSessionId: session.sessionId,
        stripeCheckoutUrl: session.url,
      },
    });

    return { url: session.url, sessionId: session.sessionId };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const event = this.stripe.verifyWebhook(rawBody, signature);
    return this.handleWebhookEvent(event);
  }

  async handleWebhookEvent(event: any) {
    const existing = await this.prisma.stripeEvent.findUnique({
      where: { stripeEventId: event.id },
    });
    if (existing && existing.processedSuccessfully) {
      return { received: true, alreadyProcessed: true };
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          const reservaId = session.metadata?.reservaId;
          if (!reservaId) break;
          await this.prisma.pago.updateMany({
            where: { stripeSessionId: session.id },
            data: { estado: 'COMPLETADO', stripePaymentId: session.payment_intent },
          });
          await this.prisma.reserva.update({
            where: { id: reservaId },
            data: { estado: 'CONFIRMADA' },
          });
          await this.sendReservaConfirmadaEmail(reservaId);
          break;
        }
        case 'checkout.session.expired': {
          const session = event.data.object as any;
          const reservaId = session.metadata?.reservaId;
          if (!reservaId) break;
          await this.prisma.pago.updateMany({
            where: { stripeSessionId: session.id },
            data: { estado: 'FALLIDO' },
          });
          await this.prisma.reserva.update({
            where: { id: reservaId },
            data: { estado: 'CANCELADA' },
          });
          break;
        }
        case 'payment_intent.payment_failed': {
          const intent = event.data.object as any;
          await this.prisma.pago.updateMany({
            where: { stripePaymentId: intent.id },
            data: { estado: 'FALLIDO' },
          });
          const pago = await this.prisma.pago.findFirst({
            where: { stripePaymentId: intent.id },
          });
          if (pago) await this.sendPagoFallidoEmail(pago.reservaId);
          break;
        }
        case 'charge.refunded': {
          const charge = event.data.object as any;
          await this.prisma.pago.updateMany({
            where: { stripePaymentId: charge.payment_intent },
            data: { estado: 'REEMBOLSADO' },
          });
          const pago = await this.prisma.pago.findFirst({
            where: { stripePaymentId: charge.payment_intent },
          });
          if (pago) await this.sendReembolsoEmail(pago.reservaId, String(pago.monto));
          break;
        }
        default:
          this.logger.warn(`Evento Stripe sin handler: ${event.type}`);
      }

      await this.prisma.stripeEvent.upsert({
        where: { stripeEventId: event.id },
        update: { processedSuccessfully: true, errorMessage: null },
        create: {
          stripeEventId: event.id,
          type: event.type,
          processedSuccessfully: true,
          payload: event as any,
        },
      });

      return { received: true };
    } catch (e: any) {
      const msg = e?.message ?? 'Error procesando webhook';
      this.logger.error(`Webhook ${event.id} (${event.type}) fallo: ${msg}`);
      await this.prisma.stripeEvent.upsert({
        where: { stripeEventId: event.id },
        update: {
          processedSuccessfully: false,
          errorMessage: msg,
          retries: { increment: 1 },
        },
        create: {
          stripeEventId: event.id,
          type: event.type,
          processedSuccessfully: false,
          errorMessage: msg,
          retries: 1,
          payload: event as any,
        },
      });
      throw e;
    }
  }

  private async sendReservaConfirmadaEmail(reservaId: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { cliente: true },
    });
    if (!reserva?.cliente?.email) return;
    const nombre = `${reserva.cliente.nombre ?? ''} ${reserva.cliente.apellido ?? ''}`.trim() || 'cliente';
    const email = reservaConfirmadaTemplate({
      nombre,
      codigo: reserva.codigo,
      total: String(reserva.total),
      moneda: 'USD',
    });
    await this.mail.send(reserva.cliente.email, email, 'reserva-confirmada');
  }

  private async sendPagoFallidoEmail(reservaId: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { cliente: true },
    });
    if (!reserva?.cliente?.email) return;
    const nombre = `${reserva.cliente.nombre ?? ''} ${reserva.cliente.apellido ?? ''}`.trim() || 'cliente';
    const email = pagoFallidoTemplate({ nombre, codigo: reserva.codigo });
    await this.mail.send(reserva.cliente.email, email, 'pago-fallido');
  }

  private async sendReembolsoEmail(reservaId: string, total: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { cliente: true },
    });
    if (!reserva?.cliente?.email) return;
    const nombre = `${reserva.cliente.nombre ?? ''} ${reserva.cliente.apellido ?? ''}`.trim() || 'cliente';
    const email = reembolsoProcesadoTemplate({
      nombre,
      codigo: reserva.codigo,
      total,
      moneda: 'USD',
    });
    await this.mail.send(reserva.cliente.email, email, 'reembolso-procesado');
  }

  async findAll(pagination: PaginationDto) {
    const where: any = {};

    if (pagination.search) {
      where.OR = [
        { referencia: { contains: pagination.search, mode: 'insensitive' } },
        { reserva: { codigo: { contains: pagination.search, mode: 'insensitive' } } },
        { user: { nombre: { contains: pagination.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.pago.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reserva: { select: { id: true, codigo: true, estado: true, total: true } },
          user: { select: { id: true, nombre: true, apellido: true, email: true } },
        },
      }),
      this.prisma.pago.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async findByReserva(reservaId: string) {
    return this.prisma.pago.findMany({
      where: { reservaId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { nombre: true, apellido: true, email: true } },
      },
    });
  }

  async findOne(id: string) {
    const pago = await this.prisma.pago.findUnique({
      where: { id },
      include: {
        reserva: true,
        user: { select: { nombre: true, apellido: true, email: true } },
      },
    });

    if (!pago) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    return pago;
  }

  async refund(id: string, userId: string) {
    const pago = await this.prisma.pago.findUnique({ where: { id } });
    if (!pago) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    if (pago.estado !== 'COMPLETADO') {
      throw new BadRequestException('Solo se pueden reembolsar pagos completados');
    }

    // If this is a Stripe payment, use Stripe refund API
    if (pago.stripePaymentId) {
      this.logger.log(`Processing Stripe refund for pago ${id}`);
      await this.stripe.refund(pago.stripePaymentId);
      return this.prisma.pago.update({
        where: { id },
        data: { estado: 'REEMBOLSADO' },
      });
    }

    this.logger.log(`Processing simulated refund for pago ${id}`);

    return this.prisma.pago.update({
      where: { id },
      data: {
        estado: 'REEMBOLSADO',
        detalles: {
          ...(pago.detalles as any || {}),
          reembolsadoPor: userId,
          reembolsadoEn: new Date().toISOString(),
        },
      },
    });
  }
}
