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
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { CreateTarifaTransferDto } from './dto/create-tarifa-transfer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Transfers')
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  // ─── TRANSFERS ──────────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar transfers (público, paginado)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tipo', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista paginada de transfers' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('tipo') tipo?: string,
    @Query('search') search?: string,
  ) {
    return this.transfersService.findAll({ page, limit, tipo, search });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Get('mis-transfers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar mis transfers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Mis transfers paginados' })
  findOwn(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.transfersService.findOwn(user.id, { page, limit });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un transfer con tarifas y vehículos' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Transfer encontrado' })
  @ApiResponse({ status: 404, description: 'Transfer no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transfersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear transfer' })
  @ApiResponse({ status: 201, description: 'Transfer creado' })
  create(@Body() dto: CreateTransferDto, @CurrentUser() user: any) {
    return this.transfersService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar transfer (propietario)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Transfer actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permiso' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransferDto,
    @CurrentUser() user: any,
  ) {
    return this.transfersService.update(id, user.id, dto, user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar transfer permanentemente' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Transfer eliminado' })
  @ApiResponse({ status: 403, description: 'Sin permiso' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.transfersService.remove(id, user.id, user.role);
  }

  // ─── TARIFAS ────────────────────────────────────────────────────────

  @Public()
  @Get(':id/tarifas')
  @ApiOperation({ summary: 'Listar tarifas de un transfer' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Tarifas del transfer' })
  findTarifas(@Param('id', ParseUUIDPipe) id: string) {
    return this.transfersService.findTarifas(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Post(':id/tarifas')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear tarifa para transfer' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Tarifa creada' })
  createTarifa(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTarifaTransferDto,
    @CurrentUser() user: any,
  ) {
    return this.transfersService.createTarifa(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Patch(':id/tarifas/:tarifaId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar tarifa de un transfer' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'tarifaId', type: String })
  @ApiResponse({ status: 200, description: 'Tarifa actualizada' })
  updateTarifa(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tarifaId', ParseUUIDPipe) tarifaId: string,
    @Body() dto: Partial<CreateTarifaTransferDto>,
    @CurrentUser() user: any,
  ) {
    return this.transfersService.updateTarifa(id, tarifaId, user.id, dto);
  }

  // ─── VEHICULOS ──────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Post(':id/vehiculos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Asignar vehículo a un transfer' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Vehículo asignado' })
  assignVehiculo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('vehiculoId') vehiculoId: string,
    @CurrentUser() user: any,
  ) {
    return this.transfersService.assignVehiculo(id, user.id, vehiculoId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Delete(':id/vehiculos/:vehiculoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desasignar vehículo de un transfer' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'vehiculoId', type: String })
  @ApiResponse({ status: 204, description: 'Vehículo desasignado' })
  unassignVehiculo(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('vehiculoId', ParseUUIDPipe) vehiculoId: string,
    @CurrentUser() user: any,
  ) {
    return this.transfersService.unassignVehiculo(id, user.id, vehiculoId);
  }
}
