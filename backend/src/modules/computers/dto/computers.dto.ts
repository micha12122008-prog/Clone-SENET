import { ApiProperty, PartialType } from '@nestjs/swagger';
import { DeviceType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { UKRAINIAN_PLACE_STATUSES, UkrainianPlaceStatus } from '../enums/place-status.enum';

export class CreateComputerDto {
  @ApiProperty({ example: 1, description: 'Унікальний порядковий номер комп’ютера / місця' })
  @IsInt()
  @Min(1)
  number: number;

  @ApiProperty({ example: 'PC-01', description: 'Дисплейна назва місця' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'zone-1-standard', description: 'ID ігрової зони' })
  @IsString()
  @IsNotEmpty()
  zoneId: string;

  @ApiProperty({
    example: {
      cpu: 'Intel Core i5-13400F',
      gpu: 'RTX 4060 Ti 8GB',
      ram: '16GB DDR4 3600MHz',
      monitor: '24.5" ZOWIE 240Hz',
      peripherals: 'Logitech G Pro X Superlight, HyperX Cloud II',
    },
    description: 'Технічні характеристики обладнання (ПК, консолі або VR)',
    required: false,
  })
  @IsObject()
  @IsOptional()
  specs?: Record<string, any>;

  @ApiProperty({ example: 100.0, description: 'Координата X на інтерактивній карті', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  coordinateX?: number;

  @ApiProperty({ example: 100.0, description: 'Координата Y на інтерактивній карті', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  coordinateY?: number;

  @ApiProperty({ example: 1, description: 'Ряд у залі', required: false, default: 1 })
  @IsInt()
  @IsOptional()
  row?: number;

  @ApiProperty({ example: 1, description: 'Колонка / стіл у залі', required: false, default: 1 })
  @IsInt()
  @IsOptional()
  col?: number;
}

export class UpdateComputerDto extends PartialType(CreateComputerDto) {}

export class UpdatePositionDto {
  @ApiProperty({ example: 150.0, description: 'Координата X на карті' })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 200.0, description: 'Координата Y на карті' })
  @IsNumber()
  y: number;

  @ApiProperty({ example: 2, required: false, description: 'Ряд у залі' })
  @IsInt()
  @IsOptional()
  row?: number;

  @ApiProperty({ example: 3, required: false, description: 'Колонка у залі' })
  @IsInt()
  @IsOptional()
  col?: number;
}

export class UpdateComputerStatusDto {
  @ApiProperty({
    example: 'ремонт',
    enum: UKRAINIAN_PLACE_STATUSES,
    description: 'Статус місця строго за українським enum з Тижня 1: вільно, зайнято, бронь, ремонт',
  })
  @IsNotEmpty()
  @IsString()
  status: UkrainianPlaceStatus;

  @ApiProperty({
    example: 'Заміна клавіатури Logitech G Pro',
    required: false,
    description: 'Причина або опис технічного обслуговування (обов’язково для статусу "ремонт")',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'Заміна клавіатури Logitech G Pro',
    required: false,
    description: 'Альтернативна назва поля причини (для сумісності з UI)',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateRepairDto {
  @ApiProperty({ example: 'place-uuid-1', description: 'ID місця, яке відправляється на ремонт' })
  @IsString()
  @IsNotEmpty()
  placeId: string;

  @ApiProperty({
    example: 'Не працює лівий клік миші Razer DeathAdder v3',
    description: 'Причина ремонту та опис несправності',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class FinishRepairDto {
  @ApiProperty({
    example: 'Замінено мікроперемикач миші, працездатність відновлено',
    required: false,
    description: 'Примітки щодо виконаних робіт',
  })
  @IsString()
  @IsOptional()
  notes?: string;
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

export class ComputerResponseDto {
  @ApiProperty({ example: 'comp-uuid-1' })
  id: string;

  @ApiProperty({ example: 1 })
  number: number;

  @ApiProperty({ example: 'PC-01' })
  name: string;

  @ApiProperty({ example: 'zone-1-standard' })
  zoneId: string;

  @ApiProperty({ example: 'Standard Zone' })
  zoneName: string;

  @ApiProperty({ example: '#3B82F6' })
  zoneColor: string;

  @ApiProperty({ enum: DeviceType, example: DeviceType.PC })
  deviceType: DeviceType;

  @ApiProperty({
    enum: UKRAINIAN_PLACE_STATUSES,
    example: 'вільно',
    description: 'Статус місця строго за українським enum: вільно, зайнято, бронь, ремонт',
  })
  status: UkrainianPlaceStatus;

  @ApiProperty({
    example: { cpu: 'i5-13400F', gpu: 'RTX 4060 Ti', ram: '16GB' },
    nullable: true,
  })
  specs: Record<string, any> | null;

  @ApiProperty({ example: 100.0 })
  coordinateX: number;

  @ApiProperty({ example: 100.0 })
  coordinateY: number;

  @ApiProperty({ example: 1 })
  row: number;

  @ApiProperty({ example: 1 })
  col: number;

  @ApiProperty({ example: '2026-10-01T10:00:00.000Z' })
  createdAt: string | Date;

  @ApiProperty({ example: '2026-10-01T10:00:00.000Z' })
  updatedAt: string | Date;
}

export class RepairResponseDto {
  @ApiProperty({ example: 'repair-uuid-1' })
  id: string;

  @ApiProperty({ example: 'comp-uuid-1' })
  placeId: string;

  @ApiProperty({ example: 3 })
  placeNumber: number;

  @ApiProperty({ example: 'PC-03' })
  placeName: string;

  @ApiProperty({ example: 'Standard Zone' })
  zoneName: string;

  @ApiProperty({ example: 'Заміна клавіатури Logitech G Pro' })
  description: string;

  @ApiProperty({ example: '2026-10-24T10:00:00.000Z' })
  startedAt: string | Date;

  @ApiProperty({ example: null, nullable: true })
  finishedAt: string | Date | null;

  @ApiProperty({ example: 'В процесі', enum: ['В процесі', 'Завершено'] })
  status: 'В процесі' | 'Завершено';

  @ApiProperty({ example: '2026-10-24T10:00:00.000Z' })
  createdAt: string | Date;
}
