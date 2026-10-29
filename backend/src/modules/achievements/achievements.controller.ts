import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';
import { CreateAchievementDto, EquipFrameDto } from './dto/achievements.dto';

@ApiTags('Achievements')
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  @ApiOperation({ summary: 'Список усіх доступних досягнень клубу (в стилі monobank)' })
  findAll() {
    return this.achievementsService.findAll();
  }

  @Get('my')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Список досягнень поточного гравця (розблоковані + заблоковані)' })
  findMy() {
    // Демо-ідентифікатор гравця s1mple
    const defaultUserId = 'current-user-uuid';
    return this.achievementsService.findMyAchievements(defaultUserId);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Створення нового досягнення (тільки для адміністратора клубу)' })
  @ApiResponse({ status: 201, description: 'Досягнення створено' })
  create(@Body() dto: CreateAchievementDto) {
    return this.achievementsService.create(dto);
  }

  @Post('equip-frame')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Екіпірувати розблоковану рамку аватара в профілі' })
  equipFrame(@Body() dto: EquipFrameDto) {
    const defaultUserId = 'current-user-uuid';
    return this.achievementsService.equipFrame(defaultUserId, dto);
  }
}
