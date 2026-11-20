import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { TariffType, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CalculatePriceDto,
  CreateTariffDto,
  TariffResponseDto,
  UpdateTariffDto,
  ValidatePromoDto,
} from './dto/tariffs.dto';
import { TariffsService } from './tariffs.service';

@ApiTags('Tariffs')
@Controller('tariffs')
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Get()
  @ApiOperation({
    summary: 'Список усіх тарифів клубу',
    description: 'Повертає перелік доступних погодинних та пакетних тарифів у гривнях.',
  })
  @ApiQuery({ name: 'zoneId', required: false, description: 'Фільтр за ігровою зоною' })
  @ApiQuery({ name: 'type', required: false, enum: TariffType, description: 'Тип тарифу (HOURLY, PACKAGE_3_PLUS_1, CUSTOM)' })
  @ApiResponse({ status: 200, description: 'Список тарифів отримано', type: [TariffResponseDto] })
  async getTariffs(
    @Query('zoneId') zoneId?: string,
    @Query('type') type?: TariffType,
  ) {
    return this.tariffsService.findAll({ zoneId, type });
  }

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Попередній розрахунок ціни сесії з промокодом',
    description: 'Розраховує підсумкову вартість з урахуванням обраного тарифу, тривалості гри та знижки за промокодом.',
  })
  @ApiResponse({ status: 200, description: 'Розрахунок вартості успішно виконано' })
  calculatePrice(@Body() dto: CalculatePriceDto) {
    return this.tariffsService.calculatePrice(dto);
  }

  @Post('promotions/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Перевірка промокоду на валідність',
    description: 'Перевіряє, чи активний введений промокод (наприклад, "WELCOME" -15%).',
  })
  @ApiResponse({ status: 200, description: 'Результат перевірки промокоду' })
  validatePromo(@Body() dto: ValidatePromoDto) {
    return this.tariffsService.validatePromo(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Детальна інформація про конкретний тариф',
  })
  @ApiParam({ name: 'id', description: 'UUID або ID тарифу' })
  @ApiResponse({ status: 200, description: 'Інформація про тариф', type: TariffResponseDto })
  @ApiResponse({ status: 404, description: 'Тариф не знайдено' })
  async getTariffById(@Param('id') id: string) {
    return this.tariffsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Створення нового тарифу клубу (лише ADMIN)',
    description: 'Додає новий погодинний або пакетний тариф у гривнях із прив’язкою до зони.',
  })
  @ApiResponse({ status: 201, description: 'Тариф успішно створено', type: TariffResponseDto })
  @ApiResponse({ status: 400, description: 'Некоректні вхідні дані' })
  @ApiResponse({ status: 401, description: 'Відсутня авторизація' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  async createTariff(@Body() dto: CreateTariffDto) {
    return this.tariffsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Редагування тарифу (лише ADMIN)',
    description: 'Оновлює назву, вартість, тривалість або прив’язану зону тарифу.',
  })
  @ApiParam({ name: 'id', description: 'UUID або ID тарифу' })
  @ApiResponse({ status: 200, description: 'Тариф успішно оновлено', type: TariffResponseDto })
  @ApiResponse({ status: 401, description: 'Відсутня авторизація' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  @ApiResponse({ status: 404, description: 'Тариф не знайдено' })
  async updateTariff(@Param('id') id: string, @Body() dto: UpdateTariffDto) {
    return this.tariffsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Видалення тарифу (лише ADMIN)',
  })
  @ApiParam({ name: 'id', description: 'UUID або ID тарифу' })
  @ApiResponse({ status: 200, description: 'Тариф успішно видалено' })
  @ApiResponse({ status: 401, description: 'Відсутня авторизація' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  @ApiResponse({ status: 404, description: 'Тариф не знайдено' })
  async deleteTariff(@Param('id') id: string) {
    return this.tariffsService.delete(id);
  }
}
