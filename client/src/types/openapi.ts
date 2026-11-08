/**
 * Типи та фіксовані enum зі скелета OpenAPI (Тиждень 1).
 * Enum не перейменовуються протягом усього проєкту згідно з docs/тиждень-01.md.
 */

export const PLACE_STATUSES = ['вільно', 'зайнято', 'бронь', 'ремонт'] as const
export type PlaceStatus = (typeof PLACE_STATUSES)[number]

export const PAYMENT_METHODS = ['готівка', 'картка', 'баланс'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const ORDER_STATUSES = ['new', 'preparing', 'issued'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const TOURNAMENT_STATUSES = ['реєстрація', 'live', 'завершено'] as const
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number]

export interface ApiEnvelope<T> {
  success: boolean
  statusCode: number
  data: T
  timestamp: string
}

export interface HealthResponseDto {
  status: string
  service: string
  version: string
  timestamp: string
}

export interface PublicClubSettingsDto {
  clubName: string
  address: string
  phone: string
  email: string
  workingHours: string
  currency: string
  availablePcsCount: number
}

export interface ZoneStubDto {
  id: string
  name: string
  description: string
  baseHourlyRate: number
  colorHex: string
  isActive: boolean
  totalComputers: number
  availableComputers: number
}

export interface TariffStubDto {
  id: string
  name: string
  type: 'HOURLY' | 'PACKAGE' | 'NIGHT'
  price: number
  durationMinutes?: number
  zoneName?: string
  startTime?: string
  endTime?: string
  isActive: boolean
}

export interface OpenApiSkeletonState {
  source: 'live-api' | 'openapi-stub'
  baseUrl: string
  health: HealthResponseDto
  settings: PublicClubSettingsDto
  zones: ZoneStubDto[]
  tariffs: TariffStubDto[]
  loadedAt: string
}

