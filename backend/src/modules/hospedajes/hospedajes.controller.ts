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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { HospedajesService } from './hospedajes.service';
import { CreateHospedajeDto } from './dto/create-hospedaje.dto';
import { UpdateHospedajeDto } from './dto/update-hospedaje.dto';
import { CreateHabitacionDto } from './dto/create-habitacion.dto';
import { CreateTarifaHospedajeDto } from './dto/create-tarifa-hospedaje.dto';
import { SetDisponibilidadDto } from './dto/disponibilidad.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Hospedajes')
@Controller('hospedajes')
export class HospedajesController {
  constructor(private readonly hospedajesService: HospedajesService) {}

  // ──────────────────────────── Hospedajes ─────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar todos los hospedajes (publico, paginado)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'provincia', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'featured', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('provincia') provincia?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
  ) {
    const isFeatured = featured === 'true' ? true : featured === 'false' ? false : undefined;
    return this.hospedajesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      provincia,
      search,
      isFeatured,
    });
  }

  @UseGuards(RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Get('mis-hospedajes')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar mis hospedajes (proveedor/agencia)' })
  findMyHospedajes(@Request() req: any) {
    return this.hospedajesService.findByProveedor(req.user.id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener hospedaje por ID con habitaciones y tarifas' })
  @ApiParam({ name: 'id', description: 'ID del hospedaje' })
  findById(@Param('id') id: string) {
    return this.hospedajesService.findById(id);
  }

  @UseGuards(RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear hospedaje (proveedor/agencia/admin)' })
  create(@Body() dto: CreateHospedajeDto, @Request() req: any) {
    return this.hospedajesService.create(dto, req.user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar hospedaje (propietario o admin)' })
  @ApiParam({ name: 'id', description: 'ID del hospedaje' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHospedajeDto,
    @Request() req: any,
  ) {
    return this.hospedajesService.update(id, dto, req.user.id, req.user.role);
  }

  @UseGuards(RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Desactivar hospedaje (propietario o admin)' })
  @ApiParam({ name: 'id', description: 'ID del hospedaje' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.hospedajesService.remove(id, req.user.id, req.user.role);
  }

  // ──────────────────────────── Habitaciones ───────────────────────────────

  @Public()
  @Get(':id/habitaciones')
  @ApiOperation({ summary: 'Listar habitaciones de un hospedaje' })
  @ApiParam({ name: 'id', description: 'ID del hospedaje' })
  findHabitaciones(@Param('id') id: string) {
    return this.hospedajesService.findHabitaciones(id);
  }

  @UseGuards(RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Post(':id/habitaciones')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear habitacion (propietario)' })
  @ApiParam({ name: 'id', description: 'ID del hospedaje' })
  createHabitacion(
    @Param('id') id: string,
    @Body() dto: CreateHabitacionDto,
    @Request() req: any,
  ) {
    return this.hospedajesService.createHabitacion(id, dto, req.user.id, req.user.role);
  }

  @UseGuards(RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Patch(':hospedajeId/habitaciones/:habId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar habitacion (propietario o admin)' })
  @ApiParam({ name: 'hospedajeId', description: 'ID del hospedaje' })
  @ApiParam({ name: 'habId', description: 'ID de la habitacion' })
  updateHabitacion(
    @Param('hospedajeId') hospedajeId: string,
    @Param('habId') habId: string,
    @Body() dto: CreateHabitacionDto,
    @Request() req: any,
  ) {
    return this.hospedajesService.updateHabitacion(
      hospedajeId,
      habId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Delete(':hospedajeId/habitaciones/:habId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar habitacion (propietario o admin)' })
  @ApiParam({ name: 'hospedajeId', description: 'ID del hospedaje' })
  @ApiParam({ name: 'habId', description: 'ID de la habitacion' })
  deleteHabitacion(
    @Param('hospedajeId') hospedajeId: string,
    @Param('habId') habId: string,
    @Request() req: any,
  ) {
    return this.hospedajesService.deleteHabitacion(
      hospedajeId,
      habId,
      req.user.id,
      req.user.role,
    );
  }

  // ──────────────────────────── Tarifas ────────────────────────────────────

  @Public()
  @Get(':id/tarifas')
  @ApiOperation({ summary: 'Listar tarifas de un hospedaje' })
  @ApiParam({ name: 'id', description: 'ID del hospedaje' })
  findTarifas(@Param('id') id: string) {
    return this.hospedajesService.findTarifas(id);
  }

  @UseGuards(RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Post(':id/tarifas')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear tarifa (propietario)' })
  @ApiParam({ name: 'id', description: 'ID del hospedaje' })
  createTarifa(
    @Param('id') id: string,
    @Body() dto: CreateTarifaHospedajeDto,
    @Request() req: any,
  ) {
    return this.hospedajesService.createTarifa(id, dto, req.user.id, req.user.role);
  }

  @UseGuards(RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Patch(':id/tarifas/:tarifaId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar tarifa (propietario o admin)' })
  @ApiParam({ name: 'id', description: 'ID del hospedaje' })
  @ApiParam({ name: 'tarifaId', description: 'ID de la tarifa' })
  updateTarifa(
    @Param('id') id: string,
    @Param('tarifaId') tarifaId: string,
    @Body() dto: CreateTarifaHospedajeDto,
    @Request() req: any,
  ) {
    return this.hospedajesService.updateTarifa(
      id,
      tarifaId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  // ──────────────────────────── Disponibilidad ─────────────────────────────

  @Public()
  @Get(':id/disponibilidad')
  @ApiOperation({ summary: 'Consultar disponibilidad de habitaciones' })
  @ApiParam({ name: 'id', description: 'ID del hospedaje' })
  @ApiQuery({ name: 'fechaInicio', required: true, type: String })
  @ApiQuery({ name: 'fechaFin', required: true, type: String })
  checkDisponibilidad(
    @Param('id') id: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.hospedajesService.checkDisponibilidad(id, fechaInicio, fechaFin);
  }

  @UseGuards(RolesGuard)
  @Roles('PROVEEDOR', 'AGENCIA', 'ADMIN')
  @Post(':id/disponibilidad')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Establecer disponibilidad (propietario)' })
  @ApiParam({ name: 'id', description: 'ID del hospedaje' })
  setDisponibilidad(
    @Param('id') id: string,
    @Body() dto: SetDisponibilidadDto,
    @Request() req: any,
  ) {
    return this.hospedajesService.setDisponibilidad(id, dto, req.user.id, req.user.role);
  }
}
