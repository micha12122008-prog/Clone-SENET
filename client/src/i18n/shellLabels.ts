/**
 * Перемикач мови оболонки (Shell Language Switcher).
 * Згідно з правилами продукту (docs/ГРУПА.md та docs/тиждень-01.md):
 * - Основні тексти інтерфейсу завжди українські.
 * - Перемикач мови перекладає ЛИШЕ підписи оболонки (навігація шапки, статус-бар, футер).
 */

export type ShellLocale = 'uk' | 'en'

export interface ShellLabels {
  appBadge: string
  navSplash: string
  navOnboarding: string
  navLogin: string
  navRegister: string
  navCabinet: string
  navApiContract: string
  langSwitchHint: string
  apiStatusLabel: string
  apiConnected: string
  apiStubFallback: string
  swaggerDocsLabel: string
  workingHoursLabel: string
  freePlacesLabel: string
  refreshApiButton: string
  footerShellNote: string
  weekBadge: string
}

export const SHELL_LABELS: Record<ShellLocale, ShellLabels> = {
  uk: {
    appBadge: 'Клієнтська оболонка',
    navSplash: 'Заставка',
    navOnboarding: 'Онбординг',
    navLogin: 'Вхід',
    navRegister: 'Реєстрація',
    navCabinet: 'Профіль (Токен)',
    navApiContract: 'Скелет OpenAPI',
    langSwitchHint: 'Підписи оболонки',
    apiStatusLabel: 'Контракт API',
    apiConnected: 'Сервер OpenAPI активний',
    apiStubFallback: 'Заглушка скелета OpenAPI',
    swaggerDocsLabel: 'Swagger UI',
    workingHoursLabel: 'Режим',
    freePlacesLabel: 'Вільні ПК',
    refreshApiButton: 'Оновити API',
    footerShellNote: 'Оболонка клієнта OBSIDIAN PC CLUB • Тексти інтерфейсу українською',
    weekBadge: 'Тиждень 2 • Реєстрація та вхід',
  },
  en: {
    appBadge: 'Client Shell',
    navSplash: 'Splash',
    navOnboarding: 'Onboarding',
    navLogin: 'Sign In',
    navRegister: 'Sign Up',
    navCabinet: 'Profile (Token)',
    navApiContract: 'OpenAPI Skeleton',
    langSwitchHint: 'Shell labels only',
    apiStatusLabel: 'API Contract',
    apiConnected: 'OpenAPI Server Live',
    apiStubFallback: 'OpenAPI Skeleton Stub',
    swaggerDocsLabel: 'Swagger UI',
    workingHoursLabel: 'Hours',
    freePlacesLabel: 'Free PCs',
    refreshApiButton: 'Refresh API',
    footerShellNote: 'OBSIDIAN PC CLUB Client Shell • Interface content in Ukrainian',
    weekBadge: 'Week 2 • Auth & OTP',
  },
}
