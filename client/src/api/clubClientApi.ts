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
import { fetchClientBookings } from './bookingsApi'
import { OPENAPI_FALLBACK_SETTINGS, requestOpenApi } from './openapiClient'

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

function readNumber(value: unknown, fallback = 0): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const PLACE_STATUS_LOOKUP: Record<string, PlaceStatus> = {
  FREE: 'вільно',
  ВІЛЬНО: 'вільно',
  BUSY: 'зайнято',
  ACTIVE: 'зайнято',
  ЗАЙНЯТО: 'зайнято',
  BOOKED: 'бронь',
  RESERVED: 'бронь',
  БРОНЬ: 'бронь',
  MAINTENANCE: 'ремонт',
  OFFLINE: 'ремонт',
  REPAIR: 'ремонт',
  РЕМОНТ: 'ремонт',
}

export function normalizePlaceStatus(rawStatus: unknown): PlaceStatus {
  const key = readString(rawStatus).toUpperCase()
  return PLACE_STATUS_LOOKUP[key] ?? 'вільно'
}

const ZONE_MATCH_RULES: Array<{
  matches: (nameLower: string, deviceUpper: string) => boolean
  result: { categoryKind: ZoneCategoryKind; deviceType: DeviceCategory }
}> = [
  {
    matches: (name, dev) => dev === 'VR' || name.includes('vr'),
    result: { categoryKind: 'VR-room', deviceType: 'VR' },
  },
  {
    matches: (name, dev) =>
      dev === 'PS' || ['ps', 'playstation', 'console'].some((kw) => name.includes(kw)),
    result: { categoryKind: 'PS-зона', deviceType: 'PS' },
  },
  {
    matches: (name) => ['bootcamp', 'буткамп', '5x5'].some((kw) => name.includes(kw)),
    result: { categoryKind: 'Bootcamp', deviceType: 'PC' },
  },
  {
    matches: (name) => ['vip', '4090', 'oled'].some((kw) => name.includes(kw)),
    result: { categoryKind: 'VIP', deviceType: 'PC' },
  },
]

export function resolveZoneCategoryAndDevice(
  rawName: string,
  rawDeviceType?: unknown,
): { categoryKind: ZoneCategoryKind; deviceType: DeviceCategory } {
  const nameLower = rawName.toLowerCase()
  const deviceUpper = readString(rawDeviceType).toUpperCase()

  return (
    ZONE_MATCH_RULES.find((rule) => rule.matches(nameLower, deviceUpper))?.result ?? {
      categoryKind: 'Standard',
      deviceType: 'PC',
    }
  )
}

const ZONE_HALL_META: Record<
  ZoneCategoryKind,
  { hallPhotoLabel: string; hallPhotoCaption: string; defaultColor: string }
> = {
  Standard: {
    hallPhotoLabel: 'Основний зал Standard Arena • Кіберспортивний простір',
    hallPhotoCaption: 'GeForce RTX 4060 Ti • 24.5" ZOWIE 144Hz/240Hz • Механічні клавіатури',
    defaultColor: '#3B82F6',
  },
  VIP: {
    hallPhotoLabel: 'Зал VIP OLED 240Hz • Шумоізольовані бокси',
    hallPhotoCaption: 'GeForce RTX 4090 • 27" OLED 240Hz • Анатомічні крісла Secretlab',
    defaultColor: '#8B5CF6',
  },
  Bootcamp: {
    hallPhotoLabel: 'Зал Bootcamp 5×5 • Командна кімната',
    hallPhotoCaption: '5 турнірних станцій у ряд • Тактична дошка • Ізольований голосовий зв’язок',
    defaultColor: '#10B981',
  },
  'PS-зона': {
    hallPhotoLabel: 'Зал PlayStation 5 Lounge • Консольна лаунж-зона',
    hallPhotoCaption: 'Sony PS5 Pro • 65" 4K OLED TV • М’які дивани та 4 геймпади DualSense',
    defaultColor: '#F59E0B',
  },
  'VR-room': {
    hallPhotoLabel: 'Зал VR-room Arena • Простір вільного руху 360°',
    hallPhotoCaption:
      'Meta Quest 3 / Valve Index • Кабель-менеджмент зі стелі • Кооперативні VR-ігри',
    defaultColor: '#EC4899',
  },
}

