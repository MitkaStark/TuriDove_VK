import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';

export enum Temporada {
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAJA = 'BAJA',
}

export enum Moneda {
  USD = 'USD',
  PAB = 'PAB',
}

export class CreateTarifaActividadDto {
  @ApiProperty({ enum: Temporada, example: Temporada.ALTA })
  @IsEnum(Temporada)
  temporada: Temporada;

  @ApiProperty({ example: 45.0, description: 'Precio por adulto' })
  @IsNumber()
  @Min(0)
  precioAdulto: number;

  @ApiPropertyOptional({ example: 25.0, description: 'Precio por niño' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioNino?: number;

  @ApiPropertyOptional({ example: 150.0, description: 'Precio por grupo' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioGrupo?: number;

  @ApiPropertyOptional({ example: 5, description: 'Mínimo de personas para grupo' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minimoPersonas?: number;

  @ApiProperty({ enum: Moneda, example: Moneda.USD })
  @IsEnum(Moneda)
  moneda: Moneda;

  @ApiProperty({ example: '2026-01-01', description: 'Inicio vigencia' })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ example: '2026-03-31', description: 'Fin vigencia' })
  @IsDateString()
  fechaFin: string;
}
