import type {
  BookingDurationPreset,
  BookingDurationPresetId,
  BookingExtraCatalogItem,
  ClientBookingRecord,
  CreateClientBookingInput,
  RescheduleClientBookingInput,
} from '../types/booking'
import { requestOpenApi } from './openapiClient'

const BOOKINGS_STORAGE_KEY = 'obsidian_client_bookings_v4'
const TWO_HOURS_MS = 2 * 60 * 60 * 1000
export const HOLD_DURATION_SECONDS = 10 * 60

export const BOOKING_DURATION_PRESETS: Record<
  BookingDurationPresetId,
  BookingDurationPreset
> = {
  '1h': {
    id: '1h',
    occupiedHours: 1,
    billableHours: 1,
    isPackage3Plus1: false,
    labelUk: '1 година',
    labelEn: '1 hour',
    badgeUk: 'Оплата за 1 год',
    badgeEn: 'Pay for 1 hr',
  },
  '2h': {
    id: '2h',
    occupiedHours: 2,
    billableHours: 2,
    isPackage3Plus1: false,
    labelUk: '2 години',
    labelEn: '2 hours',
    badgeUk: 'Оплата за 2 год',
    badgeEn: 'Pay for 2 hrs',
  },
  '3h': {
    id: '3h',
    occupiedHours: 3,
    billableHours: 3,
    isPackage3Plus1: false,
    labelUk: '3 години',
    labelEn: '3 hours',
    badgeUk: 'Оплата за 3 год',
    badgeEn: 'Pay for 3 hrs',
  },
  '3plus1': {
    id: '3plus1',
    occupiedHours: 4,
    billableHours: 3,
    isPackage3Plus1: true,
    labelUk: 'Пакет 3+1 (4 години)',
    labelEn: '3+1 Package (4 hours)',
    badgeUk: 'Зайнято 4 год • До сплати 3 год',
    badgeEn: 'Occupied 4 hrs • Pay for 3 hrs',
  },
}

export const BOOKING_EXTRAS_CATALOG: BookingExtraCatalogItem[] = [
  {
    id: 'extra-drink',
    category: 'DRINK',
    nameUk: 'Напої (Coca-Cola 0.5л / Monster Energy)',
    nameEn: 'Drinks (Coca-Cola 0.5L / Monster Energy)',
    descriptionUk: 'Охолоджений напій із холодильника бару до вашого місця',
    descriptionEn: 'Chilled drink from the bar delivered to your station',
    price: 45,
  },
  {
    id: 'extra-snack',
    category: 'SNACK',
    nameUk: 'Снеки (Клаб-сендвіч / Начос із сирним соусом)',
    nameEn: 'Snacks (Club Sandwich / Nachos with Cheese Dip)',
    descriptionUk: 'Гарячий снек-сет для перекусу під час сесії',
    descriptionEn: 'Hot snack set prepared for your gaming session',
    price: 120,
  },
  {
    id: 'extra-gamepad',
    category: 'GAMEPAD',
    nameUk: 'Другий геймпад Sony DualSense',
    nameEn: 'Second Sony DualSense Controller',
    descriptionUk: 'Додатковий бездротовий контролер для кооперативної гри',
    descriptionEn: 'Extra wireless controller for local co-op matches',
    price: 80,
  },
  {
    id: 'extra-vr-operator',
    category: 'VR_OPERATOR',
    nameUk: 'Супровід VR-оператора',
    nameEn: 'Dedicated VR Operator Assistance',
    descriptionUk: 'Інструктаж, налаштування шолома та супровід у VR-room',
    descriptionEn: 'Setup, safety briefing, and live assistance in the VR-room',
    price: 150,
  },
]

// Захист від паралельних запитів на одне й те саме місце в межах клієнта
const inFlightSeatLocks = new Set<string>()

function readStoredBookings(): ClientBookingRecord[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as ClientBookingRecord[]) : []
  } catch {
    return []
  }
}

function writeStoredBookings(records: ClientBookingRecord[]): void {
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(records))
  } catch {
    // Ігноруємо помилки доступу до localStorage
  }
}

export function canModifyBookingByTwoHourRule(
  startTimeIso: string,
  nowMs = Date.now(),
): { allowed: boolean; minutesUntilStart: number } {
  const startMs = new Date(startTimeIso).getTime()
  const diffMs = startMs - nowMs
  const minutesUntilStart = Math.round(diffMs / 60000)
  return {
    allowed: diffMs >= TWO_HOURS_MS,
    minutesUntilStart,
  }
}

function hasTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const a0 = new Date(startA).getTime()
  const a1 = new Date(endA).getTime()
  const b0 = new Date(startB).getTime()
  const b1 = new Date(endB).getTime()
  return a0 < b1 && b0 < a1
}

export function calculateBookingPriceBreakdown(params: {
  hourlyRate: number
  seatCount: number
  durationPresetId: BookingDurationPresetId
  extras: Array<{ price: number; quantity: number }>
}): {
  occupiedHours: number
  billableHours: number
  isPackage3Plus1: boolean
  seatsCost: number
  extrasCost: number
  totalAmount: number
} {
  const preset = BOOKING_DURATION_PRESETS[params.durationPresetId]
  const seatsCost = params.hourlyRate * preset.billableHours * Math.max(1, params.seatCount)
  const extrasCost = params.extras.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  return {
    occupiedHours: preset.occupiedHours,
    billableHours: preset.billableHours,
    isPackage3Plus1: preset.isPackage3Plus1,
    seatsCost,
    extrasCost,
    totalAmount: seatsCost + extrasCost,
  }
}

export function buildStartAndEndIso(
  dateYmd: string,
  startTimeHm: string,
  occupiedHours: number,
): { startTime: string; endTime: string } {
  const startDate = new Date(`${dateYmd}T${startTimeHm}:00`)
  const validStart = Number.isNaN(startDate.getTime())
    ? new Date(Date.now() + 3 * 3600 * 1000)
    : startDate
  const endDate = new Date(validStart.getTime() + occupiedHours * 3600 * 1000)
  return {
    startTime: validStart.toISOString(),
    endTime: endDate.toISOString(),
  }
}

export async function fetchClientBookings(): Promise<ClientBookingRecord[]> {
  const localRecords = readStoredBookings()

  try {
    const apiList = await requestOpenApi<Array<Record<string, unknown>>>('/bookings/my')
    if (!Array.isArray(apiList)) {
      return localRecords
    }

    const mappedFromApi: ClientBookingRecord[] = apiList.map((item, idx) => {
      const id = String(item.id ?? `book-api-${idx + 1}`)
      const existingLocal = localRecords.find((r) => r.id === id)
      if (existingLocal) {
        return {
          ...existingLocal,
          status:
            typeof item.status === 'string'
              ? (item.status as ClientBookingRecord['status'])
              : existingLocal.status,
        }
      }

      const defaultFutureStart = new Date(Date.now() + 4 * 3600 * 1000)
      const defaultFutureEnd = new Date(defaultFutureStart.getTime() + 4 * 3600 * 1000)
      const rawStart = typeof item.startTime === 'string' ? item.startTime : ''
      const parsedStart = new Date(rawStart)
      const useFutureDemoSlot =
        !rawStart || Number.isNaN(parsedStart.getTime()) || parsedStart.getTime() < Date.now()

      const startTime = useFutureDemoSlot
        ? defaultFutureStart.toISOString()
        : parsedStart.toISOString()
      const endTime = useFutureDemoSlot
        ? defaultFutureEnd.toISOString()
        : typeof item.endTime === 'string'
          ? item.endTime
          : defaultFutureEnd.toISOString()

      const computerName =
        typeof item.computerName === 'string' ? item.computerName : 'PC-01'
      const zoneName =
        typeof item.zoneName === 'string' ? item.zoneName : 'Standard Zone'
      const prepaidAmount = Number(item.prepaidAmount ?? 180)

      return {
        id,
        deviceType: 'PC',
        zoneId: 'zone-1-standard',
        zoneName,
        categoryKind: 'Standard',
        placeIds: ['comp-1'],
        placeNames: [computerName],
        computerName,
        tariffId: 'tariff-2',
        tariffName:
          typeof item.tariffName === 'string'
            ? item.tariffName
            : 'Пакет 3+1 (4 години)',
        startTime,
        endTime,
        occupiedHours: 4,
        billableHours: 3,
        isPackage3Plus1: true,
        extras: [],
        seatsCost: prepaidAmount,
        extrasCost: 0,
        totalAmount: prepaidAmount,
        prepaidAmount,
        paymentTiming: 'FULL_ONLINE',
        paymentMethod: 'баланс',
        isPaidOnline: true,
        status:
          typeof item.status === 'string'
            ? (item.status as ClientBookingRecord['status'])
            : 'CONFIRMED',
        qrCode:
          typeof item.qrCode === 'string'
            ? item.qrCode
            : `OBSIDIAN-BOOKING:${id}:${computerName}`,
        createdAt: new Date().toISOString(),
      }
    })

    const merged = [
      ...localRecords,
      ...mappedFromApi.filter((apiRec) => !localRecords.some((l) => l.id === apiRec.id)),
    ]
    writeStoredBookings(merged)
    return merged
  } catch {
    return localRecords
  }
}

