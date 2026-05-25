import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { CreateTarifaActividadDto } from './dto/create-tarifa-actividad.dto';
import { CreateCalendarioDto } from './dto/create-calendario.dto';
import { CreatePaqueteDto } from './dto/create-paquete.dto';

interface PaginationParams {
  page?: number;
  limit?: number;
  tipo?: string;
  provincia?: string;
  search?: string;
}

interface AuthUser {
  id: string;
  role: string;
}

@Injectable()
export class ActividadesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── ACTIVIDADES CRUD ──────────────────────────────────────────────

  async findAll(params: PaginationParams) {
    const { page = 1, limit = 10, tipo, provincia, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (tipo) {
      where.tipo = tipo;
    }
    if (provincia) {
      where.provincia = { contains: provincia, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { ubicacion: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.actividad.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tarifas: {
            where: { fechaFin: { gte: new Date() } },
            orderBy: { precioAdulto: 'asc' },
            take: 1,
          },
        },
      }),
      this.prisma.actividad.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findMisActividades(user: AuthUser, params: PaginationParams) {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where: any = { proveedorId: user.id };

    const [data, total] = await Promise.all([
      this.prisma.actividad.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tarifas: true,
          calendarios: {
            where: { fecha: { gte: new Date() } },
            orderBy: { fecha: 'asc' },
            take: 5,
          },
        },
      }),
      this.prisma.actividad.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const actividad = await this.prisma.actividad.findUnique({
      where: { id },
      include: {
        tarifas: { orderBy: { temporada: 'asc' } },
        calendarios: {
          where: { fecha: { gte: new Date() } },
          orderBy: { fecha: 'asc' },
        },
      },
    });

    if (!actividad) {
      throw new NotFoundException(`Actividad con ID ${id} no encontrada`);
    }

    return actividad;
  }

  async create(dto: CreateActividadDto, user: AuthUser) {
    return this.prisma.actividad.create({
      data: ({
        ...dto as any,
        proveedorId: user.id,
        activo: true,
      }) as any,
    });
  }

  async update(id: string, dto: UpdateActividadDto, user: AuthUser) {
    await this.findOneAndVerifyOwnership(id, user);

    return this.prisma.actividad.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string, user: AuthUser) {
    await this.findOneAndVerifyOwnership(id, user);

    await this.prisma.actividad.delete({ where: { id } });
    return { message: 'Actividad eliminada permanentemente' };
  }

  // ─── TARIFAS ───────────────────────────────────────────────────────

  async findTarifas(actividadId: string) {
    await this.ensureActividadExists(actividadId);

    return this.prisma.tarifaActividad.findMany({
      where: { actividadId },
      orderBy: { temporada: 'asc' },
    });
  }

  async createTarifa(
    actividadId: string,
    dto: CreateTarifaActividadDto,
    user: AuthUser,
  ) {
    await this.findOneAndVerifyOwnership(actividadId, user);

    if (new Date(dto.fechaFin) <= new Date(dto.fechaInicio)) {
      throw new BadRequestException('fechaFin debe ser posterior a fechaInicio');
    }

    return this.prisma.tarifaActividad.create({
      data: ({
        ...dto,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: new Date(dto.fechaFin),
        actividadId,
      }) as any,
    });
  }

  async updateTarifa(
    actividadId: string,
    tarifaId: string,
    dto: Partial<CreateTarifaActividadDto>,
    user: AuthUser,
  ) {
    await this.findOneAndVerifyOwnership(actividadId, user);

    const tarifa = await this.prisma.tarifaActividad.findFirst({
      where: { id: tarifaId, actividadId },
    });

    if (!tarifa) {
      throw new NotFoundException(`Tarifa con ID ${tarifaId} no encontrada`);
    }

    const updateData: any = { ...dto };
    if (dto.fechaInicio) updateData.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) updateData.fechaFin = new Date(dto.fechaFin);

    return this.prisma.tarifaActividad.update({
      where: { id: tarifaId },
      data: updateData,
    });
  }

  // ─── CALENDARIO ────────────────────────────────────────────────────

  async findCalendario(actividadId: string, mes: number, anio: number) {
    await this.ensureActividadExists(actividadId);

    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59);

    return this.prisma.calendarioActividad.findMany({
      where: {
        actividadId,
        fecha: { gte: fechaInicio, lte: fechaFin },
      },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
    });
  }

  async createCalendario(
    actividadId: string,
    dto: CreateCalendarioDto,
    user: AuthUser,
  ) {
    await this.findOneAndVerifyOwnership(actividadId, user);

    if (dto.horaFin <= dto.horaInicio) {
      throw new BadRequestException('horaFin debe ser posterior a horaInicio');
    }

    return this.prisma.calendarioActividad.create({
      data: ({
        actividadId,
        fecha: new Date(dto.fecha),
        horaInicio: dto.horaInicio,
        horaFin: dto.horaFin,
        cuposDisponibles: dto.cuposDisponibles,
      }) as any,
    });
  }

  async updateCalendario(
    actividadId: string,
    calId: string,
    dto: Partial<CreateCalendarioDto>,
    user: AuthUser,
  ) {
    await this.findOneAndVerifyOwnership(actividadId, user);

    const slot = await this.prisma.calendarioActividad.findFirst({
      where: { id: calId, actividadId },
    });

    if (!slot) {
      throw new NotFoundException(`Slot de calendario con ID ${calId} no encontrado`);
    }

    const updateData: any = { ...dto };
    if (dto.fecha) updateData.fecha = new Date(dto.fecha);

    return this.prisma.calendarioActividad.update({
      where: { id: calId },
      data: updateData,
    });
  }

  // ─── PAQUETES ──────────────────────────────────────────────────────

  async findPaquetes(params: PaginationParams) {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where: any = { activo: true };

    const [data, total] = await Promise.all([
      this.prisma.paqueteActividad.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actividades: true,
        },
      }),
      this.prisma.paqueteActividad.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findMisPaquetes(user: AuthUser, params: PaginationParams) {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where: any = { proveedorId: user.id };

    const [data, total] = await Promise.all([
      this.prisma.paqueteActividad.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { actividades: true },
      }),
      this.prisma.paqueteActividad.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createPaquete(dto: CreatePaqueteDto, user: AuthUser) {
    return this.prisma.paqueteActividad.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        descuento: dto.descuento,
        proveedorId: user.id,
        activo: true,
        actividades: {
          connect: dto.actividadIds.map((id) => ({ id })),
        },
      } as any,
      include: { actividades: true },
    });
  }

  async updatePaquete(
    id: string,
    dto: Partial<CreatePaqueteDto>,
    user: AuthUser,
  ) {
    const paquete = await this.prisma.paqueteActividad.findUnique({
      where: { id },
    });

    if (!paquete) {
      throw new NotFoundException(`Paquete con ID ${id} no encontrado`);
    }

    if (user.role !== 'ADMIN' && paquete.proveedorId !== user.id) {
      throw new ForbiddenException('No tienes permiso para editar este paquete');
    }

    const updateData: any = {};
    if (dto.nombre) updateData.nombre = dto.nombre;
    if (dto.descripcion) updateData.descripcion = dto.descripcion;
    if (dto.descuento !== undefined) updateData.descuento = dto.descuento;

    if (dto.actividadIds) {
      updateData.actividades = {
        set: dto.actividadIds.map((actId) => ({ id: actId })),
      };
    }

    return this.prisma.paqueteActividad.update({
      where: { id },
      data: updateData,
      include: { actividades: true },
    });
  }

  async deletePaquete(id: string, user: AuthUser) {
    const paquete = await this.prisma.paqueteActividad.findUnique({
      where: { id },
    });

    if (!paquete) {
      throw new NotFoundException(`Paquete con ID ${id} no encontrado`);
    }

    if (user.role !== 'ADMIN' && paquete.proveedorId !== user.id) {
      throw new ForbiddenException('No tienes permiso para eliminar este paquete');
    }

    return this.prisma.paqueteActividad.update({
      where: { id },
      data: { activo: false },
    });
  }

  // ─── HELPERS ───────────────────────────────────────────────────────

  private async findOneAndVerifyOwnership(id: string, user: AuthUser) {
    const actividad = await this.prisma.actividad.findUnique({
      where: { id },
    });

    if (!actividad) {
      throw new NotFoundException(`Actividad con ID ${id} no encontrada`);
    }

    if (user.role !== 'ADMIN' && actividad.proveedorId !== user.id) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta actividad',
      );
    }

    return actividad;
  }

  private async ensureActividadExists(id: string) {
    const actividad = await this.prisma.actividad.findUnique({
      where: { id },
    });

    if (!actividad) {
      throw new NotFoundException(`Actividad con ID ${id} no encontrada`);
    }

    return actividad;
  }
}
