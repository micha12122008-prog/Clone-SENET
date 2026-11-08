import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateBookingDto } from './dto/bookings.dto';

@ApiTags('Bookings')
@ApiBearerAuth('JWT-auth')
@Controller('bookings')
export class BookingsController {
  @Get()
  @ApiOperation({ summary: 'Список бронювань клубу (для адміна)' })
  @ApiQuery({ name: 'date', required: false, example: '2026-10-25' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] })
  getBookings(@Query('date') date?: string, @Query('status') status?: string) {
    return [
      {
        id: 'book-1',
        username: 's1mple_pro',
        computerName: 'PC-01',
        startTime: '2026-10-25T18:00:00.000Z',
        endTime: '2026-10-25T21:00:00.000Z',
        tariffName: '3 Години Пакет',
        prepaidAmount: 130.0,
        status: 'CONFIRMED',
      },
    ];
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Матриця завантаженості ПК на обрану дату (Timeline/Gantt)' })
  @ApiQuery({ name: 'date', required: true, example: '2026-10-25' })
  getCalendar(@Query('date') date: string) {
    return {
      date,
      slots: [
        {
          computerId: 'comp-1',
          computerName: 'PC-01',
          bookings: [
            {
              id: 'book-1',
              startTime: '18:00',
              endTime: '21:00',
              clientName: 's1mple_pro',
              status: 'CONFIRMED',
            },
          ],
        },
        {
          computerId: 'comp-2',
          computerName: 'PC-02',
          bookings: [],
        },
      ],
    };
  }

  @Get('my')
  @ApiOperation({ summary: 'Список моїх бронювань (для клієнта)' })
  getMyBookings() {
    return [
      {
        id: 'book-1',
        computerName: 'PC-01',
        zoneName: 'Standard Zone',
        startTime: '2026-10-25T18:00:00.000Z',
        endTime: '2026-10-25T21:00:00.000Z',
        status: 'CONFIRMED',
        prepaidAmount: 130.0,
      },
    ];
  }

  @Post()
  @ApiOperation({ summary: 'Створення нового бронювання' })
  createBooking(@Body() dto: CreateBookingDto) {
    return {
      id: 'book-new',
      ...dto,
      status: 'CONFIRMED',
      prepaidAmount: 130.0,
      message: 'Бронювання успішно створено!',
    };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Скасування бронювання (з поверненням коштів на баланс)' })
  cancelBooking(@Param('id') id: string) {
    return {
      id,
      status: 'CANCELLED',
      refundedAmount: 130.0,
      message: 'Бронювання скасовано, кошти повернуто на баланс',
    };
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Підтвердження приходу клієнта та запуск сесії (Admin)' })
  confirmArrival(@Param('id') id: string) {
    return {
      bookingId: id,
      sessionId: 'sess-started-from-booking',
      status: 'ACTIVE_SESSION',
      message: 'Клієнт прийшов, сесію успішно запущено',
    };
  }
}
