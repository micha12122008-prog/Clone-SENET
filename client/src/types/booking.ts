import type { DeviceCategory, ZoneCategoryKind } from './catalog'
import type { PaymentMethod } from './openapi'

export type BookingDurationPresetId = '1h' | '2h' | '3h' | '3plus1'

export interface BookingDurationPreset {
  id: BookingDurationPresetId
  occupiedHours: number
  billableHours: number
  isPackage3Plus1: boolean
  labelUk: string
  labelEn: string
  badgeUk: string
  badgeEn: string
}

export type BookingExtraCategory = 'DRINK' | 'SNACK' | 'GAMEPAD' | 'VR_OPERATOR'

export interface BookingExtraCatalogItem {
  id: string
  category: BookingExtraCategory
  nameUk: string
  nameEn: string
  descriptionUk: string
  descriptionEn: string
  price: number
}

export interface SelectedBookingExtraDto {
  extraId: string
  name: string
  price: number
  quantity: number
}

export type BookingPaymentTiming = 'FULL_ONLINE' | 'ON_SITE'

export type ClientBookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export interface ClientBookingRecord {
  id: string
  deviceType: DeviceCategory
  zoneId: string
  zoneName: string
  categoryKind: ZoneCategoryKind
  placeIds: string[]
  placeNames: string[]
  computerName: string
  tariffId: string
  tariffName: string
  startTime: string
  endTime: string
  occupiedHours: number
  billableHours: number
  isPackage3Plus1: boolean
  extras: SelectedBookingExtraDto[]
  seatsCost: number
  extrasCost: number
  totalAmount: number
  prepaidAmount: number
  paymentTiming: BookingPaymentTiming
  paymentMethod: PaymentMethod
  isPaidOnline: boolean
  status: ClientBookingStatus
  qrCode: string
  holdExpiresAt?: string
  createdAt: string
}

export interface CreateClientBookingInput {
  deviceType: DeviceCategory
  zoneId: string
  zoneName: string
  categoryKind: ZoneCategoryKind
  placeIds: string[]
  placeNames: string[]
  hourlyRate: number
  tariffId?: string
  tariffName?: string
  date: string
  startTimeHm: string
  durationPresetId: BookingDurationPresetId
  extras: SelectedBookingExtraDto[]
  paymentTiming: BookingPaymentTiming
  paymentMethod: PaymentMethod
  username?: string
  phone?: string
}

export interface RescheduleClientBookingInput {
  bookingId: string
  newDate: string
  newStartTimeHm: string
}
