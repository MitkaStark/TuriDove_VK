import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum TipoReporte {
  INGRESOS = 'INGRESOS',
  RESERVAS = 'RESERVAS',
  OCUPACION = 'OCUPACION',
  PROVEEDORES = 'PROVEEDORES',
  GENERAL = 'GENERAL',
}

export class ReporteQueryDto {
  @ApiPropertyOptional({ description: 'Fecha de inicio del reporte', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin del reporte', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional({ description: 'Tipo de reporte', enum: TipoReporte })
  @IsOptional()
  @IsEnum(TipoReporte)
  tipo?: TipoReporte;
}
