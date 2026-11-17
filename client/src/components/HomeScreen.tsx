import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchHomeDashboardData,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/clubClientApi'
import { localizeDynamicText } from '../i18n/localizeDynamicText'
import type { ShellLocale } from '../i18n/shellLabels'
import type { AuthSession } from '../types/auth'
import type { HomeDashboardData } from '../types/catalog'

interface HomeScreenProps {
  locale?: ShellLocale
  session: AuthSession | null
  onNavigateCatalog: () => void
  onNavigateCabinet: () => void
  onNavigateLogin: () => void
  onNavigateRegister: () => void
}

function buildQrMatrix(seedText: string): boolean[][] {
  const size = 21
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  )

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4
        grid[r0 + r][c0 + c] = isBorder || isInner
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(0, size - 7)
  drawFinder(size - 7, 0)

  let hash = 2166136261
  for (let i = 0; i < seedText.length; i += 1) {
    hash ^= seedText.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const inTopLeft = r < 8 && c < 8
      const inTopRight = r < 8 && c >= size - 8
      const inBottomLeft = r >= size - 8 && c < 8
      if (inTopLeft || inTopRight || inBottomLeft) {
        continue
      }
      if (r === 6 || c === 6) {
        grid[r][c] = (r + c) % 2 === 0
        continue
      }
      const mix = Math.imul(hash ^ (r * 31 + c * 17), 2654435761) >>> 0
      grid[r][c] = (mix & 3) === 0 || (mix & 5) === 1
    }
  }

  return grid
}

