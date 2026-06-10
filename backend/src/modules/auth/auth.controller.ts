import {
  Controller,
  Post,
  Get,
  Body,
  ForbiddenException,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshDto } from './dto/refresh.dto';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordResetService } from './services/password-reset.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerif: EmailVerificationService,
    private readonly passwordReset: PasswordResetService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Registrar nuevo usuario (rol CLIENTE por defecto)' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna JWT y usuario' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    if (!req.user.emailVerifiedAt) {
      throw new ForbiddenException({
        message: 'Debes verificar tu email antes de iniciar sesión',
        code: 'EMAIL_NOT_VERIFIED',
        email: req.user.email,
      });
    }
    const pair = await this.authService.issueTokensForUser(req.user);
    const { password: _, ...userWithoutPassword } = req.user;
    return {
      user: userWithoutPassword,
      token: pair.accessToken,
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
    };
  }

  @Public()
  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Verificar email del usuario con token' })
  @ApiResponse({ status: 200, description: 'Email verificado correctamente' })
  @ApiResponse({ status: 400, description: 'Token inválido, usado o expirado' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.emailVerif.verifyToken(dto.token);
  }

  @Public()
  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Reenviar email de verificación' })
  @ApiResponse({ status: 200, description: 'Email reenviado (respuesta silenciosa)' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.emailVerif.resendVerification(dto.email);
    return { ok: true };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(@Request() req: any) {
    const { password: _, ...userWithoutPassword } = req.user;
    return userWithoutPassword;
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Refrescar tokens vía rotación de refresh token' })
  @ApiResponse({ status: 200, description: 'Nuevo par de tokens emitido' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido, expirado o revocado' })
  async refresh(@Body() dto: RefreshDto) {
    return this.refreshTokens.rotate(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión revocando el refresh token' })
  @ApiResponse({ status: 200, description: 'Refresh token revocado' })
  async logout(@Body() dto: RefreshDto) {
    await this.refreshTokens.revoke(dto.refreshToken);
    return { ok: true };
  }

  @Public()
  @Post('password-reset/request')
  @Throttle({ default: { limit: 3, ttl: 15 * 60_000 } })
  @ApiOperation({ summary: 'Solicitar reset de contraseña (envía email)' })
  @ApiResponse({ status: 200, description: 'Respuesta silenciosa (no leak)' })
  async pwResetRequest(@Body() dto: PasswordResetRequestDto) {
    await this.passwordReset.request(dto.email);
    return { ok: true };
  }

  @Public()
  @Post('password-reset/confirm')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Confirmar reset de contraseña con token' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
  @ApiResponse({ status: 400, description: 'Token inválido, usado o expirado' })
  async pwResetConfirm(@Body() dto: PasswordResetConfirmDto) {
    await this.passwordReset.confirm(dto.token, dto.newPassword);
    return { ok: true };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta' })
  async changePassword(@Body() dto: ChangePasswordDto, @Request() req: any) {
    await this.passwordReset.changeOwnPassword(req.user.id, dto.currentPassword, dto.newPassword);
    return { ok: true };
  }
}