export async function createClientBooking(
  input: CreateClientBookingInput,
): Promise<ClientBookingRecord> {
  if (input.placeIds.length === 0) {
    throw new Error('Оберіть хоча б одне вільне місце для бронювання.')
  }

  const breakdown = calculateBookingPriceBreakdown({
    hourlyRate: input.hourlyRate,
    seatCount: input.placeIds.length,
    durationPresetId: input.durationPresetId,
    extras: input.extras,
  })

  const { startTime, endTime } = buildStartAndEndIso(
    input.date,
    input.startTimeHm,
    breakdown.occupiedHours,
  )

  // Перевірка паралельних запитів (in-flight lock) та перетину слотів для тих самих місць
  const lockKeys = input.placeNames.map((name) => `${name}:${startTime}:${endTime}`)
  for (const key of lockKeys) {
    if (inFlightSeatLocks.has(key)) {
      throw new Error(
        'Конфлікт бронювання: паралельний запит на це місце вже обробляється.',
      )
    }
  }

  const existingBookings = readStoredBookings().filter((b) => b.status === 'CONFIRMED')
  const conflictingBooking = existingBookings.find(
    (b) =>
      b.placeNames.some((pName) => input.placeNames.includes(pName)) &&
      hasTimeOverlap(startTime, endTime, b.startTime, b.endTime),
  )

  if (conflictingBooking) {
    throw new Error(
      `Конфлікт бронювання: місце ${conflictingBooking.computerName} вже заброньоване на обраний інтервал часу.`,
    )
  }

  for (const key of lockKeys) {
    inFlightSeatLocks.add(key)
  }

  try {
    const isPaidOnline = input.paymentTiming === 'FULL_ONLINE'
    const prepaidAmount = isPaidOnline ? breakdown.totalAmount : 0
    const combinedComputerName = input.placeNames.join(', ')
    const preset = BOOKING_DURATION_PRESETS[input.durationPresetId]
    const resolvedTariffId =
      input.tariffId ?? (preset.isPackage3Plus1 ? 'tariff-2' : 'tariff-1')
    const resolvedTariffName =
      input.tariffName ??
      (preset.isPackage3Plus1
        ? 'Пакет 3+1 (4 години за ціною 3)'
        : `${preset.occupiedHours} год • ${input.zoneName}`)

    const holdExpiresAt = new Date(
      Date.now() + HOLD_DURATION_SECONDS * 1000,
    ).toISOString()

    let apiBookingId = `book-${Date.now().toString(36)}`
    let apiQrCode = `OBSIDIAN-BOOKING:${apiBookingId}:${input.placeNames[0]}:${input.phone ?? '+380993334455'}`

    try {
      const apiRes = await requestOpenApi<Record<string, unknown>>('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          computerId: input.placeIds[0],
          placeId: input.placeIds[0],
          adjacentPlaceIds: input.placeIds.slice(1),
          tariffId: resolvedTariffId,
          startTime,
          endTime,
          isPackage3Plus1: breakdown.isPackage3Plus1,
          prepaidAmount,
          isPaidOnline,
          paymentMethod: input.paymentMethod,
          extras: input.extras.map((e) => ({
            name: e.name,
            price: e.price,
            quantity: e.quantity,
          })),
          notes: `Місця: ${combinedComputerName} | Тривалість: ${preset.labelUk} | Оплата: ${
            isPaidOnline ? 'Повністю онлайн' : 'На місці в клубі'
          }`,
        }),
      })

      if (typeof apiRes.id === 'string' && apiRes.id !== 'book-new') {
        apiBookingId = apiRes.id
      }
      if (typeof apiRes.qrCode === 'string' && apiRes.qrCode.trim().length > 0) {
        apiQrCode = apiRes.qrCode.trim()
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('409')) {
        throw new Error(
          'Конфлікт бронювання в БД: обране місце вже зайняте на цей час.',
          { cause: err },
        )
      }
      // Якщо ендпоінт вимагає авторизації в демо-режимі, зберігаємо бронь у клієнтському журналі
    }

    const newRecord: ClientBookingRecord = {
      id: apiBookingId,
      deviceType: input.deviceType,
      zoneId: input.zoneId,
      zoneName: input.zoneName,
      categoryKind: input.categoryKind,
      placeIds: input.placeIds,
      placeNames: input.placeNames,
      computerName: combinedComputerName,
      tariffId: resolvedTariffId,
      tariffName: resolvedTariffName,
      startTime,
      endTime,
      occupiedHours: breakdown.occupiedHours,
      billableHours: breakdown.billableHours,
      isPackage3Plus1: breakdown.isPackage3Plus1,
      extras: input.extras,
      seatsCost: breakdown.seatsCost,
      extrasCost: breakdown.extrasCost,
      totalAmount: breakdown.totalAmount,
      prepaidAmount,
      paymentTiming: input.paymentTiming,
      paymentMethod: input.paymentMethod,
      isPaidOnline,
      status: 'CONFIRMED',
      qrCode: apiQrCode,
      holdExpiresAt,
      createdAt: new Date().toISOString(),
    }

    const updatedList = [newRecord, ...readStoredBookings()]
    writeStoredBookings(updatedList)
    return newRecord
  } finally {
    for (const key of lockKeys) {
      inFlightSeatLocks.delete(key)
    }
  }
}

