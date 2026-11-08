import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateZoneDto, UpdateZoneDto } from './dto/zones.dto';

@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  @Get()
  @ApiOperation({ summary: 'Отримати список усіх ігрових зон зі статистикою вільних ПК' })
  @ApiResponse({ status: 200, description: 'Список зон' })
  getZones() {
    return [
      {
        id: 'zone-1',
        name: 'Standard Zone',
        description: 'Збалансовані ПК для геймінгу',
        baseHourlyRate: 50.0,
        colorHex: '#3B82F6',
        isActive: true,
        totalComputers: 6,
        availableComputers: 5,
      },
      {
        id: 'zone-2',
        name: 'VIP RTX 4090',
        description: 'Максимальна продуктивність 240Hz',
        baseHourlyRate: 90.0,
        colorHex: '#8B5CF6',
        isActive: true,
        totalComputers: 4,
        availableComputers: 4,
      },
      {
        id: 'zone-3',
        name: 'Bootcamp 5x5',
        description: 'Окрема кімната для команд',
        baseHourlyRate: 75.0,
        colorHex: '#10B981',
        isActive: true,
        totalComputers: 2,
        availableComputers: 2,
      },
    ];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Детальна інформація про зону' })
  getZoneById(@Param('id') id: string) {
    return {
      id,
      name: 'VIP RTX 4090',
      description: 'Преміальні ПК для кіберспорту',
      baseHourlyRate: 90.0,
      colorHex: '#8B5CF6',
      isActive: true,
    };
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Створення нової ігрової зони (Admin/Owner)' })
  createZone(@Body() dto: CreateZoneDto) {
    return {
      id: 'zone-new',
      ...dto,
      createdAt: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Редагування зони' })
  updateZone(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return {
      id,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Видалення зони' })
  deleteZone(@Param('id') id: string) {
    return { message: `Зону ${id} успішно видалено` };
  }
}
