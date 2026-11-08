import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ example: 'BLOCKED', enum: ['ACTIVE', 'BLOCKED'], description: 'Новий статус гравця' })
  @IsEnum(['ACTIVE', 'BLOCKED'])
  status: 'ACTIVE' | 'BLOCKED';

  @ApiProperty({ example: 'Порушення правил клубу (токсичність)', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'Олександр', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Костилєв', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: '+380993334455', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
