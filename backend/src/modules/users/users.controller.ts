import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateProfileDto, UpdateUserStatusDto } from './dto/users.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'Список користувачів клубу (пошук, фільтри, пагінація)' })
  @ApiQuery({ name: 'search', required: false, description: 'Пошук за ніком, email або телефоном' })
  @ApiQuery({ name: 'role', required: false, enum: ['OWNER', 'ADMIN', 'CLIENT'] })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'BLOCKED'] })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return {
      items: [
        {
          id: '1',
          username: 's1mple_pro',
          email: 'player1@gmail.com',
          phone: '+380993334455',
          role: 'CLIENT',
          status: 'ACTIVE',
          balance: 350.0,
          totalPlayTimeMinutes: 720,
          visitsCount: 12,
        },
        {
          id: '2',
          username: 'b1t_clutch',
          email: 'player2@gmail.com',
          phone: '+380994445566',
          role: 'CLIENT',
          status: 'ACTIVE',
          balance: 120.0,
          totalPlayTimeMinutes: 300,
          visitsCount: 5,
        },
      ],
      total: 2,
      page: Number(page),
      limit: Number(limit),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Детальна інформація профілю користувача' })
  getUserById(@Param('id') id: string) {
    return {
      id,
      username: 's1mple_pro',
      email: 'player1@gmail.com',
      phone: '+380993334455',
      firstName: 'Олександр',
      lastName: 'Костилєв',
      role: 'CLIENT',
      status: 'ACTIVE',
      balance: 350.0,
      bonusBalance: 50.0,
      totalPlayTimeMinutes: 720,
      totalSpent: 850.0,
      visitsCount: 12,
      createdAt: '2026-10-01T12:00:00.000Z',
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Блокування або розблокування гравця адміністратором' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return {
      id,
      status: dto.status,
      reason: dto.reason || null,
      message: `Статус гравця успішно змінено на ${dto.status}`,
    };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Оновлення власного профілю гравцем' })
  updateProfile(@Body() dto: UpdateProfileDto) {
    return {
      message: 'Профіль успішно оновлено',
      updatedData: dto,
    };
  }
}
