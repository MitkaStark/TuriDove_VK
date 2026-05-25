import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export enum TipoActividad {
  TOUR = 'TOUR',
  AVENTURA = 'AVENTURA',
  CULTURAL = 'CULTURAL',
  GASTRONOMICA = 'GASTRONOMICA',
  NATURALEZA = 'NATURALEZA',
  DEPORTIVA = 'DEPORTIVA',
  EDUCATIVA = 'EDUCATIVA',
  OTRO = 'OTRO',
}

export class CreateActividadDto {
  @ApiProperty({ example: 'Tour por cafetales orgánicos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ example: 'Recorrido guiado por las plantaciones de café...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  descripcion: string;

  @ApiProperty({ enum: TipoActividad, example: TipoActividad.NATURALEZA })
  @IsEnum(TipoActividad)
  tipo: TipoActividad;

  @ApiProperty({ example: 3, description: 'Duración en horas' })
  @IsNumber()
  @Min(0.5)
  @Max(72)
  duracionHoras: number;

  @ApiProperty({ example: 'Finca La Aurora, Boquete' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  ubicacion: string;

  @ApiProperty({ example: 'Chiriquí' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  provincia: string;

  @ApiProperty({ example: 'Boquete' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  distrito: string;

  @ApiPropertyOptional({ example: ['https://storage.example.com/img1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];

  @ApiPropertyOptional({ example: ['Guía bilingüe', 'Degustación de café'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  incluye?: string[];

  @ApiPropertyOptional({ example: ['Transporte al sitio', 'Almuerzo'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  noIncluye?: string[];

  @ApiPropertyOptional({ example: ['Ropa cómoda', 'Protector solar'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requisitos?: string[];

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  edadMinima?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  capacidadMaxima?: number;
}
