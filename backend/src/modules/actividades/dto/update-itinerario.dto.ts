import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsArray, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ItinerarioItemDto } from './itinerario-item.dto';

export class UpdateItinerarioDto {
  @ApiProperty({
    type: [ItinerarioItemDto],
    description: 'Reemplaza el itinerario completo. Días deben ser únicos.',
  })
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ItinerarioItemDto)
  items: ItinerarioItemDto[];
}
