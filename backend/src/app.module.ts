import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Redis } from 'ioredis';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HospedajesModule } from './modules/hospedajes/hospedajes.module';
import { ActividadesModule } from './modules/actividades/actividades.module';
import { TransfersModule } from './modules/transfers/transfers.module';
import { VehiculosModule } from './modules/vehiculos/vehiculos.module';
import { ReservasModule } from './modules/reservas/reservas.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { FinancieroModule } from './modules/financiero/financiero.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PaquetesModule } from './modules/paquetes/paquetes.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { RedisModule } from './modules/redis/redis.module';
import { QueueModule } from './modules/queue/queue.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.example'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { singleLine: true } }
          : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token', '*.secretKey'],
        customProps: () => ({ service: 'turidove-backend' }),
        autoLogging: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          { name: 'short',  ttl: 1000,  limit: 10 },
          { name: 'medium', ttl: 60_000, limit: 120 },
        ],
        storage: new ThrottlerStorageRedisService(
          new Redis({
            host: process.env.REDIS_HOST ?? 'localhost',
            port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
            maxRetriesPerRequest: null,
          }),
        ),
      }),
    }),
    RedisModule,
    QueueModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    HospedajesModule,
    ActividadesModule,
    TransfersModule,
    VehiculosModule,
    ReservasModule,
    PagosModule,
    FinancieroModule,
    AuditoriaModule,
    UploadsModule,
    PaquetesModule,
    StripeModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
