import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';

export enum Moneda {
  USD = 'USD',
  PAB = 'PAB',
}

export class CreateTarifaTransferDto {
  @ApiProperty({ example: 'Alta', description: 'Nombre de la temporada' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  temporada: string;

  @ApiProperty({ example: 25.0, description: 'Precio por persona' })
  @IsNumber()
  @Min(0)
  precioPorPersona: number;

  @ApiPropertyOptional({ example: 80.0, description: 'Precio por vehículo completo' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioVehiculo?: number;

  @ApiPropertyOptional({ example: 1, description: 'Mínimo de personas requeridas' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minimoPersonas?: number;

  @ApiProperty({ enum: Moneda, example: Moneda.USD })
  @IsEnum(Moneda)
  moneda: Moneda;

  @ApiProperty({ example: '2026-01-01', description: 'Inicio de vigencia' })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ example: '2026-12-31', description: 'Fin de vigencia' })
  @IsDateString()
  fechaFin: string;
}
