import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { CreateTarifaTransferDto } from './dto/create-tarifa-transfer.dto';

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; tipo?: string; search?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.tipo) {
      where.tipo = query.tipo;
    }
    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        { origen: { contains: query.search, mode: 'insensitive' } },
        { destino: { contains: query.search, mode: 'insensitive' } },
        { descripcion: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.transfer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          proveedor: { select: { id: true, nombre: true, email: true } },
        },
      }),
      this.prisma.transfer.count({ where }),
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
      this.prisma.transfer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tarifas: true,
          vehiculoTransfers: { include: { vehiculo: true } },
        },
      }),
      this.prisma.transfer.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: {
        proveedor: { select: { id: true, nombre: true, email: true } },
        tarifas: true,
        vehiculoTransfers: { include: { vehiculo: true } },
      },
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer con ID ${id} no encontrado`);
    }

    return transfer;
  }

  async create(userId: string, dto: CreateTransferDto) {
    return this.prisma.transfer.create({
      data: {
        ...dto,
        proveedorId: userId,
      } as any,
    });
  }

  async update(id: string, userId: string, dto: UpdateTransferDto, userRole?: string) {
    if (userRole !== 'ADMIN') {
      await this.ensureOwnership(id, userId);
    }

    return this.prisma.transfer.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string, userId: string, userRole?: string) {
    if (userRole !== 'ADMIN') {
      await this.ensureOwnership(id, userId);
    }

    await this.prisma.transfer.delete({ where: { id } });
    return { message: 'Transfer eliminado permanentemente' };
  }

  // --- Tarifas ---

  async findTarifas(transferId: string) {
    await this.findOne(transferId);

    return this.prisma.tarifaTransfer.findMany({
      where: { transferId },
      orderBy: { fechaInicio: 'asc' },
    });
  }

  async createTarifa(transferId: string, userId: string, dto: CreateTarifaTransferDto) {
    await this.ensureOwnership(transferId, userId);

    return this.prisma.tarifaTransfer.create({
      data: {
        ...dto,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: new Date(dto.fechaFin),
        transferId,
      } as any,
    });
  }

  async updateTarifa(
    transferId: string,
    tarifaId: string,
    userId: string,
    dto: Partial<CreateTarifaTransferDto>,
  ) {
    await this.ensureOwnership(transferId, userId);

    const tarifa = await this.prisma.tarifaTransfer.findFirst({
      where: { id: tarifaId, transferId },
    });

    if (!tarifa) {
      throw new NotFoundException(`Tarifa con ID ${tarifaId} no encontrada`);
    }

    const updateData: any = { ...dto };
    if (dto.fechaInicio) updateData.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) updateData.fechaFin = new Date(dto.fechaFin);

    return this.prisma.tarifaTransfer.update({
      where: { id: tarifaId },
      data: updateData,
    });
  }

  // --- Vehicles ---

  async assignVehiculo(transferId: string, userId: string, vehiculoId: string) {
    await this.ensureOwnership(transferId, userId);

    return this.prisma.vehiculoTransfer.create({
      data: {
        transferId,
        vehiculoId,
      },
    });
  }

  async unassignVehiculo(transferId: string, userId: string, vehiculoId: string) {
    await this.ensureOwnership(transferId, userId);

    const relation = await this.prisma.vehiculoTransfer.findFirst({
      where: { transferId, vehiculoId },
    });

    if (!relation) {
      throw new NotFoundException(
        `Vehiculo ${vehiculoId} no esta asignado al transfer ${transferId}`,
      );
    }

    return this.prisma.vehiculoTransfer.delete({
      where: { id: relation.id },
    });
  }

  // --- Helpers ---

  private async ensureOwnership(transferId: string, userId: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: transferId },
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer con ID ${transferId} no encontrado`);
    }

    if (transfer.proveedorId !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar este transfer');
    }

    return transfer;
  }
}