export async function cancelClientBooking(
  bookingId: string,
): Promise<ClientBookingRecord> {
  const records = readStoredBookings()
  const target = records.find((b) => b.id === bookingId)
  if (!target) {
    throw new Error('Бронювання не знайдено.')
  }

  const ruleCheck = canModifyBookingByTwoHourRule(target.startTime)
  if (!ruleCheck.allowed) {
    throw new Error(
      'Скасування відхилено за правилом 2 годин: скасувати бронь можна лише якщо до старту залишилося не менше 2 годин.',
    )
  }

  try {
    await requestOpenApi(`/bookings/${encodeURIComponent(bookingId)}/cancel`, {
      method: 'POST',
    })
  } catch {
    // Синхронізуємо статус у клієнтському стані
  }

  const updatedRecord: ClientBookingRecord = {
    ...target,
    status: 'CANCELLED',
  }
  const updatedList = records.map((b) => (b.id === bookingId ? updatedRecord : b))
  writeStoredBookings(updatedList)
  return updatedRecord
}

export async function rescheduleClientBooking(
  input: RescheduleClientBookingInput,
): Promise<ClientBookingRecord> {
  const records = readStoredBookings()
  const target = records.find((b) => b.id === input.bookingId)
  if (!target) {
    throw new Error('Бронювання не знайдено.')
  }

  const currentRuleCheck = canModifyBookingByTwoHourRule(target.startTime)
  if (!currentRuleCheck.allowed) {
    throw new Error(
      'Перенесення відхилено за правилом 2 годин: перенести бронь можна лише якщо до поточного старту залишилося не менше 2 годин.',
    )
  }

  const { startTime: newStartTime, endTime: newEndTime } = buildStartAndEndIso(
    input.newDate,
    input.newStartTimeHm,
    target.occupiedHours,
  )

  const newSlotRuleCheck = canModifyBookingByTwoHourRule(newStartTime)
  if (!newSlotRuleCheck.allowed) {
    throw new Error(
      'Новий час старту має бути не раніше ніж через 2 години від поточного моменту.',
    )
  }

  const conflict = records.find(
    (b) =>
      b.id !== target.id &&
      b.status === 'CONFIRMED' &&
      b.placeNames.some((pName) => target.placeNames.includes(pName)) &&
      hasTimeOverlap(newStartTime, newEndTime, b.startTime, b.endTime),
  )

  if (conflict) {
    throw new Error(
      `Конфлікт часу: місце ${conflict.computerName} вже заброньоване на обраний новий час.`,
    )
  }

  try {
    await requestOpenApi(`/bookings/${encodeURIComponent(input.bookingId)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        startTime: newStartTime,
        endTime: newEndTime,
      }),
    })
  } catch {
    // Оновлюємо локальний запис броні
  }

  const updatedRecord: ClientBookingRecord = {
    ...target,
    startTime: newStartTime,
    endTime: newEndTime,
  }
  const updatedList = records.map((b) =>
    b.id === input.bookingId ? updatedRecord : b,
  )
  writeStoredBookings(updatedList)
  return updatedRecord
}
