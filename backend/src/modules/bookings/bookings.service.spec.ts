import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { ComputersService } from '../computers/computers.service';
import { TariffsService } from '../tariffs/tariffs.service';
import { UsersService } from '../users/users.service';
import { ZonesService } from '../zones/zones.service';
import { BookingsService } from './bookings.service';

describe('BookingsService Unit Tests (Week 4)', () => {
  let service: BookingsService;
  let computersService: ComputersService;
  let tariffsService: TariffsService;
  let zonesService: ZonesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        ComputersService,
        TariffsService,
        ZonesService,
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            isConnected: false,
          },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    computersService = module.get<ComputersService>(ComputersService);
    tariffsService = module.get<TariffsService>(TariffsService);
    zonesService = module.get<ZonesService>(ZonesService);
  });

  it('повинен успішно ініціалізуватися', () => {
    expect(service).toBeDefined();
    expect(service.memoryBookings.size).toBeGreaterThanOrEqual(1);
  });

  describe('1. Каталог додаткових послуг (Extras)', () => {
    it('повинен повертати перелік допів: напої, снеки, геймпад, VR-оператор', () => {
      const extras = service.getExtrasCatalog();
      expect(Array.isArray(extras)).toBe(true);
      expect(extras.length).toBeGreaterThanOrEqual(4);

      const names = extras.map((e) => e.name);
      expect(names.some((n) => n.includes('Red Bull'))).toBe(true);
      expect(names.some((n) => n.includes('сендвіч'))).toBe(true);
      expect(names.some((n) => n.includes('DualSense'))).toBe(true);
      expect(names.some((n) => n.includes('VR-оператор'))).toBe(true);
    });
  });

  describe('2. Тривалість 1/2/3 години та розрахунок вартості', () => {
    it('повинен створити бронь на 2 години з коректним розрахунком суми', async () => {
      const now = new Date(Date.now() + 3600 * 1000 * 10); // через 10 годин
      const res = await service.create({
        placeId: 'comp-1',
        tariffId: 'tariff-1', // Standard 60 грн/год
        startTime: now.toISOString(),
        durationHours: 2,
      });

      expect(res.id).toBeDefined();
      expect(res.prepaidAmount).toBe(120.0); // 60 * 2
      expect(res.isPackage3Plus1).toBe(false);
      expect(res.status).toBe('CONFIRMED');
    });

    it('повинен додавати до суми броні обрані додаткові послуги', async () => {
      const now = new Date(Date.now() + 3600 * 1000 * 10);
      const res = await service.create({
        placeId: 'comp-2',
        tariffId: 'tariff-1',
        startTime: now.toISOString(),
        durationHours: 1,
        extras: [
          { name: 'Red Bull Energy Drink 0.25л', price: 65.0, quantity: 2 },
          { name: 'Клаб-сендвіч', price: 120.0, quantity: 1 },
        ],
      });

      // 60 грн (1 год) + 130 грн (2 редбули) + 120 грн (сендвіч) = 310 грн
      expect(res.prepaidAmount).toBe(310.0);
      expect(res.extras.length).toBe(2);
    });
  });

  describe('3. Пакет «3+1» (4 години слоту за ціною 3 годин)', () => {
    it('повинен бронювати ПК на 4 години, але нараховувати оплату суворо за 3 години', async () => {
      const now = new Date(Date.now() + 3600 * 1000 * 15);
      const res = await service.create({
        placeId: 'comp-1', // Використовуємо робочий ПК
        tariffId: 'tariff-1', // 60 грн/год
        startTime: now.toISOString(),
        isPackage3Plus1: true,
      });

      const start = new Date(res.startTime).getTime();
      const end = new Date(res.endTime).getTime();
      const diffHours = (end - start) / (3600 * 1000);

      // Слот триває 4 години
      expect(diffHours).toBe(4);
      // До сплати 3 години: 60 * 3 = 180 грн (без окремого гаманця годин)
      expect(res.prepaidAmount).toBe(180.0);
      expect(res.isPackage3Plus1).toBe(true);
    });
  });

  describe('4. Захист від подвійного бронювання (Double-Booking Conflict)', () => {
    it('повинен відхиляти друге бронювання на те саме місце на перетинний час зі статусом 409 Conflict', async () => {
      const baseTime = new Date(Date.now() + 3600 * 1000 * 20);

      // Перше бронювання: 20:00 - 22:00
      await service.create({
        placeId: 'comp-4',
        tariffId: 'tariff-1',
        startTime: baseTime.toISOString(),
        durationHours: 2,
      });

      // Спроба другого бронювання на той самий ПК: 21:00 - 23:00 (перетин)
      const overlappingTime = new Date(baseTime.getTime() + 3600 * 1000 * 1);
      await expect(
        service.create({
          placeId: 'comp-4',
          tariffId: 'tariff-1',
          startTime: overlappingTime.toISOString(),
          durationHours: 2,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('5. Утримання місця на 10 хвилин (Hold TTL) та автозвільнення', () => {
    it('повинен встановлювати holdExpiresAt на +10 хвилин при isHold: true', async () => {
      const now = new Date(Date.now() + 3600 * 1000 * 25);
      const res = await service.create({
        placeId: 'comp-5',
        tariffId: 'tariff-1',
        startTime: now.toISOString(),
        durationHours: 2,
        isHold: true,
      });

      expect(res.status).toBe('HOLD');
      expect(res.holdExpiresAt).toBeDefined();

      const holdTimeMs = new Date(res.holdExpiresAt!).getTime();
      const diffMinutes = (holdTimeMs - Date.now()) / (60 * 1000);
      expect(diffMinutes).toBeGreaterThan(9);
      expect(diffMinutes).toBeLessThanOrEqual(10.5);
    });

    it('повинен підтверджувати утриману бронь і скидати holdExpiresAt', async () => {
      const now = new Date(Date.now() + 3600 * 1000 * 30);
      const holdRes = await service.create({
        placeId: 'comp-6',
        tariffId: 'tariff-1',
        startTime: now.toISOString(),
        durationHours: 1,
        isHold: true,
      });

      const confirmed = await service.confirmBooking(holdRes.id, { isPaidOnline: true });
      expect(confirmed.status).toBe('CONFIRMED');
      expect(confirmed.holdExpiresAt).toBeNull();
    });

    it('повинен автоматично видаляти утримання з минулим hold TTL через крон', async () => {
      const pastHoldTime = new Date(Date.now() - 60 * 1000); // 1 хв тому сплив
      const expiredBooking: any = {
        id: 'book-expired-hold-test',
        userId: 'player-1',
        placeId: 'comp-7',
        tariffId: 'tariff-1',
        startTime: new Date(Date.now() + 3600 * 1000 * 10),
        endTime: new Date(Date.now() + 3600 * 1000 * 12),
        isPackage3Plus1: false,
        prepaidAmount: 120,
        isPaidOnline: false,
        qrCode: 'QR_EXPIRED',
        holdExpiresAt: pastHoldTime,
        status: 'HOLD',
        extras: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      service.memoryBookings.set(expiredBooking.id, expiredBooking);

      expect(service.memoryBookings.has('book-expired-hold-test')).toBe(true);

      // Викликаємо фонову задачу звільнення
      await service.handleExpiredHolds();

      expect(service.memoryBookings.has('book-expired-hold-test')).toBe(false);
    });
  });

  describe('6. Правило 2 годин (Скасування та перенесення)', () => {
    it('повинен ВІДХИЛЯТИ скасування, якщо до старту сесії менше 2 годин (400 Bad Request)', async () => {
      const soonTime = new Date(Date.now() + 3600 * 1000 * 1); // через 1 годину (< 2 год)
      const booking = await service.create({
        placeId: 'comp-7',
        tariffId: 'tariff-1',
        startTime: soonTime.toISOString(),
        durationHours: 1,
      });

      await expect(service.cancel(booking.id)).rejects.toThrow(BadRequestException);
    });

    it('повинен ДОЗВОЛЯТИ скасування, якщо до старту сесії більше 2 годин', async () => {
      const futureTime = new Date(Date.now() + 3600 * 1000 * 50); // через 50 годин (>= 2 год)
      const booking = await service.create({
        placeId: 'comp-7',
        tariffId: 'tariff-1',
        startTime: futureTime.toISOString(),
        durationHours: 1,
      });

      const cancelRes = await service.cancel(booking.id);
      expect(cancelRes.status).toBe('CANCELLED');
      expect(cancelRes.refundedAmount).toBe(60.0);
    });

    it('повинен ВІДХИЛЯТИ перенесення, якщо до початкового старту менше 2 годин', async () => {
      const soonTime = new Date(Date.now() + 3600 * 1000 * 1.5); // 1.5 години (< 2 год)
      const booking = await service.create({
        placeId: 'comp-8',
        tariffId: 'tariff-1',
        startTime: soonTime.toISOString(),
        durationHours: 1,
      });

      const newTime = new Date(Date.now() + 3600 * 1000 * 60);
      await expect(
        service.reschedule(booking.id, { newStartTime: newTime.toISOString() }),
      ).rejects.toThrow(BadRequestException);
    });

    it('повинен ДОЗВОЛЯТИ перенесення, якщо до старту більше 2 годин', async () => {
      const futureTime = new Date(Date.now() + 3600 * 1000 * 70);
      const booking = await service.create({
        placeId: 'comp-8',
        tariffId: 'tariff-1',
        startTime: futureTime.toISOString(),
        durationHours: 1,
      });

      const newTime = new Date(Date.now() + 3600 * 1000 * 80);
      const res = await service.reschedule(booking.id, { newStartTime: newTime.toISOString() });
      expect(res.message).toContain('перенесено за правилом 2 годин');
      expect(new Date(res.startTime).toISOString()).toBe(newTime.toISOString());
    });
  });

  describe('7. Чек-ін: пошук картки без старту сесії', () => {
    it('повинен знаходити картку броні за токеном/QR або телефоном і мати sessionStarted: false', async () => {
      const checkInCard = await service.checkInLookup({
        token: 'QR_BOOK_OBSIDIAN_VIP_01_TEST',
      });

      expect(checkInCard).toBeDefined();
      expect(checkInCard.bookingId).toBe('book-seed-1');
      expect(checkInCard.clientName).toBeDefined();
      expect(checkInCard.phone).toBe('+380993334455');
      expect(checkInCard.placeName).toBe('VIP-01');
      expect(checkInCard.paymentStatus).toBeDefined();
      // Суворо за ТЗ: чек-ін НЕ стартує сесію
      expect(checkInCard.sessionStarted).toBe(false);
    });

    it('повинен викидати NotFoundException, якщо токен не знайдено', async () => {
      await expect(
        service.checkInLookup({ token: 'INVALID_QR_TOKEN_UNKNOWN' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('8. Сусідні місця для команд (Adjacent Seats)', () => {
    it('повинен знаходити вільні групи суміжних комп’ютерів в обраній зоні', async () => {
      const startTime = new Date(Date.now() + 3600 * 1000 * 24);
      const res = await service.findAdjacentSeats({
        zoneId: 'zone-1-standard',
        seatsCount: 2,
        startTime: startTime.toISOString(),
        durationHours: 2,
      });

      expect(res.zoneId).toBe('zone-1-standard');
      expect(res.requestedSeatsCount).toBe(2);
      expect(Array.isArray(res.adjacentGroups)).toBe(true);
    });
  });
});
