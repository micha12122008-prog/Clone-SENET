import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'comp-1', description: 'ID комп’ютера' })
  @IsString()
  @IsNotEmpty()
  computerId: string;

  @ApiProperty({ example: 'tariff-2', description: 'ID тарифу' })
  @IsString()
  @IsNotEmpty()
  tariffId: string;

  @ApiProperty({ example: '2026-10-25T18:00:00.000Z', description: 'Час початку сесії' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-10-25T21:00:00.000Z', description: 'Час завершення сесії' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ example: 'Турнір з CS2', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
