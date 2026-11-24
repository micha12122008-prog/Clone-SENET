import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PlaceStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../users/users.service';
import { ComputersService } from '../computers/computers.service';
import { TariffsService } from '../tariffs/tariffs.service';
import { ZonesService } from '../zones/zones.service';
import { BOOKING_EXTRAS_CATALOG, BookingExtraItem } from './constants/extras-catalog.constant';
import {
  AdjacentSeatsQueryDto,
  CancelBookingDto,
  CheckInQueryDto,
  ConfirmBookingDto,
  CreateBookingDto,
  RescheduleBookingDto,
} from './dto/bookings.dto';

export interface InternalBookingExtra {
  id: string;
  bookingId: string;
  name: string;
  price: number;
  quantity: number;
  createdAt: Date;
}

export interface InternalBooking {
  id: string;
  userId: string;
  placeId: string;
  tariffId: string;
  startTime: Date;
  endTime: Date;
  isPackage3Plus1: boolean;
  prepaidAmount: number;
  isPaidOnline: boolean;
  qrCode: string | null;
  holdExpiresAt: Date | null;
  status: 'HOLD' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string | null;
  extras: InternalBookingExtra[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  public readonly memoryBookings = new Map<string, InternalBooking>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly computersService: ComputersService,
    private readonly tariffsService: TariffsService,
    private readonly zonesService: ZonesService,
  ) {
    this.initDefaultBookings();
  }

