import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsString,
  IsInt,
  Min,
  Matches,
} from 'class-validator';

export class CreateCalendarioDto {
  @ApiProperty({ example: '2026-05-15', description: 'Fecha del slot' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ example: '08:00', description: 'Hora de inicio (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horaInicio debe tener formato HH:mm',
  })
  horaInicio: string;

  @ApiProperty({ example: '11:00', description: 'Hora de fin (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horaFin debe tener formato HH:mm',
  })
  horaFin: string;

  @ApiProperty({ example: 15, description: 'Cupos disponibles' })
  @IsInt()
  @Min(0)
  cuposDisponibles: number;
}
