import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto, RefreshTokenDto, RegisterDto, SendOtpDto, VerifyOtpDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Post('register')
  @ApiOperation({ summary: 'Реєстрація нового клієнта (гравця) з базовими даними' })
  @ApiResponse({ status: 201, description: 'Користувача успішно зареєстровано' })
  register(@Body() dto: RegisterDto) {
    return {
      message: 'Користувача успішно зареєстровано. Надіслано код підтвердження.',
      user: {
        id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        email: dto.email,
        phone: dto.phone,
        username: dto.username,
        role: 'CLIENT',
        level: 1,
        balance: 0.0,
      },
    };
  }

  @Post('otp/send')
  @ApiOperation({ summary: 'Генерація та відправка одноразового цифрового коду (OTP)' })
  @ApiResponse({ status: 200, description: 'Код надіслано на вказаний телефон/email' })
  sendOtp(@Body() dto: SendOtpDto) {
    return {
      success: true,
      target: dto.target,
      message: 'Код підтвердження успішно відправлено. Термін дії: 5 хвилин.',
      expiresInSeconds: 300,
    };
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Перевірка та підтвердження OTP-коду' })
  @ApiResponse({ status: 200, description: 'Код успішно верифіковано' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return {
      success: true,
      verified: true,
      target: dto.target,
      message: 'Номер успішно підтверджено. Продовжуйте реєстрацію.',
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Авторизація в системі (отримання Access + Refresh токенів)' })
  @ApiResponse({ status: 200, description: 'Успішна авторизація' })
  login(@Body() dto: LoginDto) {
    const isAdmin = dto.login.includes('admin') || dto.login.includes('owner');
    return {
      accessToken: 'mock_jwt_access_token_obsidian_2026',
      refreshToken: 'mock_jwt_refresh_token_obsidian_2026',
      expiresIn: 900,
      user: {
        id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        login: dto.login,
        role: isAdmin ? 'ADMIN' : 'CLIENT',
        level: isAdmin ? 25 : 18,
        avatarFrame: isAdmin ? 'frame_cyber_admin' : 'frame_pro_sniper',
        balance: 450.0,
      },
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Оновлення пари JWT токенів' })
  @ApiResponse({ status: 200, description: 'Токени оновлено' })
  refresh(@Body() dto: RefreshTokenDto) {
    return {
      accessToken: 'new_mock_jwt_access_token_2026',
      refreshToken: dto.refreshToken,
      expiresIn: 900,
    };
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Вихід із системи (інвалідація сесії)' })
  @ApiResponse({ status: 200, description: 'Успішний вихід' })
  logout() {
    return { message: 'Сесію успішно завершено' };
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Отримання профілю поточного авторизованого користувача з рівнями та рамками' })
  @ApiResponse({ status: 200, description: 'Дані поточного користувача' })
  getMe() {
    return {
      id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
      username: 's1mple_pro',
      email: 'player1@gmail.com',
      phone: '+380993334455',
      role: 'CLIENT',
      status: 'ACTIVE',
      level: 18,
      experience: 3450,
      avatarFrame: 'frame_pro_sniper',
      bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
      balance: 450.0,
      bonusBalance: 80.0,
      totalPlayTimeMinutes: 1240,
      totalSpent: 1650.0,
      visitsCount: 18,
    };
  }
}
