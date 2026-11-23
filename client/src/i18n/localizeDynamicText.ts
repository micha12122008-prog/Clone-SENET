import type {
  PaymentMethod,
  PlaceStatus,
  TournamentStatus,
} from '../types/openapi'
import type { ShellLocale } from './shellLabels'

const PLACE_STATUS_EN: Record<PlaceStatus, string> = {
  вільно: 'free',
  зайнято: 'busy',
  бронь: 'booked',
  ремонт: 'maintenance',
}

const PAYMENT_METHOD_EN: Record<PaymentMethod, string> = {
  готівка: 'cash',
  картка: 'card',
  баланс: 'balance',
}

const TOURNAMENT_STATUS_EN: Record<TournamentStatus, string> = {
  реєстрація: 'registration',
  live: 'live',
  завершено: 'completed',
}

const EXACT_PHRASE_EN: Record<string, string> = {
  // Назви та описи зон
  'Ігрова зона': 'Gaming Zone',
  'PS-зона (PlayStation 5 Lounge)': 'PS-zone (PlayStation 5 Lounge)',
  'Збалансовані ПК для геймінгу': 'Balanced gaming PCs',
  'Збалансовані ПК для геймінгу в CS2, Dota 2 та Valorant':
    'Balanced gaming PCs for CS2, Dota 2 & Valorant',
  'Збалансовані ігрові ПК для рейтингового геймінгу в CS2, Dota 2, Valorant':
    'Balanced gaming PCs for ranked play in CS2, Dota 2, Valorant',
  'Максимальна продуктивність 240Hz': 'Maximum 240Hz performance',
  'RTX 4090, 240Hz OLED дисплеї, анатомічні крісла, шумоізоляція':
    'RTX 4090, 240Hz OLED displays, ergonomic chairs, soundproofing',
  'RTX 4090, 240Hz OLED дисплеї, преміальні анатомічні крісла':
    'RTX 4090, 240Hz OLED displays, premium ergonomic chairs',
  'Максимальна продуктивність RTX 4090, 240Hz OLED дисплеї та преміум-крісла':
    'Maximum RTX 4090 performance, 240Hz OLED displays & premium chairs',
  'Окрема кімната для команд': 'Private room for teams',
  'Ізольована звукоізольована кімната для турнірних команд':
    'Isolated soundproof room for tournament teams',
  'Окрема командна кімната на 5 гравців для тренувань і турнірних праків':
    'Private 5v5 team room for practice and tournament scrims',
  'Sony PlayStation 5, 4K TV 65", дивани, DualSense геймпади, FIFA 24 / UFC':
    'Sony PlayStation 5, 65" 4K TV, sofas, DualSense controllers, FIFA 24 / UFC',
  'Консолі PS5, 4K OLED 65", дивани, DualSense геймпади, EA FC 24, UFC 5':
    'PS5 consoles, 65" 4K OLED, sofas, DualSense controllers, EA FC 24, UFC 5',
  'Консольна лаунж-зона з 4K TV 65", диванами та FIFA / UFC / Mortal Kombat':
    'Console lounge zone with 65" 4K TV, sofas & FIFA / UFC / Mortal Kombat',
  'VR-станція HTC Vive Focus / Meta Quest 3, трекінг рухів усього тіла':
    'HTC Vive Focus / Meta Quest 3 VR station, full-body motion tracking',
  'Кімната віртуальної реальності з вільним переміщенням та шоломами Quest 3 / Index':
    'Room-scale virtual reality arena with Quest 3 / Valve Index headsets',

  // Підписи заглушок фото залу
  'Основний зал Standard Arena • Кіберспортивний простір':
    'Standard Arena Main Hall • Esports Space',
  'GeForce RTX 4060 Ti • 24.5" ZOWIE 144Hz/240Hz • Механічні клавіатури':
    'GeForce RTX 4060 Ti • 24.5" ZOWIE 144Hz/240Hz • Mechanical Keyboards',
  'Зал VIP OLED 240Hz • Шумоізольовані бокси':
    'VIP OLED 240Hz Hall • Soundproof Booths',
  'GeForce RTX 4090 • 27" OLED 240Hz • Анатомічні крісла Secretlab':
    'GeForce RTX 4090 • 27" OLED 240Hz • Secretlab Ergonomic Chairs',
  'Зал Bootcamp 5×5 • Командна кімната': 'Bootcamp 5×5 Hall • Team Room',
  '5 турнірних станцій у ряд • Тактична дошка • Ізольований голосовий зв’язок':
    '5 tournament stations in a row • Tactical board • Isolated voice comms',
  'Зал PlayStation 5 Lounge • Консольна лаунж-зона':
    'PlayStation 5 Lounge Hall • Console Lounge Zone',
  'Sony PS5 Pro • 65" 4K OLED TV • М’які дивани та 4 геймпади DualSense':
    'Sony PS5 Pro • 65" 4K OLED TV • Cozy sofas & 4 DualSense controllers',
  'Зал VR-room Arena • Простір вільного руху 360°':
    'VR-room Arena Hall • 360° Free-Roam Space',
  'Meta Quest 3 / Valve Index • Кабель-менеджмент зі стелі • Кооперативні VR-ігри':
    'Meta Quest 3 / Valve Index • Ceiling cable management • Co-op VR games',

  // Тарифи
  Тариф: 'Tariff',
  '1 Година Standard': '1 Hour Standard',
  '1 Година VIP': '1 Hour VIP',
  'VIP 1 Година OLED 240Hz': 'VIP 1 Hour OLED 240Hz',
  '3 Години Пакет': '3 Hours Package',
  '3 Години Пакет Standard': '3 Hours Standard Package',
  '5 Годин Пакет': '5 Hours Package',
  'Ніч у Клубі (22:00 - 08:00)': 'Night Pass (22:00 - 08:00)',
  'Пакет 3+1': '3+1 Package',
  'Пакет 3+1 (4 год за ціною 3)': '3+1 Package (4 hrs for price of 3)',
  'Пакет 3+1 (4 години за ціною 3)': '3+1 Package (4 hours for price of 3)',
  'Пакет 3+1 (4 години)': '3+1 Package (4 hours)',

  // Нотатки місць та характеристики
  'Room-scale 4×4 м': 'Room-scale 4×4 m',
  'Заміна клавіатури Logitech G Pro': 'Logitech G Pro keyboard replacement',
  'Бронь на 18:00': 'Booked for 18:00',
  'Командна бронь 5×5': '5×5 Team Booking',
  'Активна гра EA FC 25': 'Active game: EA FC 25',
  'Бронь Half-Life: Alyx': 'Booked: Half-Life: Alyx',

  // Налаштування клубу (адреса, графік)
  'м. Київ, вул. Вадима Гетьмана, 1-Б': 'Kyiv, 1-B Vadyma Hetmana St.',
  '24/7 (цілодобово)': '24/7 (Open 24/7)',

  // Сповіщення з API
  'Сповіщення клубу': 'Club Notification',
  'Увага! Низький баланс': 'Warning! Low Balance',
  'До закінчення оплаченого часу на PC-02 залишилося 10 хвилин. Поповніть баланс, щоб продовжити гру.':
    '10 minutes of paid time remaining on PC-02. Top up your balance to continue playing.',
  'Баланс поповнено': 'Balance Topped Up',
  'Рахунок успішно поповнено на 500.00 грн.':
    'Your account has been topped up by 500.00 UAH.',
  'Ласкаво просимо до Obsidian!': 'Welcome to Obsidian!',
  'Вам нараховано 80 бонусних балів на перший візит.':
    'You received 80 bonus points for your first visit.',
}

