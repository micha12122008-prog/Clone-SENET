import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Глобальний префікс API
  app.setGlobalPrefix('api');

  // Налаштування CORS для фронтенд-додатків
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : '*';

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Глобальна валідація вхідних запитів DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Глобальний фільтр помилок та інтерцептор відповідей
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Налаштування інтерактивної документації Swagger (OpenAPI 3.0)
  const config = new DocumentBuilder()
    .setTitle('Obsidian PC CLUB API — Next-Gen Esports Management System')
    .setDescription(
      'REST API для системи автоматизованого управління кіберспортивним клубом «Obsidian PC CLUB» (Дипломний проєкт).\n\n' +
      'Модулі: Auth, Users, Computers, Zones, Tariffs, Bookings, Sessions, Tournaments, Achievements, Payments, Store, Analytics, Notifications, Settings.',
    )
    .setVersion('1.2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Введіть JWT токен доступу у форматі: Bearer <token>',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health & System', 'Статус сервера та діагностика')
    .addTag('Auth', 'Реєстрація, OTP-верифікація, авторизація та токени')
    .addTag('Users', 'Управління користувачами, рівнями, рамками та балансом')
    .addTag('Zones', 'Ігрові зони клубу (Standard, VIP, Bootcamp, PS5, VR)')
    .addTag('Computers', 'Комп’ютери, консолі, VR-станції, характеристики та карта')
    .addTag('Tariffs', 'Тарифна сітка та розрахунок вартості')
    .addTag('Bookings', 'Бронювання робочих місць, cross-sale та QR-коди')
    .addTag('Sessions', 'Ігрові сесії, чек-ін за QR, функція «Пересадити» та відгуки')
    .addTag('Tournaments', 'Кіберспортивні турніри (CS2, FIFA, Dota), сітки матчів та стріми')
    .addTag('Achievements', 'Гейміфікація клубу, досягнення в стилі monobank та рамки профілю')
    .addTag('Payments', 'Поповнення балансу та фінансовий журнал')
    .addTag('Store', 'Магазин товарів бару та доставка до столу')
    .addTag('Analytics', 'Метрики Dashboard та звіти')
    .addTag('Notifications', 'Системні сповіщення')
    .addTag('Settings', 'Налаштування клубу')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      docExpansion: 'list',
    },
    customSiteTitle: 'Obsidian PC CLUB API Docs',
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(`🚀 Obsidian PC CLUB Backend запущено на: http://localhost:${port}/api`);
  logger.log(`📚 Інтерактивний Swagger UI: http://localhost:${port}/api/docs`);
  logger.log(`📄 OpenAPI JSON схема:       http://localhost:${port}/api/docs-json`);
  logger.log(`=======================================================`);
}

bootstrap();
