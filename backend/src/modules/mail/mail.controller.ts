import { Controller, Get, Patch, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { UpdateEmailConfigDto } from './dto/update-email-config.dto';
import { renderEmail } from './templates/render.util';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('admin/email')
@Controller('admin/email')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Get('status')
  status() {
    return this.mail.getStatus();
  }

  @Patch('config')
  async updateConfig(@Body() dto: UpdateEmailConfigDto, @Req() req: any) {
    await this.mail.updateConfig(dto, req.user?.id ?? 'unknown');
    return this.mail.getStatus();
  }

  @Post('test')
  @ApiOperation({ summary: 'Envía un email de prueba al admin autenticado.' })
  async sendTest(@Req() req: any) {
    const to = req.user?.email;
    if (!to) return { ok: false, error: 'Sin email en el token JWT' };
    const email = renderEmail(
      'Email de prueba — TuriDove',
      {
        title: 'Email de prueba',
        preheader: 'Confirmación de que la configuración de email funciona',
        heading: '¡Funciona!',
        bodyHtml: '<p>Si recibes este mensaje, la configuración de email de TuriDove está operativa.</p><p>Provider activo: <strong>verificado desde el panel admin</strong>.</p>',
        ctaUrl: 'http://localhost:3003/admin/configuracion/email',
        ctaText: 'Volver al panel',
        footerText: 'Email enviado desde el endpoint de prueba.',
      },
      'Si recibes este mensaje, la configuración de email de TuriDove está operativa.',
    );
    return this.mail.sendNow(to, email, 'test');
  }
}
