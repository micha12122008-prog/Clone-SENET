import type {
  ApiEnvelope,
  HealthResponseDto,
  OpenApiSkeletonState,
  PublicClubSettingsDto,
  TariffStubDto,
  ZoneStubDto,
} from '../types/openapi'

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000/api'
const AUTH_TOKEN_STORAGE_KEY = 'obsidian_client_jwt_token'

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
    } else {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    }
  } catch {
    // Ігноруємо помилки доступу до сховища в ізольованих середовищах
  }
}

/**
 * Fallback-дані скелета OpenAPI (збігаються з контрактами backend/src/modules/* Тижня 1)
 */
export const OPENAPI_FALLBACK_HEALTH: HealthResponseDto = {
  status: 'ok',
  service: 'SENET Clone Backend API',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
}

export const OPENAPI_FALLBACK_SETTINGS: PublicClubSettingsDto = {
  clubName: 'OBSIDIAN PC CLUB',
  address: 'м. Київ, вул. Вадима Гетьмана, 1-Б',
  phone: '+380445550199',
  email: 'arena@senet-clone.local',
  workingHours: '24/7 (цілодобово)',
  currency: 'UAH',
  availablePcsCount: 11,
}

export const OPENAPI_FALLBACK_ZONES: ZoneStubDto[] = [
  {
    id: 'zone-1',
    name: 'Standard Zone',
    description: 'Збалансовані ПК для геймінгу',
    baseHourlyRate: 50,
    colorHex: '#3B82F6',
    isActive: true,
    totalComputers: 6,
    availableComputers: 5,
  },
  {
    id: 'zone-2',
    name: 'VIP RTX 4090',
    description: 'Максимальна продуктивність 240Hz',
    baseHourlyRate: 90,
    colorHex: '#8B5CF6',
    isActive: true,
    totalComputers: 4,
    availableComputers: 4,
  },
  {
    id: 'zone-3',
    name: 'Bootcamp 5x5',
    description: 'Окрема кімната для команд',
    baseHourlyRate: 75,
    colorHex: '#10B981',
    isActive: true,
    totalComputers: 2,
    availableComputers: 2,
  },
]

export const OPENAPI_FALLBACK_TARIFFS: TariffStubDto[] = [
  {
    id: 'tariff-1',
    name: '1 Година Standard',
    type: 'HOURLY',
    price: 50,
    zoneName: 'Standard Zone',
    isActive: true,
  },
  {
    id: 'tariff-2',
    name: 'Пакет 3+1 (4 год за ціною 3)',
    type: 'PACKAGE',
    price: 150,
    durationMinutes: 240,
    zoneName: 'Standard Zone',
    isActive: true,
  },
  {
    id: 'tariff-3',
    name: '5 Годин Пакет',
    type: 'PACKAGE',
    price: 200,
    durationMinutes: 300,
    isActive: true,
  },
  {
    id: 'tariff-4',
    name: 'Ніч у Клубі (22:00 - 08:00)',
    type: 'NIGHT',
    price: 280,
    durationMinutes: 600,
    startTime: '22:00',
    endTime: '08:00',
    isActive: true,
  },
]

function isEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'success' in payload &&
    'data' in payload
  )
}

export async function requestOpenApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    })

    if (!response.ok) {
      let errorDetail = `Помилка HTTP ${response.status}`
      try {
        const errJson = (await response.json()) as Record<string, unknown>
        if (Array.isArray(errJson.messages) && errJson.messages.length > 0) {
          errorDetail = errJson.messages.map(String).join('; ')
        } else if (typeof errJson.message === 'string') {
          errorDetail = errJson.message
        }
      } catch {
        // Залишаємо код помилки HTTP
      }
      throw new Error(errorDetail)
    }

    const json: unknown = await response.json()
    if (isEnvelope<T>(json)) {
      return json.data
    }
    return json as T
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function fetchOpenApiSkeleton(): Promise<OpenApiSkeletonState> {
  try {
    const [health, settings, zones, tariffs] = await Promise.all([
      requestOpenApi<HealthResponseDto>('/health'),
      requestOpenApi<PublicClubSettingsDto>('/settings/public'),
      requestOpenApi<ZoneStubDto[]>('/zones'),
      requestOpenApi<TariffStubDto[]>('/tariffs'),
    ])

    return {
      source: 'live-api',
      baseUrl: API_BASE_URL,
      health,
      settings,
      zones,
      tariffs,
      loadedAt: new Date().toLocaleTimeString('uk-UA'),
    }
  } catch {
    return {
      source: 'openapi-stub',
      baseUrl: API_BASE_URL,
      health: {
        ...OPENAPI_FALLBACK_HEALTH,
        timestamp: new Date().toISOString(),
      },
      settings: OPENAPI_FALLBACK_SETTINGS,
      zones: OPENAPI_FALLBACK_ZONES,
      tariffs: OPENAPI_FALLBACK_TARIFFS,
      loadedAt: new Date().toLocaleTimeString('uk-UA'),
    }
  }
}
