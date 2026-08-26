import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const apiPrefix = configService.get<string>('apiPrefix', 'api/v1');

  // Enable CORS for Frontend integration
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Global Prefix
  app.setGlobalPrefix(apiPrefix);

  // Global Pipes, Filters & Interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pharma Regulatory CTD Intelligence API')
    .setDescription(
      'REST API para el análisis de expedientes farmacéuticos regulatorios (CTD/eCTD), extracción de texto, detección de moléculas e investigación científica automatizada.',
    )
    .setVersion('1.0.0')
    .addTag('Health', 'System and operational health')
    .addTag('Documents', 'Upload, parsing and OCR of CTD dossiers')
    .addTag('Molecules', 'Chemical and active ingredient detection')
    .addTag('Research', 'Scientific agent investigation (PubChem, FDA, Literature)')
    .addTag('Reports', 'Consolidated regulatory dossiers & intelligence reports')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Pharma Regulatory API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
  });

  await app.listen(port);
  logger.log(`=======================================================`);
  logger.log(`🚀 Pharma Regulatory Backend running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger OpenAPI Documentation at:   http://localhost:${port}/api/docs`);
  logger.log(`=======================================================`);
}

bootstrap();
