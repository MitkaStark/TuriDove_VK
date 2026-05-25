import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum MetodoPago {
  TARJETA = 'TARJETA',
  TRANSFERENCIA = 'TRANSFERENCIA',
  EFECTIVO = 'EFECTIVO',
  YAPPY = 'YAPPY',
  ACH = 'ACH',
}

export class CreatePagoDto {
  @ApiProperty({ description: 'ID de la reserva asociada' })
  @IsUUID()
  reservaId: string;

  @ApiProperty({ description: 'Monto del pago en USD', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto: number;

  @ApiProperty({ description: 'Metodo de pago', enum: MetodoPago })
  @IsEnum(MetodoPago)
  metodo: MetodoPago;

  @ApiPropertyOptional({ description: 'Referencia de transaccion externa' })
  @IsOptional()
  @IsString()
  referencia?: string;

  @ApiPropertyOptional({ description: 'Notas del pago' })
  @IsOptional()
  @IsString()
  notas?: string;
}
