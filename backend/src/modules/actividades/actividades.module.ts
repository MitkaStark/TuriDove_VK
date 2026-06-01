import { Module } from '@nestjs/common';
import { ActividadesController } from './actividades.controller';
import { ActividadesService } from './actividades.service';
import { CategoriasController } from './categorias.controller';
import { CategoriasService } from './categorias.service';
import { ItinerarioController } from './itinerario.controller';
import { ItinerarioService } from './itinerario.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriasController, ItinerarioController, ActividadesController],
  providers: [ActividadesService, CategoriasService, ItinerarioService],
  exports: [ActividadesService],
})
export class ActividadesModule {}
