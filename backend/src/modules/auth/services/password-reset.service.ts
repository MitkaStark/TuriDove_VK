import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { passwordResetTemplate } from '../../mail/templates/password-reset';
import { passwordChangedTemplate } from '../../mail/templates/password-changed';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private hashToken(t: string): string {
    return createHash('sha256').update(t).digest('hex');
  }

  async request(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // silencioso

    await this.prisma.passwordReset.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const token = randomBytes(32).toString('hex');
    const ttlHours = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRATION_HOURS ?? '1', 10);
    const expiresAt = new Date(Date.now() + ttlHours * 3600_000);

    await this.prisma.passwordReset.create({
      data: { userId: user.id, tokenHash: this.hashToken(token), expiresAt },
    });

    const baseUrl = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3003';
    const url = `${baseUrl}/password-reset/${token}`;
    const nombre = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() || 'usuario';
    const email_ = passwordResetTemplate({ nombre, url });
    await this.mail.send(user.email, email_, 'password-reset');
  }

  async confirm(token: string, newPassword: string): Promise<void> {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (!reset) throw new BadRequestException('Token inválido');
    if (reset.usedAt) throw new BadRequestException('Token ya usado');
    if (reset.expiresAt < new Date()) throw new BadRequestException('Token expirado');

    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await this.prisma.user.update({
      where: { id: reset.userId },
      data: { password: hashed },
    });

    await this.prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    });

    const nombre = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() || 'usuario';
    await this.mail.send(user.email, passwordChangedTemplate({ nombre }), 'password-changed');
  }

  async changeOwnPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no existe');
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new BadRequestException('La contraseña actual no es correcta');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    const nombre = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() || 'usuario';
    await this.mail.send(user.email, passwordChangedTemplate({ nombre }), 'password-changed');
  }
}
