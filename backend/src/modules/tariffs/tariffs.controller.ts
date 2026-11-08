import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CalculatePriceDto, CreateTariffDto, ValidatePromoDto } from './dto/tariffs.dto';

@ApiTags('Tariffs')
@Controller('tariffs')
export class TariffsController {
  @Get()
  @ApiOperation({ summary: 'Список усіх тарифів клубу' })
  getTariffs() {
    return [
      {
        id: 'tariff-1',
        name: '1 Година Standard',
        type: 'HOURLY',
        price: 50.0,
        zoneName: 'Standard Zone',
        isActive: true,
      },
      {
        id: 'tariff-2',
        name: '3 Години Пакет',
        type: 'PACKAGE',
        price: 130.0,
        durationMinutes: 180,
        zoneName: 'Standard Zone',
        isActive: true,
      },
      {
        id: 'tariff-3',
        name: '5 Годин Пакет',
        type: 'PACKAGE',
        price: 200.0,
        durationMinutes: 300,
        isActive: true,
      },
      {
        id: 'tariff-4',
        name: 'Ніч у Клубі (22:00 - 08:00)',
        type: 'NIGHT',
        price: 280.0,
        durationMinutes: 600,
        startTime: '22:00',
        endTime: '08:00',
        isActive: true,
      },
    ];
  }

  @Get('available')
  @ApiOperation({ summary: 'Тарифи, доступні на поточний час для обраної зони' })
  @ApiQuery({ name: 'zoneId', required: false })
  getAvailableTariffs(@Query('zoneId') zoneId?: string) {
    return [
      {
        id: 'tariff-1',
        name: '1 Година Standard',
        type: 'HOURLY',
        price: 50.0,
        isAvailableNow: true,
      },
      {
        id: 'tariff-2',
        name: '3 Години Пакет',
        type: 'PACKAGE',
        price: 130.0,
        isAvailableNow: true,
      },
    ];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Детальна інформація про тариф' })
  getTariffById(@Param('id') id: string) {
    return {
      id,
      name: '3 Години Пакет',
      type: 'PACKAGE',
      price: 130.0,
      durationMinutes: 180,
      isActive: true,
    };
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Створення нового тарифу (Admin/Owner)' })
  createTariff(@Body() dto: CreateTariffDto) {
    return {
      id: 'tariff-new',
      ...dto,
      isActive: true,
    };
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Редагування тарифу' })
  updateTariff(@Param('id') id: string, @Body() dto: Partial<CreateTariffDto>) {
    return {
      id,
      ...dto,
      message: 'Тариф оновлено',
    };
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Деактивація/видалення тарифу' })
  deleteTariff(@Param('id') id: string) {
    return { message: `Тариф ${id} деактивовано` };
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Попередній розрахунок ціни сесії з промокодом' })
  calculatePrice(@Body() dto: CalculatePriceDto) {
    const basePrice = 100.0;
    const discount = dto.promoCode ? 15.0 : 0.0;
    return {
      tariffId: dto.tariffId,
      durationMinutes: dto.durationMinutes,
      originalPrice: basePrice,
      discountAmount: discount,
      finalPrice: basePrice - discount,
      promoApplied: !!dto.promoCode,
    };
  }

  @Post('promotions/validate')
  @ApiOperation({ summary: 'Перевірка промокоду на валідність' })
  validatePromo(@Body() dto: ValidatePromoDto) {
    if (dto.code.toUpperCase() === 'WELCOME') {
      return {
        valid: true,
        code: dto.code,
        discountPercent: 15,
        message: 'Промокод успішно застосовано (-15%)',
      };
    }
    return {
      valid: false,
      code: dto.code,
      message: 'Недійсний або прострочений промокод',
    };
  }
}
