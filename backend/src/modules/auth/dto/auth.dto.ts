import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'player1@gmail.com', description: 'Електронна пошта' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+380991112233', description: 'Номер телефону' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 's1mple_pro', description: 'Нікнейм гравця' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'Password123!', description: 'Пароль (мін. 6 символів)', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

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
}

export class LoginDto {
  @ApiProperty({ example: 'admin@obsidianclub.ua', description: 'Email або телефон або нікнейм' })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ example: 'Password123!', description: 'Пароль' })
  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  target: string;

  @ApiPropertyOptional({
    enum: ['REGISTRATION', 'PASSWORD_RESET', 'LOGIN'],
    example: 'REGISTRATION',
    description: 'Тип верифікації',
  })
  @IsOptional()
  type?: 'REGISTRATION' | 'PASSWORD_RESET' | 'LOGIN';
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+380991112233', description: 'Номер телефону або email' })
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiProperty({ example: '482910', description: '6-значний цифровий код' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
