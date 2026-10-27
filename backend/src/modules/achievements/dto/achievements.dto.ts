import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateAchievementDto {
  @ApiProperty({ example: 'CAMEL_DRINKS', description: 'Унікальний системний код ачівки' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: '«Верблюд»', description: 'Назва досягнення' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Замовити 10 напоїв за одну сесію', description: 'Умова отримання' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'camel_badge.svg', description: 'URL або назва іконки' })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiPropertyOptional({ example: 'frame_camel_desert', description: 'Кастомна рамка аватара як нагорода' })
  @IsString()
  @IsOptional()
  rewardFrame?: string;

  @ApiProperty({ example: 150, description: 'Кількість досвіду (XP)' })
  @IsNumber()
  @Min(0)
  rewardXp: number;

  @ApiProperty({ example: 30.0, description: 'Бонусні кошти на баланс (грн)' })
  @IsNumber()
  @Min(0)
  rewardBonus: number;
}

export class EquipFrameDto {
  @ApiProperty({ example: 'frame_camel_desert', description: 'Код рамки, яку хоче екіпірувати користувач' })
  @IsString()
  @IsNotEmpty()
  frameCode: string;
}
