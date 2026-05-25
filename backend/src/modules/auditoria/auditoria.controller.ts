import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Auditoria')
@ApiBearerAuth()
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Listar logs de auditoria (solo ADMIN, paginado, filtrable)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Pagina' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Elementos por pagina' })
  @ApiQuery({ name: 'entidad', required: false, type: String, description: 'Filtrar por entidad' })
  @ApiQuery({ name: 'accion', required: false, type: String, description: 'Filtrar por accion' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filtrar por usuario' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('entidad') entidad?: string,
    @Query('accion') accion?: string,
    @Query('userId') userId?: string,
  ) {
    return this.auditoriaService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      entidad,
      accion,
      userId,
    });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':entidad/:entidadId')
  @ApiOperation({ summary: 'Obtener logs de una entidad especifica' })
  @ApiParam({ name: 'entidad', description: 'Nombre de la entidad (ej: Reserva, Pago)' })
  @ApiParam({ name: 'entidadId', description: 'ID de la entidad' })
  findByEntity(
    @Param('entidad') entidad: string,
    @Param('entidadId') entidadId: string,
  ) {
    return this.auditoriaService.findByEntity(entidad, entidadId);
  }
}
