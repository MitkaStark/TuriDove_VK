import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';

export enum TipoTransfer {
  AEROPUERTO = 'AEROPUERTO',
  HOTEL = 'HOTEL',
  PUNTO_A_PUNTO = 'PUNTO_A_PUNTO',
  TOUR = 'TOUR',
  COMPARTIDO = 'COMPARTIDO',
}

export class CreateTransferDto {
  @ApiProperty({ example: 'Transfer Aeropuerto Tocumen - Ciudad de Panamá' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ enum: TipoTransfer, example: TipoTransfer.AEROPUERTO })
  @IsEnum(TipoTransfer)
  tipo: TipoTransfer;

  @ApiProperty({ example: 'Aeropuerto Internacional de Tocumen' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  origen: string;

  @ApiProperty({ example: 'Ciudad de Panamá, Casco Viejo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  destino: string;

  @ApiPropertyOptional({ example: 'Servicio de transfer privado con aire acondicionado' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @ApiPropertyOptional({ example: 45.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanciaKm?: number;

  @ApiPropertyOptional({ example: '1h 15min', description: 'Duración estimada del trayecto' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  duracionEstimada?: string;
}
