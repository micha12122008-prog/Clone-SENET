import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateComputerDto {
  @ApiProperty({ example: 1, description: 'Унікальний номер ПК' })
  @IsNumber()
  number: number;

  @ApiProperty({ example: 'PC-01', description: 'Назва комп’ютера' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'zone-1', description: 'ID зони' })
  @IsString()
  @IsNotEmpty()
  zoneId: string;

  @ApiProperty({
    example: {
      cpu: 'Intel Core i5-13400F',
      gpu: 'RTX 4060 Ti',
      ram: '16GB',
      monitor: '24.5" ZOWIE 144Hz',
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  specs?: Record<string, any>;
}

export class UpdatePositionDto {
  @ApiProperty({ example: 150.0, description: 'Координата X на карті' })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 200.0, description: 'Координата Y на карті' })
  @IsNumber()
  y: number;

  @ApiProperty({ example: 2, required: false })
  @IsNumber()
  @IsOptional()
  row?: number;

  @ApiProperty({ example: 3, required: false })
  @IsNumber()
  @IsOptional()
  col?: number;
}

export class UpdateComputerStatusDto {
  @ApiProperty({
    example: 'MAINTENANCE',
    enum: ['FREE', 'BUSY', 'BOOKED', 'MAINTENANCE', 'OFFLINE'],
    description: 'Стан ПК',
  })
  @IsEnum(['FREE', 'BUSY', 'BOOKED', 'MAINTENANCE', 'OFFLINE'])
  status: 'FREE' | 'BUSY' | 'BOOKED' | 'MAINTENANCE' | 'OFFLINE';
}

export class ComputerCommandDto {
  @ApiProperty({
    example: 'REBOOT',
    enum: ['REBOOT', 'SHUTDOWN', 'LOCK', 'UNLOCK'],
    description: 'Команда керування фізичним ПК',
  })
  @IsEnum(['REBOOT', 'SHUTDOWN', 'LOCK', 'UNLOCK'])
  command: 'REBOOT' | 'SHUTDOWN' | 'LOCK' | 'UNLOCK';
}