const DEFAULT_ZONE_SPECS: Record<ZoneCategoryKind, PlaceSpecsDto> = {
  Standard: {
    cpu: 'Intel Core i5-13400F',
    gpu: 'NVIDIA RTX 4060 Ti',
    ram: '16GB DDR4',
    display: '24.5" IPS 144Hz',
  },
  VIP: {
    cpu: 'Intel Core i9-14900KF',
    gpu: 'NVIDIA RTX 4090 24GB',
    ram: '32GB DDR5',
    display: '27" OLED 240Hz',
  },
  Bootcamp: {
    cpu: 'AMD Ryzen 7 7800X3D',
    gpu: 'NVIDIA RTX 4070 Super',
    ram: '32GB DDR5',
    display: '24.5" ZOWIE 240Hz',
  },
  'PS-зона': {
    cpu: 'Sony PlayStation 5',
    gpu: '4K HDR 120Hz Output',
    ram: '2× DualSense Edge',
    display: '65" LG OLED 4K TV',
  },
  'VR-room': {
    cpu: 'Meta Quest 3 + PCVR',
    gpu: 'NVIDIA RTX 4080 Super',
    ram: 'Room-scale 4×4 м',
    display: '120Hz Pancake Optics',
  },
}

function parseSpecs(rawSpecs: unknown, categoryKind: ZoneCategoryKind): PlaceSpecsDto {
  const defaults = DEFAULT_ZONE_SPECS[categoryKind]
  if (typeof rawSpecs !== 'object' || rawSpecs === null) {
    return defaults
  }

  const obj = rawSpecs as Record<string, unknown>
  return {
    cpu: readString(obj.cpu ?? obj.console ?? obj.headset, defaults.cpu),
    gpu: readString(obj.gpu ?? obj.rig, defaults.gpu),
    ram: readString(obj.ram ?? obj.controllers, defaults.ram),
    display: readString(obj.monitor ?? obj.display ?? obj.tv, defaults.display),
    peripherals: readString(obj.peripherals) || undefined,
  }
}

const FALLBACK_ZONES: Array<{
  id: string
  name: string
  categoryKind: ZoneCategoryKind
  deviceType: DeviceCategory
  description: string
  baseHourlyRate: number
  colorHex: string
}> = [
  {
    id: 'zone-1-standard',
    name: 'Standard Zone',
    categoryKind: 'Standard',
    deviceType: 'PC',
    description: 'Збалансовані ігрові ПК для рейтингового геймінгу в CS2, Dota 2, Valorant',
    baseHourlyRate: 60,
    colorHex: '#3B82F6',
  },
  {
    id: 'zone-2-vip',
    name: 'VIP OLED 240Hz',
    categoryKind: 'VIP',
    deviceType: 'PC',
    description: 'Максимальна продуктивність RTX 4090, 240Hz OLED дисплеї та преміум-крісла',
    baseHourlyRate: 110,
    colorHex: '#8B5CF6',
  },
  {
    id: 'zone-3-bootcamp',
    name: 'Bootcamp 5x5',
    categoryKind: 'Bootcamp',
    deviceType: 'PC',
    description: 'Окрема командна кімната на 5 гравців для тренувань і турнірних праків',
    baseHourlyRate: 75,
    colorHex: '#10B981',
  },
  {
    id: 'zone-4-ps',
    name: 'PlayStation 5 Lounge',
    categoryKind: 'PS-зона',
    deviceType: 'PS',
    description: 'Консольна лаунж-зона з 4K TV 65", диванами та FIFA / UFC / Mortal Kombat',
    baseHourlyRate: 80,
    colorHex: '#F59E0B',
  },
  {
    id: 'zone-5-vr',
    name: 'VR Room Arena',
    categoryKind: 'VR-room',
    deviceType: 'VR',
    description: 'Кімната віртуальної реальності з вільним переміщенням та шоломами Quest 3 / Index',
    baseHourlyRate: 120,
    colorHex: '#EC4899',
  },
]

const FALLBACK_PLACE_TEMPLATES: Record<
  ZoneCategoryKind,
  Array<{ suffix: string; number: number; name: string; status: PlaceStatus; note?: string }>
> = {
  Standard: [
    { suffix: 'pc-1', number: 1, name: 'PC-01', status: 'вільно' },
    { suffix: 'pc-2', number: 2, name: 'PC-02', status: 'зайнято', note: 'Сесія: s1mple_pro' },
    {
      suffix: 'pc-3',
      number: 3,
      name: 'PC-03',
      status: 'ремонт',
      note: 'Заміна клавіатури Logitech G Pro',
    },
  ],
  VIP: [{ suffix: 'vip-1', number: 5, name: 'VIP-01', status: 'вільно' }],
  Bootcamp: [{ suffix: 'boot-1', number: 11, name: 'BOOT-01', status: 'вільно' }],
  'PS-зона': [{ suffix: 'ps-1', number: 7, name: 'PS5-01', status: 'вільно' }],
  'VR-room': [{ suffix: 'vr-1', number: 8, name: 'VR-01', status: 'вільно' }],
}

