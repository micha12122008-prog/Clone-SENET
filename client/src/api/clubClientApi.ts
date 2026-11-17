import type {
  ActiveBookingDto,
  ActiveSessionDto,
  CatalogPlaceDto,
  CatalogSnapshotData,
  CatalogTariffDto,
  CatalogZoneDto,
  ClubNotificationDto,
  DeviceCategory,
  HomeDashboardData,
  PlaceSpecsDto,
  ZoneCategoryKind,
} from '../types/catalog'
import type { PlaceStatus, PublicClubSettingsDto } from '../types/openapi'
import { OPENAPI_FALLBACK_SETTINGS, requestOpenApi } from './openapiClient'

export function normalizePlaceStatus(rawStatus: unknown): PlaceStatus {
  const value = typeof rawStatus === 'string' ? rawStatus.trim().toUpperCase() : ''

  if (value === 'FREE' || value === 'ВІЛЬНО') {
    return 'вільно'
  }
  if (value === 'BUSY' || value === 'ЗАЙНЯТО' || value === 'ACTIVE') {
    return 'зайнято'
  }
  if (value === 'BOOKED' || value === 'БРОНЬ' || value === 'RESERVED') {
    return 'бронь'
  }
  if (
    value === 'MAINTENANCE' ||
    value === 'OFFLINE' ||
    value === 'РЕМОНТ' ||
    value === 'REPAIR'
  ) {
    return 'ремонт'
  }

  return 'вільно'
}

export function resolveZoneCategoryAndDevice(
  rawName: string,
  rawDeviceType?: unknown,
): { categoryKind: ZoneCategoryKind; deviceType: DeviceCategory } {
  const lower = rawName.toLowerCase()
  const devUpper = typeof rawDeviceType === 'string' ? rawDeviceType.trim().toUpperCase() : ''

  if (devUpper === 'VR' || lower.includes('vr')) {
    return { categoryKind: 'VR-room', deviceType: 'VR' }
  }
  if (
    devUpper === 'PS' ||
    lower.includes('ps') ||
    lower.includes('playstation') ||
    lower.includes('console')
  ) {
    return { categoryKind: 'PS-зона', deviceType: 'PS' }
  }
  if (lower.includes('bootcamp') || lower.includes('буткамп') || lower.includes('5x5')) {
    return { categoryKind: 'Bootcamp', deviceType: 'PC' }
  }
  if (lower.includes('vip') || lower.includes('4090') || lower.includes('oled')) {
    return { categoryKind: 'VIP', deviceType: 'PC' }
  }

  return { categoryKind: 'Standard', deviceType: 'PC' }
}

function getZoneHallMeta(categoryKind: ZoneCategoryKind): {
  hallPhotoLabel: string
  hallPhotoCaption: string
  defaultColor: string
} {
  switch (categoryKind) {
    case 'VIP':
      return {
        hallPhotoLabel: 'Зал VIP OLED 240Hz • Шумоізольовані бокси',
        hallPhotoCaption: 'GeForce RTX 4090 • 27" OLED 240Hz • Анатомічні крісла Secretlab',
        defaultColor: '#8B5CF6',
      }
    case 'Bootcamp':
      return {
        hallPhotoLabel: 'Зал Bootcamp 5×5 • Командна кімната',
        hallPhotoCaption: '5 турнірних станцій у ряд • Тактична дошка • Ізольований голосовий зв’язок',
        defaultColor: '#10B981',
      }
    case 'PS-зона':
      return {
        hallPhotoLabel: 'Зал PlayStation 5 Lounge • Консольна лаунж-зона',
        hallPhotoCaption: 'Sony PS5 Pro • 65" 4K OLED TV • М’які дивани та 4 геймпади DualSense',
        defaultColor: '#F59E0B',
      }
    case 'VR-room':
      return {
        hallPhotoLabel: 'Зал VR-room Arena • Простір вільного руху 360°',
        hallPhotoCaption: 'Meta Quest 3 / Valve Index • Кабель-менеджмент зі стелі • Кооперативні VR-ігри',
        defaultColor: '#EC4899',
      }
    case 'Standard':
    default:
      return {
        hallPhotoLabel: 'Основний зал Standard Arena • Кіберспортивний простір',
        hallPhotoCaption: 'GeForce RTX 4060 Ti • 24.5" ZOWIE 144Hz/240Hz • Механічні клавіатури',
        defaultColor: '#3B82F6',
      }
  }
}

