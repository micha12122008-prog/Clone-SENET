import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DeviceType, TariffType, UserRole } from '@prisma/client';

describe('Zones, Computers, Tariffs & Maintenance Integration E2E', () => {
  jest.setTimeout(35000);
  let app: INestApplication;
  let adminToken: string;
  let clientToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();

    // Отримуємо JWT-токени для ADMIN та CLIENT
    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        login: 'admin@obsidianclub.ua',
        password: 'Password123!',
      });
    adminToken = adminLoginRes.body.data.accessToken;

    const clientLoginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        login: 'player1@gmail.com',
        password: 'Password123!',
      });
    clientToken = clientLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Загальнодоступні каталоги (Public / Client view)', () => {
    it('GET /api/zones повинен повертати список зон зі статистикою ПК', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/zones')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);

      const zone = res.body.data[0];
      expect(zone.id).toBeDefined();
      expect(zone.name).toBeDefined();
      expect(zone.baseHourlyRate).toBeGreaterThan(0);
      expect(zone.totalComputers).toBeDefined();
      expect(zone.availableComputers).toBeDefined();
    });

    it('GET /api/computers повинен повертати місця виключно з українськими статусами enum', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/computers')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const validUkrainianStatuses = ['вільно', 'зайнято', 'бронь', 'ремонт'];
      for (const comp of res.body.data) {
        expect(validUkrainianStatuses).toContain(comp.status);
        expect(comp.number).toBeGreaterThan(0);
        expect(comp.zoneName).toBeDefined();
      }
    });

    it('GET /api/computers/map повинен повертати схему залу та координати місць', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/computers/map')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.clubLayout).toBeDefined();
      expect(res.body.data.computers.length).toBeGreaterThanOrEqual(8);
    });

    it('GET /api/tariffs повинен повертати тарифи у гривнях', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tariffs')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].price).toBeGreaterThan(0);
    });

    it('POST /api/tariffs/calculate повинен розраховувати вартість і застосовувати WELCOME знижку 15%', async () => {
      const tariffsRes = await request(app.getHttpServer()).get('/api/tariffs');
      const tariff = tariffsRes.body.data[0];

      const res = await request(app.getHttpServer())
        .post('/api/tariffs/calculate')
        .send({
          tariffId: tariff.id,
          durationMinutes: 120,
          promoCode: 'WELCOME',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.promoApplied).toBe(true);
      expect(res.body.data.discountAmount).toBeGreaterThan(0);
      expect(res.body.data.finalPrice).toBeLessThan(res.body.data.originalPrice);
    });
  });

  describe('2. Захист маршрутів та перевірка прав (RBAC: 401 & 403)', () => {
    it('POST /api/zones без токена -> 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/api/zones')
        .send({ name: 'Hack Zone', baseHourlyRate: 10, colorHex: '#000000' })
        .expect(401);
    });

    it('POST /api/zones із токеном CLIENT -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post('/api/zones')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ name: 'Client Created Zone', baseHourlyRate: 50, colorHex: '#111111' })
        .expect(403);
    });

    it('POST /api/computers із токеном CLIENT -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post('/api/computers')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ number: 999, name: 'Illegal PC', zoneId: 'zone-1-standard' })
        .expect(403);
    });

    it('PATCH /api/computers/:id/status із токеном CLIENT -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .patch('/api/computers/comp-1/status')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'ремонт' })
        .expect(403);
    });

    it('POST /api/tariffs із токеном CLIENT -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post('/api/tariffs')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ name: 'Cheap Tariff', price: 1 })
        .expect(403);
    });
  });

  describe('3. Повний життєвий цикл адміна: Зона -> ПК -> Статус/Ремонт -> Тариф', () => {
    let createdZoneId: string;
    let createdPlaceId: string;
    let createdTariffId: string;

    it('Адмін створює нову ігрову зону Bootcamp Alpha', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/zones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Bootcamp Alpha E2E',
          description: 'Командна кімната для турнірних тренувань',
          deviceType: DeviceType.PC,
          baseHourlyRate: 85.0,
          colorHex: '#10B981',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Bootcamp Alpha E2E');
      expect(res.body.data.baseHourlyRate).toBe(85.0);
      createdZoneId = res.body.data.id;
    });

    it('Адмін створює нове місце, прив’язане до створеної зони', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/computers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          number: 77,
          name: 'BC-ALPHA-01',
          zoneId: createdZoneId,
          specs: {
            cpu: 'AMD Ryzen 7 7800X3D',
            gpu: 'NVIDIA RTX 4080 Super',
            ram: '32GB DDR5 6000MHz',
          },
          coordinateX: 300,
          coordinateY: 400,
          row: 3,
          col: 1,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.number).toBe(77);
      expect(res.body.data.status).toBe('вільно');
      createdPlaceId = res.body.data.id;
    });

    it('Адмін переводить місце в статус "ремонт" із фіксацією причини', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/computers/${createdPlaceId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'ремонт',
          description: 'Пошкоджено кабель гарнітури HyperX',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ремонт');

      // Перевіряємо наявність запису в журналі ремонту
      const repairsRes = await request(app.getHttpServer())
        .get(`/api/computers/repairs?placeId=${createdPlaceId}`)
        .expect(200);

      expect(repairsRes.body.data.length).toBeGreaterThan(0);
      expect(repairsRes.body.data[0].description).toBe('Пошкоджено кабель гарнітури HyperX');
      expect(repairsRes.body.data[0].finishedAt).toBeNull();
    });

    it('Система блокує некоректний перехід з "ремонт" у "зайнято" (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/computers/${createdPlaceId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'зайнято' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(400);
    });

    it('Адмін повертає місце в статус "вільно", що автоматично фінішує ремонт', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/computers/${createdPlaceId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'вільно' })
        .expect(200);

      expect(res.body.data.status).toBe('вільно');

      // Перевіряємо, що ремонт закритий
      const repairsRes = await request(app.getHttpServer())
        .get(`/api/computers/repairs?placeId=${createdPlaceId}`)
        .expect(200);

      expect(repairsRes.body.data[0].finishedAt).not.toBeNull();
      expect(repairsRes.body.data[0].status).toBe('Завершено');
    });

    it('Адмін створює тариф для зони Bootcamp Alpha', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tariffs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '1 Година Bootcamp Alpha',
          type: TariffType.HOURLY,
          price: 85.0,
          durationMinutes: 60,
          zoneId: createdZoneId,
          description: 'Погодинна гра у зоні Alpha',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(85.0);
      createdTariffId = res.body.data.id;
    });

    it('Адмін успішно видаляє створений тариф, місце та зону', async () => {
      await request(app.getHttpServer())
        .delete(`/api/tariffs/${createdTariffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/computers/${createdPlaceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/zones/${createdZoneId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
