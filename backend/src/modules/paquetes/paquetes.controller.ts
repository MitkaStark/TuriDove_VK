import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaquetesService } from './paquetes.service';
import { CreatePaqueteDto } from './dto/create-paquete.dto';
import { UpdatePaqueteDto } from './dto/update-paquete.dto';
import { QueryPaqueteDto } from './dto/query-paquete.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Paquetes')
@Controller('paquetes')
export class PaquetesController {
  constructor(private readonly service: PaquetesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar paquetes (público, paginado)' })
  findAll(@Query() q: QueryPaqueteDto) {
    return this.service.findAll({
      search: q.search,
      isFeatured:
        q.featured === 'true' ? true : q.featured === 'false' ? false : undefined,
      limit: q.limit ? parseInt(q.limit, 10) : undefined,
      page: q.page ? parseInt(q.page, 10) : undefined,
    });
  }

  @Public()
  @Get('id/:id')
  @ApiOperation({ summary: 'Obtener paquete por ID' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Public()
  @Get(':slug/precio')
  @ApiOperation({ summary: 'Calcular precio de un paquete por slug' })
  precioBySlug(
    @Param('slug') slug: string,
    @Query('fechaInicio') fechaInicio?: string,
  ) {
    return this.service
      .findBySlug(slug)
      .then((p) =>
        this.service
          .calcularPrecio(p.id, fechaInicio ? new Date(fechaInicio) : undefined)
          .then((precio) => ({ precio })),
      );
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Obtener paquete por slug' })
  findOne(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROVEEDOR', 'AGENCIA')
  @ApiOperation({ summary: 'Crear paquete' })
  create(@Body() dto: CreatePaqueteDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id, user.role);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROVEEDOR', 'AGENCIA')
  @ApiOperation({ summary: 'Actualizar paquete' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePaqueteDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROVEEDOR', 'AGENCIA')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar paquete (soft delete)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.softDelete(id, user.id, user.role);
  }
}
