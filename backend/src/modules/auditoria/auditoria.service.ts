import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface LogAuditoriaDto {
  entidad: string;
  entidadId: string;
  accion: string;
  datos?: any;
  userId: string;
  ip?: string;
}

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async log(dto: LogAuditoriaDto) {
    return this.prisma.auditLog.create({
      data: {
        entidad: dto.entidad,
        entidadId: dto.entidadId,
        accion: dto.accion,
        datos: dto.datos ?? undefined,
        userId: dto.userId,
        ip: dto.ip,
      },
    });
  }

  /**
   * Find all audit logs (ADMIN only, paginated, filterable)
   */
  async findAll(query: {
    page?: number;
    limit?: number;
    entidad?: string;
    accion?: string;
    userId?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.entidad) {
      where.entidad = query.entidad;
    }
    if (query.accion) {
      where.accion = query.accion;
    }
    if (query.userId) {
      where.userId = query.userId;
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, nombre: true, apellido: true, email: true, role: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
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

  /**
   * Find audit logs for a specific entity
   */
  async findByEntity(entidad: string, entidadId: string) {
    return this.prisma.auditLog.findMany({
      where: { entidad, entidadId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, nombre: true, apellido: true, email: true, role: true },
        },
      },
    });
  }
}
