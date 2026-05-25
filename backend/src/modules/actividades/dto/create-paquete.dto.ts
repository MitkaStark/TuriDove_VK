import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsUUID,
  Min,
  Max,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';

export class CreatePaqueteDto {
  @ApiProperty({ example: 'Paquete Aventura Completa' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ example: 'Incluye rafting, canopy y caminata por senderos...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  descripcion: string;

  @ApiProperty({
    example: ['uuid-actividad-1', 'uuid-actividad-2'],
    description: 'IDs de actividades incluidas en el paquete',
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'Un paquete debe incluir al menos 2 actividades' })
  @IsUUID('4', { each: true })
  actividadIds: string[];

  @ApiProperty({
    example: 15,
    description: 'Porcentaje de descuento sobre la suma individual',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  descuento: number;
}
