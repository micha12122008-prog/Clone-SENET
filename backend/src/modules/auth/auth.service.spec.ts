import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let otpService: OtpService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        OtpService,
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'test_jwt_access_secret_123456';
              if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
              if (key === 'JWT_REFRESH_SECRET') return 'test_jwt_refresh_secret_123456';
              if (key === 'JWT_REFRESH_EXPIRES_IN') return '30d';
              return defaultValue;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn().mockResolvedValue(null),
              findUnique: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockImplementation((args) => ({
                id: 'generated-mock-uuid',
                ...args.data,
                createdAt: new Date(),
                updatedAt: new Date(),
              })),
              update: jest.fn().mockImplementation((args) => ({
                id: args.where.id,
                ...args.data,
                updatedAt: new Date(),
              })),
              findMany: jest.fn().mockResolvedValue([]),
              count: jest.fn().mockResolvedValue(0),
            },
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    otpService = module.get<OtpService>(OtpService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(usersService).toBeDefined();
    expect(otpService).toBeDefined();
  });

  describe('Registration & Roles', () => {
    it('should register a new CLIENT and return dev OTP code', async () => {
      const res = await authService.register({
        email: 'newplayer@obsidian.ua',
        phone: '+380997778899',
        username: 'epic_player',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'Іван',
        lastName: 'Тестовий',
        role: UserRole.CLIENT,
      });

      expect(res.user).toBeDefined();
      expect(res.user.email).toBe('newplayer@obsidian.ua');
      expect(res.user.role).toBe(UserRole.CLIENT);
      expect(res.code).toBeDefined();
      expect(res.code).toHaveLength(6);
    });

    it('should register a new ADMIN and return dev OTP code', async () => {
      const res = await authService.register({
        email: 'newadmin@obsidian.ua',
        phone: '+380998889900',
        username: 'super_admin',
        password: 'AdminPassword123!',
        role: UserRole.ADMIN,
      });

      expect(res.user.role).toBe(UserRole.ADMIN);
      expect(res.code).toBeDefined();
    });

    it('should throw BadRequestException if passwords do not match', async () => {
      await expect(
        authService.register({
          email: 'mismatch@obsidian.ua',
          phone: '+380991234567',
          username: 'mismatch_user',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if duplicate email or phone is registered', async () => {
      await authService.register({
        email: 'duplicate@obsidian.ua',
        phone: '+380991119988',
        username: 'dup1',
        password: 'Password123!',
      });

      await expect(
        authService.register({
          email: 'duplicate@obsidian.ua',
          phone: '+380992229988',
          username: 'dup2',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Login (email or phone or username + password)', () => {
    it('should successfully login existing seeded admin by email', async () => {
      const res = await authService.login({
        login: 'admin@obsidianclub.ua',
        password: 'Password123!',
      });

      expect(res.accessToken).toBeDefined();
      expect(res.refreshToken).toBeDefined();
      expect(res.user.role).toBe(UserRole.ADMIN);
    });

    it('should successfully login existing client by phone', async () => {
      const res = await authService.login({
        login: '+380993334455',
        password: 'Password123!',
      });

      expect(res.accessToken).toBeDefined();
      expect(res.user.username).toBe('s1mple_pro');
      expect(res.user.role).toBe(UserRole.CLIENT);
    });

    it('should successfully login existing client by username', async () => {
      const res = await authService.login({
        login: 'b1t_clutch',
        password: 'Password123!',
      });

      expect(res.accessToken).toBeDefined();
      expect(res.user.role).toBe(UserRole.CLIENT);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      await expect(
        authService.login({
          login: 'admin@obsidianclub.ua',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      await expect(
        authService.login({
          login: 'nonexistent@obsidian.ua',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('OTP flow (send, verify, change target)', () => {
    it('should send OTP and return dev code', async () => {
      const res = await authService.sendOtp({
        target: '+380995556677',
        type: 'REGISTRATION',
      });

      expect(res.success).toBe(true);
      expect(res.code).toBeDefined();
      expect(res.code).toHaveLength(6);
    });

    it('should verify OTP and return tokens for registered user', async () => {
      // First send OTP for player1
      const sendRes = await authService.sendOtp({
        target: '+380993334455',
        type: 'REGISTRATION',
      });

      const verifyRes = await authService.verifyOtp({
        target: '+380993334455',
        code: sendRes.code,
      });

      expect(verifyRes.success).toBe(true);
      expect(verifyRes.verified).toBe(true);
      expect(verifyRes.accessToken).toBeDefined();
      expect(verifyRes.user).toBeDefined();
      expect(verifyRes.user?.username).toBe('s1mple_pro');
    });

    it('should change OTP target and issue new OTP code', async () => {
      const oldTarget = '+380991113355';
      const newTarget = '+380992224466';

      await authService.sendOtp({ target: oldTarget, type: 'REGISTRATION' });

      const changeRes = await authService.changeOtpTarget({
        oldTarget,
        newTarget,
        type: 'REGISTRATION',
      });

      expect(changeRes.success).toBe(true);
      expect(changeRes.target).toBe(newTarget);
      expect(changeRes.code).toBeDefined();

      // Verifying with new target and new code must succeed
      const verifyRes = await authService.verifyOtp({
        target: newTarget,
        code: changeRes.code,
      });
      expect(verifyRes.verified).toBe(true);
    });
  });

  describe('Password reset flow', () => {
    it('should request reset OTP and confirm new password successfully', async () => {
      // 1. Request OTP
      const resetReq = await authService.requestPasswordReset({
        identifier: 'player2@gmail.com',
      });

      expect(resetReq.success).toBe(true);
      expect(resetReq.code).toBeDefined();

      // 2. Confirm reset with code
      const confirmRes = await authService.confirmPasswordReset({
        identifier: 'player2@gmail.com',
        code: resetReq.code,
        newPassword: 'BrandNewPassword2026!',
      });

      expect(confirmRes.success).toBe(true);

      // 3. User can now login with new password
      const loginRes = await authService.login({
        login: 'player2@gmail.com',
        password: 'BrandNewPassword2026!',
      });
      expect(loginRes.accessToken).toBeDefined();
    });

    it('should throw NotFoundException if reset requested for unknown user', async () => {
      await expect(
        authService.requestPasswordReset({
          identifier: 'unknown@user.com',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on confirm reset with bad OTP', async () => {
      await authService.requestPasswordReset({
        identifier: 'player1@gmail.com',
      });

      await expect(
        authService.confirmPasswordReset({
          identifier: 'player1@gmail.com',
          code: '999999',
          newPassword: 'SomePassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
