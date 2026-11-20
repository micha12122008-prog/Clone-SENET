import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DeviceType, PlaceStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ZonesService } from '../zones/zones.service';
import {
  CreateComputerDto,
  CreateRepairDto,
  FinishRepairDto,
  UpdateComputerDto,
  UpdateComputerStatusDto,
  UpdatePositionDto,
} from './dto/computers.dto';
import {
  normalizeToPrismaStatus,
  normalizeToUkrainianStatus,
  UkrainianPlaceStatus,
  validateStatusTransition,
} from './enums/place-status.enum';

export interface InternalPlace {
  id: string;
  number: number;
  name: string;
  zoneId: string;
  status: UkrainianPlaceStatus;
  specs: Record<string, any> | null;
  coordinateX: number;
  coordinateY: number;
  row: number;
  col: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InternalRepair {
  id: string;
  placeId: string;
  description: string;
  startedAt: Date;
  finishedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class ComputersService {
  private readonly logger = new Logger(ComputersService.name);
  public readonly memoryPlaces = new Map<string, InternalPlace>();
  public readonly memoryRepairs = new Map<string, InternalRepair>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly zonesService: ZonesService,
  ) {
    this.initDefaultPlacesAndRepairs();
  }

  private initDefaultPlacesAndRepairs() {
    const defaultPlaces: InternalPlace[] = [
      {
        id: 'comp-1',
        number: 1,
        name: 'PC-01',
        zoneId: 'zone-1-standard',
        status: 'вільно',
        specs: {
          cpu: 'Intel Core i5-13400F',
          gpu: 'NVIDIA RTX 4060 Ti 8GB',
          ram: '16GB DDR4 3600MHz',
          monitor: '24.5" ZOWIE 240Hz',
        },
        coordinateX: 100,
        coordinateY: 100,
        row: 1,
        col: 1,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'comp-2',
        number: 2,
        name: 'PC-02',
        zoneId: 'zone-1-standard',
        status: 'зайнято',
        specs: {
          cpu: 'Intel Core i5-13400F',
          gpu: 'NVIDIA RTX 4060 Ti 8GB',
          ram: '16GB DDR4 3600MHz',
          monitor: '24.5" ZOWIE 240Hz',
        },
        coordinateX: 180,
        coordinateY: 100,
        row: 1,
        col: 2,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'comp-3',
        number: 3,
        name: 'PC-03',
        zoneId: 'zone-1-standard',
        status: 'ремонт',
        specs: {
          cpu: 'Intel Core i5-13400F',
          gpu: 'NVIDIA RTX 4060 Ti 8GB',
          ram: '16GB DDR4 3600MHz',
          monitor: '24.5" ZOWIE 240Hz',
        },
        coordinateX: 260,
        coordinateY: 100,
        row: 1,
        col: 3,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'comp-4',
        number: 4,
        name: 'PC-04',
        zoneId: 'zone-1-standard',
        status: 'бронь',
        specs: {
          cpu: 'Intel Core i5-13400F',
          gpu: 'NVIDIA RTX 4060 Ti 8GB',
          ram: '16GB DDR4 3600MHz',
          monitor: '24.5" ZOWIE 240Hz',
        },
        coordinateX: 340,
        coordinateY: 100,
        row: 1,
        col: 4,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'comp-5',
        number: 5,
        name: 'VIP-01',
        zoneId: 'zone-2-vip',
        status: 'вільно',
        specs: {
          cpu: 'Intel Core i9-14900KF',
          gpu: 'NVIDIA RTX 4090 24GB',
          ram: '32GB DDR5 6400MHz',
          monitor: '27" ASUS ROG OLED 240Hz',
        },
        coordinateX: 500,
        coordinateY: 100,
        row: 1,
        col: 5,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'comp-6',
        number: 6,
        name: 'VIP-02',
        zoneId: 'zone-2-vip',
        status: 'вільно',
        specs: {
          cpu: 'Intel Core i9-14900KF',
          gpu: 'NVIDIA RTX 4090 24GB',
          ram: '32GB DDR5 6400MHz',
          monitor: '27" ASUS ROG OLED 240Hz',
        },
        coordinateX: 580,
        coordinateY: 100,
        row: 1,
        col: 6,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'comp-7',
        number: 7,
        name: 'PS5-01',
        zoneId: 'zone-4-ps',
        status: 'вільно',
        specs: {
          console: 'Sony PlayStation 5 Disc Edition',
          tv: '65" LG OLED 4K 120Hz',
          controllers: '2x DualSense Wireless',
        },
        coordinateX: 720,
        coordinateY: 200,
        row: 2,
        col: 1,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'comp-8',
        number: 8,
        name: 'VR-01',
        zoneId: 'zone-5-vr',
        status: 'вільно',
        specs: {
          headset: 'Meta Quest 3 512GB + HTC Vive Pro 2',
          rig: 'Arena Station RTX 4090',
        },
        coordinateX: 860,
        coordinateY: 200,
        row: 2,
        col: 2,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
    ];

    for (const place of defaultPlaces) {
      this.memoryPlaces.set(place.id, place);
    }

    const defaultRepair: InternalRepair = {
      id: 'repair-init-1',
      placeId: 'comp-3',
      description: 'Заміна клавіатури Logitech G Pro',
      startedAt: new Date('2026-10-24T10:00:00.000Z'),
      finishedAt: null,
      createdAt: new Date('2026-10-24T10:00:00.000Z'),
    };
    this.memoryRepairs.set(defaultRepair.id, defaultRepair);
  }

  async findAll(query?: { zoneId?: string; status?: string; deviceType?: DeviceType }) {
    if (this.prisma.isConnected) {
      try {
        const where: any = {};
        if (query?.zoneId) {
          where.zoneId = query.zoneId;
        }
        if (query?.status) {
          where.status = normalizeToPrismaStatus(query.status);
        }
        if (query?.deviceType) {
          where.zone = { deviceType: query.deviceType };
        }

        const places = await this.prisma.place.findMany({
          where,
          include: {
            zone: true,
          },
          orderBy: { number: 'asc' },
        });

        if (places && places.length > 0) {
          return places.map((p) => this.mapPlaceToResponse(p, p.zone));
        }
      } catch (err) {
        this.logger.warn(`Prisma findAll places fallback to memory: ${err.message}`);
      }
    }

    let items = Array.from(this.memoryPlaces.values());
    if (query?.zoneId) {
      items = items.filter((p) => p.zoneId === query.zoneId);
    }
    if (query?.status) {
      const normalizedQueryStatus = normalizeToUkrainianStatus(query.status);
      items = items.filter((p) => p.status === normalizedQueryStatus);
    }

    const zones = await this.zonesService.findAll();
    const zoneMap = new Map(zones.map((z) => [z.id, z]));

    if (query?.deviceType) {
      items = items.filter((p) => {
        const z = zoneMap.get(p.zoneId);
        return z?.deviceType === query.deviceType;
      });
    }

    return items
      .sort((a, b) => a.number - b.number)
      .map((p) => {
        const z = zoneMap.get(p.zoneId);
        return {
          id: p.id,
          number: p.number,
          name: p.name,
          zoneId: p.zoneId,
          zoneName: z?.name || 'Standard Zone',
          zoneColor: z?.colorHex || '#3B82F6',
          deviceType: z?.deviceType || DeviceType.PC,
          status: p.status,
          specs: p.specs,
          coordinateX: p.coordinateX,
          coordinateY: p.coordinateY,
          row: p.row,
          col: p.col,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      });
  }

  async getMapLayout() {
    const computers = await this.findAll();
    return {
      clubLayout: {
        width: 1200,
        height: 800,
        gridStep: 20,
      },
      computers: computers.map((c) => ({
        id: c.id,
        number: c.number,
        name: c.name,
        x: c.coordinateX,
        y: c.coordinateY,
        row: c.row,
        col: c.col,
        status: c.status,
        zoneName: c.zoneName,
        zoneColor: c.zoneColor,
        deviceType: c.deviceType,
      })),
    };
  }

  async findById(id: string) {
    if (this.prisma.isConnected) {
      try {
        const place = await this.prisma.place.findUnique({
          where: { id },
          include: {
            zone: true,
            repairs: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        });
        if (place) {
          const res = this.mapPlaceToResponse(place, place.zone);
          return {
            ...res,
            repairs: place.repairs.map((r) => ({
              id: r.id,
              description: r.description,
              startedAt: r.startedAt,
              finishedAt: r.finishedAt,
              status: r.finishedAt ? 'Завершено' : 'В процесі',
            })),
          };
        }
      } catch (err) {
        this.logger.warn(`Prisma findById place fallback to memory: ${err.message}`);
      }
    }

    const place = this.memoryPlaces.get(id);
    if (!place) {
      throw new NotFoundException(`Місце / комп’ютер із ID "${id}" не знайдено`);
    }

    const zone = await this.zonesService.findById(place.zoneId).catch(() => null);
    const placeRepairs = Array.from(this.memoryRepairs.values())
      .filter((r) => r.placeId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      id: place.id,
      number: place.number,
      name: place.name,
      zoneId: place.zoneId,
      zoneName: zone?.name || 'Standard Zone',
      zoneColor: zone?.colorHex || '#3B82F6',
      deviceType: zone?.deviceType || DeviceType.PC,
      status: place.status,
      specs: place.specs,
      coordinateX: place.coordinateX,
      coordinateY: place.coordinateY,
      row: place.row,
      col: place.col,
      repairs: placeRepairs.map((r) => ({
        id: r.id,
        description: r.description,
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
        status: r.finishedAt ? 'Завершено' : 'В процесі',
      })),
      createdAt: place.createdAt,
      updatedAt: place.updatedAt,
    };
  }

  async create(dto: CreateComputerDto) {
    await this.ensureUniqueNumber(dto.number);
    await this.zonesService.findById(dto.zoneId);

    const now = new Date();
    const placeData = {
      number: dto.number,
      name: dto.name.trim(),
      zoneId: dto.zoneId,
      status: PlaceStatus.FREE,
      specs: dto.specs || null,
      coordinateX: dto.coordinateX ?? 0,
      coordinateY: dto.coordinateY ?? 0,
      row: dto.row ?? 1,
      col: dto.col ?? 1,
    };

    if (this.prisma.isConnected) {
      try {
        const created = await this.prisma.place.create({
          data: placeData,
          include: { zone: true },
        });
        const mapped = this.mapPlaceToResponse(created, created.zone);
        this.memoryPlaces.set(mapped.id, {
          id: mapped.id,
          number: mapped.number,
          name: mapped.name,
          zoneId: mapped.zoneId,
          status: 'вільно',
          specs: mapped.specs,
          coordinateX: mapped.coordinateX,
          coordinateY: mapped.coordinateY,
          row: mapped.row,
          col: mapped.col,
          createdAt: now,
          updatedAt: now,
        });
        return mapped;
      } catch (err) {
        this.logger.warn(`Prisma create place fallback to memory: ${err.message}`);
      }
    }

    const fallbackPlace: InternalPlace = {
      id: `comp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      number: dto.number,
      name: dto.name.trim(),
      zoneId: dto.zoneId,
      status: 'вільно',
      specs: dto.specs || null,
      coordinateX: dto.coordinateX ?? 0,
      coordinateY: dto.coordinateY ?? 0,
      row: dto.row ?? 1,
      col: dto.col ?? 1,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryPlaces.set(fallbackPlace.id, fallbackPlace);

    const zone = await this.zonesService.findById(dto.zoneId).catch(() => null);
    return {
      id: fallbackPlace.id,
      number: fallbackPlace.number,
      name: fallbackPlace.name,
      zoneId: fallbackPlace.zoneId,
      zoneName: zone?.name || 'Standard Zone',
      zoneColor: zone?.colorHex || '#3B82F6',
      deviceType: zone?.deviceType || DeviceType.PC,
      status: fallbackPlace.status,
      specs: fallbackPlace.specs,
      coordinateX: fallbackPlace.coordinateX,
      coordinateY: fallbackPlace.coordinateY,
      row: fallbackPlace.row,
      col: fallbackPlace.col,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(id: string, dto: UpdateComputerDto) {
    const existing = await this.findById(id);

    if (dto.number !== undefined && dto.number !== existing.number) {
      await this.ensureUniqueNumber(dto.number, id);
    }
    if (dto.zoneId !== undefined && dto.zoneId !== existing.zoneId) {
      await this.zonesService.findById(dto.zoneId);
    }

    const updateData: any = {};
    if (dto.number !== undefined) updateData.number = dto.number;
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.zoneId !== undefined) updateData.zoneId = dto.zoneId;
    if (dto.specs !== undefined) updateData.specs = dto.specs;
    if (dto.coordinateX !== undefined) updateData.coordinateX = dto.coordinateX;
    if (dto.coordinateY !== undefined) updateData.coordinateY = dto.coordinateY;
    if (dto.row !== undefined) updateData.row = dto.row;
    if (dto.col !== undefined) updateData.col = dto.col;

    if (this.prisma.isConnected) {
      try {
        const updated = await this.prisma.place.update({
          where: { id },
          data: updateData,
          include: { zone: true },
        });
        const mapped = this.mapPlaceToResponse(updated, updated.zone);
        const mem = this.memoryPlaces.get(id);
        if (mem) {
          Object.assign(mem, {
            ...mapped,
            updatedAt: new Date(),
          });
        }
        return mapped;
      } catch (err) {
        this.logger.warn(`Prisma update place fallback to memory: ${err.message}`);
      }
    }

    const memPlace = this.memoryPlaces.get(id);
    if (!memPlace) {
      throw new NotFoundException(`Місце / комп’ютер із ID "${id}" не знайдено`);
    }

    Object.assign(memPlace, updateData, { updatedAt: new Date() });
    const zone = await this.zonesService.findById(memPlace.zoneId).catch(() => null);

    return {
      id: memPlace.id,
      number: memPlace.number,
      name: memPlace.name,
      zoneId: memPlace.zoneId,
      zoneName: zone?.name || 'Standard Zone',
      zoneColor: zone?.colorHex || '#3B82F6',
      deviceType: zone?.deviceType || DeviceType.PC,
      status: memPlace.status,
      specs: memPlace.specs,
      coordinateX: memPlace.coordinateX,
      coordinateY: memPlace.coordinateY,
      row: memPlace.row,
      col: memPlace.col,
      createdAt: memPlace.createdAt,
      updatedAt: memPlace.updatedAt,
    };
  }

  async updatePosition(id: string, dto: UpdatePositionDto) {
    return this.update(id, {
      coordinateX: dto.x,
      coordinateY: dto.y,
      row: dto.row,
      col: dto.col,
    });
  }

  /**
   * Зміна статусу місця суворо за українським enum: 'вільно' | 'зайнято' | 'бронь' | 'ремонт'.
   * При переході в 'ремонт' створюється запис у журналі Repair.
   * При виході з 'ремонту' у 'вільно' відкритий запис Repair фінішується.
   */
  async updateStatus(id: string, dto: UpdateComputerStatusDto) {
    const currentPlace = await this.findById(id);
    const targetStatus = normalizeToUkrainianStatus(dto.status);

    // Валідація автоматних переходів між статусами
    validateStatusTransition(currentPlace.status, targetStatus);

    const now = new Date();
    const repairReason =
      dto.description?.trim() || dto.reason?.trim() || 'Технічне обслуговування / ремонт ПК';

    // 1. Якщо перехід у статус 'ремонт' -> фіксуємо в журналі Repair
    if (targetStatus === 'ремонт') {
      await this.createRepairRecord(id, repairReason);
    }

    // 2. Якщо перехід зі статусу 'ремонт' у 'вільно' -> закриваємо активний Repair
    if (currentPlace.status === 'ремонт' && targetStatus === 'вільно') {
      await this.finishActiveRepairRecord(id);
    }

    // 3. Зберігаємо статус у БД або в пам'яті
    if (this.prisma.isConnected) {
      try {
        const prismaStatus = normalizeToPrismaStatus(targetStatus);
        const updated = await this.prisma.place.update({
          where: { id },
          data: { status: prismaStatus },
          include: { zone: true },
        });
        const mapped = this.mapPlaceToResponse(updated, updated.zone);
        const mem = this.memoryPlaces.get(id);
        if (mem) {
          mem.status = targetStatus;
          mem.updatedAt = now;
        }
        return {
          ...mapped,
          message: `Статус місця №${mapped.number} успішно змінено на "${targetStatus}"`,
        };
      } catch (err) {
        this.logger.warn(`Prisma updateStatus fallback to memory: ${err.message}`);
      }
    }

    const memPlace = this.memoryPlaces.get(id);
    if (!memPlace) {
      throw new NotFoundException(`Місце / комп’ютер із ID "${id}" не знайдено`);
    }

    memPlace.status = targetStatus;
    memPlace.updatedAt = now;

    return {
      ...currentPlace,
      status: targetStatus,
      updatedAt: now,
      message: `Статус місця №${currentPlace.number} успішно змінено на "${targetStatus}"`,
    };
  }

  async delete(id: string) {
    await this.findById(id);

    if (this.prisma.isConnected) {
      try {
        await this.prisma.place.delete({
          where: { id },
        });
        this.memoryPlaces.delete(id);
        return { message: `Комп’ютер / місце з ID "${id}" успішно видалено` };
      } catch (err) {
        this.logger.warn(`Prisma delete place fallback to memory: ${err.message}`);
      }
    }

    this.memoryPlaces.delete(id);
    return { message: `Комп’ютер / місце з ID "${id}" успішно видалено` };
  }

  // -------------------------------------------------------------
  // ЖУРНАЛ РЕМОНТУ (Maintenance Log)
  // -------------------------------------------------------------

  async findAllRepairs(query?: { placeId?: string; activeOnly?: boolean }) {
    if (this.prisma.isConnected) {
      try {
        const where: any = {};
        if (query?.placeId) {
          where.placeId = query.placeId;
        }
        if (query?.activeOnly) {
          where.finishedAt = null;
        }

        const repairs = await this.prisma.repair.findMany({
          where,
          include: {
            place: {
              include: { zone: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (repairs && repairs.length > 0) {
          return repairs.map((r) => ({
            id: r.id,
            placeId: r.placeId,
            placeNumber: r.place.number,
            placeName: r.place.name,
            zoneName: r.place.zone.name,
            description: r.description,
            startedAt: r.startedAt,
            finishedAt: r.finishedAt,
            status: r.finishedAt ? 'Завершено' : 'В процесі',
            createdAt: r.createdAt,
          }));
        }
      } catch (err) {
        this.logger.warn(`Prisma findAllRepairs fallback to memory: ${err.message}`);
      }
    }

    let items = Array.from(this.memoryRepairs.values());
    if (query?.placeId) {
      items = items.filter((r) => r.placeId === query.placeId);
    }
    if (query?.activeOnly) {
      items = items.filter((r) => r.finishedAt === null);
    }

    const zones = await this.zonesService.findAll();
    const zoneMap = new Map(zones.map((z) => [z.id, z]));

    return items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((r) => {
        const place = this.memoryPlaces.get(r.placeId);
        const zone = place ? zoneMap.get(place.zoneId) : null;
        return {
          id: r.id,
          placeId: r.placeId,
          placeNumber: place?.number || 0,
          placeName: place?.name || 'ПК',
          zoneName: zone?.name || 'Standard Zone',
          description: r.description,
          startedAt: r.startedAt,
          finishedAt: r.finishedAt,
          status: (r.finishedAt ? 'Завершено' : 'В процесі') as 'Завершено' | 'В процесі',
          createdAt: r.createdAt,
        };
      });
  }

  async createRepair(dto: CreateRepairDto) {
    const place = await this.findById(dto.placeId);
    const repair = await this.createRepairRecord(dto.placeId, dto.description);

    // Оновлюємо статус ПК на 'ремонт'
    if (place.status !== 'ремонт') {
      await this.updateStatus(dto.placeId, {
        status: 'ремонт',
        description: dto.description,
      });
    }

    return {
      message: `Місце №${place.number} успішно направлено в ремонт`,
      repair,
    };
  }

  async finishRepair(repairId: string, dto?: FinishRepairDto) {
    let placeId: string | null = null;
    const now = new Date();

    if (this.prisma.isConnected) {
      try {
        const updated = await this.prisma.repair.update({
          where: { id: repairId },
          data: {
            finishedAt: now,
            ...(dto?.notes ? { description: { set: undefined } } : {}),
          },
          include: {
            place: true,
          },
        });
        placeId = updated.placeId;

        // Повертаємо ПК у статус 'вільно'
        await this.prisma.place.update({
          where: { id: placeId },
          data: { status: PlaceStatus.FREE },
        });

        const mem = this.memoryRepairs.get(repairId);
        if (mem) {
          mem.finishedAt = now;
        }
        const memP = this.memoryPlaces.get(placeId);
        if (memP) {
          memP.status = 'вільно';
        }

        return {
          message: `Ремонт #${repairId} успішно завершено. Місце повернуто в статус "вільно".`,
          repair: updated,
        };
      } catch (err) {
        this.logger.warn(`Prisma finishRepair fallback to memory: ${err.message}`);
      }
    }

    const memRepair = this.memoryRepairs.get(repairId);
    if (!memRepair) {
      throw new NotFoundException(`Запис ремонту з ID "${repairId}" не знайдено`);
    }

    memRepair.finishedAt = now;
    placeId = memRepair.placeId;

    const memPlace = this.memoryPlaces.get(placeId);
    if (memPlace) {
      memPlace.status = 'вільно';
      memPlace.updatedAt = now;
    }

    return {
      message: `Ремонт #${repairId} успішно завершено. Місце повернуто в статус "вільно".`,
      repair: memRepair,
    };
  }

  private async createRepairRecord(placeId: string, description: string): Promise<InternalRepair> {
    const now = new Date();

    if (this.prisma.isConnected) {
      try {
        const created = await this.prisma.repair.create({
          data: {
            placeId,
            description,
            startedAt: now,
          },
        });
        const internalRepair: InternalRepair = {
          id: created.id,
          placeId: created.placeId,
          description: created.description,
          startedAt: created.startedAt,
          finishedAt: created.finishedAt,
          createdAt: created.createdAt,
        };
        this.memoryRepairs.set(internalRepair.id, internalRepair);
        return internalRepair;
      } catch (err) {
        this.logger.warn(`Prisma create repair fallback to memory: ${err.message}`);
      }
    }

    const newRepair: InternalRepair = {
      id: `repair-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      placeId,
      description,
      startedAt: now,
      finishedAt: null,
      createdAt: now,
    };
    this.memoryRepairs.set(newRepair.id, newRepair);
    return newRepair;
  }

  private async finishActiveRepairRecord(placeId: string): Promise<void> {
    const now = new Date();

    if (this.prisma.isConnected) {
      try {
        await this.prisma.repair.updateMany({
          where: {
            placeId,
            finishedAt: null,
          },
          data: {
            finishedAt: now,
          },
        });
      } catch (err) {
        this.logger.warn(`Prisma finishActiveRepairRecord fallback to memory: ${err.message}`);
      }
    }

    for (const r of this.memoryRepairs.values()) {
      if (r.placeId === placeId && r.finishedAt === null) {
        r.finishedAt = now;
      }
    }
  }

  private async ensureUniqueNumber(num: number, excludeId?: string) {
    if (this.prisma.isConnected) {
      try {
        const conflict = await this.prisma.place.findFirst({
          where: {
            number: num,
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
          },
        });
        if (conflict) {
          throw new ConflictException(`Місце з номером ${num} уже існує в базі`);
        }
        return;
      } catch (err) {
        if (err instanceof ConflictException) throw err;
      }
    }

    for (const p of this.memoryPlaces.values()) {
      if (p.number === num && p.id !== excludeId) {
        throw new ConflictException(`Місце з номером ${num} уже існує в базі`);
      }
    }
  }

  private mapPlaceToResponse(place: any, zone?: any) {
    const status = normalizeToUkrainianStatus(place.status);
    return {
      id: place.id,
      number: place.number,
      name: place.name,
      zoneId: place.zoneId,
      zoneName: zone?.name || 'Standard Zone',
      zoneColor: zone?.colorHex || '#3B82F6',
      deviceType: zone?.deviceType || DeviceType.PC,
      status,
      specs: place.specs,
      coordinateX: place.coordinateX,
      coordinateY: place.coordinateY,
      row: place.row,
      col: place.col,
      createdAt: place.createdAt,
      updatedAt: place.updatedAt,
    };
  }
}
