import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTournamentDto {
  @ApiProperty({ example: 'Obsidian CS2 Autumn Masters 5v5', description: 'Назва турніру' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Головний командний турнір осені', description: 'Опис та регламент' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ['CS2', 'DOTA2', 'VALORANT', 'FIFA'], example: 'CS2', description: 'Дисципліна' })
  @IsEnum(['CS2', 'DOTA2', 'VALORANT', 'FIFA'])
  game: 'CS2' | 'DOTA2' | 'VALORANT' | 'FIFA';

  @ApiProperty({ enum: ['SOLO_1X1', 'TEAM_5X5'], example: 'TEAM_5X5', description: 'Формат турніру' })
  @IsEnum(['SOLO_1X1', 'TEAM_5X5'])
  format: 'SOLO_1X1' | 'TEAM_5X5';

  @ApiProperty({
    enum: ['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN'],
    example: 'SINGLE_ELIMINATION',
    description: 'Тип турнірної сітки',
  })
  @IsEnum(['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN'])
  bracketType: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN';

  @ApiProperty({ example: 25000, description: 'Призовий фонд (грн)' })
  @IsNumber()
  @Min(0)
  prizePool: number;

  @ApiProperty({ example: 500, description: 'Вступний внесок (грн, 0 = безкоштовно)' })
  @IsNumber()
  @Min(0)
  entryFee: number;

  @ApiProperty({ example: 16, description: 'Максимальна кількість команд або учасників' })
  @IsNumber()
  maxParticipants: number;

  @ApiProperty({ example: '2026-11-15T12:00:00.000Z', description: 'Дата та час початку' })
  @IsNotEmpty()
  startTime: string;

  @ApiPropertyOptional({ example: 'https://twitch.tv/obsidian_pc_club', description: 'Посилання на трансляцію' })
  @IsString()
  @IsOptional()
  streamUrl?: string;
}

export class RegisterTournamentDto {
  @ApiPropertyOptional({ example: 'Natus Vincere Academy', description: 'Назва команди (для форматів 5v5)' })
  @IsString()
  @IsOptional()
  teamName?: string;

  @ApiPropertyOptional({
    example: ['s1mple_pro', 'b1t_clutch', 'blade', 'jl', 'im'],
    description: 'Список нікнеймів учасників команди',
  })
  @IsOptional()
  teamMembers?: string[];
}

export class UpdateMatchScoreDto {
  @ApiProperty({ example: 13, description: 'Рахунок учасника 1' })
  @IsNumber()
  score1: number;

  @ApiProperty({ example: 9, description: 'Рахунок учасника 2' })
  @IsNumber()
  score2: number;

  @ApiPropertyOptional({ example: 'user-uuid-winner', description: 'ID переможця' })
  @IsString()
  @IsOptional()
  winnerId?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'LIVE', 'COMPLETED'], example: 'COMPLETED', description: 'Статус матчу' })
  @IsOptional()
  status?: string;
}
