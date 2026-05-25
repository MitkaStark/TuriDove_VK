import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(100)
  apellido: string;

  @ApiPropertyOptional({ example: '+507 6000-0000' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @ApiPropertyOptional({ enum: Role, default: Role.CLIENTE })
  @IsEnum(Role, { message: 'El rol debe ser uno de: ADMIN, PROVEEDOR, AGENCIA, OPERADOR, CLIENTE' })
  @IsOptional()
  rol?: Role;
}
