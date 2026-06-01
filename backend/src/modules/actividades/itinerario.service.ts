import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ItinerarioItemDto } from './dto/itinerario-item.dto';

@Injectable()
export class ItinerarioService {
  constructor(private readonly prisma: PrismaService) {}

  async listByActividad(actividadId: string) {
    const exists = await this.prisma.actividad.findUnique({ where: { id: actividadId } });
    if (!exists) throw new NotFoundException('Actividad no encontrada');
    return this.prisma.itinerarioActividad.findMany({
      where: { actividadId },
      orderBy: { dia: 'asc' },
    });
  }

  async replaceAll(
    actividadId: string,
    items: ItinerarioItemDto[],
    userId: string,
    userRole: string,
  ) {
    const actividad = await this.prisma.actividad.findUnique({ where: { id: actividadId } });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');

    if (userRole !== 'ADMIN' && actividad.proveedorId !== userId) {
      throw new ForbiddenException('No tienes permiso para editar el itinerario de esta actividad');
    }

    const dias = items.map((i) => i.dia);
    if (new Set(dias).size !== dias.length) {
      throw new BadRequestException('Días duplicados en el itinerario');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.itinerarioActividad.deleteMany({ where: { actividadId } });
      if (items.length === 0) return [];
      await tx.itinerarioActividad.createMany({
        data: items.map((i) => ({
          actividadId,
          dia: i.dia,
          titulo: i.titulo,
          descripcion: i.descripcion,
          lat: i.lat,
          lng: i.lng,
          nombreUbicacion: i.nombreUbicacion,
        })),
      });
      return tx.itinerarioActividad.findMany({
        where: { actividadId },
        orderBy: { dia: 'asc' },
      });
    });
  }
}
