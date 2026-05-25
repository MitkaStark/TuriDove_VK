import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class HospedajeItemDto {
  @ApiProperty({ description: 'ID del hospedaje' })
  @IsUUID()
  hospedajeId: string;

  @ApiProperty({ description: 'ID de la habitacion' })
  @IsUUID()
  habitacionId: string;

  @ApiProperty({ description: 'Fecha de entrada', example: '2026-05-01' })
  @IsDateString()
  fechaEntrada: string;

  @ApiProperty({ description: 'Fecha de salida', example: '2026-05-05' })
  @IsDateString()
  fechaSalida: string;

  @ApiProperty({ description: 'Numero de huespedes', minimum: 1 })
  @IsInt()
  @Min(1)
  huespedes: number;
}

export class ActividadItemDto {
  @ApiProperty({ description: 'ID de la actividad' })
  @IsUUID()
  actividadId: string;

  @ApiProperty({ description: 'Fecha de la actividad', example: '2026-05-02' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ description: 'Numero de adultos', minimum: 1 })
  @IsInt()
  @Min(1)
  adultos: number;

  @ApiProperty({ description: 'Numero de ninos', minimum: 0 })
  @IsInt()
  @Min(0)
  ninos: number;
}

export class TransferItemDto {
  @ApiProperty({ description: 'ID del transfer' })
  @IsUUID()
  transferId: string;

  @ApiProperty({ description: 'Fecha del transfer', example: '2026-05-01' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ description: 'Numero de pasajeros', minimum: 1 })
  @IsInt()
  @Min(1)
  pasajeros: number;
}

export class VehiculoItemDto {
  @ApiProperty({ description: 'ID del vehiculo' })
  @IsUUID()
  vehiculoId: string;

  @ApiProperty({ description: 'Fecha de inicio del alquiler', example: '2026-05-01' })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ description: 'Fecha de fin del alquiler', example: '2026-05-05' })
  @IsDateString()
  fechaFin: string;
}

export class CreateReservaDto {
  @ApiPropertyOptional({ description: 'Hospedajes a reservar', type: [HospedajeItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HospedajeItemDto)
  hospedajes?: HospedajeItemDto[];

  @ApiPropertyOptional({ description: 'Actividades a reservar', type: [ActividadItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActividadItemDto)
  actividades?: ActividadItemDto[];

  @ApiPropertyOptional({ description: 'Transfers a reservar', type: [TransferItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  transfers?: TransferItemDto[];

  @ApiPropertyOptional({ description: 'Vehiculos a reservar', type: [VehiculoItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehiculoItemDto)
  vehiculos?: VehiculoItemDto[];

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notas?: string;
}
