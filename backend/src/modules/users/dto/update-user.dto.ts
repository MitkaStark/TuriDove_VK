import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'juan@example.com' })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'NewPassword123!' })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;

  @ApiPropertyOptional({ example: 'Juan' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  apellido?: string;

  @ApiPropertyOptional({ example: '+507 6000-0000' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean({ message: 'El campo activo debe ser booleano' })
  @IsOptional()
  activo?: boolean;

  @ApiPropertyOptional({ example: '/uploads/avatar.jpg' })
  @IsString()
  @IsOptional()
  avatar?: string;
}
