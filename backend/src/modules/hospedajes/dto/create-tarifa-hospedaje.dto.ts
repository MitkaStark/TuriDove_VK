import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTarifaHospedajeDto {
  @ApiProperty({ description: 'Nombre de la temporada', example: 'Alta' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  temporada: string;

  @ApiProperty({ description: 'Precio por noche', minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precioNoche: number;

  @ApiPropertyOptional({ description: 'Precio por persona extra', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  precioPersonaExtra?: number;

  @ApiPropertyOptional({ description: 'Moneda (ISO 4217)', example: 'USD', default: 'USD' })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  moneda?: string;

  @ApiProperty({ description: 'Fecha de inicio de la tarifa', example: '2026-01-01' })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ description: 'Fecha de fin de la tarifa', example: '2026-03-31' })
  @IsDateString()
  fechaFin: string;

  @ApiPropertyOptional({ description: 'ID de la habitacion (si aplica a una habitacion especifica)' })
  @IsString()
  @IsOptional()
  habitacionId?: string;
}
