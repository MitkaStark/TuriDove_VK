import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class DisponibilidadVehiculoDto {
  @ApiProperty({ example: '2026-06-01', description: 'Fecha' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ example: false, description: 'Si esta disponible en esta fecha' })
  @IsBoolean()
  disponible: boolean;

  @ApiPropertyOptional({ example: 'En mantenimiento', description: 'Notas' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notas?: string;
}
