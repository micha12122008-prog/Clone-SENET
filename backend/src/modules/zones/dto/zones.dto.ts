import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateZoneDto {
  @ApiProperty({ example: 'VIP RTX 4090', description: 'Назва ігрової зони' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Преміальні ПК для кіберспорту', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 90.0, description: 'Базова погодинна ставка (грн)' })
  @IsNumber()
  baseHourlyRate: number;

  @ApiProperty({ example: '#8B5CF6', description: 'HEX колір зони для карти' })
  @IsString()
  @IsNotEmpty()
  colorHex: string;
}

export class UpdateZoneDto {
  @ApiProperty({ example: 'VIP Lounge', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 95.0, required: false })
  @IsNumber()
  @IsOptional()
  baseHourlyRate?: number;

  @ApiProperty({ example: '#8B5CF6', required: false })
  @IsString()
  @IsOptional()
  colorHex?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