function parseSpecs(
  rawSpecs: unknown,
  categoryKind: ZoneCategoryKind,
): PlaceSpecsDto {
  if (typeof rawSpecs === 'object' && rawSpecs !== null) {
    const obj = rawSpecs as Record<string, unknown>
    return {
      cpu: typeof obj.cpu === 'string' ? obj.cpu : undefined,
      gpu: typeof obj.gpu === 'string' ? obj.gpu : undefined,
      ram: typeof obj.ram === 'string' ? obj.ram : undefined,
      display:
        typeof obj.monitor === 'string'
          ? obj.monitor
          : typeof obj.display === 'string'
            ? obj.display
            : undefined,
      peripherals: typeof obj.peripherals === 'string' ? obj.peripherals : undefined,
    }
  }

  switch (categoryKind) {
    case 'VIP':
      return {
        cpu: 'Intel Core i9-14900KF',
        gpu: 'NVIDIA RTX 4090 24GB',
        ram: '32GB DDR5',
        display: '27" OLED 240Hz',
      }
    case 'Bootcamp':
      return {
        cpu: 'AMD Ryzen 7 7800X3D',
        gpu: 'NVIDIA RTX 4070 Super',
        ram: '32GB DDR5',
        display: '24.5" ZOWIE 240Hz',
      }
    case 'PS-зона':
      return {
        cpu: 'Sony PlayStation 5',
        gpu: '4K HDR 120Hz Output',
        ram: '2× DualSense Edge',
        display: '65" LG OLED 4K TV',
      }
    case 'VR-room':
      return {
        cpu: 'Meta Quest 3 + PCVR',
        gpu: 'NVIDIA RTX 4080 Super',
        ram: 'Room-scale 4×4 м',
        display: '120Hz Pancake Optics',
      }
    case 'Standard':
    default:
      return {
        cpu: 'Intel Core i5-13400F',
        gpu: 'NVIDIA RTX 4060 Ti',
        ram: '16GB DDR4',
        display: '24.5" IPS 144Hz',
      }
  }
}

const SUPPLEMENTAL_ZONES: Array<{
  id: string
  name: string
  categoryKind: ZoneCategoryKind
  deviceType: DeviceCategory
  description: string
  baseHourlyRate: number
  colorHex: string
}> = [
  {
    id: 'zone-1',
    name: 'Standard Zone',
    categoryKind: 'Standard',
    deviceType: 'PC',
    description: 'Збалансовані ігрові ПК для рейтингового геймінгу в CS2, Dota 2, Valorant',
    baseHourlyRate: 60,
    colorHex: '#3B82F6',
  },
  {
    id: 'zone-2',
    name: 'VIP RTX 4090',
    categoryKind: 'VIP',
    deviceType: 'PC',
    description: 'Максимальна продуктивність RTX 4090, 240Hz OLED дисплеї та преміум-крісла',
    baseHourlyRate: 110,
    colorHex: '#8B5CF6',
  },
  {
    id: 'zone-3',
    name: 'Bootcamp 5x5',
    categoryKind: 'Bootcamp',
    deviceType: 'PC',
    description: 'Окрема командна кімната на 5 гравців для тренувань і турнірних праків',
    baseHourlyRate: 85,
    colorHex: '#10B981',
  },
  {
    id: 'zone-ps',
    name: 'PS-зона (PlayStation 5 Lounge)',
    categoryKind: 'PS-зона',
    deviceType: 'PS',
    description: 'Консольна лаунж-зона з 4K TV 65", диванами та FIFA / UFC / Mortal Kombat',
    baseHourlyRate: 80,
    colorHex: '#F59E0B',
  },
  {
    id: 'zone-vr',
    name: 'VR-room (Virtual Reality Arena)',
    categoryKind: 'VR-room',
    deviceType: 'VR',
    description: 'Кімната віртуальної реальності з вільним переміщенням та шоломами Quest 3 / Index',
    baseHourlyRate: 120,
    colorHex: '#EC4899',
  },
]