const HOME_TEXT = {
  uk: {
    aria: 'Головна сторінка клієнта OBSIDIAN PC CLUB',
    badge: 'Тиждень 3 • Головна клієнта',
    clubSlogan: 'Кіберспортивна арена 24/7 • Станції PC, PS5 та VR',
    navHome: 'Головна',
    navCatalog: 'Каталог зон і місць →',
    navProfile: 'Кабінет гравця',
    navLogin: 'Увійти',
    navRegister: 'Реєстрація',
    refreshBtn: 'Оновити з API',
    refreshingBtn: 'Оновлення...',
    apiReadAt: 'Зчитано з API о',
    qrSectionTitle: 'QR-код користувача',
    qrSectionSubtitle: 'Покажіть цей QR-код адміністратору на ресепшені для швидкого чек-іну та старту сесії',
    qrTokenLabel: 'Токен чек-іну',
    copyQrBtn: 'Скопіювати QR-токен',
    copiedQrBtn: 'Скопійовано ✓',
    guestNote: 'Демо-профіль гостя (увійдіть у свій акаунт для персонального токена)',
    balanceLabel: 'Баланс',
    currencyUnit: 'грн',
    minutesUnit: 'хв',
    demoFirstName: 'Олександр',
    activityTitle: 'Активна сесія або бронь',
    activitySubtitle: 'Поточний стан вашого ігрового місця з API',
    tabSession: 'Активна сесія',
    tabBooking: 'Активна бронь',
    stationLabel: 'Станція / Місце',
    zoneLabel: 'Ігрова зона',
    tariffLabel: 'Тарифний план',
    remainingLabel: 'Залишилось часу',
    durationLabel: 'Тривалість',
    costLabel: 'Поточна вартість',
    prepaidLabel: 'Передплата',
    timeSlotLabel: 'Час бронювання',
    statusActive: 'АКТИВНА СЕСІЯ',
    statusBooked: 'ПІДТВЕРДЖЕНА БРОНЬ',
    noActiveSession: 'Зараз немає активної сесії. Оберіть зону в каталозі.',
    noActiveBooking: 'Немає активних бронювань на найближчий час.',
    openCatalogCta: 'Перейти до каталогу зон і місць →',
    notificationsTitle: 'Сповіщення клубу',
    notificationsSubtitle: 'Внутрішні повідомлення про баланс, бронювання та акції',
    unreadBadge: (n: number) => `Непрочитаних: ${n}`,
    markAllReadBtn: 'Прочитати всі',
    markReadBtn: 'Прочитано',
    readBadge: 'Прочитано',
    newBadge: 'Нове',
    emptyNotifications: 'Сповіщень поки немає.',
    rulesTitle: 'Правила клубу OBSIDIAN PC CLUB',
    rulesSubtitle: 'Основні положення відвідування, бронювання та користування обладнанням',
    rulesList: [
      {
        title: '1. Чек-ін та ідентифікація за QR-кодом',
        desc: 'Посадка за ігрове місце здійснюється через сканування персонального QR-коду клієнта або за номером телефону на стійці адміністратора.',
      },
      {
        title: '2. Бронювання та правило 2 годин',
        desc: 'Скасування або перенесення броні можливе лише якщо до початку сесії залишилося не менше 2 годин. Утримання місця під час оформлення триває 10 хвилин.',
      },
      {
        title: '3. Пакет 3+1 та тарифікація',
        desc: 'Пакет 3+1 оформлюється як єдина бронь: місце закріплюється на 4 години, а до сплати нараховується вартість 3 годин.',
      },
      {
        title: '4. Оплата та єдиний баланс',
        desc: 'Підтримується готівка в касі, позначка оплати карткою та списання з внутрішнього балансу гравця.',
      },
      {
        title: '5. Дбайливе ставлення до обладнання',
        desc: 'У разі несправності клавіатури, миші, монітора чи гарнітури зверніться до адміністратора — вас безкоштовно пересадять на вільне місце без втрати оплаченого часу.',
      },
    ],
  },
  en: {
    aria: 'OBSIDIAN PC CLUB Client Home Screen',
    badge: 'Week 3 • Client Home',
    clubSlogan: '24/7 Esports Arena • PC, PS5 & VR Stations',
    navHome: 'Home',
    navCatalog: 'Zones & Seats Catalog →',
    navProfile: 'Player Cabinet',
    navLogin: 'Sign In',
    navRegister: 'Register',
    refreshBtn: 'Refresh from API',
    refreshingBtn: 'Refreshing...',
    apiReadAt: 'Read from API at',
    qrSectionTitle: 'User QR Code',
    qrSectionSubtitle: 'Show this QR code at the reception desk for instant check-in and session launch',
    qrTokenLabel: 'Check-in Token',
    copyQrBtn: 'Copy QR Token',
    copiedQrBtn: 'Copied ✓',
    guestNote: 'Demo guest profile (sign in for your personal token)',
    balanceLabel: 'Balance',
    currencyUnit: 'UAH',
    minutesUnit: 'min',
    demoFirstName: 'Oleksandr',
    activityTitle: 'Active Session or Booking',
    activitySubtitle: 'Live status of your gaming station from the API',
    tabSession: 'Active Session',
    tabBooking: 'Active Booking',
    stationLabel: 'Station / Seat',
    zoneLabel: 'Gaming Zone',
    tariffLabel: 'Tariff Plan',
    remainingLabel: 'Time Remaining',
    durationLabel: 'Duration',
    costLabel: 'Current Cost',
    prepaidLabel: 'Prepaid Amount',
    timeSlotLabel: 'Booking Window',
    statusActive: 'ACTIVE SESSION',
    statusBooked: 'CONFIRMED BOOKING',
    noActiveSession: 'No active session right now. Choose a zone in the catalog.',
    noActiveBooking: 'No upcoming active bookings found.',
    openCatalogCta: 'Open Zones & Seats Catalog →',
    notificationsTitle: 'Club Notifications',
    notificationsSubtitle: 'In-app alerts about balance, bookings, and club events',
    unreadBadge: (n: number) => `Unread: ${n}`,
    markAllReadBtn: 'Mark all read',
    markReadBtn: 'Mark read',
    readBadge: 'Read',
    newBadge: 'New',
    emptyNotifications: 'No notifications yet.',
    rulesTitle: 'OBSIDIAN PC CLUB Rules',
    rulesSubtitle: 'Core terms for club visits, bookings, and hardware usage',
    rulesList: [
      {
        title: '1. QR Code Check-in & Identification',
        desc: 'Check-in at the gaming station is performed by scanning your personal QR code or by phone number at the reception desk.',
      },
      {
        title: '2. Bookings & 2-Hour Cancellation Rule',
        desc: 'Canceling or rescheduling a booking is allowed only when at least 2 hours remain before start time. Seat hold lasts 10 minutes.',
      },
      {
        title: '3. 3+1 Package & Pricing',
        desc: 'The 3+1 package is a single booking: the seat is reserved for 4 hours while you pay for only 3 hours.',
      },
      {
        title: '4. Payments & Unified Balance',
        desc: 'Cash at the desk, card payment mark, and direct deduction from your player balance are supported.',
      },
      {
        title: '5. Hardware Care & Instant Relocation',
        desc: 'If any peripheral needs maintenance, notify the admin to be relocated to a free station immediately without losing remaining time.',
      },
    ],
  },
} as const

