import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  ChangeOtpTargetDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  SendOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Реєстрація нового користувача (клієнта або адміністратора) та генерація OTP',
  })
  @ApiResponse({ status: 201, description: 'Користувача успішно зареєстровано' })
  @ApiResponse({ status: 400, description: 'Помилка валідації вхідних даних або паролі не співпадають' })
  @ApiResponse({ status: 409, description: 'Користувач із таким email, телефоном або нікнеймом уже існує' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Авторизація в системі за email, номером телефону або логіном і паролем',
  })
  @ApiResponse({ status: 200, description: 'Успішна авторизація (повертає JWT токени та профіль)' })
  @ApiResponse({ status: 401, description: 'Невірний логін або пароль' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Генерація та відправка одноразового цифрового коду (OTP)',
    description: 'У dev API код OTP повертається безпосередньо у відповіді',
  })
  @ApiResponse({ status: 200, description: 'Код надіслано на вказаний телефон/email' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Перевірка та підтвердження OTP-коду',
    description: 'Якщо акаунт існує, повертає токен для переходу далі',
  })
  @ApiResponse({ status: 200, description: 'Код успішно верифіковано' })
  @ApiResponse({ status: 400, description: 'Невірний або прострочений код' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('otp/change-target')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Зміна контактного номера або email під час OTP-підтвердження',
  })
  @ApiResponse({ status: 200, description: 'Контакт успішно змінено та надіслано новий код' })
  @ApiResponse({ status: 409, description: 'Новий контакт уже зайнятий іншим користувачем' })
  async changeOtpTarget(@Body() dto: ChangeOtpTargetDto) {
    return this.authService.changeOtpTarget(dto);
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Запит на скидання пароля (генерація OTP-коду)',
    description: 'Код для скидання пароля повертається у відповіді dev API',
  })
  @ApiResponse({ status: 200, description: 'Код для скидання пароля згенеровано' })
  @ApiResponse({ status: 404, description: 'Користувача з таким email або телефоном не знайдено' })
  async requestPasswordReset(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Аліас для запиту на скидання пароля' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Підтвердження скидання пароля за допомогою OTP-коду та встановлення нового пароля',
  })
  @ApiResponse({ status: 200, description: 'Пароль успішно змінено' })
  @ApiResponse({ status: 400, description: 'Невірний або прострочений OTP-код' })
  @ApiResponse({ status: 404, description: 'Користувача не знайдено' })
  async confirmPasswordReset(@Body() dto: ResetPasswordDto) {
    return this.authService.confirmPasswordReset(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Аліас для підтвердження скидання пароля' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.confirmPasswordReset(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Оновлення пари JWT токенів' })
  @ApiResponse({ status: 200, description: 'Токени успішно оновлено' })
  @ApiResponse({ status: 401, description: 'Недійсний refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Вихід із системи (інвалідація сесії)' })
  @ApiResponse({ status: 200, description: 'Успішний вихід' })
  @ApiResponse({ status: 401, description: 'Необхідна авторизація' })
  async logout() {
    return { message: 'Сесію успішно завершено' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Отримання профілю поточного авторизованого користувача',
  })
  @ApiResponse({ status: 200, description: 'Дані поточного користувача' })
  @ApiResponse({ status: 401, description: 'Необхідна авторизація' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Get('admin-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Тестовий захищений ендпоінт тільки для ролі ADMIN',
    description: 'Без токена: 401, з роллю CLIENT: 403, з роллю ADMIN: 200',
  })
  @ApiResponse({ status: 200, description: 'Доступ підтверджено для ADMIN' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (чужа роль)' })
  async adminCheck(@CurrentUser() user: any) {
    return {
      message: 'Доступ дозволено: ви маєте права адміністратора клубу',
      user,
    };
  }

  @Get('client-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Тестовий захищений ендпоінт тільки для ролі CLIENT',
    description: 'Без токена: 401, з роллю ADMIN: 403, з роллю CLIENT: 200',
  })
  @ApiResponse({ status: 200, description: 'Доступ підтверджено для CLIENT' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (чужа роль)' })
  async clientCheck(@CurrentUser() user: any) {
    return {
      message: 'Доступ дозволено: ви маєте статус клієнта клубу',
      user,
    };
  }
}
