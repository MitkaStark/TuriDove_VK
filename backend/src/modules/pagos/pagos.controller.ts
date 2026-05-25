import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PagosService } from './pagos.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Pagos')
@ApiBearerAuth('JWT-auth')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un pago' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePagoDto,
  ) {
    return this.pagosService.create(userId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OPERADOR)
  @ApiOperation({ summary: 'Listar todos los pagos (admin/operador)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.pagosService.findAll(pagination);
  }

  @Get('reserva/:reservaId')
  @ApiOperation({ summary: 'Obtener pagos de una reserva' })
  findByReserva(@Param('reservaId', ParseUUIDPipe) reservaId: string) {
    return this.pagosService.findByReserva(reservaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un pago' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagosService.findOne(id);
  }

  @Patch(':id/reembolso')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Procesar reembolso de un pago' })
  refund(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.pagosService.refund(id, userId);
  }
}
