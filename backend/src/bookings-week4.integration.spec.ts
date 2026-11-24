import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

describe('Bookings API Week 4 Integration E2E', () => {
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

  describe('1. Каталог додаткових послуг (GET /api/bookings/extras-catalog)', () => {
    it('повинен повертати каталог допів: напої, снеки, геймпад, VR-оператор', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/bookings/extras-catalog')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);

      const items = res.body.data;
      expect(items.some((i: any) => i.name.includes('Red Bull'))).toBe(true);
      expect(items.some((i: any) => i.name.includes('сендвіч'))).toBe(true);
      expect(items.some((i: any) => i.name.includes('DualSense'))).toBe(true);
      expect(items.some((i: any) => i.name.includes('VR-оператор'))).toBe(true);
    });
  });

  describe('2. Створення броні на 1/2/3 години та пакет «3+1» (POST /api/bookings)', () => {
    it('повинен створити бронь на 2 години з додатковими послугами', async () => {
      const startTime = new Date(Date.now() + 3600 * 1000 * 10).toISOString();
      const res = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          computerId: 'comp-1',
          tariffId: 'tariff-1',
          startTime,
          durationHours: 2,
          extras: [
            { name: 'Red Bull Energy Drink 0.25л', price: 65.0, quantity: 1 },
          ],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.prepaidAmount).toBe(185.0); // 60*2 + 65
      expect(res.body.data.extras.length).toBe(1);
      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('пакет «3+1»: повинен виділити слот на 4 години, але нарахувати оплату суворо за 3 години', async () => {
      const startTime = new Date(Date.now() + 3600 * 1000 * 15).toISOString();
      const res = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          placeId: 'comp-2',
          tariffId: 'tariff-1', // 60 грн/год
          startTime,
          isPackage3Plus1: true,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      const start = new Date(data.startTime).getTime();
      const end = new Date(data.endTime).getTime();
      const diffHours = (end - start) / (3600 * 1000);

      // Слот триває рівно 4 години
      expect(diffHours).toBe(4);
      // Оплата за 3 години: 60 * 3 = 180 грн
      expect(data.prepaidAmount).toBe(180.0);
      expect(data.isPackage3Plus1).toBe(true);
    });
  });

  describe('3. Захист від подвійного бронювання (Double-Booking Conflict)', () => {
    it('паралельні або повторні запити на той самий ПК на перетинний час повинні повертати 409 Conflict', async () => {
      const startTime = new Date(Date.now() + 3600 * 1000 * 30).toISOString();

      // Перший запит
      const firstRes = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          placeId: 'comp-4',
          tariffId: 'tariff-1',
          startTime,
          durationHours: 2,
        })
        .expect(201);

      expect(firstRes.body.success).toBe(true);

      // Другий запит на те саме місце в той самий час
      const conflictRes = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          placeId: 'comp-4',
          tariffId: 'tariff-1',
          startTime,
          durationHours: 2,
        })
        .expect(409);

      expect(conflictRes.body.success).toBe(false);
      expect(conflictRes.body.messages[0]).toContain('вже заброньоване');
    });
  });

  describe('4. Утримання місця на 10 хвилин (Hold TTL)', () => {
    let holdBookingId: string;

    it('повинен створювати утримання (isHold: true) зі статусом HOLD та holdExpiresAt на 10 хв', async () => {
      const startTime = new Date(Date.now() + 3600 * 1000 * 40).toISOString();
      const res = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          placeId: 'comp-5',
          tariffId: 'tariff-1',
          startTime,
          durationHours: 1,
          isHold: true,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('HOLD');
      expect(res.body.data.holdExpiresAt).toBeDefined();
      holdBookingId = res.body.data.id;
    });

    it('POST /api/bookings/:id/confirm повинен фіксувати утримане місце і знімати hold TTL', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/bookings/${holdBookingId}/confirm`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ isPaidOnline: true })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CONFIRMED');
      expect(res.body.data.holdExpiresAt).toBeNull();
    });
  });

  describe('5. Правило 2 годин (Скасування та перенесення)', () => {
    it('повинен ВІДХИЛЯТИ скасування зі статусом 400, якщо до початку сесії менше 2 годин', async () => {
      const soonStartTime = new Date(Date.now() + 3600 * 1000 * 1).toISOString(); // через 1 годину (< 2 год)
      const createRes = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          placeId: 'comp-6',
          tariffId: 'tariff-1',
          startTime: soonStartTime,
          durationHours: 1,
        })
        .expect(201);

      const bookingId = createRes.body.data.id;

      // Спроба скасувати
      const cancelRes = await request(app.getHttpServer())
        .post(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ reason: 'Термінові справи' })
        .expect(400);

      expect(cancelRes.body.success).toBe(false);
      expect(cancelRes.body.messages[0]).toContain('Правило 2 годин');
    });

    it('повинен УСПІШНО скасовувати бронь, якщо до початку сесії більше 2 годин', async () => {
      const futureStartTime = new Date(Date.now() + 3600 * 1000 * 50).toISOString(); // через 50 годин (>= 2 год)
      const createRes = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          placeId: 'comp-6',
          tariffId: 'tariff-1',
          startTime: futureStartTime,
          durationHours: 1,
        })
        .expect(201);

      const bookingId = createRes.body.data.id;

      const cancelRes = await request(app.getHttpServer())
        .post(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ reason: 'Зміна планів' })
        .expect(200);

      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.data.status).toBe('CANCELLED');
      expect(cancelRes.body.data.refundedAmount).toBe(60.0);
    });

    it('повинен ВІДХИЛЯТИ перенесення зі статусом 400, якщо до старту менше 2 годин', async () => {
      const soonStartTime = new Date(Date.now() + 3600 * 1000 * 1.5).toISOString(); // 1.5 год (< 2 год)
      const createRes = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          placeId: 'comp-7',
          tariffId: 'tariff-1',
          startTime: soonStartTime,
          durationHours: 1,
        })
        .expect(201);

      const bookingId = createRes.body.data.id;
      const newTime = new Date(Date.now() + 3600 * 1000 * 60).toISOString();

      const rescheduleRes = await request(app.getHttpServer())
        .post(`/api/bookings/${bookingId}/reschedule`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ newStartTime: newTime })
        .expect(400);

      expect(rescheduleRes.body.success).toBe(false);
      expect(rescheduleRes.body.messages[0]).toContain('Правило 2 годин');
    });

    it('повинен УСПІШНО переносити час броні, якщо до старту більше 2 годин', async () => {
      const futureStartTime = new Date(Date.now() + 3600 * 1000 * 70).toISOString();
      const createRes = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          placeId: 'comp-7',
          tariffId: 'tariff-1',
          startTime: futureStartTime,
          durationHours: 1,
        })
        .expect(201);

      const bookingId = createRes.body.data.id;
      const newTime = new Date(Date.now() + 3600 * 1000 * 80).toISOString();

      const rescheduleRes = await request(app.getHttpServer())
        .post(`/api/bookings/${bookingId}/reschedule`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ newStartTime: newTime })
        .expect(200);

      expect(rescheduleRes.body.success).toBe(true);
      expect(rescheduleRes.body.data.message).toContain('перенесено за правилом 2 годин');
      expect(new Date(rescheduleRes.body.data.startTime).toISOString()).toBe(newTime);
    });
  });

  describe('6. Чек-ін (GET /api/bookings/check-in): пошук картки без старту сесії', () => {
    it('повинен знаходити картку броні за токеном і повертати sessionStarted: false', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/bookings/check-in')
        .query({ token: 'QR_BOOK_OBSIDIAN_VIP_01_TEST' })
        .expect(200);

      expect(res.body.success).toBe(true);
      const card = res.body.data;
      expect(card.bookingId).toBeDefined();
      expect(card.clientName).toBeDefined();
      expect(card.phone).toBeDefined();
      expect(card.placeName).toBeDefined();
      expect(card.paymentStatus).toBeDefined();
      // Суворо за ТЗ тижня 4: чек-ін НЕ стартує сесію
      expect(card.sessionStarted).toBe(false);
      expect(card.canCheckIn).toBe(true);
    });

    it('повинен повертати 404 Not Found, якщо токен не знайдено', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/bookings/check-in')
        .query({ token: 'UNKNOWN_QR_CODE_12345' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('7. Пошук сусідніх місць для команд (GET /api/bookings/adjacent-seats)', () => {
    it('повинен повертати групи доступних суміжних місць', async () => {
      const startTime = new Date(Date.now() + 3600 * 1000 * 90).toISOString();
      const res = await request(app.getHttpServer())
        .get('/api/bookings/adjacent-seats')
        .query({
          zoneId: 'zone-1-standard',
          seatsCount: 2,
          startTime,
          durationHours: 2,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.zoneId).toBe('zone-1-standard');
      expect(Array.isArray(res.body.data.adjacentGroups)).toBe(true);
    });
  });

  describe('8. Календар та список бронювань', () => {
    it('GET /api/bookings/calendar повинен повертати слоти ПК на обрану дату', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/bookings/calendar')
        .query({ date: '2026-11-25' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.date).toBe('2026-11-25');
      expect(Array.isArray(res.body.data.slots)).toBe(true);
    });

    it('GET /api/bookings/my повинен повертати список моїх бронювань', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