function buildSupplementalPlacesForZone(zone: {
  id: string
  name: string
  categoryKind: ZoneCategoryKind
  deviceType: DeviceCategory
  baseHourlyRate: number
}): CatalogPlaceDto[] {
  const specs = parseSpecs(null, zone.categoryKind)

  if (zone.categoryKind === 'Standard') {
    return [
      {
        id: `${zone.id}-pc-1`,
        number: 1,
        name: 'PC-01',
        zoneId: zone.id,
        zoneName: zone.name,
        categoryKind: zone.categoryKind,
        deviceType: zone.deviceType,
        status: 'вільно',
        specs,
        hourlyRate: zone.baseHourlyRate,
      },
      {
        id: `${zone.id}-pc-2`,
        number: 2,
        name: 'PC-02',
        zoneId: zone.id,
        zoneName: zone.name,
        categoryKind: zone.categoryKind,
        deviceType: zone.deviceType,
        status: 'зайнято',
        specs,
        hourlyRate: zone.baseHourlyRate,
        note: 'Сесія: s1mple_pro',
      },
      {
        id: `${zone.id}-pc-3`,
        number: 3,
        name: 'PC-03',
        zoneId: zone.id,
        zoneName: zone.name,
        categoryKind: zone.categoryKind,
        deviceType: zone.deviceType,
        status: 'ремонт',
        specs,
        hourlyRate: zone.baseHourlyRate,
        note: 'Заміна клавіатури Logitech G Pro',
      },
      {
        id: `${zone.id}-pc-4`,
        number: 4,
        name: 'PC-04',
        zoneId: zone.id,
        zoneName: zone.name,
        categoryKind: zone.categoryKind,
        deviceType: zone.deviceType,
        status: 'вільно',
        specs,
        hourlyRate: zone.baseHourlyRate,
      },
    ]
  }

  if (zone.categoryKind === 'VIP') {
    return [
      {
        id: `${zone.id}-vip-1`,
        number: 7,
        name: 'VIP-01',
        zoneId: zone.id,
        zoneName: zone.name,
        categoryKind: zone.categoryKind,
        deviceType: zone.deviceType,
        status: 'вільно',
        specs,
        hourlyRate: zone.baseHourlyRate,
      },
      {
        id: `${zone.id}-vip-2`,
        number: 8,
        name: 'VIP-02',
        zoneId: zone.id,
        zoneName: zone.name,
        categoryKind: zone.categoryKind,
        deviceType: zone.deviceType,
        status: 'бронь',
        specs,
        hourlyRate: zone.baseHourlyRate,
        note: 'Бронь на 18:00',
      },
      {
        id: `${zone.id}-vip-3`,
        number: 9,
        name: 'VIP-03',
        zoneId: zone.id,
        zoneName: zone.name,
        categoryKind: zone.categoryKind,
        deviceType: zone.deviceType,
        status: 'вільно',
        specs,
        hourlyRate: zone.baseHourlyRate,
      },
    ]
  }

  if (zone.categoryKind === 'Bootcamp') {
    return [
      {
        id: `${zone.id}-boot-1`,
        number: 11,
        name: 'BOOT-01',
        zoneId: zone.id,
        zoneName: zone.name,
        categoryKind: zone.categoryKind,
        deviceType: zone.deviceType,
        status: 'вільно',
        specs,
        hourlyRate: zone.baseHourlyRate,
      },
      {
        id: `${zone.id}-boot-2`,
        number: 12,
        name: 'BOOT-02',
        zoneId: zone.id,
        zoneName: zone.name,
        categoryKind: zone.categoryKind,
        deviceType: zone.deviceType,
        status: 'вільно',
        specs,
        hourlyRate: zone.baseHourlyRate,
      },
      {
        id: `${zone.id}-boot-3`,
        number: 13,
        name: 'BOOT-03',
        zoneId: zone.id,
        zoneName: zone.name,
        categoryKind: zone.categoryKind,
        deviceType: zone.deviceType,
        status: 'бронь',
        specs,
        hourlyRate: zone.baseHourlyRate,
        note: 'Командна бронь 5×5',
      },
    ]
  }

  if (zone.categoryKind === 'PS-зона') {
    return [
      {
        id: `${zone.id}-ps-1`,
        number: 21,
        name: 'PS5-01',
        zoneId: zone.id,
        zoneName: zone.name,
        categoryKind: zone.categoryKind,
        deviceType: zone.deviceType,
        status: 'вільно',
        specs,
        hourlyRate: zone.baseHourlyRate,
      },
      {
        id: `${zone.id}-ps-2`,
        number: 22,
        name: 'PS5-02',
        zoneId: zone.id,
        zoneName: zone.name,
        categoryKind: zone.categoryKind,
        deviceType: zone.deviceType,
        status: 'зайнято',
        specs,
        hourlyRate: zone.baseHourlyRate,
        note: 'Активна гра EA FC 25',
      },
      {
        id: `${zone.id}-ps-3`,
        number: 23,
        name: 'PS5-03',
        zoneId: zone.id,
        zoneName: zone.name,
        categoryKind: zone.categoryKind,
        deviceType: zone.deviceType,
        status: 'вільно',
        specs,
        hourlyRate: zone.baseHourlyRate,
      },
    ]
  }

  return [
    {
      id: `${zone.id}-vr-1`,
      number: 31,
      name: 'VR-01',
      zoneId: zone.id,
      zoneName: zone.name,
      categoryKind: zone.categoryKind,
      deviceType: zone.deviceType,
      status: 'вільно',
      specs,
      hourlyRate: zone.baseHourlyRate,
    },
    {
      id: `${zone.id}-vr-2`,
      number: 32,
      name: 'VR-02',
      zoneId: zone.id,
      zoneName: zone.name,
      categoryKind: zone.categoryKind,
      deviceType: zone.deviceType,
      status: 'бронь',
      specs,
      hourlyRate: zone.baseHourlyRate,
      note: 'Бронь Half-Life: Alyx',
    },
  ]
}

