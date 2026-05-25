import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);

  constructor(private readonly prisma: PrismaService) {}

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
