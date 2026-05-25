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
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { CreateTarifaVehiculoDto } from './dto/create-tarifa-vehiculo.dto';
import { DisponibilidadVehiculoDto } from './dto/disponibilidad-vehiculo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Vehiculos')
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  // ─── VEHICULOS ──────────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar vehículos (público, paginado)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tipo', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'featured', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista paginada de vehículos' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('tipo') tipo?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
  ) {
    const isFeatured = featured === 'true' ? true : featured === 'false' ? false : undefined;
    return this.vehiculosService.findAll({ page, limit, tipo, search, isFeatured });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Get('mis-vehiculos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar mis vehículos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Mis vehículos paginados' })
  findOwn(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.vehiculosService.findOwn(user.id, { page, limit });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un vehículo con tarifas' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Vehículo encontrado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiculosService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear vehículo' })
  @ApiResponse({ status: 201, description: 'Vehículo creado' })
  create(@Body() dto: CreateVehiculoDto, @CurrentUser() user: any) {
    return this.vehiculosService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar vehículo (propietario)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Vehículo actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permiso' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehiculoDto,
    @CurrentUser() user: any,
  ) {
    return this.vehiculosService.update(id, user.id, dto, user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar vehiculo permanentemente' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Vehiculo eliminado' })
  @ApiResponse({ status: 403, description: 'Sin permiso' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.vehiculosService.remove(id, user.id, user.role);
  }

  // ─── TARIFAS ────────────────────────────────────────────────────────

  @Public()
  @Get(':id/tarifas')
  @ApiOperation({ summary: 'Listar tarifas de un vehículo' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Tarifas del vehículo' })
  findTarifas(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiculosService.findTarifas(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Post(':id/tarifas')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear tarifa para vehículo' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Tarifa creada' })
  createTarifa(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTarifaVehiculoDto,
    @CurrentUser() user: any,
  ) {
    return this.vehiculosService.createTarifa(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Patch(':id/tarifas/:tarifaId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar tarifa de un vehículo' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'tarifaId', type: String })
  @ApiResponse({ status: 200, description: 'Tarifa actualizada' })
  updateTarifa(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tarifaId', ParseUUIDPipe) tarifaId: string,
    @Body() dto: Partial<CreateTarifaVehiculoDto>,
    @CurrentUser() user: any,
  ) {
    return this.vehiculosService.updateTarifa(id, tarifaId, user.id, dto);
  }

  // ─── DISPONIBILIDAD ────────────────────────────────────────────────

  @Public()
  @Get(':id/disponibilidad')
  @ApiOperation({ summary: 'Consultar disponibilidad de un vehículo' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'fechaInicio', required: true, type: String })
  @ApiQuery({ name: 'fechaFin', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Disponibilidad del vehículo' })
  checkDisponibilidad(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.vehiculosService.checkDisponibilidad(id, fechaInicio, fechaFin);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Post(':id/disponibilidad')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Establecer disponibilidad de un vehículo' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Disponibilidad registrada' })
  setDisponibilidad(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisponibilidadVehiculoDto,
    @CurrentUser() user: any,
  ) {
    return this.vehiculosService.setDisponibilidad(id, user.id, dto);
  }
}
