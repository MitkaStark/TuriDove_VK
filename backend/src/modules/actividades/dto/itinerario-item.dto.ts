import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsNumber, IsOptional, IsNotEmpty, MaxLength, Min, Max } from 'class-validator';

export class ItinerarioItemDto {
  @ApiProperty({ example: 1, description: 'Número de día del itinerario (1, 2, 3...)' })
  @IsInt()
  @Min(1)
  @Max(30)
  dia: number;

  @ApiProperty({ example: 'Llegada y bienvenida' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo: string;

  @ApiProperty({ example: 'Recepción en el hotel y orientación sobre la actividad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  descripcion: string;

  @ApiPropertyOptional({ example: 8.7836 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ example: -82.4378 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({ example: 'Hotel Boquete' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombreUbicacion?: string;
}
