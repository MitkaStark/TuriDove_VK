import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser = require('cookie-parser');
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.use(cookieParser());

  app.useLogger(app.get(PinoLogger));

  // Serve uploaded files as static
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  // Global prefix (excluye /health para que el endpoint quede en http://host:port/health)
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  // CORS — accepts comma-separated list from CORS_ORIGIN env var
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const allowedOrigins = corsOrigin
    ? corsOrigin.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4200'];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.stripe.com'],
          frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com', 'https://checkout.stripe.com'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TuriDove API')
    .setDescription(
      'API de TuriDove — agencia de viajes boutique. ' +
      'Gestiona hospedajes, actividades, transfers, reservas, pagos y mas.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Ingrese el token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Autenticacion y autorizacion')
    .addTag('Users', 'Gestion de usuarios')
    .addTag('Hospedajes', 'Gestion de hospedajes')
    .addTag('Actividades', 'Gestion de actividades')
    .addTag('Transfers', 'Gestion de transfers')
    .addTag('Vehiculos', 'Gestion de vehiculos')
    .addTag('Reservas', 'Gestion de reservas')
    .addTag('Pagos', 'Gestion de pagos')
    .addTag('Financiero', 'Reportes financieros')
    .addTag('Auditoria', 'Registro de auditoria')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  logger.log(`TuriDove API running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
