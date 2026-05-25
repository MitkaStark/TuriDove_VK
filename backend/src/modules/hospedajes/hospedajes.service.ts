import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHospedajeDto } from './dto/create-hospedaje.dto';
import { UpdateHospedajeDto } from './dto/update-hospedaje.dto';
import { CreateHabitacionDto } from './dto/create-habitacion.dto';
import { CreateTarifaHospedajeDto } from './dto/create-tarifa-hospedaje.dto';
import { SetDisponibilidadDto } from './dto/disponibilidad.dto';

@Injectable()
export class HospedajesService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────── Hospedajes CRUD ────────────────────────────

  async findAll(query: {
    page?: number;
    limit?: number;
    provincia?: string;
    search?: string;
    isFeatured?: boolean;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.provincia) {
      where.provincia = query.provincia;
    }
    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        { provincia: { contains: query.search, mode: 'insensitive' } },
        { distrito: { contains: query.search, mode: 'insensitive' } },
        { descripcion: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    const [data, total] = await Promise.all([
      this.prisma.hospedaje.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          habitaciones: { take: 1 },
          tarifas: { take: 1, orderBy: { precioNoche: 'asc' } },
        },
      }),
      this.prisma.hospedaje.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByProveedor(userId: string) {
    return this.prisma.hospedaje.findMany({
      where: { proveedorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        habitaciones: true,
        tarifas: true,
      },
    });
  }

  async findById(id: string) {
    const hospedaje = await this.prisma.hospedaje.findUnique({
      where: { id },
      include: {
        habitaciones: true,
        tarifas: true,
      },
    });

    if (!hospedaje) {
      throw new NotFoundException(`Hospedaje con id ${id} no encontrado`);
    }

    return hospedaje;
  }

  async create(dto: CreateHospedajeDto, userId: string) {
    return this.prisma.hospedaje.create({
      data: {
        ...dto,
        proveedorId: userId,
      } as any,
    });
  }

  async update(id: string, dto: UpdateHospedajeDto, userId: string, userRole?: string) {
    if (userRole !== 'ADMIN') {
      await this.verifyOwnership(id, userId);
    }

    return this.prisma.hospedaje.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    if (userRole !== 'ADMIN') {
      await this.verifyOwnership(id, userId);
    } else {
      const hospedaje = await this.prisma.hospedaje.findUnique({
        where: { id },
      });
      if (!hospedaje) {
        throw new NotFoundException(`Hospedaje con id ${id} no encontrado`);
      }
    }

    await this.prisma.hospedaje.delete({ where: { id } });
    return { message: 'Hospedaje eliminado permanentemente' };
  }

  // ──────────────────────────── Habitaciones CRUD ──────────────────────────

  async findHabitaciones(hospedajeId: string) {
    await this.ensureHospedajeExists(hospedajeId);
    return this.prisma.habitacion.findMany({
      where: { hospedajeId },
      include: {
        tarifas: {
          where: { activo: true },
          orderBy: { precioNoche: 'asc' },
        },
      },
    });
  }

  async createHabitacion(
    hospedajeId: string,
    dto: CreateHabitacionDto,
    userId: string,
    userRole?: string,
  ) {
    await this.verifyOwnership(hospedajeId, userId, userRole);

    return this.prisma.habitacion.create({
      data: {
        ...dto,
        hospedajeId,
      } as any,
    });
  }

  async updateHabitacion(
    hospedajeId: string,
    habId: string,
    dto: Partial<CreateHabitacionDto>,
    userId: string,
    userRole?: string,
  ) {
    await this.verifyOwnership(hospedajeId, userId, userRole);

    const habitacion = await this.prisma.habitacion.findFirst({
      where: { id: habId, hospedajeId },
    });
    if (!habitacion) {
      throw new NotFoundException(`Habitacion con id ${habId} no encontrada`);
    }

    return this.prisma.habitacion.update({
      where: { id: habId },
      data: dto as any,
    });
  }

  async deleteHabitacion(
    hospedajeId: string,
    habId: string,
    userId: string,
    userRole?: string,
  ) {
    await this.verifyOwnership(hospedajeId, userId, userRole);

    const habitacion = await this.prisma.habitacion.findFirst({
      where: { id: habId, hospedajeId },
    });
    if (!habitacion) {
      throw new NotFoundException(`Habitacion con id ${habId} no encontrada`);
    }

    return this.prisma.habitacion.delete({
      where: { id: habId },
    });
  }

  // ──────────────────────────── Tarifas CRUD ───────────────────────────────

  async findTarifas(hospedajeId: string) {
    await this.ensureHospedajeExists(hospedajeId);
    return this.prisma.tarifaHospedaje.findMany({
      where: { hospedajeId },
      orderBy: { fechaInicio: 'asc' },
    });
  }

  async createTarifa(
    hospedajeId: string,
    dto: CreateTarifaHospedajeDto,
    userId: string,
    userRole?: string,
  ) {
    await this.verifyOwnership(hospedajeId, userId, userRole);

    const { fechaInicio, fechaFin, ...rest } = dto;

    return this.prisma.tarifaHospedaje.create({
      data: {
        ...rest,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        hospedajeId,
      } as any,
    });
  }

  async updateTarifa(
    hospedajeId: string,
    tarifaId: string,
    dto: Partial<CreateTarifaHospedajeDto>,
    userId: string,
    userRole?: string,
  ) {
    await this.verifyOwnership(hospedajeId, userId, userRole);

    const tarifa = await this.prisma.tarifaHospedaje.findFirst({
      where: { id: tarifaId, hospedajeId },
    });
    if (!tarifa) {
      throw new NotFoundException(`Tarifa con id ${tarifaId} no encontrada`);
    }

    const data: any = { ...dto };
    if (dto.fechaInicio) data.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) data.fechaFin = new Date(dto.fechaFin);

    return this.prisma.tarifaHospedaje.update({
      where: { id: tarifaId },
      data,
    });
  }

  // ──────────────────────────── Disponibilidad ─────────────────────────────

  async checkDisponibilidad(
    hospedajeId: string,
    fechaInicio: string,
    fechaFin: string,
  ) {
    await this.ensureHospedajeExists(hospedajeId);

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    const habitaciones = await this.prisma.habitacion.findMany({
      where: { hospedajeId },
    });

    const unavailable = await this.prisma.disponibilidadHospedaje.findMany({
      where: {
        habitacionId: { in: habitaciones.map((h) => h.id) },
        fecha: { gte: inicio, lte: fin },
        disponible: false,
      },
    });

    const unavailableByRoom = new Map<string, string[]>();
    for (const entry of unavailable) {
      const dates = unavailableByRoom.get(entry.habitacionId) ?? [];
      dates.push(entry.fecha.toISOString().split('T')[0]);
      unavailableByRoom.set(entry.habitacionId, dates);
    }

    return habitaciones.map((hab) => ({
      habitacionId: hab.id,
      nombre: hab.nombre,
      tipo: hab.tipo,
      capacidad: hab.capacidad,
      disponible: !unavailableByRoom.has(hab.id),
      fechasNoDisponibles: unavailableByRoom.get(hab.id) ?? [],
    }));
  }

  async setDisponibilidad(
    hospedajeId: string,
    dto: SetDisponibilidadDto,
    userId: string,
    userRole?: string,
  ) {
    await this.verifyOwnership(hospedajeId, userId, userRole);

    const operations = dto.entries.map((entry) =>
      this.prisma.disponibilidadHospedaje.upsert({
        where: {
          habitacionId_fecha: {
            habitacionId: entry.habitacionId,
            fecha: new Date(entry.fecha),
          },
        },
        update: { disponible: entry.disponible },
        create: {
          habitacionId: entry.habitacionId,
          fecha: new Date(entry.fecha),
          disponible: entry.disponible,
        },
      }),
    );

    return this.prisma.$transaction(operations);
  }

  // ──────────────────────────── Helpers ────────────────────────────────────

  private async verifyOwnership(hospedajeId: string, userId: string, userRole?: string) {
    const hospedaje = await this.prisma.hospedaje.findUnique({
      where: { id: hospedajeId },
    });

    if (!hospedaje) {
      throw new NotFoundException(
        `Hospedaje con id ${hospedajeId} no encontrado`,
      );
    }

    if (userRole !== 'ADMIN' && hospedaje.proveedorId !== userId) {
      throw new ForbiddenException(
        'No tiene permisos para modificar este hospedaje',
      );
    }

    return hospedaje;
  }

  private async ensureHospedajeExists(hospedajeId: string) {
    const hospedaje = await this.prisma.hospedaje.findUnique({
      where: { id: hospedajeId },
    });
    if (!hospedaje) {
      throw new NotFoundException(
        `Hospedaje con id ${hospedajeId} no encontrado`,
      );
    }
    return hospedaje;
  }
}
