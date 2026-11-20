import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TariffType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ZonesService } from '../zones/zones.service';
import { TariffsService } from './tariffs.service';

describe('TariffsService', () => {
  let service: TariffsService;
  let zonesService: ZonesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TariffsService,
        ZonesService,
        {
          provide: PrismaService,
          useValue: {
            isConnected: false,
          },
        },
      ],
    }).compile();

    service = module.get<TariffsService>(TariffsService);
    zonesService = module.get<ZonesService>(ZonesService);
  });

  it('повинен успішно ініціалізуватися з дефолтними тарифами', () => {
    expect(service).toBeDefined();
    expect(service.memoryTariffs.size).toBeGreaterThanOrEqual(6);
  });

  it('повинен повернути список усіх тарифів', async () => {
    const tariffs = await service.findAll();
    expect(tariffs.length).toBeGreaterThanOrEqual(6);

    const standardTariff = tariffs.find((t) => t.name === '1 Година Standard');
    expect(standardTariff).toBeDefined();
    expect(standardTariff?.price).toBe(60.0);
    expect(standardTariff?.durationMinutes).toBe(60);
  });

  it('повинен фільтрувати тарифи за типом (PACKAGE_3_PLUS_1)', async () => {
    const packages = await service.findAll({ type: TariffType.PACKAGE_3_PLUS_1 });
    expect(packages.length).toBeGreaterThanOrEqual(1);
    expect(packages.every((t) => t.type === TariffType.PACKAGE_3_PLUS_1)).toBe(true);
  });

  it('повинен повернути тариф за ID', async () => {
    const tariff = await service.findById('tariff-1');
    expect(tariff).toBeDefined();
    expect(tariff.name).toBe('1 Година Standard');
  });

  it('повинен викидати NotFoundException, якщо тарифу не існує', async () => {
    await expect(service.findById('non-existing-tariff')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('повинен створити новий погодинний тариф', async () => {
    const created = await service.create({
      name: 'Нічний пакет VIP',
      price: 250.0,
      durationMinutes: 480,
      zoneId: 'zone-2-vip',
      type: TariffType.CUSTOM,
      description: 'Гра з 23:00 до 07:00 у зоні VIP',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Нічний пакет VIP');
    expect(created.price).toBe(250.0);
    expect(created.zoneName).toBe('VIP OLED 240Hz');

    const found = await service.findById(created.id);
    expect(found.name).toBe('Нічний пакет VIP');
  });

  it('повинен оновити тариф', async () => {
    const updated = await service.update('tariff-1', {
      price: 65.0,
      description: 'Оновлена вартість Standard',
    });

    expect(updated.price).toBe(65.0);
    expect(updated.description).toBe('Оновлена вартість Standard');
  });

  it('повинен видалити тариф', async () => {
    const created = await service.create({
      name: 'Temp Tariff',
      price: 30.0,
      durationMinutes: 30,
    });

    const res = await service.delete(created.id);
    expect(res.message).toContain('успішно видалено');

    await expect(service.findById(created.id)).rejects.toThrow(NotFoundException);
  });

  describe('Розрахунок вартості та промокоди', () => {
    it('повинен правильно розраховувати базову ціну за тривалість (120 хв)', async () => {
      // tariff-1: 60 грн за 60 хв -> 1 грн/хв. За 120 хв = 120 грн
      const calc = await service.calculatePrice({
        tariffId: 'tariff-1',
        durationMinutes: 120,
      });

      expect(calc.originalPrice).toBe(120);
      expect(calc.discountAmount).toBe(0);
      expect(calc.finalPrice).toBe(120);
      expect(calc.promoApplied).toBe(false);
    });

    it('повинен застосовувати знижку 15% за промокодом WELCOME', async () => {
      const calc = await service.calculatePrice({
        tariffId: 'tariff-1',
        durationMinutes: 120,
        promoCode: 'WELCOME',
      });

      expect(calc.originalPrice).toBe(120);
      expect(calc.discountAmount).toBe(18); // 15% від 120 = 18 грн
      expect(calc.finalPrice).toBe(102);
      expect(calc.promoApplied).toBe(true);
    });

    it('повинен валідувати промокод WELCOME', () => {
      const valid = service.validatePromo({ code: 'welcome' });
      expect(valid.valid).toBe(true);
      expect(valid.discountPercent).toBe(15);

      const invalid = service.validatePromo({ code: 'INVALID_CODE' });
      expect(invalid.valid).toBe(false);
      expect(invalid.discountPercent).toBe(0);
    });
  });
});
