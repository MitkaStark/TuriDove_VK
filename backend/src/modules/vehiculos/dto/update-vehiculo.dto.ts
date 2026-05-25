import { PartialType } from '@nestjs/swagger';
import { CreateVehiculoDto } from './create-vehiculo.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateVehiculoDto extends PartialType(CreateVehiculoDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
