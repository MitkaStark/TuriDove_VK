import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StripeService } from '../stripe/stripe.service';
import { MailService } from '../mail/mail.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly stripe: StripeService,
    private readonly mail: MailService,
    @InjectQueue('emails') private readonly emailsQueue: Queue,
    @InjectQueue('reservas-expirations') private readonly reservasQueue: Queue,
  ) {}

  async check() {
    const start = Date.now();

    const [dbCheck, redisCheck, stripeStatus, emailStatus, emailsCounts, reservasCounts] =
      await Promise.allSettled([
        this.pingDb(),
        this.redis.ping(),
        this.stripe.getStatus(),
        this.mail.getStatus(),
        this.emailsQueue.getJobCounts('active', 'waiting', 'failed', 'completed'),
        this.reservasQueue.getJobCounts('active', 'waiting', 'failed', 'completed', 'delayed'),
      ]);

    const checks = {
      database: this.unwrap(dbCheck, { ok: false, latencyMs: -1 }),
      redis: this.unwrap(redisCheck, { ok: false, latencyMs: -1 }),
      stripe: this.unwrap(stripeStatus, null),
      email: this.unwrap(emailStatus, null),
      queues: {
        emails: this.unwrap(emailsCounts, {} as Record<string, number>),
        'reservas-expirations': this.unwrap(reservasCounts, {} as Record<string, number>),
      },
    };

    const allOk = checks.database.ok && checks.redis.ok;

    return {
      status: allOk ? 'ok' : 'degraded',
      version: process.env.npm_package_version ?? '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      checkedAt: new Date().toISOString(),
      totalLatencyMs: Date.now() - start,
      checks,
    };
  }

  private async pingDb(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, latencyMs: Date.now() - start };
    } catch {
      return { ok: false, latencyMs: Date.now() - start };
    }
  }

  private unwrap<T>(result: PromiseSettledResult<T>, fallback: T): T {
    return result.status === 'fulfilled' ? result.value : fallback;
  }
}
