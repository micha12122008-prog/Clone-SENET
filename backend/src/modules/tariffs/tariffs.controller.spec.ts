import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { ZonesService } from '../zones/zones.service';
import { TariffsController } from './tariffs.controller';
import { TariffsService } from './tariffs.service';

describe('TariffsController', () => {
  let controller: TariffsController;
  let service: TariffsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TariffsController],
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

    controller = module.get<TariffsController>(TariffsController);
    service = module.get<TariffsService>(TariffsService);
  });

  it('повинен бути визначений', () => {
    expect(controller).toBeDefined();
  });

  it('повинен повертати список усіх тарифів', async () => {
    const tariffs = await controller.getTariffs();
    expect(Array.isArray(tariffs)).toBe(true);
    expect(tariffs.length).toBeGreaterThan(0);
  });

  it('повинен повертати тариф за ID', async () => {
    const tariff = await controller.getTariffById('tariff-1');
    expect(tariff).toBeDefined();
    expect(tariff.id).toBe('tariff-1');
  });

  it('повинен створювати новий тариф', async () => {
    const created = await controller.createTariff({
      name: 'Controller Test Tariff',
      price: 55.0,
      durationMinutes: 60,
    });
    expect(created.name).toBe('Controller Test Tariff');
  });

  it('повинен розраховувати ціну з промокодом', async () => {
    const calc = await controller.calculatePrice({
      tariffId: 'tariff-1',
      durationMinutes: 60,
      promoCode: 'WELCOME',
    });
    expect(calc.promoApplied).toBe(true);
  });

  it('повинен валідувати промокод', () => {
    const res = controller.validatePromo({ code: 'WELCOME' });
    expect(res.valid).toBe(true);
  });
});
