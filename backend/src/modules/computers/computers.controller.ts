import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ComputerCommandDto, CreateComputerDto, UpdateComputerStatusDto, UpdatePositionDto } from './dto/computers.dto';

@ApiTags('Computers')
@Controller('computers')
export class ComputersController {
  @Get()
  @ApiOperation({ summary: 'Список комп’ютерів із фільтрами за зоною та статусом' })
  @ApiQuery({ name: 'zoneId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['FREE', 'BUSY', 'BOOKED', 'MAINTENANCE', 'OFFLINE'] })
  getComputers(@Query('zoneId') zoneId?: string, @Query('status') status?: string) {
    return [
      {
        id: 'comp-1',
        number: 1,
        name: 'PC-01',
        zoneId: 'zone-1',
        zoneName: 'Standard Zone',
        status: 'FREE',
        specs: { cpu: 'i5-13400F', gpu: 'RTX 4060 Ti', ram: '16GB' },
        coordinateX: 100,
        coordinateY: 100,
      },
      {
        id: 'comp-2',
        number: 2,
        name: 'PC-02',
        zoneId: 'zone-1',
        zoneName: 'Standard Zone',
        status: 'BUSY',
        activeSession: {
          sessionId: 'sess-1',
          username: 's1mple_pro',
          startedAt: '2026-10-24T19:00:00.000Z',
          durationMinutes: 45,
          currentCost: 37.5,
        },
        coordinateX: 180,
        coordinateY: 100,
      },
      {
        id: 'comp-7',
        number: 7,
        name: 'VIP-01',
        zoneId: 'zone-2',
        zoneName: 'VIP RTX 4090',
        status: 'FREE',
        specs: { cpu: 'i9-14900KF', gpu: 'RTX 4090', ram: '32GB' },
        coordinateX: 400,
        coordinateY: 100,
      },
    ];
  }

  @Get('map')
  @ApiOperation({ summary: 'Дані для інтерактивної карти клубу (координати та активні сесії)' })
  getMap() {
    return {
      clubLayout: { width: 1200, height: 800, gridStep: 20 },
      computers: [
        { id: 'comp-1', number: 1, name: 'PC-01', x: 100, y: 100, status: 'FREE', zoneColor: '#3B82F6' },
        { id: 'comp-2', number: 2, name: 'PC-02', x: 180, y: 100, status: 'BUSY', zoneColor: '#3B82F6' },
        { id: 'comp-7', number: 7, name: 'VIP-01', x: 400, y: 100, status: 'FREE', zoneColor: '#8B5CF6' },
      ],
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Детальна інформація про конкретний ПК' })
  getComputerById(@Param('id') id: string) {
    return {
      id,
      number: 1,
      name: 'PC-01',
      zoneId: 'zone-1',
      status: 'FREE',
      specs: {
        cpu: 'Intel Core i5-13400F',
        gpu: 'NVIDIA RTX 4060 Ti 8GB',
        ram: '16GB DDR4',
        monitor: '24.5" ZOWIE 144Hz',
      },
      ipAddress: '192.168.1.101',
      macAddress: '00:1A:79:01:AB:CD',
    };
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Додавання нового ПК (Admin/Owner)' })
  createComputer(@Body() dto: CreateComputerDto) {
    return {
      id: 'comp-new',
      ...dto,
      status: 'FREE',
    };
  }

  @Patch(':id/position')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Збереження нових координат ПК на карті (Drag-and-Drop)' })
  updatePosition(@Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return {
      id,
      coordinateX: dto.x,
      coordinateY: dto.y,
      message: 'Координати ПК на карті оновлено',
    };
  }

  @Patch(':id/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ручна зміна статусу ПК (MAINTENANCE, OFFLINE тощо)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateComputerStatusDto) {
    return {
      id,
      status: dto.status,
      message: `Статус ПК змінено на ${dto.status}`,
    };
  }

  @Post(':id/command')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Відправка команди керування ПК (REBOOT, SHUTDOWN, LOCK)' })
  sendCommand(@Param('id') id: string, @Body() dto: ComputerCommandDto) {
    return {
      id,
      command: dto.command,
      status: 'EXECUTED_MOCK',
      message: `Команду ${dto.command} успішно передано на клієнтський ПК`,
    };
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Видалення ПК' })
  deleteComputer(@Param('id') id: string) {
    return { message: `Комп’ютер ${id} видалено` };
  }
}
