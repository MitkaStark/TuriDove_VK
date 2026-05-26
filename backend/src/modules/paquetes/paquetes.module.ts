import { Module } from '@nestjs/common';
import { PaquetesController } from './paquetes.controller';
import { PaquetesService } from './paquetes.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaquetesController],
  providers: [PaquetesService],
  exports: [PaquetesService],
})
export class PaquetesModule {}
