import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TipoHabitacion {
  INDIVIDUAL = 'INDIVIDUAL',
  DOBLE = 'DOBLE',
  SUITE = 'SUITE',
  FAMILIAR = 'FAMILIAR',
  DORMITORIO = 'DORMITORIO',
  CABANA = 'CABANA',
}

export class CreateHabitacionDto {
  @ApiProperty({ description: 'Nombre de la habitacion', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @ApiProperty({
    description: 'Tipo de habitacion',
    enum: TipoHabitacion,
  })
  @IsEnum(TipoHabitacion)
  tipo: TipoHabitacion;

  @ApiProperty({ description: 'Capacidad maxima de huespedes', minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacidad: number;

  @ApiPropertyOptional({ description: 'Descripcion de la habitacion' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Amenidades de la habitacion',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenidades?: string[];

  @ApiPropertyOptional({
    description: 'URLs de imagenes de la habitacion',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imagenes?: string[];
}
