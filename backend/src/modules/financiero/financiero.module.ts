import { Module } from '@nestjs/common';
import { FinancieroController } from './financiero.controller';
import { FinancieroService } from './financiero.service';

@Module({
  controllers: [FinancieroController],
  providers: [FinancieroService],
  exports: [FinancieroService],
})
export class FinancieroModule {}