function buildFallbackPlacesForZone(zone: {
  id: string
  name: string
  categoryKind: ZoneCategoryKind
  deviceType: DeviceCategory
  baseHourlyRate: number
}): CatalogPlaceDto[] {
  const specs = parseSpecs(null, zone.categoryKind)
  const templates = FALLBACK_PLACE_TEMPLATES[zone.categoryKind]

  return templates.map((tpl) => ({
    id: `${zone.id}-${tpl.suffix}`,
    number: tpl.number,
    name: tpl.name,
    zoneId: zone.id,
    zoneName: zone.name,
    categoryKind: zone.categoryKind,
    deviceType: zone.deviceType,
    status: tpl.status,
    specs,
    hourlyRate: zone.baseHourlyRate,
    note: tpl.note,
  }))
}

export async function fetchCatalogSnapshot(): Promise<CatalogSnapshotData> {
  const loadedAt = new Date().toLocaleTimeString('uk-UA')

  try {
    const [rawZones, rawPlacesOrComputers, rawTariffs, rawRepairs] = await Promise.all([
      requestOpenApi<Array<Record<string, unknown>>>('/zones'),
      requestOpenApi<Array<Record<string, unknown>>>('/computers').catch(() =>
        requestOpenApi<Array<Record<string, unknown>>>('/places'),
      ),
      requestOpenApi<Array<Record<string, unknown>>>('/tariffs').catch(() => []),
      requestOpenApi<Array<Record<string, unknown>>>('/computers/repairs?activeOnly=true').catch(
        () => [],
      ),
    ])

    const activeRepairNoteByPlaceId = new Map<string, string>()
    for (const rep of rawRepairs) {
      const placeId = readString(rep.placeId)
      const desc = readString(rep.description)
      if (placeId && desc && !rep.finishedAt) {
        activeRepairNoteByPlaceId.set(placeId, desc)
      }
    }

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
      const name = readString(item.name, 'Ігрова зона')
      const { categoryKind, deviceType } = resolveZoneCategoryAndDevice(name, item.deviceType)
      const hallMeta = ZONE_HALL_META[categoryKind]

      baseZonesMap.set(id, {
        id,
        name,
        categoryKind,
        deviceType,
        description: readString(item.description, hallMeta.hallPhotoCaption),
        baseHourlyRate: readNumber(item.baseHourlyRate ?? item.hourlyRate, 60),
        colorHex: readString(item.colorHex, hallMeta.defaultColor),
      })
    }

    const allZonesList = Array.from(baseZonesMap.values())

    // Використовуємо виключно живі місця з відповіді API (/computers або /places)
    const normalizedPlaces: CatalogPlaceDto[] = rawPlacesOrComputers.map((rawPlace, index) => {
      const placeId = String(rawPlace.id ?? `place-${index + 1}`)
      const number = readNumber(rawPlace.number, index + 1)
      const name = readString(rawPlace.name, `PC-0${number}`)
      const rawZoneId = readString(rawPlace.zoneId)
      const rawZoneName = readString(rawPlace.zoneName)
      const inferred = resolveZoneCategoryAndDevice(rawZoneName || name, rawPlace.deviceType)

      const matchedZone =
        baseZonesMap.get(rawZoneId) ??
        allZonesList.find((z) => z.name.toLowerCase() === rawZoneName.toLowerCase()) ??
        allZonesList.find((z) => z.categoryKind === inferred.categoryKind)

      const categoryKind = matchedZone?.categoryKind ?? inferred.categoryKind
      const activeSession =
        typeof rawPlace.activeSession === 'object' && rawPlace.activeSession !== null
          ? (rawPlace.activeSession as Record<string, unknown>)
          : null
      const activeUsername = readString(activeSession?.username)
      const repairNote = activeRepairNoteByPlaceId.get(placeId)

      return {
        id: placeId,
        number,
        name,
        zoneId: matchedZone?.id ?? (rawZoneId || 'zone-1'),
        zoneName: matchedZone?.name ?? (rawZoneName || 'Standard Zone'),
        categoryKind,
        deviceType: matchedZone?.deviceType ?? inferred.deviceType,
        status: normalizePlaceStatus(rawPlace.status),
        specs: parseSpecs(rawPlace.specs, categoryKind),
        hourlyRate: readNumber(rawPlace.hourlyRate, matchedZone?.baseHourlyRate ?? 60),
        note: activeUsername ? `Гравець: ${activeUsername}` : repairNote,
      }
    })

    const zones: CatalogZoneDto[] = allZonesList.map((z) => {
      const zonePlaces = normalizedPlaces.filter((p) => p.zoneId === z.id)
      const hallMeta = ZONE_HALL_META[z.categoryKind]
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

    const tariffs: CatalogTariffDto[] = rawTariffs.map((t, index) => ({
      id: String(t.id ?? `tariff-${index + 1}`),
      name: readString(t.name, 'Тариф'),
      type: readString(t.type, 'HOURLY'),
      price: readNumber(t.price, 60),
      durationMinutes: typeof t.durationMinutes === 'number' ? t.durationMinutes : undefined,
      zoneId: readString(t.zoneId) || undefined,
      zoneName: readString(t.zoneName) || undefined,
    }))

    return {
      source: 'live-api',
      loadedAt,
      zones,
      places: normalizedPlaces,
      tariffs,
    }
  } catch {
    const fallbackPlaces: CatalogPlaceDto[] = FALLBACK_ZONES.flatMap((z) =>
      buildFallbackPlacesForZone(z),
    )

    const fallbackZones: CatalogZoneDto[] = FALLBACK_ZONES.map((z) => {
      const zonePlaces = fallbackPlaces.filter((p) => p.zoneId === z.id)
      const hallMeta = ZONE_HALL_META[z.categoryKind]
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
  const storedBookings = await fetchClientBookings().catch(() => [])
  const confirmedClientBookings: ActiveBookingDto[] = storedBookings
    .filter((b) => b.status === 'CONFIRMED')
    .map((b) => ({
      id: b.id,
      computerName: b.computerName,
      zoneName: b.zoneName,
      tariffName: b.tariffName,
      startTime: b.startTime,
      endTime: b.endTime,
      prepaidAmount: b.isPaidOnline ? b.prepaidAmount : b.totalAmount,
      status: b.status,
      qrCode: b.qrCode,
    }))

  try {
    const [settingsRes, sessionRes, bookingsRes, notificationsRes] = await Promise.all([
      requestOpenApi<PublicClubSettingsDto>('/settings/public').catch(
        () => OPENAPI_FALLBACK_SETTINGS,
      ),
      requestOpenApi<Record<string, unknown>>('/sessions/my-active').catch(() => null),
      requestOpenApi<Array<Record<string, unknown>>>('/bookings/my').catch(() => []),
      requestOpenApi<Record<string, unknown>>('/notifications').catch(() => null),
    ])

    const activeSession: ActiveSessionDto | null =
      sessionRes && typeof sessionRes.id === 'string'
        ? {
            id: sessionRes.id,
            computerName: readString(sessionRes.computerName, 'VIP-01'),
            zoneName: readString(sessionRes.zoneName, 'VIP OLED 240Hz'),
            tariffName: readString(sessionRes.tariffName, '1 Година VIP'),
            startTime: readString(sessionRes.startTime, new Date().toISOString()),
            durationMinutes: readNumber(sessionRes.durationMinutes, 45),
            currentCost: readNumber(sessionRes.currentCost, 82.5),
            remainingMinutes: readNumber(sessionRes.remainingMinutes, 15),
            status: readString(sessionRes.status, 'ACTIVE'),
          }
        : null

    const apiBookings: ActiveBookingDto[] = Array.isArray(bookingsRes)
      ? bookingsRes.map((b, idx) => ({
          id: String(b.id ?? `book-${idx + 1}`),
          computerName: readString(b.computerName, 'PC-01'),
          zoneName: readString(b.zoneName, 'Standard Zone'),
          tariffName: readString(b.tariffName, 'Пакет 3+1'),
          startTime: readString(b.startTime, '2026-10-25T18:00:00.000Z'),
          endTime: readString(b.endTime, '2026-10-25T21:00:00.000Z'),
          prepaidAmount: readNumber(b.prepaidAmount, 130),
          status: readString(b.status, 'CONFIRMED'),
          qrCode: readString(b.qrCode) || undefined,
        }))
      : []

    const activeBookings: ActiveBookingDto[] = [
      ...confirmedClientBookings,
      ...apiBookings.filter(
        (apiB) => !confirmedClientBookings.some((cb) => cb.id === apiB.id),
      ),
    ]

    const rawItems =
      notificationsRes && Array.isArray(notificationsRes.items)
        ? (notificationsRes.items as Array<Record<string, unknown>>)
        : []

    const notifications: ClubNotificationDto[] = rawItems.map((n, idx) => ({
      id: String(n.id ?? `notif-${idx + 1}`),
      type: readString(n.type, 'INFO'),
      title: readString(n.title, 'Сповіщення клубу'),
      message: readString(n.message),
      isRead: Boolean(n.isRead),
      createdAt: readString(n.createdAt, new Date().toISOString()),
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
