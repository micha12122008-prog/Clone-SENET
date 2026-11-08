import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'player1@gmail.com', description: 'Електронна пошта користувача' })
  @IsEmail({}, { message: 'Некоректний формат електронної пошти' })
  email: string;

  @ApiProperty({ example: '+380991112233', description: 'Номер телефону користувача' })
  @IsString()
  @IsNotEmpty({ message: 'Номер телефону є обов’язковим' })
  phone: string;

  @ApiProperty({ example: 's1mple_pro', description: 'Нікнейм гравця або логін' })
  @IsString()
  @IsNotEmpty({ message: 'Нікнейм є обов’язковим' })
  username: string;

  @ApiProperty({ example: 'Password123!', description: 'Пароль (мін. 6 символів)', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Пароль має містити щонайменше 6 символів' })
  password: string;

  @ApiPropertyOptional({ example: 'Password123!', description: 'Підтвердження пароля' })
  @IsString()
  @IsOptional()
  confirmPassword?: string;

  @ApiPropertyOptional({ example: 'Олександр', description: 'Ім’я' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Костилєв', description: 'Прізвище' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: '1997-10-02', description: 'Дата народження (РРРР-ММ-ДД)' })
  @IsString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.CLIENT,
    description: 'Роль користувача (CLIENT або ADMIN, за замовчуванням CLIENT)',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: true, description: 'Згода з правилами клубу' })
  @IsBoolean()
  @IsOptional()
  agreeToTerms?: boolean;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@obsidianclub.ua', description: 'Email або номер телефону або нікнейм' })
  @IsString()
  @IsNotEmpty({ message: 'Вкажіть логін (email, телефон або нікнейм)' })
  login: string;

  @ApiProperty({ example: 'Password123!', description: 'Пароль користувача' })
  @IsString()
  @IsNotEmpty({ message: 'Вкажіть пароль' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Refresh Token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '+380991112233', description: 'Номер телефону або email для відправки OTP-коду' })
  @IsString()
  @IsNotEmpty({ message: 'Вкажіть цільовий телефон або email' })
  target: string;

  @ApiPropertyOptional({
    enum: ['REGISTRATION', 'PASSWORD_RESET', 'LOGIN', 'CHANGE_TARGET'],
    example: 'REGISTRATION',
    description: 'Тип верифікації OTP',
  })
  @IsOptional()
  type?: 'REGISTRATION' | 'PASSWORD_RESET' | 'LOGIN' | 'CHANGE_TARGET';
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+380991112233', description: 'Номер телефону або email' })
  @IsString()
  @IsNotEmpty({ message: 'Вкажіть цільовий телефон або email' })
  target: string;

  @ApiProperty({ example: '482910', description: '6-значний цифровий код OTP' })
  @IsString()
  @IsNotEmpty({ message: 'Вкажіть 6-значний код OTP' })
  code: string;

  @ApiPropertyOptional({
    enum: ['REGISTRATION', 'PASSWORD_RESET', 'LOGIN', 'CHANGE_TARGET'],
    example: 'REGISTRATION',
    description: 'Тип верифікації OTP',
  })
  @IsOptional()
  type?: 'REGISTRATION' | 'PASSWORD_RESET' | 'LOGIN' | 'CHANGE_TARGET';
}

export class ChangeOtpTargetDto {
  @ApiProperty({ example: '+380991112233', description: 'Попередній телефон або email' })
  @IsString()
  @IsNotEmpty({ message: 'Вкажіть попередній телефон або email' })
  oldTarget: string;

  @ApiProperty({ example: '+380998887766', description: 'Новий телефон або email' })
  @IsString()
  @IsNotEmpty({ message: 'Вкажіть новий телефон або email' })
  newTarget: string;

  @ApiPropertyOptional({
    enum: ['REGISTRATION', 'PASSWORD_RESET'],
    example: 'REGISTRATION',
    description: 'Тип операції',
  })
  @IsOptional()
  type?: 'REGISTRATION' | 'PASSWORD_RESET';
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'player1@gmail.com', description: 'Email або номер телефону для скидання пароля' })
  @IsString()
  @IsNotEmpty({ message: 'Вкажіть email або номер телефону' })
  identifier: string;

  @ApiPropertyOptional({ example: '+380993334455', description: 'Альтернативна назва цільового контакту' })
  @IsString()
  @IsOptional()
  target?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'player1@gmail.com', description: 'Email або номер телефону' })
  @IsString()
  @IsNotEmpty({ message: 'Вкажіть email або номер телефону' })
  identifier: string;

  @ApiPropertyOptional({ example: '+380993334455', description: 'Альтернативна назва цільового контакту' })
  @IsString()
  @IsOptional()
  target?: string;

  @ApiProperty({ example: '482910', description: '6-значний OTP-код із відповіді dev API' })
  @IsString()
  @IsNotEmpty({ message: 'Вкажіть код підтвердження' })
  code: string;

  @ApiProperty({ example: 'NewSecretPass123!', description: 'Новий пароль (мін. 6 символів)', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Новий пароль повинен містити щонайменше 6 символів' })
  newPassword: string;
}
