import { Test, TestingModule } from '@nestjs/testing';
import { DeviceType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ZonesController } from './zones.controller';
import { ZonesService } from './zones.service';

describe('ZonesController', () => {
  let controller: ZonesController;
  let service: ZonesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZonesController],
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

    controller = module.get<ZonesController>(ZonesController);
    service = module.get<ZonesService>(ZonesService);
  });

  it('повинен бути визначений', () => {
    expect(controller).toBeDefined();
  });

  it('повинен повернути список зон', async () => {
    const zones = await controller.getZones();
    expect(Array.isArray(zones)).toBe(true);
    expect(zones.length).toBeGreaterThan(0);
  });

  it('повинен повернути зону за id', async () => {
    const zone = await controller.getZoneById('zone-1-standard');
    expect(zone).toBeDefined();
    expect(zone.id).toBe('zone-1-standard');
  });

  it('повинен створити нову зону', async () => {
    const created = await controller.createZone({
      name: 'Controller Test Zone',
      baseHourlyRate: 80.0,
      colorHex: '#123456',
      deviceType: DeviceType.PC,
    });
    expect(created.name).toBe('Controller Test Zone');
  });

  it('повинен оновити зону', async () => {
    const updated = await controller.updateZone('zone-1-standard', {
      baseHourlyRate: 72.0,
    });
    expect(updated.baseHourlyRate).toBe(72.0);
  });

  it('повинен видалити зону', async () => {
    const created = await controller.createZone({
      name: 'To Delete Zone',
      baseHourlyRate: 40.0,
      colorHex: '#000000',
    });
    const res = await controller.deleteZone(created.id);
    expect(res.message).toBeDefined();
  });
});
