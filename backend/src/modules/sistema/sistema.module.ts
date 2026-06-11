import { Module, forwardRef } from '@nestjs/common';
import { SistemaController } from './sistema.controller';
import { SistemaService } from './sistema.service';
import { PagosModule } from '../pagos/pagos.module';

@Module({
  imports: [forwardRef(() => PagosModule)],
  controllers: [SistemaController],
  providers: [SistemaService],
  exports: [SistemaService],
})
export class SistemaModule {}
