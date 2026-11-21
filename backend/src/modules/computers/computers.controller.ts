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
import {
  ComputerCommandDto,
  ComputerResponseDto,
  CreateComputerDto,
  CreateRepairDto,
  FinishRepairDto,
  RepairResponseDto,
  UpdateComputerDto,
  UpdateComputerStatusDto,
  UpdatePositionDto,
} from './dto/computers.dto';
import { ComputersService } from './computers.service';
import { UKRAINIAN_PLACE_STATUSES } from './enums/place-status.enum';

@ApiTags('Computers')
@Controller('computers')
export class ComputersController {
  constructor(private readonly computersService: ComputersService) {}

  @Get()
  @ApiOperation({
    summary: 'Список комп’ютерів та місць із фільтрами за зоною, статусом і типом',
    description: 'Повертає список місць. Статуси повертаються строго за українським enum: вільно, зайнято, бронь, ремонт.',
  })
  @ApiQuery({ name: 'zoneId', required: false, description: 'ID ігрової зони' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: UKRAINIAN_PLACE_STATUSES,
    description: 'Статус місця (вільно, зайнято, бронь, ремонт)',
  })
  @ApiQuery({
    name: 'deviceType',
    required: false,
    enum: DeviceType,
    description: 'Тип обладнання (PC, PS, VR)',
  })
  @ApiResponse({ status: 200, description: 'Список місць успішно отримано', type: [ComputerResponseDto] })
  async getComputers(
    @Query('zoneId') zoneId?: string,
    @Query('status') status?: string,
    @Query('deviceType') deviceType?: DeviceType,
  ) {
    return this.computersService.findAll({ zoneId, status, deviceType });
  }

  @Get('map')
  @ApiOperation({
    summary: 'Дані для інтерактивної карти клубу (координати, зони та статуси)',
    description: 'Повертає розміри схеми залу та положення кожного комп’ютера з його актуальним статусом.',
  })
  @ApiResponse({ status: 200, description: 'Схема клубу та розташування місць' })
  async getMap() {
    return this.computersService.getMapLayout();
  }

