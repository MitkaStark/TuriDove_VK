import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { reservaCanceladaTiempoTemplate } from '../mail/templates/reserva-cancelada-tiempo';

export interface ExpireReservaJob {
  reservaId: string;
}

@Processor('reservas-expirations')
export class ReservaExpirationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReservaExpirationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {
    super();
  }

  async process(job: Job<ExpireReservaJob>): Promise<{ cancelled: boolean }> {
    const { reservaId } = job.data;

    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { cliente: true },
    });

    if (!reserva) {
      this.logger.warn(`Reserva ${reservaId} no existe; job ignorado`);
      return { cancelled: false };
    }

    if (reserva.estado !== 'PENDIENTE') {
      this.logger.log(`Reserva ${reservaId} ya no esta PENDIENTE (${reserva.estado}); job ignorado`);
      return { cancelled: false };
    }

    if (reserva.expiresAt && reserva.expiresAt > new Date()) {
      this.logger.warn(`Reserva ${reservaId} aun no expira; job se ejecuto antes de tiempo`);
      return { cancelled: false };
    }

    await this.prisma.reserva.update({
      where: { id: reservaId },
      data: { estado: 'CANCELADA' },
    });

    this.logger.log(`Reserva ${reservaId} cancelada por TTL`);

    if (reserva.cliente?.email) {
      const nombre = `${reserva.cliente.nombre ?? ''} ${reserva.cliente.apellido ?? ''}`.trim() || 'cliente';
      const email = reservaCanceladaTiempoTemplate({ nombre, codigo: reserva.codigo });
      await this.mail.send(reserva.cliente.email, email, 'reserva-cancelada-tiempo');
    }

    return { cancelled: true };
  }
}
