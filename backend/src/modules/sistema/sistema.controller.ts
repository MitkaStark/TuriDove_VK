import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SistemaService } from './sistema.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('admin/system')
@Controller('admin/system')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SistemaController {
  constructor(private readonly sistema: SistemaService) {}

  @Get('stripe-events')
  listStripeEvents(@Query('status') status?: 'all' | 'failed' | 'ok', @Query('type') type?: string) {
    return this.sistema.listStripeEvents({ status, type });
  }

  @Post('stripe-events/:id/retry')
  retry(@Param('id') id: string) {
    return this.sistema.retryStripeEvent(id);
  }

  @Get('email-logs')
  listEmailLogs(@Query('status') status?: 'sent' | 'failed' | 'all') {
    return this.sistema.listEmailLogs({ status });
  }
}
