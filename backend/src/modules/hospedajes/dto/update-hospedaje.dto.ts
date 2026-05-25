import { PartialType } from '@nestjs/swagger';
import { CreateHospedajeDto } from './create-hospedaje.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateHospedajeDto extends PartialType(CreateHospedajeDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
