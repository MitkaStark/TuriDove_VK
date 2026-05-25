import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { CreateTarifaVehiculoDto } from './dto/create-tarifa-vehiculo.dto';
import { DisponibilidadVehiculoDto } from './dto/disponibilidad-vehiculo.dto';

@Injectable()
export class VehiculosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; tipo?: string; search?: string; isFeatured?: boolean }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.tipo) {
      where.tipo = query.tipo;
    }
    if (query.search) {
      where.OR = [
        { marca: { contains: query.search, mode: 'insensitive' } },
        { modelo: { contains: query.search, mode: 'insensitive' } },
        { placa: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    const [data, total] = await Promise.all([
      this.prisma.vehiculo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          proveedor: { select: { id: true, nombre: true, email: true } },
        },
      }),
      this.prisma.vehiculo.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOwn(userId: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where = { proveedorId: userId };

    const [data, total] = await Promise.all([
      this.prisma.vehiculo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tarifas: true,
          disponibilidades: true,
        },
      }),
      this.prisma.vehiculo.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id },
      include: {
        proveedor: { select: { id: true, nombre: true, email: true } },
        tarifas: true,
        disponibilidades: true,
      },
    });

    if (!vehiculo) {
      throw new NotFoundException(`Vehiculo con ID ${id} no encontrado`);
    }

    return vehiculo;
  }

  async create(userId: string, dto: CreateVehiculoDto) {
    try {
      return await this.prisma.vehiculo.create({
        data: {
          ...dto,
          proveedorId: userId,
        } as any,
      });
    } catch (e: any) {
      if (e?.code === 'P2002' && e?.meta?.target?.includes?.('placa')) {
        throw new ConflictException(`La placa "${dto.placa}" ya está registrada`);
      }
      throw e;
    }
  }

  async update(id: string, userId: string, dto: UpdateVehiculoDto, userRole?: string) {
    if (userRole !== 'ADMIN') {
      await this.ensureOwnership(id, userId);
    }

    try {
      return await this.prisma.vehiculo.update({
        where: { id },
        data: dto as any,
      });
    } catch (e: any) {
      if (e?.code === 'P2002' && e?.meta?.target?.includes?.('placa')) {
        throw new ConflictException(`La placa "${dto.placa}" ya está registrada`);
      }
      throw e;
    }
  }

  async remove(id: string, userId: string, userRole?: string) {
    if (userRole !== 'ADMIN') {
      await this.ensureOwnership(id, userId);
    }

    await this.prisma.vehiculo.delete({ where: { id } });
    return { message: 'Vehiculo eliminado permanentemente' };
  }

  // --- Tarifas ---

  async findTarifas(vehiculoId: string) {
    await this.findOne(vehiculoId);

    return this.prisma.tarifaVehiculo.findMany({
      where: { vehiculoId },
      orderBy: { fechaInicio: 'asc' },
    });
  }

  async createTarifa(vehiculoId: string, userId: string, dto: CreateTarifaVehiculoDto) {
    await this.ensureOwnership(vehiculoId, userId);

    return this.prisma.tarifaVehiculo.create({
      data: {
        ...dto,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: new Date(dto.fechaFin),
        vehiculoId,
      } as any,
    });
  }

  async updateTarifa(
    vehiculoId: string,
    tarifaId: string,
    userId: string,
    dto: Partial<CreateTarifaVehiculoDto>,
  ) {
    await this.ensureOwnership(vehiculoId, userId);

    const tarifa = await this.prisma.tarifaVehiculo.findFirst({
      where: { id: tarifaId, vehiculoId },
    });

    if (!tarifa) {
      throw new NotFoundException(`Tarifa con ID ${tarifaId} no encontrada`);
    }

    const updateData: any = { ...dto };
    if (dto.fechaInicio) updateData.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) updateData.fechaFin = new Date(dto.fechaFin);

    return this.prisma.tarifaVehiculo.update({
      where: { id: tarifaId },
      data: updateData,
    });
  }

  // --- Disponibilidad ---

  async checkDisponibilidad(vehiculoId: string, fechaInicio: string, fechaFin: string) {
    await this.findOne(vehiculoId);

    const bloques = await this.prisma.disponibilidadVehiculo.findMany({
      where: {
        vehiculoId,
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        },
      },
      orderBy: { fecha: 'asc' },
    });

    const noDisponible = bloques.some((b) => !b.disponible);

    return {
      vehiculoId,
      fechaInicio,
      fechaFin,
      disponible: !noDisponible,
      bloques,
    };
  }

  async setDisponibilidad(vehiculoId: string, userId: string, dto: DisponibilidadVehiculoDto) {
    await this.ensureOwnership(vehiculoId, userId);

    return this.prisma.disponibilidadVehiculo.upsert({
      where: {
        vehiculoId_fecha: {
          vehiculoId,
          fecha: new Date(dto.fecha),
        },
      },
      update: {
        disponible: dto.disponible,
        notas: dto.notas,
      },
      create: {
        vehiculoId,
        fecha: new Date(dto.fecha),
        disponible: dto.disponible,
        notas: dto.notas,
      },
    });
  }

  // --- Helpers ---

  private async ensureOwnership(vehiculoId: string, userId: string) {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id: vehiculoId },
    });

    if (!vehiculo) {
      throw new NotFoundException(`Vehiculo con ID ${vehiculoId} no encontrado`);
    }

    if (vehiculo.proveedorId !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar este vehiculo');
    }

    return vehiculo;
  }
}