const PREFIX_PHRASE_EN: Array<{ ukPrefix: string; enPrefix: string }> = [
  { ukPrefix: 'Гравець: ', enPrefix: 'Player: ' },
  { ukPrefix: 'Сесія: ', enPrefix: 'Session: ' },
]

export function localizePlaceStatus(
  status: PlaceStatus,
  locale: ShellLocale,
): string {
  return locale === 'en' ? (PLACE_STATUS_EN[status] ?? status) : status
}

export function localizePaymentMethod(
  method: PaymentMethod,
  locale: ShellLocale,
): string {
  return locale === 'en' ? (PAYMENT_METHOD_EN[method] ?? method) : method
}

export function localizeTournamentStatus(
  status: TournamentStatus,
  locale: ShellLocale,
): string {
  return locale === 'en' ? (TOURNAMENT_STATUS_EN[status] ?? status) : status
}

export function localizeDynamicText(
  text: string | undefined,
  locale: ShellLocale,
): string {
  if (!text || locale !== 'en') {
    return text ?? ''
  }

  const trimmed = text.trim()
  const exactMatch = EXACT_PHRASE_EN[trimmed]
  if (exactMatch) {
    return exactMatch
  }

  const prefixRule = PREFIX_PHRASE_EN.find((rule) =>
    trimmed.startsWith(rule.ukPrefix),
  )
  return prefixRule
    ? `${prefixRule.enPrefix}${trimmed.slice(prefixRule.ukPrefix.length)}`
    : text
}
