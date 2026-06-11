import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'emails' }),
    BullModule.registerQueue({ name: 'reservas-expirations' }),
    StripeModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
