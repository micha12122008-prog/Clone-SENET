import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateProfileDto, UpdateUserStatusDto } from './dto/users.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Список користувачів клубу (пошук, фільтри, пагінація) — доступно для ADMIN' })
  @ApiQuery({ name: 'search', required: false, description: 'Пошук за ніком, email або телефоном' })
  @ApiQuery({ name: 'role', required: false, enum: ['ADMIN', 'CLIENT'] })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'BLOCKED'] })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Список користувачів' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (недостатньо прав)' })
  getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.usersService.findAll({ search, role, status, page, limit });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Детальна інформація профілю користувача за ID' })
  @ApiResponse({ status: 200, description: 'Профіль користувача' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Користувача не знайдено' })
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    return this.usersService.sanitize(user);
  }

  @Patch('profile')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Оновлення власного профілю поточним авторизованим користувачем' })
  @ApiResponse({ status: 200, description: 'Профіль успішно оновлено' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const updated = await this.usersService.updateProfile(userId, dto);
    return {
      message: 'Профіль успішно оновлено',
      user: this.usersService.sanitize(updated),
    };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Блокування або розблокування гравця адміністратором' })
  @ApiResponse({ status: 200, description: 'Статус гравця успішно змінено' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (необхідна роль ADMIN)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return {
      id,
      status: dto.status,
      reason: dto.reason || null,
      message: `Статус гравця успішно змінено на ${dto.status}`,
    };
  }
}
