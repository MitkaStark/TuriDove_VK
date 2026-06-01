import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsInt,
  IsArray,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsNotEmpty,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export enum EstadoActividad {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
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

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000004', description: 'UUID de la categoría' })
  @IsUUID()
  categoriaId: string;

  @ApiProperty({ example: 3, description: 'Duración en horas (0.5 - 168)' })
  @IsNumber()
  @Min(0.5)
  @Max(168)
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

  @ApiPropertyOptional({ example: '/uploads/actividad-portada.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagenPrincipal?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Guía profesional', 'Equipo'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  incluye?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Comidas', 'Propinas'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  noIncluye?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Calzado cómodo', 'Edad mínima 12'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requisitos?: string[];

  @ApiPropertyOptional({ example: 0, description: 'Edad mínima del participante' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  edadMinima?: number;

  @ApiProperty({ example: 20, description: 'Capacidad máxima por sesión' })
  @IsInt()
  @Min(1)
  @Max(1000)
  capacidadMaxima: number;

  @ApiPropertyOptional({ enum: EstadoActividad, default: EstadoActividad.DRAFT })
  @IsOptional()
  @IsEnum(EstadoActividad)
  estado?: EstadoActividad;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
