import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChangePcDto, CreateReviewDto, ExtendSessionDto, QrCheckInDto, StartSessionDto } from './dto/sessions.dto';

@ApiTags('Sessions')
@ApiBearerAuth('JWT-auth')
@Controller('sessions')
export class SessionsController {
  @Get()
  @ApiOperation({ summary: 'Журнал усіх сесій клубу (історія + поточні)' })
  getSessions() {
    return [
      {
        id: 'sess-1',
        computerName: 'VIP-01',
        username: 's1mple_pro',
        tariffName: 'VIP 1 Година OLED 240Hz',
        status: 'ACTIVE',
        startTime: '2026-10-25T11:00:00.000Z',
        durationMinutes: 45,
        currentCost: 82.5,
      },
      {
        id: 'sess-0',
        computerName: 'PC-01',
        username: 'b1t_clutch',
        tariffName: '3 Години Пакет Standard',
        status: 'FINISHED',
        startTime: '2026-10-25T08:00:00.000Z',
        actualEndTime: '2026-10-25T11:00:00.000Z',
        durationMinutes: 180,
        totalCost: 150.0,
      },
    ];
  }

  @Get('active')
  @ApiOperation({ summary: 'Список усіх активних сесій просто зараз (для адмінки та інтерактивної карти залу)' })
  getActiveSessions() {
    return [
      {
        id: 'sess-1',
        computerId: 'comp-vip-1',
        computerNumber: 7,
        computerName: 'VIP-01',
        username: 's1mple_pro',
        status: 'ACTIVE',
        startTime: '2026-10-25T11:00:00.000Z',
        durationMinutes: 45,
        currentCost: 82.5,
        remainingMinutes: 15,
      },
    ];
  }

  @Get('my-active')
  @ApiOperation({ summary: 'Інформація про активну сесію поточного гравця (для оверлею на моніторі або в мобілці)' })
  getMyActiveSession() {
    return {
      id: 'sess-1',
      computerName: 'VIP-01',
      zoneName: 'VIP OLED 240Hz',
      tariffName: 'VIP 1 Година OLED 240Hz',
      startTime: '2026-10-25T11:00:00.000Z',
      durationMinutes: 45,
      currentCost: 82.5,
      remainingMinutes: 15,
    };
  }

  @Post('check-in')
  @ApiOperation({ summary: 'Чек-ін на ресепшені клубу: сканування QR-коду гостя або пошук за телефоном' })
  @ApiResponse({ status: 200, description: 'Чек-ін успішно виконано, сесію запущено' })
  checkIn(@Body() dto: QrCheckInDto) {
    return {
      success: true,
      client: {
        username: 's1mple_pro',
        phone: dto.phone || '+380993334455',
        balance: 450.0,
      },
      booking: {
        stationName: 'VIP-01',
        zone: 'VIP OLED 240Hz',
        tariff: 'VIP 1 Година OLED 240Hz',
        isPaidOnline: true,
      },
      message: 'QR підтверджено. Комп’ютер активовано. Приємної гри!',
    };
  }

  @Post('start')
  @ApiOperation({ summary: 'Ручний запуск нової ігрової сесії адміністратором (клієнт + ПК/станція + тариф)' })
  startSession(@Body() dto: StartSessionDto) {
    return {
      sessionId: 'sess-new',
      computerId: dto.computerId,
      status: 'ACTIVE',
      startTime: new Date().toISOString(),
      message: 'Сесію успішно розпочато. Комп’ютер активовано.',
    };
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Штатне або примусове завершення сесії з розрахунком суми' })
  stopSession(@Param('id') id: string) {
    return {
      sessionId: id,
      status: 'FINISHED',
      totalCost: 110.0,
      durationMinutes: 60,
      actualEndTime: new Date().toISOString(),
      message: 'Сесію завершено. Станцію звільнено. Кошти списано.',
    };
  }

  @Post(':id/extend')
  @ApiOperation({ summary: 'Продовження сесії (докуповування часу гравцем або адміном)' })
  extendSession(@Param('id') id: string, @Body() dto: ExtendSessionDto) {
    return {
      sessionId: id,
      addedMinutes: dto.additionalMinutes,
      message: `Сесію продовжено на ${dto.additionalMinutes} хв`,
    };
  }

  @Post(':id/relocate')
  @ApiOperation({ summary: 'Функція «Пересадити»: перенесення сесії клієнта на інший вільний ПК без втрати часу' })
  relocate(@Param('id') id: string, @Body() dto: ChangePcDto) {
    return {
      sessionId: id,
      oldComputerName: 'PC-02',
      newComputerId: dto.newComputerId,
      message: 'Гравця успішно пересаджено на нову станцію. Попередній ПК розблоковано.',
    };
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Оцінити візит після завершення сесії (1-5 зірок + відгук)' })
  createReview(@Param('id') id: string, @Body() dto: CreateReviewDto) {
    return {
      sessionId: id,
      rating: dto.rating,
      comment: dto.comment,
      message: 'Дякуємо за ваш відгук! Бонуси за оцінку нараховано на баланс.',
    };
  }
}
