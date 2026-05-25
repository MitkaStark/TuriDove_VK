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
import { ActividadesService } from './actividades.service';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { CreateTarifaActividadDto } from './dto/create-tarifa-actividad.dto';
import { CreateCalendarioDto } from './dto/create-calendario.dto';
import { CreatePaqueteDto } from './dto/create-paquete.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Actividades')
@Controller('actividades')
export class ActividadesController {
  constructor(private readonly actividadesService: ActividadesService) {}

  // ─── ACTIVIDADES ───────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar actividades (público, paginado)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tipo', required: false, type: String })
  @ApiQuery({ name: 'provincia', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'featured', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista paginada de actividades' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('tipo') tipo?: string,
    @Query('provincia') provincia?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
  ) {
    const isFeatured = featured === 'true' ? true : featured === 'false' ? false : undefined;
    return this.actividadesService.findAll({ page, limit, tipo, provincia, search, isFeatured });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Get('mis-actividades')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar mis actividades' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Mis actividades paginadas' })
  findMisActividades(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.actividadesService.findMisActividades(user, { page, limit });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener actividad con tarifas' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Detalle de la actividad' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.actividadesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear actividad' })
  @ApiResponse({ status: 201, description: 'Actividad creada' })
  create(@Body() dto: CreateActividadDto, @CurrentUser() user: any) {
    return this.actividadesService.create(dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar actividad (propietario)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Actividad actualizada' })
  @ApiResponse({ status: 403, description: 'Sin permiso' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActividadDto,
    @CurrentUser() user: any,
  ) {
    return this.actividadesService.update(id, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar actividad (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Actividad eliminada' })
  @ApiResponse({ status: 403, description: 'Sin permiso' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.actividadesService.remove(id, user);
  }

  // ─── TARIFAS ───────────────────────────────────────────────────────

  @Public()
  @Get(':id/tarifas')
  @ApiOperation({ summary: 'Listar tarifas de una actividad' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Tarifas de la actividad' })
  findTarifas(@Param('id', ParseUUIDPipe) id: string) {
    return this.actividadesService.findTarifas(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Post(':id/tarifas')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear tarifa para actividad' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Tarifa creada' })
  createTarifa(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTarifaActividadDto,
    @CurrentUser() user: any,
  ) {
    return this.actividadesService.createTarifa(id, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Patch(':id/tarifas/:tarifaId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar tarifa' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'tarifaId', type: String })
  @ApiResponse({ status: 200, description: 'Tarifa actualizada' })
  updateTarifa(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tarifaId', ParseUUIDPipe) tarifaId: string,
    @Body() dto: Partial<CreateTarifaActividadDto>,
    @CurrentUser() user: any,
  ) {
    return this.actividadesService.updateTarifa(id, tarifaId, dto, user);
  }

  // ─── CALENDARIO ────────────────────────────────────────────────────

  @Public()
  @Get(':id/calendario')
  @ApiOperation({ summary: 'Obtener calendario de disponibilidad' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'mes', required: true, type: Number })
  @ApiQuery({ name: 'anio', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Slots del calendario' })
  findCalendario(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('mes', ParseIntPipe) mes: number,
    @Query('anio', ParseIntPipe) anio: number,
  ) {
    return this.actividadesService.findCalendario(id, mes, anio);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Post(':id/calendario')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear slot de calendario' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Slot creado' })
  createCalendario(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCalendarioDto,
    @CurrentUser() user: any,
  ) {
    return this.actividadesService.createCalendario(id, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Patch(':id/calendario/:calId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar slot de calendario' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'calId', type: String })
  @ApiResponse({ status: 200, description: 'Slot actualizado' })
  updateCalendario(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('calId', ParseUUIDPipe) calId: string,
    @Body() dto: Partial<CreateCalendarioDto>,
    @CurrentUser() user: any,
  ) {
    return this.actividadesService.updateCalendario(id, calId, dto, user);
  }

  // ─── PAQUETES ──────────────────────────────────────────────────────

  @Public()
  @Get('paquetes')
  @ApiOperation({ summary: 'Listar paquetes de actividades (público)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de paquetes' })
  findPaquetes(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.actividadesService.findPaquetes({ page, limit });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Get('paquetes/mis-paquetes')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar mis paquetes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Mis paquetes paginados' })
  findMisPaquetes(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.actividadesService.findMisPaquetes(user, { page, limit });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Post('paquetes')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear paquete de actividades' })
  @ApiResponse({ status: 201, description: 'Paquete creado con descuento aplicado' })
  createPaquete(@Body() dto: CreatePaqueteDto, @CurrentUser() user: any) {
    return this.actividadesService.createPaquete(dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Patch('paquetes/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar paquete' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Paquete actualizado' })
  updatePaquete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreatePaqueteDto>,
    @CurrentUser() user: any,
  ) {
    return this.actividadesService.updatePaquete(id, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Delete('paquetes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar paquete (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Paquete eliminado' })
  deletePaquete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.actividadesService.deletePaquete(id, user);
  }
}
