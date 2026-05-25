import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CheckDisponibilidadDto {
  @ApiProperty({ description: 'Fecha de inicio', example: '2026-04-10' })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ description: 'Fecha de fin', example: '2026-04-15' })
  @IsDateString()
  fechaFin: string;
}

export class DisponibilidadEntryDto {
  @ApiProperty({ description: 'ID de la habitacion' })
  @IsString()
  @IsNotEmpty()
  habitacionId: string;

  @ApiProperty({ description: 'Fecha', example: '2026-04-10' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ description: 'Si esta disponible o no' })
  @IsBoolean()
  disponible: boolean;
}

export class SetDisponibilidadDto {
  @ApiProperty({
    description: 'Lista de entradas de disponibilidad',
    type: [DisponibilidadEntryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisponibilidadEntryDto)
  entries: DisponibilidadEntryDto[];
}
