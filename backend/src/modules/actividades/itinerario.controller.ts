import { Controller, Get, Put, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ItinerarioService } from './itinerario.service';
import { UpdateItinerarioDto } from './dto/update-itinerario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('actividades/itinerario')
@Controller('actividades/:actividadId/itinerario')
export class ItinerarioController {
  constructor(private readonly service: ItinerarioService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lista el itinerario de una actividad ordenado por día.' })
  list(@Param('actividadId') actividadId: string) {
    return this.service.listByActividad(actividadId);
  }

  @Put()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PROVEEDOR, Role.AGENCIA)
  @ApiOperation({ summary: 'Reemplaza el itinerario completo.' })
  replace(
    @Param('actividadId') actividadId: string,
    @Body() dto: UpdateItinerarioDto,
    @Req() req: any,
  ) {
    return this.service.replaceAll(actividadId, dto.items, req.user.id, req.user.role);
  }
}
