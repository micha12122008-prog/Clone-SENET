import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BookingsService } from './bookings.service';
import {
  AdjacentSeatsQueryDto,
  CancelBookingDto,
  CheckInQueryDto,
  ConfirmBookingDto,
  CreateBookingDto,
  RescheduleBookingDto,
} from './dto/bookings.dto';

@ApiTags('Bookings')
@ApiBearerAuth('JWT-auth')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('extras-catalog')
  @ApiOperation({
    summary: 'Каталог додаткових послуг до бронювання (Booking Extras)',
    description: 'Повертає довідник додаткових опцій: напої, снеки, другий геймпад DualSense, супровід VR-оператора.',
  })
  @ApiResponse({ status: 200, description: 'Каталог додаткових послуг клубу' })
  getExtrasCatalog() {
    return this.bookingsService.getExtrasCatalog();
  }

  @Get('adjacent-seats')
  @ApiOperation({
    summary: 'Пошук суміжних / сусідніх місць для команд',
    description: 'Знаходить групи сусідніх комп’ютерів в одному ряду обраної зони для командного бронювання на заданий час.',
  })
  @ApiResponse({ status: 200, description: 'Групи вільних сусідніх місць' })
  getAdjacentSeats(@Query() query: AdjacentSeatsQueryDto) {
    return this.bookingsService.findAdjacentSeats(query);
  }

  @Get('check-in')
  @ApiOperation({
    summary: 'Чек-ін: пошук картки бронювання за QR-кодом/токеном або телефоном',
    description: 'Повертає повну інформаційну картку бронювання для рецепції адміна або сканера. Увага: відповідно до ТЗ тижня 4 цей ендпоінт НЕ стартує ігрову сесію.',
  })
  @ApiResponse({ status: 200, description: 'Картку бронювання знайдено' })
  @ApiResponse({ status: 404, description: 'Бронювання не знайдено' })
  checkIn(@Query() query: CheckInQueryDto) {
    return this.bookingsService.checkInLookup(query);
  }

  @Get('calendar')
  @ApiOperation({
    summary: 'Матриця завантаженості ПК на обрану дату (Timeline / Gantt chart)',
    description: 'Повертає список комп’ютерів із часовими слотами бронювань на обрану дату (формат дати YYYY-MM-DD).',
  })
  @ApiQuery({ name: 'date', required: true, example: '2026-11-25', description: 'Дата у форматі YYYY-MM-DD' })
  @ApiResponse({ status: 200, description: 'Матриця завантаженості місць' })
  getCalendar(@Query('date') date: string) {
    return this.bookingsService.getCalendar(date);
  }

  @Get('my')
  @ApiOperation({
    summary: 'Список бронювань поточного користувача (для клієнтського кабінету)',
    description: 'Повертає активні та минулі бронювання авторизованого гравця.',
  })
  @ApiResponse({ status: 200, description: 'Список бронювань користувача' })
  getMyBookings(@CurrentUser() user?: any) {
    const userId = user?.id || user?.userId || 'player-uuid-1a2b-3c4d-5e6f-7a8b9c0d1e2f';
    return this.bookingsService.getMyBookings(userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Реєстр усіх бронювань клубу з фільтрами (для адмін-панелі)',
    description: 'Дозволяє фільтрувати бронювання за датою, статусом, зоною та ID комп’ютера.',
  })
  @ApiQuery({ name: 'date', required: false, example: '2026-11-25', description: 'Фільтр за датою' })
  @ApiQuery({ name: 'status', required: false, enum: ['HOLD', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] })
  @ApiQuery({ name: 'placeId', required: false, description: 'ID комп’ютера' })
  @ApiQuery({ name: 'zoneId', required: false, description: 'ID ігрової зони' })
  @ApiResponse({ status: 200, description: 'Список бронювань' })
  getBookings(
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('placeId') placeId?: string,
    @Query('zoneId') zoneId?: string,
  ) {
    return this.bookingsService.findAll({ date, status, placeId, zoneId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Детальна інформація про конкретне бронювання' })
  @ApiParam({ name: 'id', description: 'UUID бронювання' })
  @ApiResponse({ status: 200, description: 'Інформація про бронь' })
  @ApiResponse({ status: 404, description: 'Бронювання не знайдено' })
  getBookingById(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Створення бронювання (клієнтський майстер або створення із залу адміном)',
    description: 'Підтримує тривалість 1/2/3 години, пакет «3+1» (4 години за ціною 3), додаткові послуги (extras), утримання місця на 10 хвилин (isHold) та атомарний захист від double-booking через транзакцію PostgreSQL.',
  })
  @ApiResponse({ status: 201, description: 'Бронювання успішно створено або заблоковано на 10 хвилин утримання' })
  @ApiResponse({ status: 409, description: 'Конфлікт: місце вже заброньоване на обраний інтервал' })
  @ApiResponse({ status: 400, description: 'Помилка валідації або місце на ремонті' })
  createBooking(@Body() dto: CreateBookingDto, @CurrentUser() user?: any) {
    const currentUserId = user?.id || user?.userId;
    return this.bookingsService.create(dto, currentUserId);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Фіксація / оплата утриманого бронювання (Hold -> Confirmed)',
    description: 'Підтверджує попередньо утримане місце, скидає 10-хвилинний hold TTL і закріплює бронь за клієнтом.',
  })
  @ApiParam({ name: 'id', description: 'UUID бронювання' })
  @ApiResponse({ status: 200, description: 'Бронювання успішно підтверджено' })
  confirmBooking(@Param('id') id: string, @Body() dto?: ConfirmBookingDto) {
    return this.bookingsService.confirmBooking(id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Скасування бронювання (з перевіркою правила 2 годин)',
    description: 'Правило 2 годин: якщо до старту сесії залишилося менше 2 годин, скасування блокується зі статусом 400 Bad Request. При своєчасному скасуванні повертається сума коштів.',
  })
  @ApiParam({ name: 'id', description: 'UUID бронювання' })
  @ApiResponse({ status: 200, description: 'Бронювання успішно скасовано, кошти повернуто' })
  @ApiResponse({ status: 400, description: 'Порушення правила 2 годин (до старту менше 2 годин)' })
  cancelBooking(
    @Param('id') id: string,
    @CurrentUser() user?: any,
    @Body() dto?: CancelBookingDto,
  ) {
    const currentUserId = user?.id || user?.userId;
    return this.bookingsService.cancel(id, currentUserId, dto);
  }

  @Post(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Перенесення часу бронювання (з перевіркою правила 2 годин)',
    description: 'Правило 2 годин: перенесення можливе лише не пізніше ніж за 2 години до початку поточної сесії. Перевіряє доступність місця на новий інтервал у транзакції.',
  })
  @ApiParam({ name: 'id', description: 'UUID бронювання' })
  @ApiResponse({ status: 200, description: 'Час бронювання успішно змінено' })
  @ApiResponse({ status: 400, description: 'Порушення правила 2 годин або некоректний новий час' })
  @ApiResponse({ status: 409, description: 'Місце зайняте на новий обраний інтервал' })
  rescheduleBooking(
    @Param('id') id: string,
    @Body() dto: RescheduleBookingDto,
    @CurrentUser() user?: any,
  ) {
    const currentUserId = user?.id || user?.userId;
    return this.bookingsService.reschedule(id, dto, currentUserId);
  }
}
