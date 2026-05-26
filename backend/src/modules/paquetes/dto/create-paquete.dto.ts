import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePaqueteDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(140)
  slug!: string;

  @IsString()
  @MinLength(10)
  descripcion!: string;

  @IsString()
  hospedajeId!: string;

  @IsString()
  habitacionId!: string;

  @IsOptional()
  @IsString()
  actividadId?: string;

  @IsOptional()
  @IsString()
  vehiculoId?: string;

  @IsInt()
  @Min(1)
  @Max(30)
  diasDuracion!: number;

  @IsInt()
  @Min(0)
  @Max(29)
  noches!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  descuentoPorcentaje?: number;

  @IsOptional()
  @IsString()
  imagenPrincipal?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsDateString()
  validoDesde!: string;

  @IsDateString()
  validoHasta!: string;
}
