import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DeviceType, PlaceStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateZoneDto, UpdateZoneDto } from './dto/zones.dto';

export interface InternalZone {
  id: string;
  name: string;
  description: string | null;
  deviceType: DeviceType;
  baseHourlyRate: number;
  colorHex: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ZonesService {
  private readonly logger = new Logger(ZonesService.name);
  public readonly memoryZones = new Map<string, InternalZone>();

  constructor(private readonly prisma: PrismaService) {
    this.initDefaultZones();
  }

  private initDefaultZones() {
    const defaultZones: InternalZone[] = [
      {
        id: 'zone-1-standard',
        name: 'Standard Zone',
        description: 'Збалансовані ПК для геймінгу в CS2, Dota 2 та Valorant',
        deviceType: DeviceType.PC,
        baseHourlyRate: 60.0,
        colorHex: '#3B82F6',
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'zone-2-vip',
        name: 'VIP OLED 240Hz',
        description: 'RTX 4090, 240Hz OLED дисплеї, преміальні анатомічні крісла',
        deviceType: DeviceType.PC,
        baseHourlyRate: 110.0,
        colorHex: '#8B5CF6',
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'zone-3-bootcamp',
        name: 'Bootcamp 5x5',
        description: 'Ізольована звукоізольована кімната для турнірних команд',
        deviceType: DeviceType.PC,
        baseHourlyRate: 75.0,
        colorHex: '#10B981',
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'zone-4-ps',
        name: 'PlayStation 5 Lounge',
        description: 'Консолі PS5, 4K OLED 65", дивани, DualSense геймпади, EA FC 24, UFC 5',
        deviceType: DeviceType.PS,
        baseHourlyRate: 80.0,
        colorHex: '#F59E0B',
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'zone-5-vr',
        name: 'VR Room Arena',
        description: 'VR-станція HTC Vive Focus / Meta Quest 3, трекінг рухів усього тіла',
        deviceType: DeviceType.VR,
        baseHourlyRate: 120.0,
        colorHex: '#EC4899',
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
    ];

    for (const zone of defaultZones) {
      this.memoryZones.set(zone.id, zone);
    }
  }

  async findAll(deviceType?: DeviceType) {
    if (this.prisma.isConnected) {
      try {
        const where: any = {};
        if (deviceType) {
          where.deviceType = deviceType;
        }

        const zones = await this.prisma.zone.findMany({
          where,
          include: {
            places: {
              select: {
                id: true,
                status: true,
              },
            },
            tariffs: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        if (zones && zones.length > 0) {
          return zones.map((z) => {
            const totalComputers = z.places.length;
            const availableComputers = z.places.filter(
              (p) => p.status === PlaceStatus.FREE || (p.status as any) === 'вільно',
            ).length;

            return {
              id: z.id,
              name: z.name,
              description: z.description,
              deviceType: z.deviceType,
              baseHourlyRate: Number(z.baseHourlyRate),
              colorHex: z.colorHex,
              totalComputers,
              availableComputers,
              tariffs: z.tariffs.map((t) => ({
                id: t.id,
                name: t.name,
                price: Number(t.price),
                durationMinutes: t.durationMinutes,
                type: t.type,
              })),
              createdAt: z.createdAt,
              updatedAt: z.updatedAt,
            };
          });
        }
      } catch (err) {
        this.logger.warn(`Prisma findAll zones fallback to memory: ${err.message}`);
      }
    }

    let items = Array.from(this.memoryZones.values());
    if (deviceType) {
      items = items.filter((z) => z.deviceType === deviceType);
    }

    return items.map((z) => ({
      ...z,
      totalComputers: z.name.includes('Bootcamp') ? 5 : z.name.includes('VIP') ? 4 : 6,
      availableComputers: z.name.includes('VIP') ? 4 : 5,
      tariffs: [],
    }));
  }

  async findById(id: string) {
    if (this.prisma.isConnected) {
      try {
        const zone = await this.prisma.zone.findUnique({
          where: { id },
          include: {
            places: true,
            tariffs: true,
          },
        });
        if (zone) {
          const totalComputers = zone.places.length;
          const availableComputers = zone.places.filter(
            (p) => p.status === PlaceStatus.FREE || (p.status as any) === 'вільно',
          ).length;

          return {
            id: zone.id,
            name: zone.name,
            description: zone.description,
            deviceType: zone.deviceType,
            baseHourlyRate: Number(zone.baseHourlyRate),
            colorHex: zone.colorHex,
            totalComputers,
            availableComputers,
            places: zone.places,
            tariffs: zone.tariffs,
            createdAt: zone.createdAt,
            updatedAt: zone.updatedAt,
          };
        }
      } catch (err) {
        this.logger.warn(`Prisma findById zone fallback to memory: ${err.message}`);
      }
    }

    const zone = this.memoryZones.get(id);
    if (!zone) {
      throw new NotFoundException(`Ігрову зону з ID "${id}" не знайдено`);
    }

    return {
      ...zone,
      totalComputers: 6,
      availableComputers: 5,
      places: [],
      tariffs: [],
    };
  }

  async create(dto: CreateZoneDto) {
    const trimmedName = dto.name.trim();

    // Перевірка конфлікту назви
    await this.ensureUniqueName(trimmedName);

    const now = new Date();
    const zoneData = {
      name: trimmedName,
      description: dto.description?.trim() || null,
      deviceType: dto.deviceType || DeviceType.PC,
      baseHourlyRate: dto.baseHourlyRate,
      colorHex: dto.colorHex?.trim() || '#3B82F6',
    };

    if (this.prisma.isConnected) {
      try {
        const created = await this.prisma.zone.create({
          data: zoneData,
        });
        const mapped = {
          ...created,
          baseHourlyRate: Number(created.baseHourlyRate),
        };
        this.memoryZones.set(mapped.id, mapped);
        return {
          ...mapped,
          totalComputers: 0,
          availableComputers: 0,
        };
      } catch (err) {
        this.logger.warn(`Prisma create zone fallback to memory: ${err.message}`);
      }
    }

    const newZone: InternalZone = {
      id: `zone-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...zoneData,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryZones.set(newZone.id, newZone);

    return {
      ...newZone,
      totalComputers: 0,
      availableComputers: 0,
    };
  }

  async update(id: string, dto: UpdateZoneDto) {
    const existing = await this.findById(id);

    if (dto.name && dto.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      await this.ensureUniqueName(dto.name.trim(), id);
    }

    const updateData: Partial<InternalZone> = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.description !== undefined) updateData.description = dto.description.trim() || null;
    if (dto.deviceType !== undefined) updateData.deviceType = dto.deviceType;
    if (dto.baseHourlyRate !== undefined) updateData.baseHourlyRate = dto.baseHourlyRate;
    if (dto.colorHex !== undefined) updateData.colorHex = dto.colorHex.trim();

    if (this.prisma.isConnected) {
      try {
        const updated = await this.prisma.zone.update({
          where: { id },
          data: updateData as any,
        });
        const mapped = {
          ...updated,
          baseHourlyRate: Number(updated.baseHourlyRate),
        };
        this.memoryZones.set(id, mapped);
        return {
          ...mapped,
          totalComputers: existing.totalComputers,
          availableComputers: existing.availableComputers,
        };
      } catch (err) {
        this.logger.warn(`Prisma update zone fallback to memory: ${err.message}`);
      }
    }

    const memZone = this.memoryZones.get(id);
    if (!memZone) {
      throw new NotFoundException(`Ігрову зону з ID "${id}" не знайдено`);
    }

    Object.assign(memZone, updateData, { updatedAt: new Date() });
    return {
      ...memZone,
      totalComputers: existing.totalComputers,
      availableComputers: existing.availableComputers,
    };
  }

  async delete(id: string) {
    await this.findById(id);

    if (this.prisma.isConnected) {
      try {
        await this.prisma.zone.delete({
          where: { id },
        });
        this.memoryZones.delete(id);
        return { message: `Зону з ID "${id}" успішно видалено` };
      } catch (err) {
        this.logger.warn(`Prisma delete zone fallback to memory: ${err.message}`);
      }
    }

    this.memoryZones.delete(id);
    return { message: `Зону з ID "${id}" успішно видалено` };
  }

  private async ensureUniqueName(name: string, excludeId?: string) {
    const lower = name.toLowerCase();

    if (this.prisma.isConnected) {
      try {
        const conflict = await this.prisma.zone.findFirst({
          where: {
            name: { equals: name, mode: 'insensitive' },
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
          },
        });
        if (conflict) {
          throw new ConflictException(`Ігрова зона з назвою "${name}" вже існує`);
        }
        return;
      } catch (err) {
        if (err instanceof ConflictException) throw err;
      }
    }

    for (const z of this.memoryZones.values()) {
      if (z.name.toLowerCase() === lower && z.id !== excludeId) {
        throw new ConflictException(`Ігрова зона з назвою "${name}" вже існує`);
      }
    }
  }
}
