import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaqueteDto } from './dto/create-paquete.dto';
import { UpdatePaqueteDto } from './dto/update-paquete.dto';

@Injectable()
export class PaquetesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    isFeatured?: boolean;
    limit?: number;
    page?: number;
  }) {
    const where: Prisma.PaqueteWhereInput = { isActive: true };
    if (params.search) {
      where.OR = [
        { nombre: { contains: params.search, mode: 'insensitive' } },
        { descripcion: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured;

    const limit = params.limit ?? 12;
    const page = params.page ?? 1;

    const [items, total] = await Promise.all([
      this.prisma.paquete.findMany({
        where,
        include: {
          hospedaje: true,
          habitacion: true,
          actividad: true,
          vehiculo: true,
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paquete.count({ where }),
    ]);

    const withPrice = await Promise.all(
      items.map(async (p) => ({
        ...p,
        precioDesde: await this.calcularPrecio(p.id),
      })),
    );

    return { items: withPrice, total, page, limit };
  }

  async findBySlug(slug: string) {
    const paquete = await this.prisma.paquete.findUnique({
      where: { slug },
      include: {
        hospedaje: true,
        habitacion: true,
        actividad: true,
        vehiculo: true,
      },
    });
    if (!paquete) throw new NotFoundException('Paquete no encontrado');
    return { ...paquete, precioDesde: await this.calcularPrecio(paquete.id) };
  }

  async findById(id: string) {
    const paquete = await this.prisma.paquete.findUnique({
      where: { id },
      include: {
        hospedaje: true,
        habitacion: true,
        actividad: true,
        vehiculo: true,
      },
    });
    if (!paquete) throw new NotFoundException('Paquete no encontrado');
    return { ...paquete, precioDesde: await this.calcularPrecio(paquete.id) };
  }

  async calcularPrecio(paqueteId: string, _fechaInicio?: Date): Promise<number> {
    const paquete = await this.prisma.paquete.findUnique({
      where: { id: paqueteId },
      include: {
        habitacion: {
          include: {
            tarifas: {
              where: { activo: true },
              orderBy: { precioNoche: 'asc' },
              take: 1,
            },
          },
        },
        actividad: {
          include: {
            tarifas: {
              where: { activo: true },
              orderBy: { precioAdulto: 'asc' },
              take: 1,
            },
          },
        },
        vehiculo: {
          include: {
            tarifas: {
              where: { activo: true },
              orderBy: { precioDia: 'asc' },
              take: 1,
            },
          },
        },
      },
    });
    if (!paquete) throw new NotFoundException('Paquete no encontrado');

    const precioHabitacion = paquete.habitacion?.tarifas?.[0]
      ? Number(paquete.habitacion.tarifas[0].precioNoche)
      : 0;

    const precioActividad = paquete.actividad?.tarifas?.[0]
      ? Number(paquete.actividad.tarifas[0].precioAdulto)
      : 0;

    const precioVehiculoDia = paquete.vehiculo?.tarifas?.[0]
      ? Number(paquete.vehiculo.tarifas[0].precioDia)
      : 0;

    const precioBase =
      precioHabitacion * paquete.noches +
      precioActividad +
      precioVehiculoDia * paquete.diasDuracion;

    const descuento = Number(paquete.descuentoPorcentaje ?? 0);
    const precioConDescuento = precioBase * (1 - descuento / 100);

    const margen = await this.getMargenPaquetes();
    const precioFinal = precioConDescuento * (1 + margen / 100);

    return Math.round(precioFinal * 100) / 100;
  }

  private async getMargenPaquetes(): Promise<number> {
    return 12;
  }

  async create(dto: CreatePaqueteDto, userId: string, userRole: string) {
    if (new Date(dto.validoHasta) <= new Date(dto.validoDesde)) {
      throw new BadRequestException('validoHasta debe ser posterior a validoDesde');
    }

    const habitacion = await this.prisma.habitacion.findUnique({
      where: { id: dto.habitacionId },
    });
    if (!habitacion) throw new BadRequestException('Habitación no existe');
    if (habitacion.hospedajeId !== dto.hospedajeId) {
      throw new BadRequestException('La habitación no pertenece al hospedaje');
    }

    const proveedorId = userRole === 'ADMIN' ? null : userId;
    if (proveedorId) {
      const hospedaje = await this.prisma.hospedaje.findUnique({
        where: { id: dto.hospedajeId },
      });
      if (hospedaje && hospedaje.proveedorId !== userId) {
        throw new ForbiddenException('No puedes usar un hospedaje que no es tuyo');
      }
    }

    return this.prisma.paquete.create({
      data: {
        nombre: dto.nombre,
        slug: dto.slug,
        descripcion: dto.descripcion,
        hospedajeId: dto.hospedajeId,
        habitacionId: dto.habitacionId,
        actividadId: dto.actividadId,
        vehiculoId: dto.vehiculoId,
        diasDuracion: dto.diasDuracion,
        noches: dto.noches,
        descuentoPorcentaje: dto.descuentoPorcentaje ?? 0,
        imagenPrincipal: dto.imagenPrincipal,
        isFeatured: dto.isFeatured ?? false,
        proveedorId,
        validoDesde: new Date(dto.validoDesde),
        validoHasta: new Date(dto.validoHasta),
      },
    });
  }

  async update(id: string, dto: UpdatePaqueteDto, userId: string, userRole: string) {
    const paquete = await this.prisma.paquete.findUnique({ where: { id } });
    if (!paquete) throw new NotFoundException('Paquete no encontrado');
    if (userRole !== 'ADMIN' && paquete.proveedorId !== userId) {
      throw new ForbiddenException('No puedes editar este paquete');
    }

    return this.prisma.paquete.update({
      where: { id },
      data: {
        ...dto,
        descuentoPorcentaje: dto.descuentoPorcentaje !== undefined
          ? dto.descuentoPorcentaje
          : undefined,
        validoDesde: dto.validoDesde ? new Date(dto.validoDesde) : undefined,
        validoHasta: dto.validoHasta ? new Date(dto.validoHasta) : undefined,
      },
    });
  }

  async softDelete(id: string, userId: string, userRole: string) {
    const paquete = await this.prisma.paquete.findUnique({ where: { id } });
    if (!paquete) throw new NotFoundException();
    if (userRole !== 'ADMIN' && paquete.proveedorId !== userId) {
      throw new ForbiddenException();
    }
    return this.prisma.paquete.update({ where: { id }, data: { isActive: false } });
  }
}