export async function fetchCatalogSnapshot(): Promise<CatalogSnapshotData> {
  const loadedAt = new Date().toLocaleTimeString('uk-UA')

  try {
    const [rawZones, rawPlacesOrComputers, rawTariffs] = await Promise.all([
      requestOpenApi<Array<Record<string, unknown>>>('/zones'),
      requestOpenApi<Array<Record<string, unknown>>>('/places').catch(() =>
        requestOpenApi<Array<Record<string, unknown>>>('/computers'),
      ),
      requestOpenApi<Array<Record<string, unknown>>>('/tariffs').catch(() => []),
    ])

    const baseZonesMap = new Map<
      string,
      {
        id: string
        name: string
        categoryKind: ZoneCategoryKind
        deviceType: DeviceCategory
        description: string
        baseHourlyRate: number
        colorHex: string
      }
    >()

    for (const item of rawZones) {
      const id = String(item.id ?? `zone-${baseZonesMap.size + 1}`)
      const name = typeof item.name === 'string' ? item.name : 'Ігрова зона'
      const { categoryKind, deviceType } = resolveZoneCategoryAndDevice(name, item.deviceType)
      const hallMeta = getZoneHallMeta(categoryKind)
      const baseHourlyRate = Number(item.baseHourlyRate ?? item.hourlyRate ?? 60)
      const colorHex =
        typeof item.colorHex === 'string' && item.colorHex.trim().length > 0
          ? item.colorHex
          : hallMeta.defaultColor

      baseZonesMap.set(id, {
        id,
        name,
        categoryKind,
        deviceType,
        description:
          typeof item.description === 'string' && item.description.trim().length > 0
            ? item.description
            : hallMeta.hallPhotoCaption,
        baseHourlyRate,
        colorHex,
      })
    }

    // Доповнюємо каталог категоріями з ТЗ (Standard, VIP, Bootcamp, PS-зона, VR-room), якщо бекенд ще не повернув їх
    for (const supp of SUPPLEMENTAL_ZONES) {
      const hasCategory = Array.from(baseZonesMap.values()).some(
        (z) => z.categoryKind === supp.categoryKind,
      )
      if (!hasCategory) {
        baseZonesMap.set(supp.id, supp)
      }
    }

    const normalizedPlaces: CatalogPlaceDto[] = []

    for (const rawPlace of rawPlacesOrComputers) {
      const id = String(rawPlace.id ?? `place-${normalizedPlaces.length + 1}`)
      const number = Number(rawPlace.number ?? normalizedPlaces.length + 1)
      const name = typeof rawPlace.name === 'string' ? rawPlace.name : `PC-0${number}`
      const rawZoneId = typeof rawPlace.zoneId === 'string' ? rawPlace.zoneId : ''
      const rawZoneName = typeof rawPlace.zoneName === 'string' ? rawPlace.zoneName : ''

      let matchedZone =
        baseZonesMap.get(rawZoneId) ??
        Array.from(baseZonesMap.values()).find(
          (z) => z.name.toLowerCase() === rawZoneName.toLowerCase(),
        )

      if (!matchedZone) {
        const inferred = resolveZoneCategoryAndDevice(rawZoneName || name, rawPlace.deviceType)
        matchedZone = Array.from(baseZonesMap.values()).find(
          (z) => z.categoryKind === inferred.categoryKind,
        )
      }

      const categoryKind = matchedZone?.categoryKind ?? 'Standard'
      const deviceType = matchedZone?.deviceType ?? 'PC'
      const zoneId = matchedZone?.id ?? (rawZoneId || 'zone-1')
      const zoneName = matchedZone?.name ?? (rawZoneName || 'Standard Zone')
      const hourlyRate = Number(rawPlace.hourlyRate ?? matchedZone?.baseHourlyRate ?? 60)
      const status = normalizePlaceStatus(rawPlace.status)
      const specs = parseSpecs(rawPlace.specs, categoryKind)

      let note: string | undefined
      if (typeof rawPlace.activeSession === 'object' && rawPlace.activeSession !== null) {
        const sess = rawPlace.activeSession as Record<string, unknown>
        if (typeof sess.username === 'string') {
          note = `Гравець: ${sess.username}`
        }
      }

      normalizedPlaces.push({
        id,
        number,
        name,
        zoneId,
        zoneName,
        categoryKind,
        deviceType,
        status,
        specs,
        hourlyRate,
        note,
      })
    }

    // Для кожної зони, де у відповіді /computers або /places менше 2 місць, додаємо додаткові місця залу без перезапису живих місць з API
    for (const zone of baseZonesMap.values()) {
      const existingInZone = normalizedPlaces.filter((p) => p.zoneId === zone.id)
      const defaults = buildSupplementalPlacesForZone(zone)
      for (const defPlace of defaults) {
        const alreadyExists = existingInZone.some(
          (p) => p.name.toLowerCase() === defPlace.name.toLowerCase() || p.number === defPlace.number,
        )
        if (!alreadyExists) {
          normalizedPlaces.push(defPlace)
        }
      }
    }

    const zones: CatalogZoneDto[] = Array.from(baseZonesMap.values()).map((z) => {
      const zonePlaces = normalizedPlaces.filter((p) => p.zoneId === z.id)
      const hallMeta = getZoneHallMeta(z.categoryKind)
      return {
        id: z.id,
        name: z.name,
        categoryKind: z.categoryKind,
        deviceType: z.deviceType,
        description: z.description,
        baseHourlyRate: z.baseHourlyRate,
        colorHex: z.colorHex,
        hallPhotoLabel: hallMeta.hallPhotoLabel,
        hallPhotoCaption: hallMeta.hallPhotoCaption,
        totalPlaces: zonePlaces.length,
        freePlaces: zonePlaces.filter((p) => p.status === 'вільно').length,
        busyPlaces: zonePlaces.filter((p) => p.status === 'зайнято').length,
        bookedPlaces: zonePlaces.filter((p) => p.status === 'бронь').length,
        maintenancePlaces: zonePlaces.filter((p) => p.status === 'ремонт').length,
      }
    })

    const tariffs: CatalogTariffDto[] = rawTariffs.map((t, index) => ({
      id: String(t.id ?? `tariff-${index + 1}`),
      name: typeof t.name === 'string' ? t.name : 'Тариф',
      type: typeof t.type === 'string' ? t.type : 'HOURLY',
      price: Number(t.price ?? 60),
      durationMinutes: typeof t.durationMinutes === 'number' ? t.durationMinutes : undefined,
      zoneId: typeof t.zoneId === 'string' ? t.zoneId : undefined,
      zoneName: typeof t.zoneName === 'string' ? t.zoneName : undefined,
    }))

    return {
      source: 'live-api',
      loadedAt,
      zones,
      places: normalizedPlaces,
      tariffs,
    }
  } catch {
    const fallbackPlaces: CatalogPlaceDto[] = SUPPLEMENTAL_ZONES.flatMap((z) =>
      buildSupplementalPlacesForZone(z),
    )

    const fallbackZones: CatalogZoneDto[] = SUPPLEMENTAL_ZONES.map((z) => {
      const zonePlaces = fallbackPlaces.filter((p) => p.zoneId === z.id)
      const hallMeta = getZoneHallMeta(z.categoryKind)
      return {
        ...z,
        hallPhotoLabel: hallMeta.hallPhotoLabel,
        hallPhotoCaption: hallMeta.hallPhotoCaption,
        totalPlaces: zonePlaces.length,
        freePlaces: zonePlaces.filter((p) => p.status === 'вільно').length,
        busyPlaces: zonePlaces.filter((p) => p.status === 'зайнято').length,
        bookedPlaces: zonePlaces.filter((p) => p.status === 'бронь').length,
        maintenancePlaces: zonePlaces.filter((p) => p.status === 'ремонт').length,
      }
    })

    return {
      source: 'openapi-stub',
      loadedAt,
      zones: fallbackZones,
      places: fallbackPlaces,
      tariffs: [
        {
          id: 'tariff-1',
          name: '1 Година Standard',
          type: 'HOURLY',
          price: 60,
          durationMinutes: 60,
          zoneName: 'Standard Zone',
        },
        {
          id: 'tariff-2',
          name: 'Пакет 3+1 (4 години за ціною 3)',
          type: 'PACKAGE_3_PLUS_1',
          price: 180,
          durationMinutes: 240,
          zoneName: 'Standard Zone',
        },
      ],
    }
  }
}

