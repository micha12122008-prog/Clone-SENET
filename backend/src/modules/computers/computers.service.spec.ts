import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeviceType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ZonesService } from '../zones/zones.service';
import { ComputersService } from './computers.service';

describe('ComputersService', () => {
  let service: ComputersService;
  let zonesService: ZonesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComputersService,
        ZonesService,
        {
          provide: PrismaService,
          useValue: {
            isConnected: false,
          },
        },
      ],
    }).compile();

    service = module.get<ComputersService>(ComputersService);
    zonesService = module.get<ZonesService>(ZonesService);
  });

  it('повинен успішно ініціалізуватися з дефолтними місцями та ремонтом', () => {
    expect(service).toBeDefined();
    expect(service.memoryPlaces.size).toBeGreaterThanOrEqual(8);
    expect(service.memoryRepairs.size).toBeGreaterThanOrEqual(1);
  });

  it('повинен повернути всі комп’ютери з українськими статусами: вільно, зайнято, бронь, ремонт', async () => {
    const computers = await service.findAll();
    expect(computers.length).toBeGreaterThanOrEqual(8);

    const validStatuses = ['вільно', 'зайнято', 'бронь', 'ремонт'];
    for (const comp of computers) {
      expect(validStatuses).toContain(comp.status);
      expect(comp.zoneName).toBeDefined();
    }
  });

  it('повинен повертати дані для інтерактивної карти клубу', async () => {
    const layout = await service.getMapLayout();
    expect(layout.clubLayout).toBeDefined();
    expect(layout.clubLayout.width).toBe(1200);
    expect(layout.computers.length).toBeGreaterThanOrEqual(8);
  });

  it('повинен фільтрувати комп’ютери за статусом', async () => {
    const freeComps = await service.findAll({ status: 'вільно' });
    expect(freeComps.every((c) => c.status === 'вільно')).toBe(true);

    const repairComps = await service.findAll({ status: 'ремонт' });
    expect(repairComps.every((c) => c.status === 'ремонт')).toBe(true);
  });

  it('повинен повернути комп’ютер за ID разом із характеристиками та ремонтами', async () => {
    const comp3 = await service.findById('comp-3');
    expect(comp3).toBeDefined();
    expect(comp3.name).toBe('PC-03');
    expect(comp3.status).toBe('ремонт');
    expect(comp3.specs).toBeDefined();
    expect(comp3.repairs.length).toBeGreaterThanOrEqual(1);
  });

  it('повинен створити нове місце', async () => {
    const created = await service.create({
      number: 99,
      name: 'PC-99',
      zoneId: 'zone-1-standard',
      specs: { cpu: 'Ryzen 7 7800X3D', gpu: 'RTX 4070 Ti' },
      coordinateX: 450,
      coordinateY: 300,
    });

    expect(created.number).toBe(99);
    expect(created.name).toBe('PC-99');
    expect(created.status).toBe('вільно');

    const found = await service.findById(created.id);
    expect(found.number).toBe(99);
  });

  it('повинен викидати ConflictException при спробі створити місце з дублікатом номера', async () => {
    await expect(
      service.create({
        number: 1, // номер 1 вже існує
        name: 'Duplicate PC',
        zoneId: 'zone-1-standard',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('повинен оновити координати місця на схемі залу', async () => {
    const updated = await service.updatePosition('comp-1', {
      x: 125,
      y: 135,
      row: 2,
      col: 4,
    });

    expect(updated.coordinateX).toBe(125);
    expect(updated.coordinateY).toBe(135);
  });

  describe('Переходи статусів (State Machine) та журнал ремонту', () => {
    it('повинен успішно перевести вільне місце в статус "зайнято"', async () => {
      const res = await service.updateStatus('comp-1', { status: 'зайнято' });
      expect(res.status).toBe('зайнято');
    });

    it('повинен успішно перевести місце в статус "ремонт" і створити запис у Repair', async () => {
      const res = await service.updateStatus('comp-5', {
        status: 'ремонт',
        description: 'Зламаний монітор ROG OLED',
      });

      expect(res.status).toBe('ремонт');

      const repairs = await service.findAllRepairs({ placeId: 'comp-5', activeOnly: true });
      expect(repairs.length).toBe(1);
      expect(repairs[0].description).toBe('Зламаний монітор ROG OLED');
      expect(repairs[0].finishedAt).toBeNull();
    });

    it('повинен успішно перевести місце з "ремонт" у "вільно" та автоматично закрити Repair', async () => {
      // comp-3 вже в статусі 'ремонт'
      const res = await service.updateStatus('comp-3', { status: 'вільно' });
      expect(res.status).toBe('вільно');

      const activeRepairs = await service.findAllRepairs({ placeId: 'comp-3', activeOnly: true });
      expect(activeRepairs.length).toBe(0);

      const allRepairs = await service.findAllRepairs({ placeId: 'comp-3' });
      expect(allRepairs[0].finishedAt).not.toBeNull();
      expect(allRepairs[0].status).toBe('Завершено');
    });

    it('повинен забороняти прямий перехід зі статусу "ремонт" у "зайнято" (BadRequestException)', async () => {
      // comp-3 зараз відправимо в ремонт
      await service.updateStatus('comp-1', {
        status: 'ремонт',
        description: 'Сервісне чищення кулерів',
      });

      await expect(
        service.updateStatus('comp-1', { status: 'зайнято' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('повинен викидати помилку при передачі неіснуючого статусу', async () => {
      await expect(
        service.updateStatus('comp-1', { status: 'UNKNOWN_STATUS' as any }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Операції журналу ремонту', () => {
    it('повинен створити запис ремонту через createRepair та перевести ПК в ремонт', async () => {
      const res = await service.createRepair({
        placeId: 'comp-6',
        description: 'Заміна термопасти та вентилятора GPU',
      });

      expect(res.repair).toBeDefined();

      const place = await service.findById('comp-6');
      expect(place.status).toBe('ремонт');
    });

    it('повинен завершити ремонт через finishRepair та повернути ПК у статус "вільно"', async () => {
      const repairRes = await service.createRepair({
        placeId: 'comp-7',
        description: 'Оновлення прошивки геймпадів',
      });

      const finishRes = await service.finishRepair(repairRes.repair.id);
      expect(finishRes.message).toContain('успішно завершено');

      const place = await service.findById('comp-7');
      expect(place.status).toBe('вільно');
    });
  });
});
