import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { StripeService } from './stripe.service';

class UpdateStripeConfigDto {
  @IsOptional()
  @IsString()
  secretKey?: string;

  @IsOptional()
  @IsString()
  publicKey?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}

/**
 * Endpoints administrativos para inspeccionar y configurar Stripe.
 * Nunca expone secrets completos — solo enmascarados.
 */
@ApiTags('admin/stripe')
@Controller('admin/stripe')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Get('status')
  @ApiOperation({ summary: 'Estado de configuración Stripe (solo ADMIN). NO expone secrets.' })
  async getStatus() {
    return this.stripeService.getStatus();
  }

  @Patch('config')
  @ApiOperation({
    summary: 'Actualizar claves Stripe en BD (cifradas). Las claves Live se aceptan pero se advierte.',
  })
  async updateConfig(@Body() dto: UpdateStripeConfigDto, @Req() req: any) {
    // Validación básica de formato
    if (dto.secretKey !== undefined && dto.secretKey) {
      if (!dto.secretKey.startsWith('sk_test_') && !dto.secretKey.startsWith('sk_live_')) {
        throw new BadRequestException(
          'Secret key debe empezar con sk_test_ o sk_live_',
        );
      }
    }
    if (dto.publicKey !== undefined && dto.publicKey) {
      if (!dto.publicKey.startsWith('pk_test_') && !dto.publicKey.startsWith('pk_live_')) {
        throw new BadRequestException(
          'Publishable key debe empezar con pk_test_ o pk_live_',
        );
      }
    }
    if (dto.webhookSecret !== undefined && dto.webhookSecret) {
      if (!dto.webhookSecret.startsWith('whsec_')) {
        throw new BadRequestException('Webhook secret debe empezar con whsec_');
      }
    }

    // Validar consistencia secret/public (ambos test o ambos live)
    const skMode =
      dto.secretKey && dto.secretKey.startsWith('sk_live_')
        ? 'live'
        : dto.secretKey && dto.secretKey.startsWith('sk_test_')
          ? 'test'
          : null;
    const pkMode =
      dto.publicKey && dto.publicKey.startsWith('pk_live_')
        ? 'live'
        : dto.publicKey && dto.publicKey.startsWith('pk_test_')
          ? 'test'
          : null;
    if (skMode && pkMode && skMode !== pkMode) {
      throw new BadRequestException(
        `Secret key (${skMode}) y Publishable key (${pkMode}) deben ser del mismo modo`,
      );
    }

    await this.stripeService.updateConfig(dto, req.user?.id ?? 'unknown');
    return this.stripeService.getStatus();
  }

  @Delete('config')
  @ApiOperation({ summary: 'Borrar configuración de BD y volver a usar env vars.' })
  async resetConfig(@Req() req: any) {
    await this.stripeService.resetConfig(req.user?.id ?? 'unknown');
    return this.stripeService.getStatus();
  }

  @Post('test-connection')
  @ApiOperation({
    summary: 'Hace una llamada read-only (balance.retrieve) para validar las claves.',
  })
  async testConnection() {
    return this.stripeService.testConnection();
  }
}
