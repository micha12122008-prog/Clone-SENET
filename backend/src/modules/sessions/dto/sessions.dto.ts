import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class StartSessionDto {
  @ApiProperty({ example: 'comp-1', description: 'ID комп’ютера' })
  @IsString()
  @IsNotEmpty()
  computerId: string;

  @ApiProperty({ example: 'tariff-1', description: 'ID тарифу' })
  @IsString()
  @IsNotEmpty()
  tariffId: string;

  @ApiPropertyOptional({ example: 'user-1', description: 'ID клієнта (якщо пустий — гостьова сесія)' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ example: 60, description: 'Тривалість у хвилинах' })
  @IsNumber()
  @IsOptional()
  customDurationMinutes?: number;
}

export class ExtendSessionDto {
  @ApiProperty({ example: 60, description: 'Додатковий час у хвилинах' })
  @IsNumber()
  additionalMinutes: number;
}

export class ChangePcDto {
  @ApiProperty({ example: 'comp-3', description: 'ID нового вільного комп’ютера' })
  @IsString()
  @IsNotEmpty()
  newComputerId: string;
}

export class QrCheckInDto {
  @ApiPropertyOptional({ example: 'QR_BOOKING_OBSIDIAN_VIP_01_TEST', description: 'QR-код броні або клієнта' })
  @IsString()
  @IsOptional()
  qrCode?: string;

  @ApiPropertyOptional({ example: '+380993334455', description: 'Номер телефону клієнта для ручного пошуку' })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreateReviewDto {
  @ApiProperty({ example: 5, description: 'Оцінка сесії (від 1 до 5 зірочок)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Топовий ПК, монітор 240Hz просто космос!', description: 'Текстовий відгук' })
  @IsString()
  @IsOptional()
  comment?: string;
}
