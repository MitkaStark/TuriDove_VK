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
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Reservas')
@ApiBearerAuth('JWT-auth')
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva reserva' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReservaDto,
  ) {
    return this.reservasService.create(userId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OPERADOR)
  @ApiOperation({ summary: 'Listar todas las reservas (admin/operador)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.reservasService.findAll(pagination);
  }

  @Get('mis-reservas')
  @ApiOperation({ summary: 'Listar mis reservas (cliente: sus reservas, proveedor: reservas de sus recursos)' })
  findMyReservas(
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto,
  ) {
    if (user.role === Role.PROVEEDOR || user.role === Role.AGENCIA) {
      return this.reservasService.findByProveedor(user.id, pagination);
    }
    return this.reservasService.findByUser(user.id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una reserva' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservasService.findOne(id);
  }

  @Patch(':id/estado')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OPERADOR)
  @ApiOperation({ summary: 'Actualizar estado de una reserva' })
  updateEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEstadoDto,
  ) {
    return this.reservasService.updateEstado(id, dto);
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar una reserva' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reservasService.cancel(id, userId);
  }
}
