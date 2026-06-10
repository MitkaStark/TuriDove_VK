import {
  Injectable,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from './strategies/jwt.strategy';
import { EmailVerificationService } from './services/email-verification.service';
import { RefreshTokenService } from './services/refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditoriaService: AuditoriaService,
    private readonly emailVerification: EmailVerificationService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Only allow CLIENTE and PROVEEDOR for self-registration
    const allowedRoles = [Role.CLIENTE, Role.PROVEEDOR];
    const role = registerDto.role && allowedRoles.includes(registerDto.role)
      ? registerDto.role
      : Role.CLIENTE;

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      role,
    });

    const pair = await this.refreshTokens.issuePair(user.id, user.role);

    // Audit register
    this.auditoriaService.log({
      accion: 'REGISTER',
      entidad: 'Auth',
      entidadId: user.id,
      datos: { email: user.email, role: user.role },
      userId: user.id,
    }).catch(() => {});

    // Disparar email de verificación (no bloquea registro si falla)
    this.emailVerification.sendVerification(user.id).catch(() => {});

    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token: pair.accessToken,
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException({
        message: 'Debes verificar tu email antes de iniciar sesión',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    const pair = await this.refreshTokens.issuePair(user.id, user.role);

    // Audit login
    this.auditoriaService.log({
      accion: 'LOGIN',
      entidad: 'Auth',
      entidadId: user.id,
      datos: { email: user.email, role: user.role },
      userId: user.id,
    }).catch(() => {});

    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token: pair.accessToken,
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.activo) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  generateToken(user: { id: string; email: string; role: string }): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Issues a token pair (access + refresh) for an already-validated user.
   * Used by the controller's login endpoint (which validates via LocalAuthGuard).
   */
  async issueTokensForUser(user: { id: string; role: string }) {
    return this.refreshTokens.issuePair(user.id, user.role);
  }
}
