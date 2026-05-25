import { Module } from '@nestjs/common';
import { HospedajesController } from './hospedajes.controller';
import { HospedajesService } from './hospedajes.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HospedajesController],
  providers: [HospedajesService],
  exports: [HospedajesService],
})
export class HospedajesModule {}
