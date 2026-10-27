import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTariffDto {
  @ApiProperty({ example: '3 Години Пакет', description: 'Назва тарифу' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'PACKAGE', enum: ['HOURLY', 'PACKAGE', 'NIGHT', 'DAY', 'VIP'] })
  @IsEnum(['HOURLY', 'PACKAGE', 'NIGHT', 'DAY', 'VIP'])
  type: string;

  @ApiProperty({ example: 130.0, description: 'Вартість тарифу (грн)' })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 180, description: 'Тривалість у хвилинах', required: false })
  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @ApiProperty({ example: 'zone-1', description: 'ID зони (необов’язково)', required: false })
  @IsString()
  @IsOptional()
  zoneId?: string;

  @ApiProperty({ example: [1, 2, 3, 4, 5, 6, 7], description: 'Дні дії (1-7)', required: false })
  @IsArray()
  @IsOptional()
  allowedDays?: number[];
}

export class CalculatePriceDto {
  @ApiProperty({ example: 'tariff-1', description: 'ID тарифу' })
  @IsString()
  @IsNotEmpty()
  tariffId: string;

  @ApiProperty({ example: 120, description: 'Тривалість гри у хвилинах' })
  @IsNumber()
  durationMinutes: number;

  @ApiProperty({ example: 'WELCOME', description: 'Промокод на знижку', required: false })
  @IsString()
  @IsOptional()
  promoCode?: string;
}

export class ValidatePromoDto {
  @ApiProperty({ example: 'WELCOME', description: 'Промокод' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