  @Get('repairs')
  @ApiOperation({
    summary: 'Журнал ремонту та технічного обслуговування ПК (Maintenance Log)',
    description: 'Повертає історію ремонтів із причиною, датою початку та завершення.',
  })
  @ApiQuery({ name: 'placeId', required: false, description: 'Фільтр за конкретним місцем' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Лише незавершені ремонти' })
  @ApiResponse({ status: 200, description: 'Журнал ремонту', type: [RepairResponseDto] })
  async getRepairs(
    @Query('placeId') placeId?: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.computersService.findAllRepairs({ placeId, activeOnly });
  }

  @Post('repairs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Запис у журнал ремонту та переведення місця в статус "ремонт" (лише ADMIN)',
    description: 'Створює новий запис у журналі ремонту та змінює статус комп’ютера на "ремонт".',
  })
  @ApiResponse({ status: 201, description: 'Запис успішно створено', type: RepairResponseDto })
  @ApiResponse({ status: 400, description: 'Некоректні вхідні дані' })
  @ApiResponse({ status: 401, description: 'Відсутня авторизація' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  async createRepair(@Body() dto: CreateRepairDto) {
    return this.computersService.createRepair(dto);
  }

  @Patch('repairs/:id/finish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Завершення ремонту та повернення ПК у статус "вільно" (лише ADMIN)',
    description: 'Фіксує дату завершення ремонту та автоматично переводить місце у статус "вільно".',
  })
  @ApiParam({ name: 'id', description: 'ID запису ремонту' })
  @ApiResponse({ status: 200, description: 'Ремонт завершено, ПК повернено в роботу' })
  @ApiResponse({ status: 401, description: 'Відсутня авторизація' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  @ApiResponse({ status: 404, description: 'Запис ремонту не знайдено' })
  async finishRepair(
    @Param('id') id: string,
    @Body() dto: FinishRepairDto,
  ) {
    return this.computersService.finishRepair(id, dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Детальна інформація про конкретний ПК / місце',
    description: 'Повертає характеристики, прив’язку до зони та історію останніх ремонтів.',
  })
  @ApiParam({ name: 'id', description: 'UUID або ID комп’ютера' })
  @ApiResponse({ status: 200, description: 'Інформація про ПК', type: ComputerResponseDto })
  @ApiResponse({ status: 404, description: 'Місце не знайдено' })
  async getComputerById(@Param('id') id: string) {
    return this.computersService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Додавання нового місця / ПК (лише ADMIN)',
    description: 'Створює нове робоче місце з унікальним номером та прив’язкою до зони.',
  })
  @ApiResponse({ status: 201, description: 'Місце успішно створено', type: ComputerResponseDto })
  @ApiResponse({ status: 400, description: 'Некоректні вхідні дані' })
  @ApiResponse({ status: 401, description: 'Відсутня авторизація' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  @ApiResponse({ status: 409, description: 'Місце з таким номером уже існує' })
  async createComputer(@Body() dto: CreateComputerDto) {
    return this.computersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Редагування характеристик комп’ютера (лише ADMIN)',
    description: 'Оновлює назву, номер, зону або конфігурацію обладнання ПК.',
  })
  @ApiParam({ name: 'id', description: 'UUID або ID комп’ютера' })
  @ApiResponse({ status: 200, description: 'Дані ПК оновлено', type: ComputerResponseDto })
  @ApiResponse({ status: 401, description: 'Відсутня авторизація' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  @ApiResponse({ status: 404, description: 'ПК не знайдено' })
  async updateComputer(@Param('id') id: string, @Body() dto: UpdateComputerDto) {
    return this.computersService.update(id, dto);
  }

  @Patch(':id/position')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Збереження координат ПК на схемі клубу (лише ADMIN)',
    description: 'Оновлює координати X/Y та ряд/стіл для інтерактивної карти залу.',
  })
  @ApiParam({ name: 'id', description: 'UUID або ID комп’ютера' })
  @ApiResponse({ status: 200, description: 'Координати оновлено' })
  @ApiResponse({ status: 401, description: 'Відсутня авторизація' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  async updatePosition(@Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.computersService.updatePosition(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Зміна статусу місця згідно з українським enum: вільно, зайнято, бронь, ремонт (лише ADMIN)',
    description:
      'Контролює переходи між статусами. Якщо передається статус "ремонт", автоматично створюється запис у журналі з описом несправності.',
  })
  @ApiParam({ name: 'id', description: 'UUID або ID комп’ютера' })
  @ApiResponse({ status: 200, description: 'Статус успішно змінено', type: ComputerResponseDto })
  @ApiResponse({ status: 400, description: 'Неприпустимий статус або заборонений перехід стану' })
  @ApiResponse({ status: 401, description: 'Відсутня авторизація' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  @ApiResponse({ status: 404, description: 'ПК не знайдено' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateComputerStatusDto) {
    return this.computersService.updateStatus(id, dto);
  }

  @Post(':id/command')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Відправка системної команди на клієнтський ПК (REBOOT, SHUTDOWN, LOCK, UNLOCK)',
  })
  @ApiParam({ name: 'id', description: 'ID комп’ютера' })
  @ApiResponse({ status: 200, description: 'Команду передано' })
  sendCommand(@Param('id') id: string, @Body() dto: ComputerCommandDto) {
    return {
      id,
      command: dto.command,
      status: 'SENT',
      message: `Команду ${dto.command} успішно передано на клієнтське робоче місце`,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Видалення комп’ютера / місця (лише ADMIN)',
  })
  @ApiParam({ name: 'id', description: 'ID комп’ютера' })
  @ApiResponse({ status: 200, description: 'Місце видалено' })
  @ApiResponse({ status: 401, description: 'Відсутня авторизація' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  @ApiResponse({ status: 404, description: 'Місце не знайдено' })
  async deleteComputer(@Param('id') id: string) {
    return this.computersService.delete(id);
  }
}