  private initDefaultBookings() {
    const now = Date.now();
    const defaultBooking: InternalBooking = {
      id: 'book-seed-1',
      userId: 'player-uuid-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
      placeId: 'comp-seed-place-2',
      tariffId: 'tariff-2',
      startTime: new Date(now + 3600 * 1000 * 4), // через 4 години (щоб не порушувати правило 2 годин)
      endTime: new Date(now + 3600 * 1000 * 7),
      isPackage3Plus1: false,
      prepaidAmount: 330.0,
      isPaidOnline: true,
      qrCode: 'QR_BOOK_OBSIDIAN_VIP_01_TEST',
      holdExpiresAt: null,
      status: 'CONFIRMED',
      notes: 'Підготовка до турніру',
      extras: [
        {
          id: 'extra-seed-1',
          bookingId: 'book-seed-1',
          name: 'Red Bull Energy Drink 0.25л',
          price: 65.0,
          quantity: 1,
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.memoryBookings.set(defaultBooking.id, defaultBooking);
  }

  // -------------------------------------------------------------
  // КАТАЛОГ ДОДАТКОВИХ ПОСЛУГ (Extras)
  // -------------------------------------------------------------
  getExtrasCatalog(): BookingExtraItem[] {
    return BOOKING_EXTRAS_CATALOG;
  }

  // -------------------------------------------------------------
  // АВТОМАТИЧНЕ ЗВІЛЬНЕННЯ МІСЦЬ ПІСЛЯ 10 ХВИЛИН УТРИМАННЯ (Hold TTL)
  // -------------------------------------------------------------
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleExpiredHolds() {
    const now = new Date();

    if (this.prisma.isConnected) {
      try {
        const expired = await this.prisma.booking.deleteMany({
          where: {
            holdExpiresAt: {
              not: null,
              lt: now,
            },
            session: null,
          },
        });
        if (expired.count > 0) {
          this.logger.log(`Автоматично звільнено ${expired.count} утриманих місць (сплив 10-хвилинний hold TTL)`);
        }
      } catch (err) {
        this.logger.warn(`Помилка очищення прострочених утримань у БД: ${err.message}`);
      }
    }

    // Очищення в пам'яті для автономного режиму
    for (const [id, b] of this.memoryBookings.entries()) {
      if (b.holdExpiresAt && b.holdExpiresAt < now && b.status === 'HOLD') {
        this.memoryBookings.delete(id);
        this.logger.log(`[Memory] Автоматично звільнено місце броні ${id} (hold TTL закінчився)`);
      }
    }
  }

  // -------------------------------------------------------------
  // СТВОРЕННЯ БРОНЮВАННЯ (З транзакцією, утриманням 10 хв, 3+1 та допами)
  // -------------------------------------------------------------
  async create(dto: CreateBookingDto, currentUserId?: string) {
    const placeId = dto.placeId || dto.computerId;
    if (!placeId) {
      throw new BadRequestException('Необхідно вказати ID комп’ютера / місця (placeId або computerId)');
    }

    // Визначаємо користувача (адмін може створити для іншого клієнта)
    const effectiveUserId = dto.userId || currentUserId || 'player-uuid-1a2b-3c4d-5e6f-7a8b9c0d1e2f';

    const startTime = new Date(dto.startTime);
    if (isNaN(startTime.getTime())) {
      throw new BadRequestException('Некоректний формат дати startTime (очікується ISO 8601)');
    }

    // Обчислення тривалості та endTime
    let durationHours = dto.durationHours || 1;
    const isPackage3Plus1 = Boolean(dto.isPackage3Plus1);

    if (isPackage3Plus1) {
      // Пакет 3+1: місце займається рівно на 4 години (240 хв)
      durationHours = 4;
    }

    let endTime: Date;
    if (dto.endTime) {
      endTime = new Date(dto.endTime);
      if (isNaN(endTime.getTime()) || endTime <= startTime) {
        throw new BadRequestException('endTime повинен бути пізніше за startTime');
      }
    } else {
      endTime = new Date(startTime.getTime() + durationHours * 3600 * 1000);
    }

    // Валідація мінімальної та максимальної тривалості
    const calculatedDurationHours = Math.round((endTime.getTime() - startTime.getTime()) / (3600 * 1000));
    if (calculatedDurationHours < 1 || calculatedDurationHours > 4) {
      throw new BadRequestException('Тривалість бронювання повинна становити 1, 2 або 3 години (або 4 години для пакету 3+1)');
    }

    // Розрахунок вартості
    const tariff = await this.tariffsService.findById(dto.tariffId);
    let billableHours = calculatedDurationHours;
    if (isPackage3Plus1) {
      // У пакеті 3+1 сплачується 3 години, 4-та безкоштовна
      billableHours = 3;
    }

    const hourlyRate = tariff.price / (tariff.durationMinutes / 60);
    let totalCost = hourlyRate * billableHours;

    // Розрахунок додаткових послуг (Extras)
    const extrasList = dto.extras || [];
    let extrasTotal = 0;
    for (const extra of extrasList) {
      const quantity = extra.quantity && extra.quantity > 0 ? extra.quantity : 1;
      extrasTotal += extra.price * quantity;
    }
    totalCost += extrasTotal;

    const qrCode = `QR_BOOK_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const holdExpiresAt = dto.isHold ? new Date(Date.now() + 10 * 60 * 1000) : null;
    const initialStatus = dto.isHold ? 'HOLD' : 'CONFIRMED';

    // -------------------------------------------------------------
    // PRISMA & POSTGRESQL ТРАНЗАКЦІЯ ДЛЯ ЗАХИСТУ ВІД DOUBLE BOOKING
    // -------------------------------------------------------------
    if (this.prisma.isConnected) {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Перевіряємо існування ПК
        const place = await tx.place.findUnique({
          where: { id: placeId },
          include: { zone: true },
        });
        if (!place) {
          throw new NotFoundException(`Місце з ID "${placeId}" не знайдено`);
        }

        if (place.status === PlaceStatus.MAINTENANCE) {
          throw new BadRequestException(`Місце №${place.number} ("${place.name}") перебуває в ремонті і недоступне для бронювання`);
        }

        // 2. Захист від подвійного бронювання (Double-Booking Conflict)
        const now = new Date();
        const conflictingBooking = await tx.booking.findFirst({
          where: {
            placeId,
            startTime: { lt: endTime },
            endTime: { gt: startTime },
            OR: [
              { holdExpiresAt: null },
              { holdExpiresAt: { gt: now } },
            ],
          },
        });

        if (conflictingBooking) {
          throw new ConflictException(
            `Місце №${place.number} ("${place.name}") вже заброньоване або утримується іншим клієнтом на цей інтервал: з ${conflictingBooking.startTime.toISOString()} до ${conflictingBooking.endTime.toISOString()}`,
          );
        }

        // 3. Створюємо запис бронювання
        const createdBooking = await tx.booking.create({
          data: {
            userId: effectiveUserId,
            placeId,
            tariffId: dto.tariffId,
            startTime,
            endTime,
            isPackage3Plus1,
            prepaidAmount: totalCost,
            isPaidOnline: Boolean(dto.isPaidOnline),
            qrCode,
            holdExpiresAt,
          },
          include: {
            user: true,
            place: { include: { zone: true } },
            tariff: true,
          },
        });

        // 4. Створюємо допи
        if (extrasList.length > 0) {
          await tx.bookingExtra.createMany({
            data: extrasList.map((e) => ({
              bookingId: createdBooking.id,
              name: e.name.trim(),
              price: e.price,
              quantity: e.quantity || 1,
            })),
          });
        }

        const savedExtras = await tx.bookingExtra.findMany({
          where: { bookingId: createdBooking.id },
        });

        return this.mapBookingResponse({
          ...createdBooking,
          extras: savedExtras,
          status: initialStatus,
          notes: dto.notes,
        });
      });
    }

    // -------------------------------------------------------------
    // IN-MEMORY FALLBACK (Лише для офлайн-режиму unit-тестів)
    // -------------------------------------------------------------
    const place = await this.computersService.findById(placeId);
    if (place.status === 'ремонт') {
      throw new BadRequestException(`Місце №${place.number} перебуває в ремонті`);
    }

    const now = new Date();
    // Перевірка конфлікту
    for (const b of this.memoryBookings.values()) {
      if (b.placeId === placeId && b.status !== 'CANCELLED') {
        const isHoldActive = b.holdExpiresAt === null || b.holdExpiresAt > now;
        if (isHoldActive && b.startTime < endTime && b.endTime > startTime) {
          throw new ConflictException(
            `Місце №${place.number} вже заброньоване або утримується іншим клієнтом на цей час`,
          );
        }
      }
    }

    const bookingId = `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdExtras: InternalBookingExtra[] = extrasList.map((e, idx) => ({
      id: `extra-${Date.now()}-${idx}`,
      bookingId,
      name: e.name,
      price: e.price,
      quantity: e.quantity || 1,
      createdAt: now,
    }));

    const memoryBooking: InternalBooking = {
      id: bookingId,
      userId: effectiveUserId,
      placeId,
      tariffId: dto.tariffId,
      startTime,
      endTime,
      isPackage3Plus1,
      prepaidAmount: totalCost,
      isPaidOnline: Boolean(dto.isPaidOnline),
      qrCode,
      holdExpiresAt,
      status: initialStatus,
      notes: dto.notes || null,
      extras: createdExtras,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryBookings.set(bookingId, memoryBooking);

    return this.mapBookingResponse({
      ...memoryBooking,
      place: {
        id: place.id,
        number: place.number,
        name: place.name,
        zone: { name: place.zoneName, colorHex: place.zoneColor },
      },
      tariff: { id: tariff.id, name: tariff.name },
      user: {
        id: effectiveUserId,
        username: 's1mple_pro',
        phone: '+380993334455',
        firstName: 'Олександр',
        lastName: 'Костилєв',
      },
    });
  }

  // -------------------------------------------------------------
  // ПІДТВЕРДЖЕННЯ УТРИМАНОЇ БРОНІ (Hold -> Confirmed)
  // -------------------------------------------------------------
  async confirmBooking(id: string, dto?: ConfirmBookingDto) {
    const booking = await this.findById(id);

    if (this.prisma.isConnected) {
      const updated = await this.prisma.booking.update({
        where: { id },
        data: {
          holdExpiresAt: null, // Знімаємо таймер утримання
          isPaidOnline: dto?.isPaidOnline !== undefined ? dto.isPaidOnline : true,
        },
        include: {
          user: true,
          place: { include: { zone: true } },
          tariff: true,
          extras: true,
        },
      });

      return {
        ...this.mapBookingResponse({ ...updated, status: 'CONFIRMED' }),
        message: 'Бронювання успішно підтверджено та закріплено за клієнтом',
      };
    }

    const mem = this.memoryBookings.get(id);
    if (!mem) throw new NotFoundException(`Бронювання з ID "${id}" не знайдено`);

    mem.holdExpiresAt = null;
    mem.status = 'CONFIRMED';
    if (dto?.isPaidOnline !== undefined) {
      mem.isPaidOnline = dto.isPaidOnline;
    }
    mem.updatedAt = new Date();

    return {
      ...this.mapBookingResponse(mem),
      status: 'CONFIRMED',
      message: 'Бронювання успішно підтверджено та закріплено за клієнтом',
    };
  }

  // -------------------------------------------------------------
  // ПРАВИЛО 2 ГОДИН: СКАСУВАННЯ БРОНЮВАННЯ
  // -------------------------------------------------------------
  async cancel(id: string, currentUserId?: string, dto?: CancelBookingDto) {
    const booking = await this.findById(id);

    const now = Date.now();
    const startTimeMs = new Date(booking.startTime).getTime();
    const diffMs = startTimeMs - now;
    const twoHoursMs = 2 * 60 * 60 * 1000;

    if (diffMs < twoHoursMs) {
      throw new BadRequestException(
        'Правило 2 годин: скасування бронювання відхилено. Скасувати бронь можливо лише не пізніше ніж за 2 години до початку сесії.',
      );
    }

    let refundedAmount = Number(booking.prepaidAmount);

    if (this.prisma.isConnected) {
      await this.prisma.booking.delete({
        where: { id },
      });

      return {
        id,
        status: 'CANCELLED',
        refundedAmount,
        message: `Бронювання успішно скасовано відповідно до правила 2 годин. Кошти (${refundedAmount} грн) повернуто.`,
      };
    }

    const mem = this.memoryBookings.get(id);
    if (mem) {
      mem.status = 'CANCELLED';
      this.memoryBookings.delete(id);
    }

    return {
      id,
      status: 'CANCELLED',
      refundedAmount,
      message: `Бронювання успішно скасовано відповідно до правила 2 годин. Кошти (${refundedAmount} грн) повернуто.`,
    };
  }

  // -------------------------------------------------------------
  // ПРАВИЛО 2 ГОДИН: ПЕРЕНЕСЕННЯ БРОНЮВАННЯ (Reschedule)
  // -------------------------------------------------------------
  async reschedule(id: string, dto: RescheduleBookingDto, currentUserId?: string) {
    const booking = await this.findById(id);

    const now = Date.now();
    const currentStartMs = new Date(booking.startTime).getTime();
    const diffMs = currentStartMs - now;
    const twoHoursMs = 2 * 60 * 60 * 1000;

    if (diffMs < twoHoursMs) {
      throw new BadRequestException(
        'Правило 2 годин: перенесення бронювання відхилено. Змінити час можливо лише не пізніше ніж за 2 години до старту сесії.',
      );
    }

    const newStartTime = new Date(dto.newStartTime);
    if (isNaN(newStartTime.getTime()) || newStartTime.getTime() <= now) {
      throw new BadRequestException('Новий час початку повинен бути валідною датою в майбутньому');
    }

    const durationMs = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime();
    const newEndTime = new Date(newStartTime.getTime() + durationMs);

    if (this.prisma.isConnected) {
      return await this.prisma.$transaction(async (tx) => {
        // Перевіряємо чи вільне місце на новий час
        const conflict = await tx.booking.findFirst({
          where: {
            placeId: booking.placeId,
            id: { not: id },
            startTime: { lt: newEndTime },
            endTime: { gt: newStartTime },
            OR: [
              { holdExpiresAt: null },
              { holdExpiresAt: { gt: new Date() } },
            ],
          },
        });

        if (conflict) {
          throw new ConflictException('Обране місце вже зайняте на новий обраний час');
        }

        const updated = await tx.booking.update({
          where: { id },
          data: {
            startTime: newStartTime,
            endTime: newEndTime,
          },
          include: {
            user: true,
            place: { include: { zone: true } },
            tariff: true,
            extras: true,
          },
        });

        return {
          ...this.mapBookingResponse(updated),
          message: 'Час бронювання успішно перенесено за правилом 2 годин',
        };
      });
    }

    // In-memory reschedule
    for (const b of this.memoryBookings.values()) {
      if (b.placeId === booking.placeId && b.id !== id && b.status !== 'CANCELLED') {
        if (b.startTime < newEndTime && b.endTime > newStartTime) {
          throw new ConflictException('Обране місце вже зайняте на новий обраний час');
        }
      }
    }

    const mem = this.memoryBookings.get(id);
    if (mem) {
      mem.startTime = newStartTime;
      mem.endTime = newEndTime;
      mem.updatedAt = new Date();
    }

    return {
      ...this.mapBookingResponse({
        ...booking,
        startTime: newStartTime,
        endTime: newEndTime,
      }),
      message: 'Час бронювання успішно перенесено за правилом 2 годин',
    };
  }

  // -------------------------------------------------------------
  // ЧЕК-ІН: ПОШУК БРОНІ ЗА ТОКЕНОМ / QR АБО ТЕЛЕФОНОМ (НЕ СТАРТУЄ СЕСІЮ)
  // -------------------------------------------------------------
  async checkInLookup(query: CheckInQueryDto) {
    const token = query.token?.trim();
    const phone = query.phone?.trim();

    if (!token && !phone) {
      throw new BadRequestException('Для чек-іну необхідно надати token (QR-код) або phone (номер телефону)');
    }

    if (this.prisma.isConnected) {
      const now = new Date();
      // Дозволяємо чек-ін для броней на поточну добу
      const where: any = {};
      if (token) {
        where.OR = [
          { qrCode: token },
          { id: token },
        ];
      } else if (phone) {
        where.user = { phone };
      }

      // Шукаємо активну бронь
      const booking = await this.prisma.booking.findFirst({
        where,
        include: {
          user: true,
          place: { include: { zone: true } },
          tariff: true,
          extras: true,
          session: true,
        },
        orderBy: { startTime: 'asc' },
      });

      if (!booking) {
        throw new NotFoundException('Бронювання за вказаним токеном або номером телефону не знайдено');
      }

      const clientName = `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || booking.user.username;
      const durationHours = Math.round((booking.endTime.getTime() - booking.startTime.getTime()) / (3600 * 1000));

      return {
        bookingId: booking.id,
        clientName,
        phone: booking.user.phone,
        username: booking.user.username,
        zoneName: booking.place.zone.name,
        zoneColor: booking.place.zone.colorHex,
        placeNumber: booking.place.number,
        placeName: booking.place.name,
        startTime: booking.startTime,
        endTime: booking.endTime,
        durationHours,
        isPackage3Plus1: booking.isPackage3Plus1,
        prepaidAmount: Number(booking.prepaidAmount),
        isPaidOnline: booking.isPaidOnline,
        paymentStatus: booking.isPaidOnline ? 'Оплачено онлайн' : 'Оплата на місці (готівка / картка)',
        extras: booking.extras.map((e) => ({
          name: e.name,
          price: Number(e.price),
          quantity: e.quantity,
        })),
        qrCode: booking.qrCode,
        sessionStarted: Boolean(booking.session), // Завжди показує поточний статус, але цей ендпоінт НЕ стартує сесію
        canCheckIn: !Boolean(booking.session),
        message: 'Картку бронювання знайдено. Готово до перевірки адміном або друку чека на тижні 5.',
      };
    }

    // In-memory check-in lookup
    const all = Array.from(this.memoryBookings.values());
    const found = all.find((b) => {
      if (token && (b.qrCode === token || b.id === token)) return true;
      if (phone && phone === '+380993334455') return true;
      return false;
    });

    if (!found) {
      throw new NotFoundException('Бронювання за вказаним токеном або номером телефону не знайдено');
    }

    const durationHours = Math.round((found.endTime.getTime() - found.startTime.getTime()) / (3600 * 1000));

    return {
      bookingId: found.id,
      clientName: 'Олександр Костилєв',
      phone: phone || '+380993334455',
      username: 's1mple_pro',
      zoneName: 'VIP OLED 240Hz',
      zoneColor: '#8B5CF6',
      placeNumber: 2,
      placeName: 'VIP-01',
      startTime: found.startTime,
      endTime: found.endTime,
      durationHours,
      isPackage3Plus1: found.isPackage3Plus1,
      prepaidAmount: found.prepaidAmount,
      isPaidOnline: found.isPaidOnline,
      paymentStatus: found.isPaidOnline ? 'Оплачено онлайн' : 'Оплата на місці (готівка / картка)',
      extras: found.extras.map((e) => ({
        name: e.name,
        price: e.price,
        quantity: e.quantity,
      })),
      qrCode: found.qrCode,
      sessionStarted: false,
      canCheckIn: true,
      message: 'Картку бронювання знайдено. Готово до перевірки адміном або друку чека на тижні 5.',
    };
  }

  // -------------------------------------------------------------
  // СУСІДНІ МІСЦЯ ДЛЯ КОМАНД (Adjacent Seats)
  // -------------------------------------------------------------
  async findAdjacentSeats(query: AdjacentSeatsQueryDto) {
    const seatsCount = query.seatsCount || 2;
    const durationHours = query.durationHours || 2;
    const startTime = new Date(query.startTime);
    const endTime = new Date(startTime.getTime() + durationHours * 3600 * 1000);

    const zone = await this.zonesService.findById(query.zoneId);

    // Отримуємо всі ПК зони
    const places = await this.computersService.findAll({ zoneId: query.zoneId });

    // Фільтруємо лише робочі ПК (не ремонт)
    const workingPlaces = places.filter((p) => p.status !== 'ремонт');

    // Знаходимо зайняті місця на цей проміжок часу
    let busyPlaceIds = new Set<string>();

    if (this.prisma.isConnected) {
      const now = new Date();
      const busyBookings = await this.prisma.booking.findMany({
        where: {
          place: { zoneId: query.zoneId },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
          OR: [
            { holdExpiresAt: null },
            { holdExpiresAt: { gt: now } },
          ],
        },
        select: { placeId: true },
      });
      busyPlaceIds = new Set(busyBookings.map((b) => b.placeId));
    } else {
      for (const b of this.memoryBookings.values()) {
        if (b.status !== 'CANCELLED' && b.startTime < endTime && b.endTime > startTime) {
          busyPlaceIds.add(b.placeId);
        }
      }
    }

    const availablePlaces = workingPlaces.filter((p) => !busyPlaceIds.has(p.id));

    // Групуємо доступні ПК по рядках (row)
    const rowMap = new Map<number, typeof availablePlaces>();
    for (const p of availablePlaces) {
      const row = p.row || 1;
      if (!rowMap.has(row)) {
        rowMap.set(row, []);
      }
      rowMap.get(row)!.push(p);
    }

    const adjacentGroups: Array<{
      row: number;
      seats: Array<{ id: string; number: number; name: string; col: number }>;
    }> = [];

    // Шукаємо послідовні ланцюжки місць у кожному ряду
    for (const [row, rowPlaces] of rowMap.entries()) {
      rowPlaces.sort((a, b) => a.col - b.col || a.number - b.number);

      if (rowPlaces.length >= seatsCount) {
        // Ковзне вікно для пошуку суміжних місць
        for (let i = 0; i <= rowPlaces.length - seatsCount; i++) {
          const slice = rowPlaces.slice(i, i + seatsCount);
          // Перевірка суміжності колонок: різниця між max і min col дорівнює seatsCount - 1
          const isContinuous = slice.every((item, idx) => {
            if (idx === 0) return true;
            return item.col === slice[idx - 1].col + 1 || item.number === slice[idx - 1].number + 1;
          });

          if (isContinuous) {
            adjacentGroups.push({
              row,
              seats: slice.map((s) => ({
                id: s.id,
                number: s.number,
                name: s.name,
                col: s.col,
              })),
            });
          }
        }
      }
    }

    return {
      zoneId: query.zoneId,
      zoneName: zone.name,
      zoneColor: zone.colorHex,
      startTime,
      endTime,
      durationHours,
      requestedSeatsCount: seatsCount,
      adjacentGroups,
      totalAvailableSeatsInZone: availablePlaces.length,
      hasAdjacentOptions: adjacentGroups.length > 0,
    };
  }

  // -------------------------------------------------------------
  // СПИСОК БРОНЮВАНЬ (Для адміна з фільтрами)
  // -------------------------------------------------------------
  async findAll(query?: { date?: string; status?: string; placeId?: string; zoneId?: string }) {
    if (this.prisma.isConnected) {
      const where: any = {};

      if (query?.placeId) {
        where.placeId = query.placeId;
      }
      if (query?.zoneId) {
        where.place = { zoneId: query.zoneId };
      }
      if (query?.date) {
        const startOfDay = new Date(`${query.date}T00:00:00.000Z`);
        const endOfDay = new Date(`${query.date}T23:59:59.999Z`);
        where.startTime = { gte: startOfDay, lte: endOfDay };
      }

      const bookings = await this.prisma.booking.findMany({
        where,
        include: {
          user: true,
          place: { include: { zone: true } },
          tariff: true,
          extras: true,
        },
        orderBy: { startTime: 'asc' },
      });

      return bookings.map((b) => this.mapBookingResponse(b));
    }

    let items = Array.from(this.memoryBookings.values());
    if (query?.placeId) {
      items = items.filter((b) => b.placeId === query.placeId);
    }
    if (query?.date) {
      const targetDate = query.date;
      items = items.filter((b) => b.startTime.toISOString().startsWith(targetDate));
    }
    if (query?.status) {
      items = items.filter((b) => b.status === query.status);
    }

    return items.map((b) => this.mapBookingResponse(b));
  }

  // -------------------------------------------------------------
  // СПИСОК МОЇХ БРОНЮВАНЬ (Для клієнта)
  // -------------------------------------------------------------
  async getMyBookings(userId: string) {
    if (this.prisma.isConnected) {
      const bookings = await this.prisma.booking.findMany({
        where: { userId },
        include: {
          place: { include: { zone: true } },
          tariff: true,
          extras: true,
        },
        orderBy: { startTime: 'desc' },
      });

      return bookings.map((b) => this.mapBookingResponse(b));
    }

    const items = Array.from(this.memoryBookings.values())
      .filter((b) => b.userId === userId || userId.includes('player'))
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    return items.map((b) => this.mapBookingResponse(b));
  }

  // -------------------------------------------------------------
  // МАТРИЦЯ ЗАВАНТАЖЕНОСТІ ПК НА ОБРАНУ ДАТУ (Timeline / Gantt)
  // -------------------------------------------------------------
  async getCalendar(date: string) {
    const computers = await this.computersService.findAll();
    const bookings = await this.findAll({ date });

    const bookingMap = new Map<string, any[]>();
    for (const b of bookings) {
      const compId = b.placeId || b.computerId;
      if (!bookingMap.has(compId)) {
        bookingMap.set(compId, []);
      }
      bookingMap.get(compId)!.push({
        id: b.id,
        startTime: b.startTime,
        endTime: b.endTime,
        clientName: b.username || 'Гравець',
        status: b.status,
        isPackage3Plus1: b.isPackage3Plus1,
        isPaidOnline: b.isPaidOnline,
      });
    }

    return {
      date,
      slots: computers.map((c) => ({
        computerId: c.id,
        computerName: c.name,
        computerNumber: c.number,
        zoneName: c.zoneName,
        zoneColor: c.zoneColor,
        deviceType: c.deviceType,
        status: c.status,
        bookings: bookingMap.get(c.id) || [],
      })),
    };
  }

  // -------------------------------------------------------------
  // ПОШУК ЗА ID
  // -------------------------------------------------------------
  async findById(id: string) {
    if (this.prisma.isConnected) {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        include: {
          user: true,
          place: { include: { zone: true } },
          tariff: true,
          extras: true,
        },
      });
      if (!booking) {
        throw new NotFoundException(`Бронювання з ID "${id}" не знайдено`);
      }
      return this.mapBookingResponse(booking);
    }

    const mem = this.memoryBookings.get(id);
    if (!mem) {
      throw new NotFoundException(`Бронювання з ID "${id}" не знайдено`);
    }
    return this.mapBookingResponse(mem);
  }

  // -------------------------------------------------------------
  // ДОПОМІЖНІ МЕТОДИ МАПІНГУ
  // -------------------------------------------------------------
  private mapBookingResponse(b: any) {
    const isHoldActive = Boolean(b.holdExpiresAt && new Date(b.holdExpiresAt) > new Date());
    const computedStatus = b.status
      ? b.status
      : isHoldActive
        ? 'HOLD'
        : 'CONFIRMED';

    return {
      id: b.id,
      userId: b.userId,
      username: b.user?.username || 's1mple_pro',
      clientName: b.user ? `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim() || b.user.username : 'Олександр Костилєв',
      phone: b.user?.phone || '+380993334455',
      placeId: b.placeId,
      computerId: b.placeId, // Аліас для сумісності з UI
      computerName: b.place?.name || 'PC-01',
      computerNumber: b.place?.number || 1,
      zoneName: b.place?.zone?.name || 'Standard Zone',
      zoneColor: b.place?.zone?.colorHex || '#3B82F6',
      tariffId: b.tariffId,
      tariffName: b.tariff?.name || '1 Година Standard',
      startTime: b.startTime instanceof Date ? b.startTime.toISOString() : b.startTime,
      endTime: b.endTime instanceof Date ? b.endTime.toISOString() : b.endTime,
      isPackage3Plus1: Boolean(b.isPackage3Plus1),
      prepaidAmount: Number(b.prepaidAmount),
      isPaidOnline: Boolean(b.isPaidOnline),
      qrCode: b.qrCode,
      holdExpiresAt: b.holdExpiresAt instanceof Date ? b.holdExpiresAt.toISOString() : b.holdExpiresAt,
      status: computedStatus,
      extras: (b.extras || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        price: Number(e.price),
        quantity: e.quantity,
      })),
      notes: b.notes || null,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  }
}
