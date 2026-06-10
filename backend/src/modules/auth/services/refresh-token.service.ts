import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { randomBytes, createHash, randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private hashToken(t: string): string {
    return createHash('sha256').update(t).digest('hex');
  }

  /**
   * Issues a new (access, refresh) pair. If `family` is provided, the refresh
   * token is part of an existing rotation chain (refresh flow); otherwise a
   * new family is started (login flow).
   */
  async issuePair(userId: string, role: string, family?: string): Promise<TokenPair> {
    const accessToken = this.jwt.sign(
      { sub: userId, role },
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION ?? '15m' },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const familyId = family ?? randomUUID();
    const refreshDays = parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS ?? '7', 10);
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 3600_000);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, family: familyId, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Rotates a refresh token: validates it, revokes it, issues a new one in the
   * same family. If the token was ALREADY revoked (replay attempt), invalidates
   * the entire family — security signal that the token was stolen.
   */
  async rotate(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) throw new UnauthorizedException('Refresh token inválido');

    if (stored.revokedAt) {
      this.logger.warn(
        `Reuso de refresh token detectado para user ${stored.userId}; revocando familia ${stored.family}`,
      );
      await this.prisma.refreshToken.updateMany({
        where: { family: stored.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token revocado por reuso');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issuePair(stored.userId, stored.user.role, stored.family);
  }

  async revoke(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
