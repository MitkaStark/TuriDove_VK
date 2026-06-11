import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';
import { ReservaExpirationProcessor } from './reserva-expiration.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'reservas-expirations' })],
  controllers: [ReservasController],
  providers: [ReservasService, ReservaExpirationProcessor],
  exports: [ReservasService],
})
export class ReservasModule {}
