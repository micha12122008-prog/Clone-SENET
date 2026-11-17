import type { PlaceStatus, PublicClubSettingsDto } from './openapi'

export type DeviceCategory = 'PC' | 'PS' | 'VR'

export type ZoneCategoryKind =
  | 'Standard'
  | 'VIP'
  | 'Bootcamp'
  | 'PS-зона'
  | 'VR-room'

export interface PlaceSpecsDto {
  cpu?: string
  gpu?: string
  ram?: string
  display?: string
  peripherals?: string
}

export interface CatalogPlaceDto {
  id: string
  number: number
  name: string
  zoneId: string
  zoneName: string
  categoryKind: ZoneCategoryKind
  deviceType: DeviceCategory
  status: PlaceStatus
  specs: PlaceSpecsDto
  hourlyRate: number
  note?: string
}

export interface CatalogZoneDto {
  id: string
  name: string
  categoryKind: ZoneCategoryKind
  deviceType: DeviceCategory
  description: string
  baseHourlyRate: number
  colorHex: string
  hallPhotoLabel: string
  hallPhotoCaption: string
  totalPlaces: number
  freePlaces: number
  busyPlaces: number
  bookedPlaces: number
  maintenancePlaces: number
}

export interface CatalogTariffDto {
  id: string
  name: string
  type: string
  price: number
  durationMinutes?: number
  zoneId?: string
  zoneName?: string
}

export interface ActiveSessionDto {
  id: string
  computerName: string
  zoneName: string
  tariffName: string
  startTime: string
  durationMinutes: number
  currentCost: number
  remainingMinutes: number
  status: string
}

export interface ActiveBookingDto {
  id: string
  computerName: string
  zoneName: string
  tariffName?: string
  startTime: string
  endTime: string
  prepaidAmount: number
  status: string
  qrCode?: string
}

export interface ClubNotificationDto {
  id: string
  type?: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface HomeDashboardData {
  source: 'live-api' | 'openapi-stub'
  loadedAt: string
  clubSettings: PublicClubSettingsDto
  activeSession: ActiveSessionDto | null
  activeBookings: ActiveBookingDto[]
  notifications: ClubNotificationDto[]
  unreadCount: number
}

export interface CatalogSnapshotData {
  source: 'live-api' | 'openapi-stub'
  loadedAt: string
  zones: CatalogZoneDto[]
  places: CatalogPlaceDto[]
  tariffs: CatalogTariffDto[]
}
