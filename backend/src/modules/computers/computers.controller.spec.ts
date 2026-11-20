import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { ZonesService } from '../zones/zones.service';
import { ComputersController } from './computers.controller';
import { ComputersService } from './computers.service';

describe('ComputersController', () => {
  let controller: ComputersController;
  let service: ComputersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComputersController],
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

    controller = module.get<ComputersController>(ComputersController);
    service = module.get<ComputersService>(ComputersService);
  });

  it('повинен бути визначений', () => {
    expect(controller).toBeDefined();
  });

  it('повинен повертати список комп’ютерів', async () => {
    const list = await controller.getComputers();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it('повинен повертати дані карти залу', async () => {
    const map = await controller.getMap();
    expect(map.clubLayout).toBeDefined();
    expect(map.computers).toBeDefined();
  });

  it('повинен повертати журнал ремонту', async () => {
    const repairs = await controller.getRepairs();
    expect(Array.isArray(repairs)).toBe(true);
  });

  it('повинен змінювати статус місця за українським enum', async () => {
    const res = await controller.updateStatus('comp-1', {
      status: 'ремонт',
      description: 'Тестова несправність',
    });
    expect(res.status).toBe('ремонт');
  });

  it('повинен створювати та видаляти місце', async () => {
    const created = await controller.createComputer({
      number: 88,
      name: 'PC-88',
      zoneId: 'zone-1-standard',
    });
    expect(created.number).toBe(88);

    const deleted = await controller.deleteComputer(created.id);
    expect(deleted.message).toBeDefined();
  });
});
