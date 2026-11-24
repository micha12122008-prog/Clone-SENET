import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TariffType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ZonesService } from '../zones/zones.service';
import {
  CalculatePriceDto,
  CreateTariffDto,
  UpdateTariffDto,
  ValidatePromoDto,
} from './dto/tariffs.dto';

export interface InternalTariff {
  id: string;
  name: string;
  description: string | null;
  type: TariffType;
  zoneId: string | null;
  price: number;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TariffsService {
  private readonly logger = new Logger(TariffsService.name);
  public readonly memoryTariffs = new Map<string, InternalTariff>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly zonesService: ZonesService,
  ) {
    this.initDefaultTariffs();
  }

  private initDefaultTariffs() {
    const defaultTariffs: InternalTariff[] = [
      {
        id: 'tariff-1',
        name: '1 Година Standard',
        description: 'Погодинний тариф Standard для CS2, Dota 2, Valorant',
        type: TariffType.HOURLY,
        zoneId: 'zone-1-standard',
        price: 60.0,
        durationMinutes: 60,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'tariff-2',
        name: '1 Година VIP',
        description: 'Преміальний ігровий досвід на RTX 4090 та 240Hz OLED',
        type: TariffType.HOURLY,
        zoneId: 'zone-2-vip',
        price: 110.0,
        durationMinutes: 60,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'tariff-3',
        name: '1 Година Bootcamp',
        description: 'Погодинний тариф для командної тренувальної кімнати',
        type: TariffType.HOURLY,
        zoneId: 'zone-3-bootcamp',
        price: 75.0,
        durationMinutes: 60,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'tariff-4',
        name: '1 Година PlayStation 5',
        description: 'Ігрова сесія на PS5 з 4K TV 65" та двома геймпадами DualSense',
        type: TariffType.HOURLY,
        zoneId: 'zone-4-ps',
        price: 80.0,
        durationMinutes: 60,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'tariff-5',
        name: '1 Година VR Arena',
        description: 'Занурення у віртуальну реальність на Quest 3 / Vive Focus',
        type: TariffType.HOURLY,
        zoneId: 'zone-5-vr',
        price: 120.0,
        durationMinutes: 60,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'tariff-6',
        name: 'Пакет 3+1 (4 години)',
        description: 'Купуй 3 години, 4-та година у подарунок для Standard Zone',
        type: TariffType.PACKAGE_3_PLUS_1,
        zoneId: 'zone-1-standard',
        price: 180.0,
        durationMinutes: 240,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
    ];

    for (const tariff of defaultTariffs) {
      this.memoryTariffs.set(tariff.id, tariff);
    }
  }

  async findAll(query?: { zoneId?: string; type?: TariffType }) {
    if (this.prisma.isConnected) {
      const where: any = {};
      if (query?.zoneId) {
        where.zoneId = query.zoneId;
      }
      if (query?.type) {
        where.type = query.type;
      }

      const tariffs = await this.prisma.tariff.findMany({
        where,
        include: {
          zone: true,
        },
        orderBy: { price: 'asc' },
      });

      return tariffs.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        type: t.type,
        price: Number(t.price),
        durationMinutes: t.durationMinutes,
        zoneId: t.zoneId,
        zoneName: t.zone?.name || 'Загальний тариф клубу',
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
    }

    let items = Array.from(this.memoryTariffs.values());
    if (query?.zoneId) {
      items = items.filter((t) => t.zoneId === query.zoneId);
    }
    if (query?.type) {
      items = items.filter((t) => t.type === query.type);
    }

    const zones = await this.zonesService.findAll();
    const zoneMap = new Map(zones.map((z) => [z.id, z]));

    return items
      .sort((a, b) => a.price - b.price)
      .map((t) => {
        const z = t.zoneId ? zoneMap.get(t.zoneId) : null;
        return {
          id: t.id,
          name: t.name,
          description: t.description,
          type: t.type,
          price: t.price,
          durationMinutes: t.durationMinutes,
          zoneId: t.zoneId,
          zoneName: z?.name || 'Загальний тариф клубу',
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        };
      });
  }

  async findById(id: string) {
    if (this.prisma.isConnected) {
      const tariff = await this.prisma.tariff.findUnique({
        where: { id },
        include: { zone: true },
      });
      if (!tariff) {
        throw new NotFoundException(`Тариф із ID "${id}" не знайдено`);
      }
      return {
        id: tariff.id,
        name: tariff.name,
        description: tariff.description,
        type: tariff.type,
        price: Number(tariff.price),
        durationMinutes: tariff.durationMinutes,
        zoneId: tariff.zoneId,
        zoneName: tariff.zone?.name || 'Загальний тариф клубу',
        createdAt: tariff.createdAt,
        updatedAt: tariff.updatedAt,
      };
    }

    const tariff = this.memoryTariffs.get(id);
    if (!tariff) {
      throw new NotFoundException(`Тариф із ID "${id}" не знайдено`);
    }

    const zone = tariff.zoneId
      ? await this.zonesService.findById(tariff.zoneId).catch(() => null)
      : null;

    return {
      id: tariff.id,
      name: tariff.name,
      description: tariff.description,
      type: tariff.type,
      price: tariff.price,
      durationMinutes: tariff.durationMinutes,
      zoneId: tariff.zoneId,
      zoneName: zone?.name || 'Загальний тариф клубу',
      createdAt: tariff.createdAt,
      updatedAt: tariff.updatedAt,
    };
  }

  async create(dto: CreateTariffDto) {
    if (dto.zoneId) {
      await this.zonesService.findById(dto.zoneId);
    }

    const now = new Date();
    const tariffData = {
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      type: dto.type || TariffType.HOURLY,
      price: dto.price,
      durationMinutes: dto.durationMinutes ?? 60,
      zoneId: dto.zoneId || null,
    };

    if (this.prisma.isConnected) {
      const created = await this.prisma.tariff.create({
        data: tariffData,
        include: { zone: true },
      });
      return {
        id: created.id,
        name: created.name,
        description: created.description,
        type: created.type,
        price: Number(created.price),
        durationMinutes: created.durationMinutes,
        zoneId: created.zoneId,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        zoneName: created.zone?.name || 'Загальний тариф клубу',
      };
    }

    const newTariff: InternalTariff = {
      id: `tariff-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...tariffData,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryTariffs.set(newTariff.id, newTariff);

    const zone = newTariff.zoneId
      ? await this.zonesService.findById(newTariff.zoneId).catch(() => null)
      : null;

    return {
      ...newTariff,
      zoneName: zone?.name || 'Загальний тариф клубу',
    };
  }

  async update(id: string, dto: UpdateTariffDto) {
    const existing = await this.findById(id);

    if (dto.zoneId !== undefined && dto.zoneId !== null && dto.zoneId !== existing.zoneId) {
      await this.zonesService.findById(dto.zoneId);
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.description !== undefined) updateData.description = dto.description.trim() || null;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.durationMinutes !== undefined) updateData.durationMinutes = dto.durationMinutes;
    if (dto.zoneId !== undefined) updateData.zoneId = dto.zoneId;

    if (this.prisma.isConnected) {
      const updated = await this.prisma.tariff.update({
        where: { id },
        data: updateData,
        include: { zone: true },
      });
      return {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        type: updated.type,
        price: Number(updated.price),
        durationMinutes: updated.durationMinutes,
        zoneId: updated.zoneId,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        zoneName: updated.zone?.name || 'Загальний тариф клубу',
      };
    }

    const memTariff = this.memoryTariffs.get(id);
    if (!memTariff) {
      throw new NotFoundException(`Тариф із ID "${id}" не знайдено`);
    }

    Object.assign(memTariff, updateData, { updatedAt: new Date() });
    const zone = memTariff.zoneId
      ? await this.zonesService.findById(memTariff.zoneId).catch(() => null)
      : null;

    return {
      ...memTariff,
      zoneName: zone?.name || 'Загальний тариф клубу',
    };
  }

  async delete(id: string) {
    await this.findById(id);

    if (this.prisma.isConnected) {
      await this.prisma.tariff.delete({
        where: { id },
      });
      return { message: `Тариф із ID "${id}" успішно видалено` };
    }

    this.memoryTariffs.delete(id);
    return { message: `Тариф із ID "${id}" успішно видалено` };
  }

  async calculatePrice(dto: CalculatePriceDto) {
    const tariff = await this.findById(dto.tariffId);

    const hourlyRate = tariff.price / (tariff.durationMinutes / 60);
    const rawCost = (dto.durationMinutes / 60) * hourlyRate;

    let discountPercent = 0;
    if (dto.promoCode && dto.promoCode.trim().toUpperCase() === 'WELCOME') {
      discountPercent = 15;
    }

    const discountAmount = Math.round(((rawCost * discountPercent) / 100) * 100) / 100;
    const finalPrice = Math.round((rawCost - discountAmount) * 100) / 100;

    return {
      tariffId: tariff.id,
      tariffName: tariff.name,
      durationMinutes: dto.durationMinutes,
      hourlyRate: Math.round(hourlyRate * 100) / 100,
      originalPrice: Math.round(rawCost * 100) / 100,
      discountAmount,
      finalPrice,
      promoApplied: discountPercent > 0,
      currency: 'UAH',
    };
  }

  validatePromo(dto: ValidatePromoDto) {
    if (dto.code.trim().toUpperCase() === 'WELCOME') {
      return {
        valid: true,
        code: dto.code.trim().toUpperCase(),
        discountPercent: 15,
        message: 'Промокод успішно застосовано (-15% на першу сесію)',
      };
    }

    return {
      valid: false,
      code: dto.code.trim(),
      discountPercent: 0,
      message: 'Недійсний або прострочений промокод',
    };
  }
}