export function HomeScreen({
  locale = 'uk',
  session,
  onNavigateCatalog,
  onNavigateCabinet,
  onNavigateLogin,
  onNavigateRegister,
}: HomeScreenProps) {
  const t = HOME_TEXT[locale]
  const [data, setData] = useState<HomeDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'session' | 'booking'>('session')
  const [copiedQr, setCopiedQr] = useState<boolean>(false)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    const snapshot = await fetchHomeDashboardData()
    setData(snapshot)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true
    fetchHomeDashboardData().then((snapshot) => {
      if (mounted) {
        setData(snapshot)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const currentUser = session?.user ?? {
    id: 'usr-s1mple-demo',
    username: 's1mple_pro',
    firstName: t.demoFirstName,
    phone: '+380993334455',
    email: 'player1@gmail.com',
    role: 'CLIENT' as const,
    balance: 450,
  }

  const qrToken = useMemo(() => {
    const cleanUser = currentUser.username || currentUser.firstName || 'player'
    const cleanPhone = currentUser.phone || '+380993334455'
    return `OBSIDIAN-QR:${currentUser.id}:${cleanUser}:${cleanPhone}`
  }, [currentUser.firstName, currentUser.id, currentUser.phone, currentUser.username])

  const qrMatrix = useMemo(() => buildQrMatrix(qrToken), [qrToken])

  const handleCopyQr = async () => {
    try {
      await navigator.clipboard.writeText(qrToken)
    } catch {
      // Fallback if clipboard API is restricted
    }
    setCopiedQr(true)
    window.setTimeout(() => setCopiedQr(false), 2000)
  }

  const handleMarkOneRead = async (id: string) => {
    await markNotificationAsRead(id)
    setData((prev) => {
      if (!prev) return prev
      const updated = prev.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      )
      return {
        ...prev,
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      }
    })
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead()
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }
    })
  }

  const primaryBooking = data?.activeBookings[0] ?? null

  return (
    <section aria-label={t.aria} className="mx-auto flex w-full flex-col gap-6 py-3 sm:py-5">
      {/* Блок 1: Логотип клубу + внутрішня навігація Головної */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-violet-950/30 p-5 shadow-2xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-500/40 bg-violet-600/20 font-mono text-xl font-black tracking-tighter text-violet-300 shadow-lg shadow-violet-600/20">
              OB
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                  {t.badge}
                </span>
                {data && (
                  <span className="text-xs text-zinc-400">
                    {t.apiReadAt} <strong className="text-zinc-200">{data.loadedAt}</strong>
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {data?.clubSettings.clubName ?? 'OBSIDIAN PC CLUB'}
              </h1>
              <p className="text-xs text-zinc-400 sm:text-sm">
                {t.clubSlogan} •{' '}
                {localizeDynamicText(
                  data?.clubSettings.address ?? 'м. Київ, вул. Вадима Гетьмана, 1-Б',
                  locale,
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onNavigateCatalog}
              className="cursor-pointer rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500"
            >
              {t.navCatalog}
            </button>

            {session ? (
              <button
                type="button"
                onClick={onNavigateCabinet}
                className="cursor-pointer rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              >
                {t.navProfile} ({currentUser.username})
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
                >
                  {t.navLogin}
                </button>
                <button
                  type="button"
                  onClick={onNavigateRegister}
                  className="cursor-pointer rounded-xl border border-violet-500/40 bg-violet-500/10 px-3.5 py-2.5 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20"
                >
                  {t.navRegister}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={loadDashboard}
              disabled={isLoading}
              className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:opacity-50"
            >
              {isLoading ? t.refreshingBtn : t.refreshBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Середній ряд: Активна сесія/бронь + QR користувача */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Блок 2: Активна бронь або сесія з API */}
        <div className="flex flex-col justify-between rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">{t.activityTitle}</h2>
                <p className="text-xs text-zinc-400">{t.activitySubtitle}</p>
              </div>

              <div className="flex rounded-xl border border-zinc-800 bg-zinc-950 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('session')}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === 'session'
                      ? 'bg-violet-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.tabSession}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('booking')}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === 'booking'
                      ? 'bg-violet-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.tabBooking}
                </button>
              </div>
            </div>

            {activeTab === 'session' ? (
              data?.activeSession ? (
                <div className="mt-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <span className="text-xs font-bold tracking-wider text-emerald-300 uppercase">
                        {t.statusActive}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-emerald-200">
                      ID: {data.activeSession.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5">
                      <div className="text-[11px] text-zinc-400">{t.stationLabel}</div>
                      <div className="mt-1 font-mono text-lg font-extrabold text-white">
                        {data.activeSession.computerName}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5">
                      <div className="text-[11px] text-zinc-400">{t.zoneLabel}</div>
                      <div className="mt-1 text-sm font-bold text-violet-300">
                        {localizeDynamicText(data.activeSession.zoneName, locale)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5">
                      <div className="text-[11px] text-zinc-400">{t.tariffLabel}</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-200">
                        {localizeDynamicText(data.activeSession.tariffName, locale)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5">
                      <div className="text-[11px] text-zinc-400">{t.durationLabel}</div>
                      <div className="mt-1 font-mono text-base font-bold text-white">
                        {data.activeSession.durationMinutes} {t.minutesUnit}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5">
                      <div className="text-[11px] text-zinc-400">{t.remainingLabel}</div>
                      <div className="mt-1 font-mono text-base font-bold text-amber-300">
                        {data.activeSession.remainingMinutes} {t.minutesUnit}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5">
                      <div className="text-[11px] text-zinc-400">{t.costLabel}</div>
                      <div className="mt-1 font-mono text-base font-extrabold text-emerald-400">
                        {data.activeSession.currentCost} {t.currencyUnit}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-sm text-zinc-400">
                  {t.noActiveSession}
                </div>
              )
            ) : primaryBooking ? (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                    <span className="text-xs font-bold tracking-wider text-violet-300 uppercase">
                      {t.statusBooked} ({primaryBooking.status})
                    </span>
                  </div>
                  <span className="font-mono text-xs text-violet-200">
                    ID: {primaryBooking.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5">
                    <div className="text-[11px] text-zinc-400">{t.stationLabel}</div>
                    <div className="mt-1 font-mono text-lg font-extrabold text-white">
                      {primaryBooking.computerName}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5">
                    <div className="text-[11px] text-zinc-400">{t.zoneLabel}</div>
                    <div className="mt-1 text-sm font-bold text-violet-300">
                      {localizeDynamicText(primaryBooking.zoneName, locale)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5">
                    <div className="text-[11px] text-zinc-400">{t.prepaidLabel}</div>
                    <div className="mt-1 font-mono text-base font-extrabold text-emerald-400">
                      {primaryBooking.prepaidAmount} {t.currencyUnit}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5">
                    <div className="text-[11px] text-zinc-400">{t.timeSlotLabel}</div>
                    <div className="mt-1 text-xs font-semibold text-zinc-200">
                      {new Date(primaryBooking.startTime).toLocaleTimeString('uk-UA', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      –{' '}
                      {new Date(primaryBooking.endTime).toLocaleTimeString('uk-UA', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-sm text-zinc-400">
                {t.noActiveBooking}
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onNavigateCatalog}
              className="w-full cursor-pointer rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-3 text-xs font-bold text-violet-300 transition hover:bg-violet-500/20"
            >
              {t.openCatalogCta}
            </button>
          </div>
        </div>

        {/* Блок 3: QR користувача (видимий на головній) */}
        <div className="flex flex-col justify-between rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl lg:col-span-5">
          <div>
            <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">{t.qrSectionTitle}</h2>
                <p className="mt-0.5 text-xs text-zinc-400">{t.qrSectionSubtitle}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-right">
                <div className="text-[10px] text-zinc-400">{t.balanceLabel}</div>
                <div className="font-mono text-sm font-extrabold text-emerald-400">
                  {currentUser.balance ?? 450} {t.currencyUnit}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row">
              <div
                aria-label="User QR Code SVG"
                className="shrink-0 rounded-2xl border-2 border-violet-500/40 bg-white p-3 shadow-lg"
              >
                <svg
                  viewBox="0 0 21 21"
                  className="h-36 w-36"
                  shapeRendering="crispEdges"
                  role="img"
                  aria-label={`QR ${currentUser.username}`}
                >
                  {qrMatrix.map((row, rIdx) =>
                    row.map((cell, cIdx) =>
                      cell ? (
                        <rect
                          key={`${rIdx}-${cIdx}`}
                          x={cIdx}
                          y={rIdx}
                          width={1}
                          height={1}
                          fill="#09090b"
                        />
                      ) : null,
                    ),
                  )}
                </svg>
              </div>

              <div className="w-full space-y-2.5 text-left">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <div className="text-xs font-bold text-white">
                    {currentUser.username}
                    {currentUser.firstName ? ` (${currentUser.firstName})` : ''}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-400">{currentUser.phone}</div>
                  {!session && (
                    <div className="mt-1.5 text-[11px] text-amber-300">{t.guestNote}</div>
                  )}
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <div className="text-[11px] text-zinc-400">{t.qrTokenLabel}</div>
                  <div className="mt-1 break-all font-mono text-xs text-violet-300">
                    {qrToken}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyQr}
                  className="w-full cursor-pointer rounded-xl bg-zinc-800 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
                >
                  {copiedQr ? t.copiedQrBtn : t.copyQrBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Нижній ряд: Сповіщення + Правила клубу */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Блок 4: Сповіщення з API */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white sm:text-xl">
                {t.notificationsTitle}
              </h2>
              <p className="text-xs text-zinc-400">{t.notificationsSubtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                {t.unreadBadge(data?.unreadCount ?? 0)}
              </span>
              {(data?.unreadCount ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700"
                >
                  {t.markAllReadBtn}
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {data && data.notifications.length > 0 ? (
              data.notifications.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 transition ${
                    item.isRead
                      ? 'border-zinc-800/80 bg-zinc-950/60'
                      : 'border-violet-500/40 bg-violet-500/10'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          item.isRead
                            ? 'bg-zinc-800 text-zinc-400'
                            : 'bg-violet-600 text-white'
                        }`}
                      >
                        {item.isRead ? t.readBadge : t.newBadge}
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        {localizeDynamicText(item.title, locale)}
                      </h3>
                    </div>

                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkOneRead(item.id)}
                        className="cursor-pointer rounded-lg border border-violet-400/40 bg-violet-500/20 px-2.5 py-1 text-[11px] font-semibold text-violet-200 transition hover:bg-violet-500/30"
                      >
                        {t.markReadBtn}
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
                    {localizeDynamicText(item.message, locale)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-sm text-zinc-400">
                {t.emptyNotifications}
              </div>
            )}
          </div>
        </div>

        {/* Блок 5: Правила клубу */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl lg:col-span-6">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-bold text-white sm:text-xl">{t.rulesTitle}</h2>
            <p className="text-xs text-zinc-400">{t.rulesSubtitle}</p>
          </div>

          <ul className="mt-4 space-y-3">
            {t.rulesList.map((rule) => (
              <li
                key={rule.title}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5"
              >
                <div className="text-xs font-bold text-violet-300">{rule.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-300">{rule.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
