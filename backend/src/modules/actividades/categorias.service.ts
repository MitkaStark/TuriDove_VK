import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { slugify, ensureUniqueSlug } from '../../common/utils/slug.util';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(opts: { soloActivas?: boolean } = {}) {
    return this.prisma.categoriaActividad.findMany({
      where: opts.soloActivas ? { activo: true } : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const cat = await this.prisma.categoriaActividad.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }

  async create(dto: CreateCategoriaDto) {
    const baseSlug = slugify(dto.nombre);
    if (!baseSlug) throw new ConflictException('El nombre debe contener al menos una letra o número');

    const slug = await ensureUniqueSlug(baseSlug, async (s) => {
      const found = await this.prisma.categoriaActividad.findUnique({ where: { slug: s } });
      return !!found;
    });

    try {
      return await this.prisma.categoriaActividad.create({
        data: {
          nombre: dto.nombre,
          slug,
          icono: dto.icono,
          descripcion: dto.descripcion,
          activo: dto.activo ?? true,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateCategoriaDto) {
    await this.findOne(id);
    return this.prisma.categoriaActividad.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        icono: dto.icono,
        descripcion: dto.descripcion,
        activo: dto.activo,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const count = await this.prisma.actividad.count({ where: { categoriaId: id } });
    if (count > 0) {
      throw new ConflictException(
        `No se puede eliminar la categoría: tiene ${count} actividad(es) asociada(s). Desactívela en su lugar.`,
      );
    }
    await this.prisma.categoriaActividad.delete({ where: { id } });
    return { ok: true };
  }
}
