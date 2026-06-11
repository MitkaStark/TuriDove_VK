import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { verifyEmailTemplate } from '../../mail/templates/verify-email';
import { welcomeTemplate } from '../../mail/templates/welcome';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async sendVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no existe');

    // Invalidar tokens previos no usados
    await this.prisma.emailVerification.deleteMany({
      where: { userId, usedAt: null },
    });

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const ttlHours = parseInt(process.env.VERIFY_EMAIL_TOKEN_EXPIRATION_HOURS ?? '24', 10);
    const expiresAt = new Date(Date.now() + ttlHours * 3600_000);

    await this.prisma.emailVerification.create({
      data: { userId, tokenHash, expiresAt },
    });

    const baseUrl = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3003';
    const url = `${baseUrl}/verify-email/${token}`;
    const nombre = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() || 'usuario';

    const email = verifyEmailTemplate({ nombre, url });
    await this.mail.send(user.email, email, 'verify-email');
  }

  async verifyToken(token: string): Promise<{ userId: string }> {
    const tokenHash = this.hashToken(token);
    const verif = await this.prisma.emailVerification.findUnique({
      where: { tokenHash },
    });
    if (!verif) throw new BadRequestException('Token inválido');
    if (verif.usedAt) throw new BadRequestException('Token ya usado');
    if (verif.expiresAt < new Date()) throw new BadRequestException('Token expirado');

    const user = await this.prisma.user.update({
      where: { id: verif.userId },
      data: { emailVerifiedAt: new Date() },
    });

    await this.prisma.emailVerification.update({
      where: { id: verif.id },
      data: { usedAt: new Date() },
    });

    // Welcome email
    const nombre = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() || 'usuario';
    await this.mail.send(user.email, welcomeTemplate({ nombre }), 'welcome');

    return { userId: user.id };
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // silencioso (no leak)
    if (user.emailVerifiedAt) return; // ya verificado
    await this.sendVerification(user.id);
  }
}
