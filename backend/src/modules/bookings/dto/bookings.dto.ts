import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateBookingExtraDto {
  @ApiProperty({ example: 'Red Bull Energy Drink 0.25л', description: 'Назва додаткової послуги або товару' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 65.0, description: 'Ціна за одиницю (грн)' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Кількість одиниць' })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;
}

export class CreateBookingDto {
  @ApiPropertyOptional({
    example: 'comp-uuid-1',
    description: 'ID комп’ютера / місця (Place UUID). Можна передавати placeId або computerId.',
  })
  @IsString()
  @IsOptional()
  placeId?: string;

  @ApiPropertyOptional({
    example: 'comp-uuid-1',
    description: 'Аліас для placeId (для сумісності з UI)',
  })
  @IsString()
  @IsOptional()
  computerId?: string;

  @ApiProperty({ example: 'tariff-uuid-1', description: 'ID обраного тарифу' })
  @IsString()
  @IsNotEmpty()
  tariffId: string;

  @ApiProperty({ example: '2026-11-25T18:00:00.000Z', description: 'Час початку сесії (ISO 8601)' })
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Тривалість у годинах: 1, 2, 3 або 4 (для пакету 3+1)',
  })
  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  durationHours?: number;

  @ApiPropertyOptional({
    example: '2026-11-25T21:00:00.000Z',
    description: 'Час завершення сесії (ISO 8601). Якщо не вказано — вираховується з durationHours.',
  })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Ознака пакету 3+1: 4 години слоту за ціною 3 годин без окремого гаманця',
  })
  @IsBoolean()
  @IsOptional()
  isPackage3Plus1?: boolean = false;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Чи оплачено онлайн (true — онлайн оплата, false — оплата готівкою/карткою на місці)',
  })
  @IsBoolean()
  @IsOptional()
  isPaidOnline?: boolean = false;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Утримання місця на 10 хвилин (hold TTL) перед фінальним підтвердженням',
  })
  @IsBoolean()
  @IsOptional()
  isHold?: boolean = false;

  @ApiPropertyOptional({
    example: 'user-uuid-1',
    description: 'ID клієнта (для адміністратора, який створює бронь на місці із залу)',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    type: [CreateBookingExtraDto],
    description: 'Додаткові послуги (напої, снеки, геймпад, VR-оператор)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBookingExtraDto)
  @IsOptional()
  extras?: CreateBookingExtraDto[];

  @ApiPropertyOptional({ example: 'Командне тренування перед турніром', description: 'Нотатки до броні' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AdjacentSeatsQueryDto {
  @ApiProperty({ example: 'zone-1-standard', description: 'ID зони клубу' })
  @IsString()
  @IsNotEmpty()
  zoneId: string;

  @ApiPropertyOptional({ example: 2, default: 2, description: 'Кількість потрібних сусідніх місць (від 2 до 10)' })
  @IsInt()
  @Min(2)
  @Max(10)
  @IsOptional()
  seatsCount?: number = 2;

  @ApiProperty({ example: '2026-11-25T18:00:00.000Z', description: 'Час початку сесії (ISO 8601)' })
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({ example: 2, default: 2, description: 'Тривалість у годинах (1, 2, 3 або 4)' })
  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  durationHours?: number = 2;
}

export class CheckInQueryDto {
  @ApiPropertyOptional({
    example: 'QR_BOOK_1700000000_123',
    description: 'Токен або QR-код бронювання (зчитаний камерою або введений вручну)',
  })
  @IsString()
  @IsOptional()
  token?: string;

  @ApiPropertyOptional({
    example: '+380993334455',
    description: 'Номер телефону клієнта для пошуку активної броні',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class RescheduleBookingDto {
  @ApiProperty({ example: '2026-11-25T20:00:00.000Z', description: 'Новий час початку сесії (ISO 8601)' })
  @IsDateString()
  newStartTime: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional({ example: 'Зміна планів клієнта', description: 'Причина скасування' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ConfirmBookingDto {
  @ApiPropertyOptional({ example: true, default: true, description: 'Чи підтверджується з онлайн-оплатою' })
  @IsBoolean()
  @IsOptional()
  isPaidOnline?: boolean = true;
}
