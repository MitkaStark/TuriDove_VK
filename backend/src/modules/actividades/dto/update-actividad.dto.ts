import { PartialType } from '@nestjs/swagger';
import { CreateActividadDto } from './create-actividad.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateActividadDto extends PartialType(CreateActividadDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
