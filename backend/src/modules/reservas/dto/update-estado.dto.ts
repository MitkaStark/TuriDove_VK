import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum EstadoReserva {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  CANCELADA = 'CANCELADA',
  COMPLETADA = 'COMPLETADA',
  REEMBOLSADA = 'REEMBOLSADA',
}

export class UpdateEstadoDto {
  @ApiProperty({
    description: 'Nuevo estado de la reserva',
    enum: EstadoReserva,
    example: EstadoReserva.CONFIRMADA,
  })
  @IsEnum(EstadoReserva)
  estado: EstadoReserva;
}
