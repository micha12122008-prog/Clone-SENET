import { ApiProperty, PartialType } from '@nestjs/swagger';
import { TariffType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTariffDto {
  @ApiProperty({ example: '1 Година Standard', description: 'Назва тарифу' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: TariffType.HOURLY,
    enum: TariffType,
    description: 'Тип тарифу (HOURLY, PACKAGE_3_PLUS_1, CUSTOM)',
    default: TariffType.HOURLY,
    required: false,
  })
  @IsEnum(TariffType)
  @IsOptional()
  type?: TariffType;

  @ApiProperty({ example: 60.0, description: 'Вартість тарифу у гривнях (UAH)' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 60, description: 'Тривалість гри у хвилинах', required: false, default: 60 })
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @ApiProperty({ example: 'zone-1-standard', description: 'ID ігрової зони (опціонально)', required: false })
  @IsString()
  @IsOptional()
  zoneId?: string;

  @ApiProperty({
    example: 'Погодинний тариф для зони Standard',
    description: 'Опис умов тарифу',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateTariffDto extends PartialType(CreateTariffDto) {}

export class CalculatePriceDto {
  @ApiProperty({ example: 'tariff-1', description: 'ID тарифу' })
  @IsString()
  @IsNotEmpty()
  tariffId: string;

  @ApiProperty({ example: 120, description: 'Тривалість гри у хвилинах' })
  @IsInt()
  @Min(1)
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

export class TariffResponseDto {
  @ApiProperty({ example: 'tariff-uuid-1' })
  id: string;

  @ApiProperty({ example: '1 Година Standard' })
  name: string;

  @ApiProperty({ example: 'Погодинний тариф Standard', nullable: true })
  description: string | null;

  @ApiProperty({ enum: TariffType, example: TariffType.HOURLY })
  type: TariffType;

  @ApiProperty({ example: 60.0, description: 'Ціна в грн' })
  price: number;

  @ApiProperty({ example: 60, description: 'Тривалість у хвилинах' })
  durationMinutes: number;

  @ApiProperty({ example: 'zone-1-standard', nullable: true })
  zoneId: string | null;

  @ApiProperty({ example: 'Standard Zone' })
  zoneName: string;

  @ApiProperty({ example: '2026-10-01T10:00:00.000Z' })
  createdAt: string | Date;

  @ApiProperty({ example: '2026-10-01T10:00:00.000Z' })
  updatedAt: string | Date;
}
