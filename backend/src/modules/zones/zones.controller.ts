import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DeviceType, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateZoneDto, UpdateZoneDto, ZoneResponseDto } from './dto/zones.dto';
import { ZonesService } from './zones.service';

@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  @ApiOperation({
    summary: 'Отримати список усіх ігрових зон зі статистикою вільних ПК',
    description: 'Повертає перелік ігрових зон (Standard, VIP, Bootcamp, PS, VR) із підрахунком загальних та вільних місць.',
  })
  @ApiQuery({
    name: 'deviceType',
    required: false,
    enum: DeviceType,
    description: 'Фільтр за типом пристроїв (PC, PS, VR)',
  })
  @ApiResponse({ status: 200, description: 'Список зон успішно отримано', type: [ZoneResponseDto] })
  async getZones(@Query('deviceType') deviceType?: DeviceType) {
    return this.zonesService.findAll(deviceType);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Детальна інформація про ігрову зону',
    description: 'Повертає характеристики зони, список закріплених місць та актуальних тарифів.',
  })
  @ApiParam({ name: 'id', description: 'UUID або ідентифікатор зони' })
  @ApiResponse({ status: 200, description: 'Інформація про зону', type: ZoneResponseDto })
  @ApiResponse({ status: 404, description: 'Зону не знайдено' })
  async getZoneById(@Param('id') id: string) {
    return this.zonesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Створення нової ігрової зони (лише ADMIN)',
    description: 'Додає нову ігрову зону до клубу з базовою погодинною ставкою в гривнях.',
  })
  @ApiResponse({ status: 201, description: 'Ігрову зону успішно створено', type: ZoneResponseDto })
  @ApiResponse({ status: 400, description: 'Некоректні вхідні дані' })
  @ApiResponse({ status: 401, description: 'Відсутня авторизація' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  @ApiResponse({ status: 409, description: 'Зона з такою назвою вже існує' })
  async createZone(@Body() dto: CreateZoneDto) {
    return this.zonesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Редагування зони (лише ADMIN)',
    description: 'Оновлює назву, опис, тип пристрою, колір або базовий погодинний тариф зони.',
  })
  @ApiParam({ name: 'id', description: 'UUID або ідентифікатор зони' })
  @ApiResponse({ status: 200, description: 'Зону успішно оновлено', type: ZoneResponseDto })
  @ApiResponse({ status: 401, description: 'Відсутня авторизація' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  @ApiResponse({ status: 404, description: 'Зону не знайдено' })
  @ApiResponse({ status: 409, description: 'Конфлікт унікальної назви зони' })
  async updateZone(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.zonesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Видалення зони (лише ADMIN)',
    description: 'Видаляє ігрову зону з клубу.',
  })
  @ApiParam({ name: 'id', description: 'UUID або ідентифікатор зони' })
  @ApiResponse({ status: 200, description: 'Зону успішно видалено' })
  @ApiResponse({ status: 401, description: 'Відсутня авторизація' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  @ApiResponse({ status: 404, description: 'Зону не знайдено' })
  async deleteZone(@Param('id') id: string) {
    return this.zonesService.delete(id);
  }
}
