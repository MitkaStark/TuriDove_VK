import { PartialType } from '@nestjs/swagger';
import { CreateTransferDto } from './create-transfer.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTransferDto extends PartialType(CreateTransferDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
