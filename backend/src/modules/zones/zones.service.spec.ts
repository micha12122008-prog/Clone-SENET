import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeviceType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ZonesService } from './zones.service';

describe('ZonesService', () => {
  let service: ZonesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZonesService,
        {
          provide: PrismaService,
          useValue: {
            isConnected: false,
          },
        },
      ],
    }).compile();

    service = module.get<ZonesService>(ZonesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('повинен успішно ініціалізуватися', () => {
    expect(service).toBeDefined();
    expect(service.memoryZones.size).toBeGreaterThanOrEqual(5);
  });

  it('повинен повернути список усіх зон', async () => {
    const zones = await service.findAll();
    expect(Array.isArray(zones)).toBe(true);
    expect(zones.length).toBeGreaterThanOrEqual(5);

    const standard = zones.find((z) => z.name === 'Standard Zone');
    expect(standard).toBeDefined();
    expect(standard?.deviceType).toBe(DeviceType.PC);
    expect(standard?.baseHourlyRate).toBe(60.0);
  });

  it('повинен фільтрувати зони за типом пристрою (PS)', async () => {
    const psZones = await service.findAll(DeviceType.PS);
    expect(psZones.every((z) => z.deviceType === DeviceType.PS)).toBe(true);
    expect(psZones.some((z) => z.name.includes('PlayStation'))).toBe(true);
  });

  it('повинен повернути зону за її ID', async () => {
    const zone = await service.findById('zone-1-standard');
    expect(zone).toBeDefined();
    expect(zone.name).toBe('Standard Zone');
  });

  it('повинен викидати NotFoundException, якщо зони не існує', async () => {
    await expect(service.findById('non-existing-zone-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('повинен успішно створити нову зону', async () => {
    const newZone = await service.create({
      name: 'Sim-Racing Zone',
      description: 'Симулятори перегонів з Fanatec кермами',
      deviceType: DeviceType.PC,
      baseHourlyRate: 95.0,
      colorHex: '#EF4444',
    });

    expect(newZone).toBeDefined();
    expect(newZone.id).toBeDefined();
    expect(newZone.name).toBe('Sim-Racing Zone');
    expect(newZone.baseHourlyRate).toBe(95.0);

    const found = await service.findById(newZone.id);
    expect(found.name).toBe('Sim-Racing Zone');
  });

  it('повинен викидати ConflictException при спробі створити зону з існуючою назвою', async () => {
    await expect(
      service.create({
        name: 'Standard Zone',
        baseHourlyRate: 70.0,
        colorHex: '#3B82F6',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('повинен оновити зону', async () => {
    const updated = await service.update('zone-1-standard', {
      baseHourlyRate: 65.0,
      description: 'Оновлений опис Standard',
    });

    expect(updated.baseHourlyRate).toBe(65.0);
    expect(updated.description).toBe('Оновлений опис Standard');
  });

  it('повинен успішно видалити зону', async () => {
    const tempZone = await service.create({
      name: 'Temporary Zone',
      baseHourlyRate: 50.0,
      colorHex: '#999999',
    });

    const deleteRes = await service.delete(tempZone.id);
    expect(deleteRes.message).toContain('успішно видалено');

    await expect(service.findById(tempZone.id)).rejects.toThrow(NotFoundException);
  });
});
