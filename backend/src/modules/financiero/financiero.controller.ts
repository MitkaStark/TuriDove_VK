import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinancieroService } from './financiero.service';
import { ReporteQueryDto } from './dto/reporte-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Financiero')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.OPERADOR)
@Controller('financiero')
export class FinancieroController {
  constructor(private readonly financieroService: FinancieroService) {}

  @Get('resumen')
  @ApiOperation({ summary: 'Obtener resumen financiero general' })
  getResumen(@Query() query: ReporteQueryDto) {
    return this.financieroService.getResumen(query);
  }

  @Get('ingresos/:year')
  @ApiOperation({ summary: 'Obtener ingresos mensuales por ano' })
  getIngresosPorMes(@Param('year', ParseIntPipe) year: number) {
    return this.financieroService.getIngresosPorMes(year);
  }

  @Get('proveedores')
  @ApiOperation({ summary: 'Obtener reporte de proveedores' })
  getReporteProveedores(@Query() query: ReporteQueryDto) {
    return this.financieroService.getReporteProveedores(query);
  }

  @Get('ocupacion')
  @ApiOperation({ summary: 'Obtener reporte de ocupacion' })
  getOcupacion(@Query() query: ReporteQueryDto) {
    return this.financieroService.getOcupacion(query);
  }
}