export async function fetchHomeDashboardData(): Promise<HomeDashboardData> {
  const loadedAt = new Date().toLocaleTimeString('uk-UA')

  try {
    const [settingsRes, sessionRes, bookingsRes, notificationsRes] = await Promise.all([
      requestOpenApi<PublicClubSettingsDto>('/settings/public').catch(
        () => OPENAPI_FALLBACK_SETTINGS,
      ),
      requestOpenApi<Record<string, unknown>>('/sessions/my-active').catch(() => null),
      requestOpenApi<Array<Record<string, unknown>>>('/bookings/my').catch(() => []),
      requestOpenApi<Record<string, unknown>>('/notifications').catch(() => null),
    ])

    let activeSession: ActiveSessionDto | null = null
    if (sessionRes && typeof sessionRes.id === 'string') {
      activeSession = {
        id: sessionRes.id,
        computerName:
          typeof sessionRes.computerName === 'string' ? sessionRes.computerName : 'VIP-01',
        zoneName:
          typeof sessionRes.zoneName === 'string' ? sessionRes.zoneName : 'VIP OLED 240Hz',
        tariffName:
          typeof sessionRes.tariffName === 'string'
            ? sessionRes.tariffName
            : '1 Година VIP',
        startTime:
          typeof sessionRes.startTime === 'string'
            ? sessionRes.startTime
            : new Date().toISOString(),
        durationMinutes: Number(sessionRes.durationMinutes ?? 45),
        currentCost: Number(sessionRes.currentCost ?? 82.5),
        remainingMinutes: Number(sessionRes.remainingMinutes ?? 15),
        status: typeof sessionRes.status === 'string' ? sessionRes.status : 'ACTIVE',
      }
    }

    const activeBookings: ActiveBookingDto[] = Array.isArray(bookingsRes)
      ? bookingsRes.map((b, idx) => ({
          id: String(b.id ?? `book-${idx + 1}`),
          computerName: typeof b.computerName === 'string' ? b.computerName : 'PC-01',
          zoneName: typeof b.zoneName === 'string' ? b.zoneName : 'Standard Zone',
          tariffName: typeof b.tariffName === 'string' ? b.tariffName : 'Пакет 3+1',
          startTime:
            typeof b.startTime === 'string' ? b.startTime : '2026-10-25T18:00:00.000Z',
          endTime: typeof b.endTime === 'string' ? b.endTime : '2026-10-25T21:00:00.000Z',
          prepaidAmount: Number(b.prepaidAmount ?? 130),
          status: typeof b.status === 'string' ? b.status : 'CONFIRMED',
          qrCode: typeof b.qrCode === 'string' ? b.qrCode : undefined,
        }))
      : []

    const rawItems =
      notificationsRes && Array.isArray(notificationsRes.items)
        ? (notificationsRes.items as Array<Record<string, unknown>>)
        : []

    const notifications: ClubNotificationDto[] = rawItems.map((n, idx) => ({
      id: String(n.id ?? `notif-${idx + 1}`),
      type: typeof n.type === 'string' ? n.type : 'INFO',
      title: typeof n.title === 'string' ? n.title : 'Сповіщення клубу',
      message: typeof n.message === 'string' ? n.message : '',
      isRead: Boolean(n.isRead),
      createdAt:
        typeof n.createdAt === 'string' ? n.createdAt : new Date().toISOString(),
    }))

    const unreadCount =
      notificationsRes && typeof notificationsRes.unreadCount === 'number'
        ? notificationsRes.unreadCount
        : notifications.filter((n) => !n.isRead).length

    return {
      source: 'live-api',
      loadedAt,
      clubSettings: settingsRes,
      activeSession,
      activeBookings,
      notifications,
      unreadCount,
    }
  } catch {
    return {
      source: 'openapi-stub',
      loadedAt,
      clubSettings: OPENAPI_FALLBACK_SETTINGS,
      activeSession: {
        id: 'sess-1',
        computerName: 'VIP-01',
        zoneName: 'VIP OLED 240Hz',
        tariffName: 'VIP 1 Година OLED 240Hz',
        startTime: new Date().toISOString(),
        durationMinutes: 45,
        currentCost: 82.5,
        remainingMinutes: 15,
        status: 'ACTIVE',
      },
      activeBookings: [
        {
          id: 'book-1',
          computerName: 'PC-01',
          zoneName: 'Standard Zone',
          tariffName: 'Пакет 3+1',
          startTime: '2026-10-25T18:00:00.000Z',
          endTime: '2026-10-25T21:00:00.000Z',
          prepaidAmount: 130,
          status: 'CONFIRMED',
        },
      ],
      notifications: [
        {
          id: 'notif-1',
          type: 'LOW_BALANCE',
          title: 'Увага! Низький баланс',
          message:
            'До закінчення оплаченого часу на PC-02 залишилося 10 хвилин. Поповніть баланс, щоб продовжити гру.',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
    }
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await requestOpenApi(`/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: 'PATCH',
    })
  } catch {
    // Ігноруємо помилку мережі в dev-режимі, стан оновлюється локально
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    await requestOpenApi('/notifications/read-all', {
      method: 'POST',
    })
  } catch {
    // Ігноруємо помилку мережі в dev-режимі, стан оновлюється локально
  }
}
