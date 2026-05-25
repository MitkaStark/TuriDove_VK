import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateHospedajeDto {
  @ApiProperty({ description: 'Nombre del hospedaje', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripcion del hospedaje' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Direccion fisica' })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({ description: 'Provincia' })
  @IsString()
  @IsOptional()
  provincia?: string;

  @ApiPropertyOptional({ description: 'Distrito' })
  @IsString()
  @IsOptional()
  distrito?: string;

  @ApiPropertyOptional({ description: 'Corregimiento' })
  @IsString()
  @IsOptional()
  corregimiento?: string;

  @ApiPropertyOptional({ description: 'Latitud GPS', minimum: -90, maximum: 90 })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitud?: number;

  @ApiPropertyOptional({ description: 'Longitud GPS', minimum: -180, maximum: 180 })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitud?: number;

  @ApiPropertyOptional({
    description: 'URLs de imagenes del hospedaje',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imagenes?: string[];

  @ApiPropertyOptional({ description: 'URL de la imagen principal' })
  @IsString()
  @IsOptional()
  imagenPrincipal?: string;

  @ApiPropertyOptional({
    description: 'Lista de amenidades',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenidades?: string[];

  @ApiPropertyOptional({ description: 'Politicas del hospedaje (JSON)' })
  @IsObject()
  @IsOptional()
  politicas?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Hora de check-in (HH:mm)', example: '14:00' })
  @IsString()
  @IsOptional()
  checkIn?: string;

  @ApiPropertyOptional({ description: 'Hora de check-out (HH:mm)', example: '11:00' })
  @IsString()
  @IsOptional()
  checkOut?: string;
}
