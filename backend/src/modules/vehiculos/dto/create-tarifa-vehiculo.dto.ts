import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';

export enum Moneda {
  USD = 'USD',
  PAB = 'PAB',
}

export class CreateTarifaVehiculoDto {
  @ApiProperty({ example: 'Alta', description: 'Nombre de la temporada' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  temporada: string;

  @ApiProperty({ example: 85.0, description: 'Precio por día' })
  @IsNumber()
  @Min(0)
  precioDia: number;

  @ApiPropertyOptional({ example: 500.0, description: 'Precio por semana' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioSemana?: number;

  @ApiPropertyOptional({ example: 200.0, description: 'Depósito requerido' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deposito?: number;

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
