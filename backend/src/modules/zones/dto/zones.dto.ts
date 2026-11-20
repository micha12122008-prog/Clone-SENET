import { ApiProperty, PartialType } from '@nestjs/swagger';
import { DeviceType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateZoneDto {
  @ApiProperty({ example: 'Standard Zone', description: 'Унікальна назва ігрової зони' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Збалансовані ПК для рейтингового геймінгу в CS2, Dota 2, Valorant',
    description: 'Опис зони та обладнання',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'PC',
    enum: DeviceType,
    description: 'Тип пристроїв у зоні (PC, PS, VR)',
    required: false,
    default: DeviceType.PC,
  })
  @IsEnum(DeviceType)
  @IsOptional()
  deviceType?: DeviceType;

  @ApiProperty({ example: 60.0, description: 'Базова вартість у гривнях за годину (UAH/год)' })
  @IsNumber()
  @Min(0)
  baseHourlyRate: number;

  @ApiProperty({
    example: '#3B82F6',
    description: 'HEX-код кольору зони для візуального відображення на схемі клубу',
    required: false,
    default: '#3B82F6',
  })
  @IsString()
  @IsOptional()
  colorHex?: string;
}

export class UpdateZoneDto extends PartialType(CreateZoneDto) {}

export class ZoneResponseDto {
  @ApiProperty({ example: 'zone-uuid-1' })
  id: string;

  @ApiProperty({ example: 'Standard Zone' })
  name: string;

  @ApiProperty({ example: 'Збалансовані ПК для кіберспорту', nullable: true })
  description: string | null;

  @ApiProperty({ enum: DeviceType, example: DeviceType.PC })
  deviceType: DeviceType;

  @ApiProperty({ example: 60.0 })
  baseHourlyRate: number;

  @ApiProperty({ example: '#3B82F6' })
  colorHex: string;

  @ApiProperty({ example: 6, description: 'Загальна кількість місць у зоні' })
  totalComputers: number;

  @ApiProperty({ example: 5, description: 'Кількість вільних місць у зоні' })
  availableComputers: number;

  @ApiProperty({ example: '2026-10-01T10:00:00.000Z' })
  createdAt: string | Date;

  @ApiProperty({ example: '2026-10-01T10:00:00.000Z' })
  updatedAt: string | Date;
}
