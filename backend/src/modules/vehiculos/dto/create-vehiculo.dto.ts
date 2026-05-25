import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export enum TipoVehiculo {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  VAN = 'VAN',
  MINIBUS = 'MINIBUS',
  BUS = 'BUS',
  PICKUP = 'PICKUP',
  LANCHA = 'LANCHA',
  OTRO = 'OTRO',
}

export class CreateVehiculoDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  marca: string;

  @ApiProperty({ example: 'Hiace' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  modelo: string;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsNumber()
  @Min(1990)
  @Max(2030)
  anio?: number;

  @ApiPropertyOptional({ example: 'AB-1234' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  placa?: string;

  @ApiProperty({ enum: TipoVehiculo, example: TipoVehiculo.VAN })
  @IsEnum(TipoVehiculo)
  tipo: TipoVehiculo;

  @ApiProperty({ example: 12, description: 'Capacidad de pasajeros' })
  @IsNumber()
  @Min(1)
  capacidadPasajeros: number;

  @ApiPropertyOptional({
    example: ['Aire acondicionado', 'WiFi', 'USB'],
    description: 'Lista de características del vehículo',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  caracteristicas?: string[];

  @ApiPropertyOptional({
    example: ['https://example.com/img1.jpg'],
    description: 'URLs de imágenes del vehículo',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];

  @ApiPropertyOptional({ example: true, description: 'Si incluye seguro' })
  @IsOptional()
  @IsBoolean()
  seguroIncluido?: boolean;
}
