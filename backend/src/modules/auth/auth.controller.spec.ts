import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn().mockResolvedValue({
      message: 'Користувача успішно зареєстровано. Надіслано код підтвердження.',
      user: { id: 'test-id', email: 'test@obsidian.ua', role: 'CLIENT' },
      code: '123456',
      expiresInSeconds: 300,
    }),
    login: jest.fn().mockResolvedValue({
      accessToken: 'mock_jwt_access_token',
      refreshToken: 'mock_jwt_refresh_token',
      expiresIn: 900,
      user: { id: 'test-id', role: 'CLIENT' },
    }),
    sendOtp: jest.fn().mockResolvedValue({
      success: true,
      target: '+380991112233',
      code: '654321',
      expiresInSeconds: 300,
    }),
    verifyOtp: jest.fn().mockResolvedValue({
      success: true,
      verified: true,
      target: '+380991112233',
    }),
    changeOtpTarget: jest.fn().mockResolvedValue({
      success: true,
      target: '+380998889900',
      code: '987654',
      expiresInSeconds: 300,
    }),
    requestPasswordReset: jest.fn().mockResolvedValue({
      success: true,
      target: 'player@gmail.com',
      code: '112233',
      expiresInSeconds: 300,
    }),
    confirmPasswordReset: jest.fn().mockResolvedValue({
      success: true,
      message: 'Пароль успішно змінено',
    }),
    refreshToken: jest.fn().mockResolvedValue({
      accessToken: 'new_token',
      refreshToken: 'new_refresh',
      expiresIn: 900,
    }),
    getMe: jest.fn().mockResolvedValue({
      id: 'test-id',
      username: 's1mple_pro',
      role: 'CLIENT',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register() should call authService.register', async () => {
    const dto = {
      email: 'test@obsidian.ua',
      phone: '+380991112233',
      username: 'testuser',
      password: 'Password123!',
      role: UserRole.CLIENT,
    };
    const res = await controller.register(dto);
    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(res.code).toBe('123456');
  });

  it('login() should call authService.login', async () => {
    const dto = { login: 'test@obsidian.ua', password: 'Password123!' };
    const res = await controller.login(dto);
    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(res.accessToken).toBe('mock_jwt_access_token');
  });

  it('sendOtp() should call authService.sendOtp', async () => {
    const dto = { target: '+380991112233' };
    const res = await controller.sendOtp(dto);
    expect(authService.sendOtp).toHaveBeenCalledWith(dto);
    expect(res.code).toBe('654321');
  });

  it('verifyOtp() should call authService.verifyOtp', async () => {
    const dto = { target: '+380991112233', code: '654321' };
    const res = await controller.verifyOtp(dto);
    expect(authService.verifyOtp).toHaveBeenCalledWith(dto);
    expect(res.verified).toBe(true);
  });

  it('changeOtpTarget() should call authService.changeOtpTarget', async () => {
    const dto = { oldTarget: '+380991112233', newTarget: '+380998889900' };
    const res = await controller.changeOtpTarget(dto);
    expect(authService.changeOtpTarget).toHaveBeenCalledWith(dto);
    expect(res.target).toBe('+380998889900');
  });

  it('requestPasswordReset() should call authService.requestPasswordReset', async () => {
    const dto = { identifier: 'player@gmail.com' };
    const res = await controller.requestPasswordReset(dto);
    expect(authService.requestPasswordReset).toHaveBeenCalledWith(dto);
    expect(res.code).toBe('112233');
  });

  it('confirmPasswordReset() should call authService.confirmPasswordReset', async () => {
    const dto = {
      identifier: 'player@gmail.com',
      code: '112233',
      newPassword: 'NewPassword123!',
    };
    const res = await controller.confirmPasswordReset(dto);
    expect(authService.confirmPasswordReset).toHaveBeenCalledWith(dto);
    expect(res.success).toBe(true);
  });

  it('adminCheck() should return admin confirmation', async () => {
    const res = await controller.adminCheck({ id: 'admin-id', role: 'ADMIN' });
    expect(res.message).toContain('адміністратора');
  });

  it('clientCheck() should return client confirmation', async () => {
    const res = await controller.clientCheck({ id: 'client-id', role: 'CLIENT' });
    expect(res.message).toContain('клієнта');
  });
});
