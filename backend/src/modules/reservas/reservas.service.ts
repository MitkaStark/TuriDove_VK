import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReservaDto) {
    const hasItems =
      (dto.hospedajes && dto.hospedajes.length > 0) ||
      (dto.actividades && dto.actividades.length > 0) ||
      (dto.transfers && dto.transfers.length > 0) ||
      (dto.vehiculos && dto.vehiculos.length > 0);

    if (!hasItems) {
      throw new BadRequestException(
        'La reserva debe incluir al menos un hospedaje, actividad, transfer o vehiculo',
      );
    }

    this.logger.log(`Creating reserva for user ${userId}`);

    let total = new Decimal(0);

    // Calculate hospedaje totals
    const hospedajeItems: any[] = [];
    if (dto.hospedajes) {
      for (const h of dto.hospedajes) {
        const hospedaje = await this.prisma.hospedaje.findUnique({ where: { id: h.hospedajeId } });
        if (!hospedaje) throw new BadRequestException(`Hospedaje ${h.hospedajeId} no encontrado`);

        const habitacion = await this.prisma.habitacion.findUnique({ where: { id: h.habitacionId } });
        if (!habitacion) throw new BadRequestException(`Habitacion ${h.habitacionId} no encontrada`);

        const entrada = new Date(h.fechaEntrada);
        const salida = new Date(h.fechaSalida);
        const noches = Math.max(1, Math.ceil((salida.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24)));

        // Find applicable tarifa for this habitacion (prefer BAJA as default)
        const tarifa = await this.prisma.tarifaHospedaje.findFirst({
          where: {
            habitacionId: h.habitacionId,
            activo: true,
            fechaInicio: { lte: entrada },
            fechaFin: { gte: salida },
          },
          orderBy: { precioNoche: 'asc' },
        });

        const precioNoche = tarifa ? tarifa.precioNoche : new Decimal(50);
        const precioExtra = tarifa ? tarifa.precioPersonaExtra : new Decimal(0);
        const huespedesExtra = Math.max(0, h.huespedes - 1);
        const precioPorNoche = new Decimal(precioNoche).add(new Decimal(precioExtra).mul(huespedesExtra));
        const precio = precioPorNoche.mul(noches);
        total = total.add(precio);

        hospedajeItems.push({
          hospedajeId: h.hospedajeId,
          habitacionId: h.habitacionId,
          fechaEntrada: entrada,
          fechaSalida: salida,
          huespedes: h.huespedes,
          precioTotal: precio,
        });
      }
    }

    // Calculate actividad totals
    const actividadItems: any[] = [];
    if (dto.actividades) {
      for (const a of dto.actividades) {
        const actividad = await this.prisma.actividad.findUnique({ where: { id: a.actividadId } });
        if (!actividad) throw new BadRequestException(`Actividad ${a.actividadId} no encontrada`);

        const precio = new Decimal((a.adultos * 45) + (a.ninos * 25)); // precio base
        total = total.add(precio);

        actividadItems.push({
          actividadId: a.actividadId,
          fecha: new Date(a.fecha),
          adultos: a.adultos,
          ninos: a.ninos,
          precioTotal: precio,
        });
      }
    }

    // Calculate transfer totals
    const transferItems: any[] = [];
    if (dto.transfers) {
      for (const t of dto.transfers) {
        const transfer = await this.prisma.transfer.findUnique({ where: { id: t.transferId } });
        if (!transfer) throw new BadRequestException(`Transfer ${t.transferId} no encontrado`);

        const precio = new Decimal(t.pasajeros * 20); // precio base por persona
        total = total.add(precio);

        transferItems.push({
          transferId: t.transferId,
          fecha: new Date(t.fecha),
          pasajeros: t.pasajeros,
          precioTotal: precio,
        });
      }
    }

    // Calculate vehiculo totals
    const vehiculoItems: any[] = [];
    if (dto.vehiculos) {
      for (const v of dto.vehiculos) {
        const vehiculo = await this.prisma.vehiculo.findUnique({ where: { id: v.vehiculoId } });
        if (!vehiculo) throw new BadRequestException(`Vehiculo ${v.vehiculoId} no encontrado`);

        const inicio = new Date(v.fechaInicio);
        const fin = new Date(v.fechaFin);
        const dias = Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)));
        const precio = new Decimal(dias * 60); // precio base por dia
        total = total.add(precio);

        vehiculoItems.push({
          vehiculoId: v.vehiculoId,
          fechaInicio: inicio,
          fechaFin: fin,
          precioTotal: precio,
        });
      }
    }

    // Create reserva with all items in a transaction
    const reserva = await this.prisma.$transaction(async (tx) => {
      const created = await tx.reserva.create({
        data: {
          clienteId: userId,
          total,
          notas: dto.notas,
          reservaHospedajes: {
            create: hospedajeItems,
          },
          reservaActividades: {
            create: actividadItems,
          },
          reservaTransfers: {
            create: transferItems,
          },
          reservaVehiculos: {
            create: vehiculoItems,
          },
        },
        include: {
          cliente: { select: { id: true, nombre: true, apellido: true, email: true } },
          reservaHospedajes: { include: { hospedaje: { select: { id: true, nombre: true } } } },
          reservaActividades: { include: { actividad: { select: { id: true, nombre: true } } } },
          reservaTransfers: { include: { transfer: { select: { id: true, nombre: true } } } },
          reservaVehiculos: { include: { vehiculo: { select: { id: true, marca: true, modelo: true } } } },
        },
      });

      return created;
    });

    return reserva;
  }

  async findAll(pagination: PaginationDto) {
    const where: any = {};

    if (pagination.search) {
      where.OR = [
        { codigo: { contains: pagination.search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: pagination.search, mode: 'insensitive' } } },
        { cliente: { apellido: { contains: pagination.search, mode: 'insensitive' } } },
        { cliente: { email: { contains: pagination.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.reserva.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { id: true, nombre: true, apellido: true, email: true } },
          reservaHospedajes: { include: { hospedaje: { select: { nombre: true } } } },
          reservaActividades: { include: { actividad: { select: { nombre: true } } } },
          reservaTransfers: { include: { transfer: { select: { nombre: true } } } },
          reservaVehiculos: { include: { vehiculo: { select: { marca: true, modelo: true } } } },
        },
      }),
      this.prisma.reserva.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async findByProveedor(proveedorId: string, pagination: PaginationDto) {
    // Find reservas that contain resources owned by this proveedor
    const where = {
      OR: [
        { reservaHospedajes: { some: { hospedaje: { proveedorId } } } },
        { reservaActividades: { some: { actividad: { proveedorId } } } },
        { reservaTransfers: { some: { transfer: { proveedorId } } } },
        { reservaVehiculos: { some: { vehiculo: { proveedorId } } } },
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.reserva.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { id: true, nombre: true, apellido: true, email: true } },
          reservaHospedajes: { include: { hospedaje: { select: { nombre: true, proveedorId: true } } } },
          reservaActividades: { include: { actividad: { select: { nombre: true, proveedorId: true } } } },
          reservaTransfers: { include: { transfer: { select: { nombre: true, proveedorId: true } } } },
          reservaVehiculos: { include: { vehiculo: { select: { marca: true, modelo: true, proveedorId: true } } } },
          pagos: true,
        },
      }),
      this.prisma.reserva.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async findByUser(userId: string, pagination: PaginationDto) {
    const where = { clienteId: userId };

    const [items, total] = await Promise.all([
      this.prisma.reserva.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reservaHospedajes: { include: { hospedaje: { select: { nombre: true } } } },
          reservaActividades: { include: { actividad: { select: { nombre: true } } } },
          reservaTransfers: { include: { transfer: { select: { nombre: true } } } },
          reservaVehiculos: { include: { vehiculo: { select: { marca: true, modelo: true } } } },
        },
      }),
      this.prisma.reserva.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async findOne(id: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nombre: true, apellido: true, email: true, telefono: true } },
        reservaHospedajes: { include: { hospedaje: true, habitacion: true } },
        reservaActividades: { include: { actividad: true } },
        reservaTransfers: { include: { transfer: true } },
        reservaVehiculos: { include: { vehiculo: true } },
        pagos: true,
      },
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    return reserva;
  }

  async updateEstado(id: string, dto: UpdateEstadoDto) {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } });
    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    return this.prisma.reserva.update({
      where: { id },
      data: { estado: dto.estado as any },
      include: {
        cliente: { select: { nombre: true, apellido: true, email: true } },
      },
    });
  }

  async cancel(id: string, userId: string) {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } });
    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    if (reserva.clienteId !== userId) {
      throw new ForbiddenException('Solo puedes cancelar tus propias reservas');
    }

    if (reserva.estado !== 'PENDIENTE' && reserva.estado !== 'CONFIRMADA') {
      throw new BadRequestException('Solo se pueden cancelar reservas pendientes o confirmadas');
    }

    return this.prisma.reserva.update({
      where: { id },
      data: { estado: 'CANCELADA' },
    });
  }
}
