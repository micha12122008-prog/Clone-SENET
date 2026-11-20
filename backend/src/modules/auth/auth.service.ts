import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
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

export interface VerifyOtpResult {
  success: boolean;
  verified: boolean;
  target: string;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: any;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Реєстрація нового користувача (клієнта або адміністратора)
   */
  async register(dto: RegisterDto) {
    if (dto.confirmPassword && dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Паролі не співпадають');
    }

    const user = await this.usersService.create(dto);

    // Автоматична генерація коду OTP для верифікації контакту (телефону або email)
    const targetContact = dto.phone || dto.email;
    const otp = this.otpService.generateOtp(targetContact, 'REGISTRATION');

    return {
      message: 'Користувача успішно зареєстровано. Надіслано код підтвердження.',
      user: this.usersService.sanitize(user),
      otpTarget: targetContact,
      code: otp.code,
      expiresInSeconds: otp.expiresInSeconds,
    };
  }

  /**
   * Авторизація за email, номером телефону або логіном і паролем
   */
  async login(dto: LoginDto) {
    const user = await this.usersService.findByLogin(dto.login);

    if (!user) {
      throw new UnauthorizedException('Невірний логін або пароль');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Невірний логін або пароль');
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.usersService.sanitize(user),
    };
  }

  /**
   * Генерація та надсилання OTP-коду
   */
  async sendOtp(dto: SendOtpDto) {
    const type = dto.type || 'REGISTRATION';
    const otp = this.otpService.generateOtp(dto.target, type);

    return {
      success: true,
      target: dto.target,
      type,
      message: 'Код підтвердження успішно відправлено. Термін дії: 5 хвилин.',
      code: otp.code,
      expiresInSeconds: otp.expiresInSeconds,
    };
  }

  /**
   * Верифікація OTP-коду
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<VerifyOtpResult> {
    const type = dto.type || 'REGISTRATION';
    this.otpService.verifyOtp(dto.target, dto.code, type);

    // Перевірка, чи вже існує користувач із таким контактом
    const user = await this.usersService.findByIdentifier(dto.target);

    if (user) {
      // Якщо користувач зареєстрований — повертаємо JWT токени для переходу далі
      const tokens = await this.generateTokens(user);
      return {
        success: true,
        verified: true,
        target: dto.target,
        message: 'Номер/email успішно підтверджено.',
        ...tokens,
        user: this.usersService.sanitize(user),
      };
    }

    return {
      success: true,
      verified: true,
      target: dto.target,
      message: 'Номер/email успішно підтверджено. Продовжуйте реєстрацію.',
    };
  }

  /**
   * Зміна цільового номеру телефону або email під час OTP-верифікації
   */
  async changeOtpTarget(dto: ChangeOtpTargetDto) {
    const oldTarget = dto.oldTarget.trim();
    const newTarget = dto.newTarget.trim();

    // Перевірка: чи новий контакт не зайнятий іншим користувачем
    const conflictUser = await this.usersService.findByIdentifier(newTarget);
    if (conflictUser && conflictUser.phone !== oldTarget && conflictUser.email !== oldTarget.toLowerCase()) {
      throw new ConflictException('Вказаний email або телефон вже використовується іншим акаунтом');
    }

    // Якщо користувач уже є в системі зі старим контактом — оновлюємо його контакт
    await this.usersService.updateContactTarget(oldTarget, newTarget);

    const type = dto.type || 'REGISTRATION';
    const otp = this.otpService.changeTarget(oldTarget, newTarget, type);

    return {
      success: true,
      oldTarget,
      target: newTarget,
      message: 'Контактні дані успішно змінено. Новий код надіслано.',
      code: otp.code,
      expiresInSeconds: otp.expiresInSeconds,
    };
  }

  /**
   * Запит на скидання пароля (генерація OTP)
   */
  async requestPasswordReset(dto: ForgotPasswordDto) {
    const identifier = (dto.identifier || dto.target || '').trim();
    if (!identifier) {
      throw new BadRequestException('Вкажіть email або номер телефону');
    }

    const user = await this.usersService.findByIdentifier(identifier);
    if (!user) {
      throw new NotFoundException('Користувача з вказаним email або телефоном не знайдено');
    }

    const otp = this.otpService.generateOtp(identifier, 'PASSWORD_RESET');

    return {
      success: true,
      target: identifier,
      message: 'Код для скидання пароля успішно згенеровано.',
      code: otp.code,
      expiresInSeconds: otp.expiresInSeconds,
    };
  }

  /**
   * Підтвердження скидання пароля з новим паролем та OTP-кодом
   */
  async confirmPasswordReset(dto: ResetPasswordDto) {
    const identifier = (dto.identifier || dto.target || '').trim();
    if (!identifier) {
      throw new BadRequestException('Вкажіть email або номер телефону');
    }

    const user = await this.usersService.findByIdentifier(identifier);
    if (!user) {
      throw new NotFoundException('Користувача з вказаним email або телефоном не знайдено');
    }

    this.otpService.consumeOtp(identifier, dto.code, 'PASSWORD_RESET');

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(user.id, newPasswordHash);

    return {
      success: true,
      message: 'Пароль успішно змінено. Тепер ви можете увійти з новим паролем.',
    };
  }

  /**
   * Оновлення пари токенів за Refresh Token
   */
  async refreshToken(dto: RefreshTokenDto) {
    try {
      const refreshSecret = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'senet_super_secret_jwt_refresh_key_2026',
      );
      const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Користувача більше не існує');
      }

      const tokens = await this.generateTokens(user);
      return tokens;
    } catch {
      throw new UnauthorizedException('Недійсний або прострочений Refresh токен');
    }
  }

  /**
   * Отримання даних поточного користувача за його ID з JWT токена
   */
  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    return this.usersService.sanitize(user);
  }

  /**
   * Генерація пари Access та Refresh JWT токенів
   */
  private async generateTokens(user: { id: string; email: string; phone: string; username: string; role: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      username: user.username,
      role: user.role,
    };

    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'senet_super_secret_jwt_access_key_2026',
    );
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'senet_super_secret_jwt_refresh_key_2026',
    );
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }
}
