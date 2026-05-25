import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../common/enums/role.enum';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  activo?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: PaginationParams = {}): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, role, activo } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (activo !== undefined) {
      where.activo = activo;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          telefono: true,
          role: true,
          activo: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: CreateUserDto & { role?: Role }) {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    // If password is already hashed (starts with $2a$ or $2b$), use as-is
    // Otherwise hash it (e.g. when admin creates user with plain password)
    const password = data.password.startsWith('$2a$') || data.password.startsWith('$2b$')
      ? data.password
      : await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password,
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono,
        role: data.role || Role.CLIENTE,
      },
    });
  }

  async update(id: string, data: UpdateUserDto) {
    const user = await this.findById(id);

    // Prevent deactivating ADMIN users
    if (data.activo === false && user.role === Role.ADMIN) {
      throw new ForbiddenException('No se puede desactivar un usuario administrador');
    }

    const updateData: any = { ...data };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (data.email) {
      const existing = await this.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new ConflictException('El email ya está en uso por otro usuario');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        role: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async softDelete(id: string) {
    const user = await this.findById(id);

    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('No se puede eliminar un usuario administrador');
    }

    return this.prisma.user.update({
      where: { id },
      data: { activo: false },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        activo: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.findById(id);

    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('No se puede eliminar un usuario administrador');
    }

    await this.prisma.user.delete({ where: { id } });

    return { message: 'Usuario eliminado permanentemente' };
  }

  async changeRole(id: string, role: Role) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        role: true,
      },
    });
  }
}
