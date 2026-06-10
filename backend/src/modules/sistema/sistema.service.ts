import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PagosService } from '../pagos/pagos.service';

@Injectable()
export class SistemaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagos: PagosService,
  ) {}

  async listStripeEvents(filter: { status?: 'all' | 'failed' | 'ok'; type?: string; limit?: number }) {
    const where: any = {};
    if (filter.status === 'failed') where.processedSuccessfully = false;
    if (filter.status === 'ok') where.processedSuccessfully = true;
    if (filter.type) where.type = filter.type;

    return this.prisma.stripeEvent.findMany({
      where,
      orderBy: { processedAt: 'desc' },
      take: filter.limit ?? 100,
    });
  }

  async retryStripeEvent(eventId: string) {
    const ev = await this.prisma.stripeEvent.findUnique({ where: { id: eventId } });
    if (!ev) throw new NotFoundException('Evento no existe');
    await this.pagos.handleWebhookEvent(ev.payload as any);
    return { ok: true };
  }

  async listEmailLogs(filter: { status?: 'sent' | 'failed' | 'all'; limit?: number }) {
    const where: any = {};
    if (filter.status === 'sent') where.status = 'sent';
    if (filter.status === 'failed') where.status = 'failed';

    return this.prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filter.limit ?? 100,
    });
  }
}
