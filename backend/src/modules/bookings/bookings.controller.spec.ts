import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../users/users.service';
import { ComputersService } from '../computers/computers.service';
import { TariffsService } from '../tariffs/tariffs.service';
import { ZonesService } from '../zones/zones.service';

describe('BookingsController Unit Tests', () => {
  let controller: BookingsController;
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        BookingsService,
        UsersService,
        ComputersService,
        TariffsService,
        ZonesService,
        {
          provide: PrismaService,
          useValue: { isConnected: false },
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
  });

  it('контролер повинен бути визначений', () => {
    expect(controller).toBeDefined();
  });

  it('getExtrasCatalog повинен повертати довідник допів', () => {
    const extras = controller.getExtrasCatalog();
    expect(Array.isArray(extras)).toBe(true);
    expect(extras.length).toBeGreaterThanOrEqual(4);
  });

  it('checkIn повинен знаходити картку бронювання', async () => {
    const res = await controller.checkIn({ token: 'QR_BOOK_OBSIDIAN_VIP_01_TEST' });
    expect(res.bookingId).toBe('book-seed-1');
    expect(res.sessionStarted).toBe(false);
  });

  it('getCalendar повинен повертати структуру слотів за датою', async () => {
    const res = await controller.getCalendar('2026-11-25');
    expect(res.date).toBe('2026-11-25');
    expect(Array.isArray(res.slots)).toBe(true);
  });

  it('createBooking повинен успішно створювати нову бронь', async () => {
    const now = new Date(Date.now() + 3600 * 1000 * 100);
    const res = await controller.createBooking({
      placeId: 'comp-1',
      tariffId: 'tariff-1',
      startTime: now.toISOString(),
      durationHours: 2,
    });
    expect(res.id).toBeDefined();
    expect(res.prepaidAmount).toBe(120.0);
  });
});
