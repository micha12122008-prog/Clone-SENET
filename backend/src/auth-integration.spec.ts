import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { UserRole } from '@prisma/client';

describe('Auth & Roles Integration E2E', () => {
  jest.setTimeout(30000);
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  let clientToken: string;
  let adminToken: string;
  let registeredClientPhone = '+380991110001';
  let registeredClientEmail = 'client_e2e@obsidianclub.ua';
  let registeredClientOtp: string;

  describe('1. Registration & OTP Flow', () => {
    it('should register a new client and return dev OTP code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: registeredClientEmail,
          phone: registeredClientPhone,
          username: 'client_e2e_user',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          firstName: 'Тест',
          lastName: 'Клієнт',
          role: UserRole.CLIENT,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(registeredClientEmail);
      expect(res.body.data.code).toBeDefined();
      expect(res.body.data.code).toHaveLength(6);
      registeredClientOtp = res.body.data.code;
    });

    it('should verify OTP and return tokens for registered client', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/otp/verify')
        .send({
          target: registeredClientPhone,
          code: registeredClientOtp,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.verified).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      clientToken = res.body.data.accessToken;
    });

    it('should change OTP target phone and issue new OTP code', async () => {
      const oldPhone = '+380995550011';
      const newPhone = '+380995550022';

      await request(app.getHttpServer())
        .post('/api/auth/otp/send')
        .send({ target: oldPhone, type: 'REGISTRATION' })
        .expect(200);

      const changeRes = await request(app.getHttpServer())
        .post('/api/auth/otp/change-target')
        .send({ oldTarget: oldPhone, newTarget: newPhone, type: 'REGISTRATION' })
        .expect(200);

      expect(changeRes.body.data.target).toBe(newPhone);
      expect(changeRes.body.data.code).toBeDefined();
    });
  });

  describe('2. Login Flow (email or phone or username)', () => {
    it('should login client by email and return JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          login: registeredClientEmail,
          password: 'Password123!',
        })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.role).toBe('CLIENT');
      clientToken = res.body.data.accessToken;
    });

    it('should login client by phone', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          login: registeredClientPhone,
          password: 'Password123!',
        })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should login admin by email and return ADMIN role', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          login: 'admin@obsidianclub.ua',
          password: 'Password123!',
        })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.role).toBe('ADMIN');
      adminToken = res.body.data.accessToken;
    });

    it('should reject login with wrong password (401)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          login: 'admin@obsidianclub.ua',
          password: 'IncorrectPassword!',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
    });
  });

  describe('3. Role-Based Access Control (401 without token, 403 for wrong role)', () => {
    it('GET /api/auth/me without token should return 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
    });

    it('GET /api/auth/me with client token should return 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(registeredClientEmail);
    });

    it('GET /api/auth/admin-check without token should return 401', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/admin-check')
        .expect(401);
    });

    it('GET /api/auth/admin-check with CLIENT token should return 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/admin-check')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(403);
    });

    it('GET /api/auth/admin-check with ADMIN token should return 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/admin-check')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/analytics/dashboard-summary without token should return 401', async () => {
      await request(app.getHttpServer())
        .get('/api/analytics/dashboard-summary')
        .expect(401);
    });

    it('GET /api/analytics/dashboard-summary with CLIENT token should return 403', async () => {
      await request(app.getHttpServer())
        .get('/api/analytics/dashboard-summary')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    it('GET /api/analytics/dashboard-summary with ADMIN token should return 200 with zero/no-data widgets', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/analytics/dashboard-summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.workload.text).toBe('немає даних');
      expect(res.body.data.activeSessions.count).toBe(0);
      expect(res.body.data.shiftRevenue.amount).toBe(0.0);
    });
  });

  describe('4. Password Reset Flow', () => {
    let resetCode: string;

    it('should request password reset OTP for client', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/password-reset/request')
        .send({ identifier: registeredClientEmail })
        .expect(200);

      expect(res.body.data.code).toBeDefined();
      resetCode = res.body.data.code;
    });

    it('should confirm password reset with OTP and new password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/password-reset/confirm')
        .send({
          identifier: registeredClientEmail,
          code: resetCode,
          newPassword: 'BrandNewClientPassword123!',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should login with the newly set password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          login: registeredClientEmail,
          password: 'BrandNewClientPassword123!',
        })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
    });
  });
});
