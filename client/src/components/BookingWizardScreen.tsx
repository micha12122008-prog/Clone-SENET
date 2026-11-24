import { useEffect, useMemo, useState } from 'react'
import {
  BOOKING_DURATION_PRESETS,
  BOOKING_EXTRAS_CATALOG,
  HOLD_DURATION_SECONDS,
  calculateBookingPriceBreakdown,
  canModifyBookingByTwoHourRule,
  cancelClientBooking,
  createClientBooking,
  fetchClientBookings,
  rescheduleClientBooking,
} from '../api/bookingsApi'
import { fetchCatalogSnapshot } from '../api/clubClientApi'
import {
  localizeDynamicText,
  localizePaymentMethod,
  localizePlaceStatus,
} from '../i18n/localizeDynamicText'
import type { ShellLocale } from '../i18n/shellLabels'
import type { AuthSession } from '../types/auth'
import type {
  BookingDurationPresetId,
  BookingPaymentTiming,
  ClientBookingRecord,
  SelectedBookingExtraDto,
} from '../types/booking'
import type {
  CatalogPlaceDto,
  CatalogSnapshotData,
  DeviceCategory,
  ZoneCategoryKind,
} from '../types/catalog'
import type { PaymentMethod } from '../types/openapi'
import { generateScannableQrMatrix } from '../utils/qrCodeGenerator'

interface BookingWizardScreenProps {
  locale?: ShellLocale
  session: AuthSession | null
  initialZoneId?: string | null
  initialPlaceId?: string | null
  onBackToHome: () => void
  onOpenCatalog: () => void
}

const DEVICE_TYPES: DeviceCategory[] = ['PC', 'PS', 'VR']
const DURATION_IDS: BookingDurationPresetId[] = ['1h', '2h', '3h', '3plus1']
const QUICK_TIMES = ['14:00', '16:00', '18:00', '20:00', '22:00']

function getTomorrowYmd(): string {
  const d = new Date(Date.now() + 24 * 3600 * 1000)
  return d.toISOString().slice(0, 10)
}

function getTodayYmd(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatHoldTimer(seconds: number): string {
  const safe = Math.max(0, seconds)
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const WIZARD_TEXT = {
  uk: {
    aria: 'Майстер бронювання місця OBSIDIAN PC CLUB',
    badge: 'Тиждень 4 • Майстер бронювання (Live API)',
    title: 'Майстер бронювання ігрового місця',
    subtitle:
      'Оберіть тип і зону, дату, час і тривалість (включно з пакетом 3+1), основне та сусідні місця для команди, допи та спосіб оплати.',
    backHomeBtn: '← На головну',
    catalogBtn: 'Каталог зон',
    holdTimerTitle: 'Утримання обраних місць (10 хвилин)',
    holdTimerActiveDesc:
      'Місце тимчасово утримується за вами. Завершіть підтвердження до закінчення таймера.',
    holdTimerIdleDesc: 'Оберіть вільне місце на кроці 3, щоб активувати 10-хвилинне утримання.',
    holdTimerExpiredAlert:
      'Час утримання (10 хвилин) вичерпано — місце автоматично звільнено. Оберіть місце знову.',
    simulateHoldExpireBtn: 'Тест: сплив 10 хв',
    resetHoldBtn: 'Оновити 10:00',
    steps: [
      '1. Тип і зона',
      '2. Дата, час і 3+1',
      '3. Місце і сусідні',
      '4. Допи',
      '5. Підтвердження й оплата',
    ],
    step1Header: 'Крок 1. Оберіть тип пристрою та ігрову зону',
    step2Header: 'Крок 2. Оберіть дату, час старту та тривалість (1 / 2 / 3 год або 3+1)',
    dateLabel: 'Дата візиту',
    startTimeLabel: 'Час початку',
    quickSlotsLabel: 'Швидкі слоти:',
    testUnder2hBtn: 'Слот за 1 год від зараз (тест правила 2 год)',
    durationLabel: 'Тривалість сесії та пакет 3+1',
    package3Plus1Note:
      'Пакет 3+1 — це одна бронь: ігрове місце закріплюється на 4 години, а до сплати рахується лише 3 години (окремого гаманця годин немає).',
    step3Header: 'Крок 3. Оберіть місце та сусідні місця для команди',
    step3Hint:
      'Натисніть на вільне місце, щоб обрати або скасувати вибір. Ви можете обрати кілька сусідніх місць для гри командою.',
    addAdjacentBtn: '+ Додати сусіднє вільне місце поруч',
    clearSeatsBtn: 'Очистити вибір місць',
    selectedSeatsLabel: 'Обрані місця:',
    noSeatsSelected: 'Ще не обрано жодного місця',
    step4Header: 'Крок 4. Додаткові послуги до броні (допи)',
    step4Hint: 'Напої, снеки, другий геймпад або супровід VR-оператора',
    step5Header: 'Крок 5. Підтвердження та спосіб оплати',
    paymentTimingLabel: 'Коли сплачувати',
    payFullOnlineTitle: 'Оплата повністю (зараз)',
    payFullOnlineDesc: 'Списання повної суми з балансу або карткою онлайн',
    payOnSiteTitle: 'Оплата на місці (на ресепшені)',
    payOnSiteDesc: 'Оплата готівкою або карткою адміністратору перед стартом',
    paymentMethodLabel: 'Спосіб оплати (enum)',
    summaryZone: 'Зона та тип',
    summarySeats: 'Місця (основне + сусідні)',
    summaryWindow: 'Дата та час',
    summaryDuration: 'Тривалість',
    summarySeatsCost: 'Вартість місць',
    summaryExtrasCost: 'Вартість допів',
    summaryTotal: 'Разом до сплати',
    summaryPrepaid: 'До сплати зараз',
    prevStepBtn: '← Назад',
    nextStepBtn: 'Далі →',
    confirmBookingBtn: 'Підтвердити бронювання →',
    submittingBookingBtn: 'Створення броні...',
    myBookingsTitle: 'Мої бронювання (Скасування та Перенесення • Правило 2 годин)',
    myBookingsSubtitle:
      'Скасування та перенесення доступні лише якщо до початку броні залишилося не менше 2 годин.',
    noBookingsYet: 'У вас ще немає створених бронювань. Пройдіть майстер вище, щоб створити бронь.',
    statusConfirmed: 'ПІДТВЕРДЖЕНО',
    statusCancelled: 'СКАСОВАНО',
    paidOnlineBadge: 'Оплачено повністю',
    payOnSiteBadge: 'Оплата на місці',
    ruleAllowedBadge: '≥ 2 год до старту (зміни дозволені)',
    ruleLockedBadge: '< 2 год до старту (заблоковано правилом 2 год)',
    cancelBtn: 'Скасувати бронь',
    rescheduleBtn: 'Перенести час',
    applyRescheduleBtn: 'Зберегти новий час',
    closeRescheduleBtn: 'Закрити',
    copyQrTokenBtn: 'Скопіювати QR-токен для чек-іну',
    copiedQrTokenBtn: 'Скопійовано ✓',
    currencyUnit: 'грн',
    hoursShort: 'год',
  },
  en: {
    aria: 'OBSIDIAN PC CLUB Seat Booking Wizard',
    badge: 'Week 4 • Booking Wizard (Live API)',
    title: 'Gaming Station Booking Wizard',
    subtitle:
      'Select device type & zone, date, time & duration (including 3+1 package), main & adjacent team seats, extras, and payment option.',
    backHomeBtn: '← Back to Home',
    catalogBtn: 'Zones Catalog',
    holdTimerTitle: 'Selected Seats Hold Timer (10 minutes)',
    holdTimerActiveDesc:
      'Your selected seats are temporarily held. Complete confirmation before the timer expires.',
    holdTimerIdleDesc: 'Select a free seat in Step 3 to activate the 10-minute seat hold.',
    holdTimerExpiredAlert:
      'The 10-minute seat hold has expired — your seat was automatically released. Please select a seat again.',
    simulateHoldExpireBtn: 'Test: Expire 10m Hold',
    resetHoldBtn: 'Reset 10:00',
    steps: [
      '1. Type & Zone',
      '2. Date, Time & 3+1',
      '3. Seat & Adjacent',
      '4. Extras',
      '5. Confirm & Pay',
    ],
    step1Header: 'Step 1. Select Device Type & Gaming Zone',
    step2Header: 'Step 2. Select Date, Start Time & Duration (1 / 2 / 3 hrs or 3+1)',
    dateLabel: 'Visit Date',
    startTimeLabel: 'Start Time',
    quickSlotsLabel: 'Quick slots:',
    testUnder2hBtn: 'Slot 1 hr from now (test 2-hour rule)',
    durationLabel: 'Session Duration & 3+1 Package',
    package3Plus1Note:
      'The 3+1 package is a single booking: the seat is occupied for 4 hours while you only pay for 3 hours (no separate hours wallet).',
    step3Header: 'Step 3. Select Main Seat & Adjacent Team Seats',
    step3Hint:
      'Click any free seat to toggle selection. You can pick multiple adjacent seats for your team.',
    addAdjacentBtn: '+ Add Adjacent Free Seat Nearby',
    clearSeatsBtn: 'Clear Seat Selection',
    selectedSeatsLabel: 'Selected seats:',
    noSeatsSelected: 'No seats selected yet',
    step4Header: 'Step 4. Booking Extras (Add-ons)',
    step4Hint: 'Drinks, snacks, second DualSense controller, or VR operator assistance',
    step5Header: 'Step 5. Confirmation & Payment Option',
    paymentTimingLabel: 'When to Pay',
    payFullOnlineTitle: 'Pay in Full (Now)',
    payFullOnlineDesc: 'Deduct full amount from player balance or by card online',
    payOnSiteTitle: 'Pay on Site (At Reception)',
    payOnSiteDesc: 'Pay by cash or card at the reception desk upon arrival',
    paymentMethodLabel: 'Payment Method (enum)',
    summaryZone: 'Zone & Type',
    summarySeats: 'Seats (Main + Adjacent)',
    summaryWindow: 'Date & Time Window',
    summaryDuration: 'Duration',
    summarySeatsCost: 'Seats Cost',
    summaryExtrasCost: 'Extras Cost',
    summaryTotal: 'Total Amount',
    summaryPrepaid: 'Due Now',
    prevStepBtn: '← Previous',
    nextStepBtn: 'Next Step →',
    confirmBookingBtn: 'Confirm Booking →',
    submittingBookingBtn: 'Creating booking...',
    myBookingsTitle: 'My Bookings (Cancel & Reschedule • 2-Hour Rule)',
    myBookingsSubtitle:
      'Canceling or rescheduling is allowed only when at least 2 hours remain before start time.',
    noBookingsYet: 'You have no bookings yet. Complete the wizard above to create one.',
    statusConfirmed: 'CONFIRMED',
    statusCancelled: 'CANCELLED',
    paidOnlineBadge: 'Paid in Full',
    payOnSiteBadge: 'Pay on Site',
    ruleAllowedBadge: '≥ 2 hrs before start (changes allowed)',
    ruleLockedBadge: '< 2 hrs before start (locked by 2-hour rule)',
    cancelBtn: 'Cancel Booking',
    rescheduleBtn: 'Reschedule Time',
    applyRescheduleBtn: 'Save New Time',
    closeRescheduleBtn: 'Close',
    copyQrTokenBtn: 'Copy QR Token for Check-in',
    copiedQrTokenBtn: 'Copied ✓',
    currencyUnit: 'UAH',
    hoursShort: 'hrs',
  },
} as const

export function BookingWizardScreen({
  locale = 'uk',
  session,
  initialZoneId = null,
  initialPlaceId = null,
  onBackToHome,
  onOpenCatalog,
}: BookingWizardScreenProps) {
  const t = WIZARD_TEXT[locale]

  const [snapshot, setSnapshot] = useState<CatalogSnapshotData | null>(null)
  const [bookings, setBookings] = useState<ClientBookingRecord[]>([])
  const [step, setStep] = useState<number>(0)

  const [selectedDevice, setSelectedDevice] = useState<DeviceCategory>('PC')
  const [selectedZoneId, setSelectedZoneId] = useState<string>(initialZoneId ?? '')
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>(
    initialPlaceId ? [initialPlaceId] : [],
  )

  const [dateYmd, setDateYmd] = useState<string>(getTomorrowYmd)
  const [startTimeHm, setStartTimeHm] = useState<string>('18:00')
  const [durationPresetId, setDurationPresetId] =
    useState<BookingDurationPresetId>('3plus1')

  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({})
  const [paymentTiming, setPaymentTiming] =
    useState<BookingPaymentTiming>('FULL_ONLINE')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('баланс')

  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number>(HOLD_DURATION_SECONDS)
  const [isHoldActive, setIsHoldActive] = useState<boolean>(Boolean(initialPlaceId))

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [statusBanner, setStatusBanner] = useState<string | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  const [reschedulingId, setReschedulingId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState<string>(getTomorrowYmd)
  const [rescheduleTimeHm, setRescheduleTimeHm] = useState<string>('19:00')
  const [copiedBookingId, setCopiedBookingId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([fetchCatalogSnapshot(), fetchClientBookings()]).then(
      ([catalogData, myBookings]) => {
        if (!mounted) return
        setSnapshot(catalogData)
        setBookings(myBookings)

        if (catalogData.zones.length > 0) {
          const targetZone =
            (initialZoneId
              ? catalogData.zones.find((z) => z.id === initialZoneId)
              : undefined) ?? catalogData.zones[0]
          setSelectedZoneId(targetZone.id)
          setSelectedDevice(targetZone.deviceType)

          if (!initialPlaceId) {
            const firstFree = catalogData.places.find(
              (p) => p.zoneId === targetZone.id && p.status === 'вільно',
            )
            if (firstFree) {
              setSelectedPlaceIds([firstFree.id])
              setIsHoldActive(true)
              setHoldSecondsLeft(HOLD_DURATION_SECONDS)
            }
          }
        }
      },
    )
    return () => {
      mounted = false
    }
  }, [initialPlaceId, initialZoneId])

  // Живий 10-хвилинний таймер утримання обраного місця
  useEffect(() => {
    if (!isHoldActive || selectedPlaceIds.length === 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      setHoldSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsHoldActive(false)
          setSelectedPlaceIds([])
          setErrorBanner(t.holdTimerExpiredAlert)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [isHoldActive, selectedPlaceIds.length, t.holdTimerExpiredAlert])

  const activeZone = useMemo(() => {
    if (!snapshot) return null
    return (
      snapshot.zones.find((z) => z.id === selectedZoneId) ??
      snapshot.zones.find((z) => z.deviceType === selectedDevice) ??
      snapshot.zones[0] ??
      null
    )
  }, [selectedDevice, selectedZoneId, snapshot])

  const zonePlaces = useMemo(() => {
    if (!snapshot || !activeZone) return []
    return snapshot.places
      .filter(
        (p) => p.zoneId === activeZone.id || p.categoryKind === activeZone.categoryKind,
      )
      .sort((a, b) => a.number - b.number)
  }, [activeZone, snapshot])

  const selectedPlaces = useMemo(
    () => zonePlaces.filter((p) => selectedPlaceIds.includes(p.id)),
    [selectedPlaceIds, zonePlaces],
  )

  const selectedExtras: SelectedBookingExtraDto[] = useMemo(() => {
    return BOOKING_EXTRAS_CATALOG.filter((item) => (extraQuantities[item.id] ?? 0) > 0).map(
      (item) => ({
        extraId: item.id,
        name: locale === 'en' ? item.nameEn : item.nameUk,
        price: item.price,
        quantity: extraQuantities[item.id] ?? 0,
      }),
    )
  }, [extraQuantities, locale])

  const priceBreakdown = useMemo(() => {
    return calculateBookingPriceBreakdown({
      hourlyRate: activeZone?.baseHourlyRate ?? 60,
      seatCount: selectedPlaces.length || 1,
      durationPresetId,
      extras: selectedExtras,
    })
  }, [activeZone?.baseHourlyRate, durationPresetId, selectedExtras, selectedPlaces.length])

  const handleSelectDevice = (device: DeviceCategory) => {
    setSelectedDevice(device)
    const firstZone = snapshot?.zones.find((z) => z.deviceType === device)
    if (firstZone) {
      setSelectedZoneId(firstZone.id)
      const firstFree = snapshot?.places.find(
        (p) => p.zoneId === firstZone.id && p.status === 'вільно',
      )
      setSelectedPlaceIds(firstFree ? [firstFree.id] : [])
      setIsHoldActive(Boolean(firstFree))
      setHoldSecondsLeft(HOLD_DURATION_SECONDS)
    }
  }

  const handleSelectZone = (zoneId: string, device: DeviceCategory) => {
    setSelectedDevice(device)
    setSelectedZoneId(zoneId)
    const firstFree = snapshot?.places.find(
      (p) => p.zoneId === zoneId && p.status === 'вільно',
    )
    setSelectedPlaceIds(firstFree ? [firstFree.id] : [])
    setIsHoldActive(Boolean(firstFree))
    setHoldSecondsLeft(HOLD_DURATION_SECONDS)
  }

  const handleTogglePlace = (place: CatalogPlaceDto) => {
    if (place.status !== 'вільно') return
    setErrorBanner(null)

    setSelectedPlaceIds((prev) => {
      const exists = prev.includes(place.id)
      const next = exists ? prev.filter((id) => id !== place.id) : [...prev, place.id]
      if (next.length > 0) {
        setIsHoldActive(true)
        setHoldSecondsLeft(HOLD_DURATION_SECONDS)
      } else {
        setIsHoldActive(false)
      }
      return next
    })
  }

  const handleAddAdjacentPlace = () => {
    setErrorBanner(null)
    const freePlaces = zonePlaces.filter((p) => p.status === 'вільно')
    if (freePlaces.length === 0) return

    if (selectedPlaceIds.length === 0) {
      setSelectedPlaceIds([freePlaces[0].id])
      setIsHoldActive(true)
      setHoldSecondsLeft(HOLD_DURATION_SECONDS)
      return
    }

    const selectedNumbers = selectedPlaces.map((p) => p.number)
    const maxSelectedNum = Math.max(...selectedNumbers)
    const nextAdjacent =
      freePlaces.find(
        (p) => !selectedPlaceIds.includes(p.id) && p.number > maxSelectedNum,
      ) ?? freePlaces.find((p) => !selectedPlaceIds.includes(p.id))

    if (nextAdjacent) {
      setSelectedPlaceIds((prev) => [...prev, nextAdjacent.id])
      setIsHoldActive(true)
      setHoldSecondsLeft(HOLD_DURATION_SECONDS)
    }
  }

  const handleExpireHoldNow = () => {
    setIsHoldActive(false)
    setHoldSecondsLeft(0)
    setSelectedPlaceIds([])
    setErrorBanner(t.holdTimerExpiredAlert)
  }

  const handleChangeExtraQty = (extraId: string, delta: number) => {
    setExtraQuantities((prev) => {
      const current = prev[extraId] ?? 0
      const next = Math.max(0, Math.min(5, current + delta))
      return { ...prev, [extraId]: next }
    })
  }

  const handleSetSlotUnderTwoHours = () => {
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000)
    setDateYmd(getTodayYmd())
    setStartTimeHm(
      oneHourLater.toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    )
  }

  const handleConfirmBooking = async () => {
    setErrorBanner(null)
    setStatusBanner(null)

    if (!activeZone || selectedPlaces.length === 0) {
      setErrorBanner(t.noSeatsSelected)
      setStep(2)
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createClientBooking({
        deviceType: activeZone.deviceType,
        zoneId: activeZone.id,
        zoneName: activeZone.name,
        categoryKind: activeZone.categoryKind as ZoneCategoryKind,
        placeIds: selectedPlaces.map((p) => p.id),
        placeNames: selectedPlaces.map((p) => p.name),
        hourlyRate: activeZone.baseHourlyRate,
        date: dateYmd,
        startTimeHm,
        durationPresetId,
        extras: selectedExtras,
        paymentTiming,
        paymentMethod,
        username: session?.user.username ?? 's1mple_pro',
        phone: session?.user.phone ?? '+380993334455',
      })

      setBookings((prev) => [created, ...prev.filter((b) => b.id !== created.id)])
      setStatusBanner(
        locale === 'en'
          ? `Booking #${created.id} for ${created.computerName} confirmed!`
          : `Бронювання #${created.id} на місце ${created.computerName} успішно підтверджено!`,
      )
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Error creating booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    setErrorBanner(null)
    setStatusBanner(null)
    try {
      const cancelled = await cancelClientBooking(bookingId)
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? cancelled : b)))
      setStatusBanner(
        locale === 'en'
          ? `Booking #${bookingId} has been cancelled.`
          : `Бронювання #${bookingId} успішно скасовано.`,
      )
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Cancel error')
    }
  }

  const handleApplyReschedule = async (bookingId: string) => {
    setErrorBanner(null)
    setStatusBanner(null)
    try {
      const updated = await rescheduleClientBooking({
        bookingId,
        newDate: rescheduleDate,
        newStartTimeHm: rescheduleTimeHm,
      })
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)))
      setReschedulingId(null)
      setStatusBanner(
        locale === 'en'
          ? `Booking #${bookingId} rescheduled to ${rescheduleDate} ${rescheduleTimeHm}.`
          : `Бронювання #${bookingId} перенесено на ${rescheduleDate} о ${rescheduleTimeHm}.`,
      )
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Reschedule error')
    }
  }

  const handleCopyBookingQr = async (booking: ClientBookingRecord) => {
    try {
      await navigator.clipboard.writeText(booking.qrCode)
    } catch {
      // Ignore clipboard errors in isolated contexts
    }
    setCopiedBookingId(booking.id)
    window.setTimeout(() => setCopiedBookingId(null), 2000)
  }

  return (
    <section aria-label={t.aria} className="mx-auto flex w-full flex-col gap-6 py-3 sm:py-5">
      {/* Шапка майстра + Таймер утримання місця 10 хвилин */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-2xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
              {t.badge}
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">{t.title}</h1>
            <p className="mt-1 max-w-3xl text-xs text-zinc-400 sm:text-sm">{t.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
            >
              {t.backHomeBtn}
            </button>
            <button
              type="button"
              onClick={onOpenCatalog}
              className="cursor-pointer rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20"
            >
              {t.catalogBtn}
            </button>
          </div>
        </div>

        {/* Видимий таймер утримання місця на 10 хвилин */}
        <div
          className={`mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 ${
            isHoldActive && selectedPlaceIds.length > 0
              ? 'border-amber-500/40 bg-amber-500/10'
              : 'border-zinc-800 bg-zinc-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-20 items-center justify-center rounded-xl border border-amber-500/40 bg-zinc-950 font-mono text-lg font-black text-amber-300">
              {formatHoldTimer(holdSecondsLeft)}
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider text-amber-300 uppercase">
                {t.holdTimerTitle}
              </div>
              <div className="mt-0.5 text-xs text-zinc-300">
                {isHoldActive && selectedPlaceIds.length > 0
                  ? `${t.holdTimerActiveDesc} (${selectedPlaces.map((p) => p.name).join(', ')})`
                  : t.holdTimerIdleDesc}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsHoldActive(true)
                setHoldSecondsLeft(HOLD_DURATION_SECONDS)
                setErrorBanner(null)
              }}
              className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
            >
              {t.resetHoldBtn}
            </button>
            <button
              type="button"
              onClick={handleExpireHoldNow}
              className="cursor-pointer rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25"
            >
              {t.simulateHoldExpireBtn}
            </button>
          </div>
        </div>

        {/* Індикатор 5 кроків майстра */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {t.steps.map((label, idx) => {
            const isCurrent = step === idx
            const isDone = idx < step
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(idx)}
                className={`cursor-pointer rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition ${
                  isCurrent
                    ? 'border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-600/25'
                    : isDone
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Повідомлення про помилку або успіх */}
      {errorBanner && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-4 text-sm font-medium text-rose-200"
        >
          {errorBanner}
        </div>
      )}

      {statusBanner && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-200"
        >
          {statusBanner}
        </div>
      )}

      {/* Основна панель поточного кроку майстра */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl sm:p-8">
        {/* КРОК 1: Тип і зона */}
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white sm:text-xl">{t.step1Header}</h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {DEVICE_TYPES.map((dev) => {
                const isSelected = selectedDevice === dev
                return (
                  <button
                    key={dev}
                    type="button"
                    onClick={() => handleSelectDevice(dev)}
                    className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-violet-500 bg-violet-600/15 text-white'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-mono text-xl font-black">{dev}</div>
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot?.zones.map((zone) => {
                const isSelected = activeZone?.id === zone.id
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => handleSelectZone(zone.id, zone.deviceType)}
                    className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-violet-500 bg-violet-600/20 shadow-lg shadow-violet-600/10'
                        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        {localizeDynamicText(zone.name, locale)}
                      </span>
                      <span className="rounded-md bg-violet-500/20 px-2 py-0.5 font-mono text-xs font-bold text-violet-300">
                        {zone.baseHourlyRate} {t.currencyUnit}/{t.hoursShort}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-400">
                      {localizeDynamicText(zone.description, locale)}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* КРОК 2: Дата, час, тривалість 1/2/3 год та Пакет 3+1 */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white sm:text-xl">{t.step2Header}</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-300">
                  {t.dateLabel}
                </label>
                <input
                  type="date"
                  value={dateYmd}
                  onChange={(e) => setDateYmd(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300">
                  {t.startTimeLabel}
                </label>
                <input
                  type="time"
                  value={startTimeHm}
                  onChange={(e) => setStartTimeHm(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-400">{t.quickSlotsLabel}</span>
              {QUICK_TIMES.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setStartTimeHm(slot)}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 font-mono text-xs font-bold transition ${
                    startTimeHm === slot
                      ? 'border-violet-500 bg-violet-600 text-white'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {slot}
                </button>
              ))}
              <button
                type="button"
                onClick={handleSetSlotUnderTwoHours}
                className="cursor-pointer rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
              >
                {t.testUnder2hBtn}
              </button>
            </div>

            <div>
              <div className="text-xs font-semibold text-zinc-300">{t.durationLabel}</div>
              <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {DURATION_IDS.map((id) => {
                  const preset = BOOKING_DURATION_PRESETS[id]
                  const isSelected = durationPresetId === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDurationPresetId(id)}
                      className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? 'border-violet-500 bg-violet-600/20 shadow-lg shadow-violet-600/10'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-sm font-extrabold text-white">
                        {locale === 'en' ? preset.labelEn : preset.labelUk}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-emerald-400">
                        {locale === 'en' ? preset.badgeEn : preset.badgeUk}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
                {t.package3Plus1Note}
              </div>
            </div>
          </div>
        )}

        {/* КРОК 3: Місце та сусідні місця для команди */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">{t.step3Header}</h2>
                <p className="mt-0.5 text-xs text-zinc-400">{t.step3Hint}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAddAdjacentPlace}
                  className="cursor-pointer rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
                >
                  {t.addAdjacentBtn}
                </button>
                {selectedPlaceIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlaceIds([])
                      setIsHoldActive(false)
                    }}
                    className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-700"
                  >
                    {t.clearSeatsBtn}
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 text-xs">
              <span className="text-zinc-400">{t.selectedSeatsLabel} </span>
              {selectedPlaces.length > 0 ? (
                <strong className="font-mono text-sm text-emerald-400">
                  {selectedPlaces.map((p) => p.name).join(', ')} ({selectedPlaces.length})
                </strong>
              ) : (
                <span className="text-amber-300">{t.noSeatsSelected}</span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {zonePlaces.map((place) => {
                const isSelected = selectedPlaceIds.includes(place.id)
                const isFree = place.status === 'вільно'
                return (
                  <button
                    key={place.id}
                    type="button"
                    disabled={!isFree}
                    onClick={() => handleTogglePlace(place)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'cursor-pointer border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-600/15'
                        : isFree
                          ? 'cursor-pointer border-zinc-800 bg-zinc-950 hover:border-violet-500/50'
                          : 'cursor-not-allowed border-zinc-800/60 bg-zinc-950/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-extrabold text-white">
                        {place.name}
                      </span>
                      <span className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] font-bold text-zinc-200">
                        {localizePlaceStatus(place.status, locale)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-zinc-400">
                      #{place.number} • {place.specs.gpu ?? place.deviceType}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* КРОК 4: Допи (напої, снеки, другий геймпад, VR-оператор) */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white sm:text-xl">{t.step4Header}</h2>
              <p className="mt-0.5 text-xs text-zinc-400">{t.step4Hint}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {BOOKING_EXTRAS_CATALOG.map((item) => {
                const qty = extraQuantities[item.id] ?? 0
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                      qty > 0
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-zinc-800 bg-zinc-950'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-bold text-white">
                          {locale === 'en' ? item.nameEn : item.nameUk}
                        </div>
                        <span className="font-mono text-sm font-extrabold text-emerald-400">
                          {item.price} {t.currencyUnit}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">
                        {locale === 'en' ? item.descriptionEn : item.descriptionUk}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleChangeExtraQty(item.id, -1)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 font-mono text-sm font-bold text-white hover:bg-zinc-800"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono text-sm font-bold text-white">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleChangeExtraQty(item.id, 1)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-violet-600 font-mono text-sm font-bold text-white hover:bg-violet-500"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* КРОК 5: Підтвердження та спосіб оплати (повністю або на місці) */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white sm:text-xl">{t.step5Header}</h2>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-6">
                <div className="text-xs font-semibold text-zinc-300">
                  {t.paymentTimingLabel}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentTiming('FULL_ONLINE')
                      setPaymentMethod('баланс')
                    }}
                    className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
                      paymentTiming === 'FULL_ONLINE'
                        ? 'border-emerald-500 bg-emerald-500/15'
                        : 'border-zinc-800 bg-zinc-950'
                    }`}
                  >
                    <div className="text-sm font-bold text-white">{t.payFullOnlineTitle}</div>
                    <p className="mt-1 text-xs text-zinc-400">{t.payFullOnlineDesc}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentTiming('ON_SITE')
                      setPaymentMethod('готівка')
                    }}
                    className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
                      paymentTiming === 'ON_SITE'
                        ? 'border-amber-500 bg-amber-500/15'
                        : 'border-zinc-800 bg-zinc-950'
                    }`}
                  >
                    <div className="text-sm font-bold text-white">{t.payOnSiteTitle}</div>
                    <p className="mt-1 text-xs text-zinc-400">{t.payOnSiteDesc}</p>
                  </button>
                </div>

                <div>
                  <div className="text-xs font-semibold text-zinc-300">
                    {t.paymentMethodLabel}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['баланс', 'картка', 'готівка'] as PaymentMethod[]).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`cursor-pointer rounded-xl border px-4 py-2 text-xs font-bold transition ${
                          paymentMethod === method
                            ? 'border-violet-500 bg-violet-600 text-white'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-300'
                        }`}
                      >
                        {localizePaymentMethod(method, locale)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Підсумковий чек бронювання */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 lg:col-span-6">
                <dl className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">{t.summaryZone}:</dt>
                    <dd className="font-bold text-white">
                      {activeZone ? localizeDynamicText(activeZone.name, locale) : '—'} (
                      {selectedDevice})
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">{t.summarySeats}:</dt>
                    <dd className="font-mono font-bold text-emerald-400">
                      {selectedPlaces.map((p) => p.name).join(', ') || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">{t.summaryWindow}:</dt>
                    <dd className="font-semibold text-zinc-200">
                      {dateYmd} • {startTimeHm}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">{t.summaryDuration}:</dt>
                    <dd className="font-semibold text-violet-300">
                      {locale === 'en'
                        ? BOOKING_DURATION_PRESETS[durationPresetId].labelEn
                        : BOOKING_DURATION_PRESETS[durationPresetId].labelUk}{' '}
                      ({priceBreakdown.occupiedHours} {t.hoursShort})
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-2.5">
                    <dt className="text-zinc-400">{t.summarySeatsCost}:</dt>
                    <dd className="font-mono font-semibold text-zinc-200">
                      {priceBreakdown.seatsCost} {t.currencyUnit}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">{t.summaryExtrasCost}:</dt>
                    <dd className="font-mono font-semibold text-zinc-200">
                      {priceBreakdown.extrasCost} {t.currencyUnit}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-2.5 text-sm">
                    <dt className="font-bold text-white">{t.summaryTotal}:</dt>
                    <dd className="font-mono font-black text-emerald-400">
                      {priceBreakdown.totalAmount} {t.currencyUnit}
                    </dd>
                  </div>
                  <div className="flex justify-between text-xs">
                    <dt className="text-zinc-400">{t.summaryPrepaid}:</dt>
                    <dd className="font-mono font-bold text-violet-300">
                      {paymentTiming === 'FULL_ONLINE' ? priceBreakdown.totalAmount : 0}{' '}
                      {t.currencyUnit} ({localizePaymentMethod(paymentMethod, locale)})
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmBooking}
                  className="mt-5 w-full cursor-pointer rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isSubmitting ? t.submittingBookingBtn : t.confirmBookingBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Навігація між кроками майстра */}
        <div className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-5">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800/80 px-5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-40"
          >
            {t.prevStepBtn}
          </button>

          {step < 4 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              className="cursor-pointer rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500"
            >
              {t.nextStepBtn}
            </button>
          )}
        </div>
      </div>

      {/* Секція «Мої бронювання»: перегляд, QR-код броні, скасування та перенесення з правилом 2 годин */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl sm:p-8">
        <div className="border-b border-zinc-800 pb-4">
          <h2 className="text-lg font-bold text-white sm:text-xl">{t.myBookingsTitle}</h2>
          <p className="mt-0.5 text-xs text-zinc-400">{t.myBookingsSubtitle}</p>
        </div>

        {bookings.length > 0 ? (
          <div className="mt-5 space-y-4">
            {bookings.map((booking) => {
              const ruleCheck = canModifyBookingByTwoHourRule(booking.startTime)
              const qrMatrix = generateScannableQrMatrix(booking.qrCode)
              const isConfirmed = booking.status === 'CONFIRMED'

              return (
                <div
                  key={booking.id}
                  className={`rounded-2xl border p-5 transition ${
                    isConfirmed
                      ? 'border-zinc-800 bg-zinc-950'
                      : 'border-zinc-800/50 bg-zinc-950/50 opacity-65'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                            isConfirmed
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {isConfirmed ? t.statusConfirmed : t.statusCancelled}
                        </span>
                        <span className="font-mono text-xs text-zinc-400">
                          ID: {booking.id}
                        </span>
                        <span className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                          {booking.isPaidOnline ? t.paidOnlineBadge : t.payOnSiteBadge} (
                          {localizePaymentMethod(booking.paymentMethod, locale)})
                        </span>
                        <span
                          className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${
                            ruleCheck.allowed
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                          }`}
                        >
                          {ruleCheck.allowed ? t.ruleAllowedBadge : t.ruleLockedBadge}
                        </span>
                      </div>

                      <div className="text-base font-extrabold text-white">
                        {booking.computerName} •{' '}
                        <span className="text-violet-300">
                          {localizeDynamicText(booking.zoneName, locale)}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-300">
                        {new Date(booking.startTime).toLocaleString(
                          locale === 'en' ? 'en-US' : 'uk-UA',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}{' '}
                        –{' '}
                        {new Date(booking.endTime).toLocaleTimeString(
                          locale === 'en' ? 'en-US' : 'uk-UA',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}{' '}
                        • {booking.occupiedHours} {t.hoursShort}{' '}
                        {booking.isPackage3Plus1 ? '(3+1)' : ''} •{' '}
                        <strong className="font-mono text-emerald-400">
                          {booking.totalAmount} {t.currencyUnit}
                        </strong>
                      </div>

                      {booking.extras.length > 0 && (
                        <div className="text-xs text-zinc-400">
                          +{' '}
                          {booking.extras
                            .map((e) => `${e.name} ×${e.quantity}`)
                            .join(', ')}
                        </div>
                      )}

                      {isConfirmed && (
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(booking.id)}
                            className="cursor-pointer rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
                          >
                            {t.cancelBtn}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReschedulingId(
                                reschedulingId === booking.id ? null : booking.id,
                              )
                            }}
                            className="cursor-pointer rounded-xl border border-violet-500/40 bg-violet-500/10 px-3.5 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/20"
                          >
                            {t.rescheduleBtn}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyBookingQr(booking)}
                            className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
                          >
                            {copiedBookingId === booking.id
                              ? t.copiedQrTokenBtn
                              : t.copyQrTokenBtn}
                          </button>
                        </div>
                      )}

                      {reschedulingId === booking.id && (
                        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-violet-500/30 bg-zinc-900 p-3">
                          <div>
                            <label className="block text-[11px] text-zinc-400">
                              {t.dateLabel}
                            </label>
                            <input
                              type="date"
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                              className="mt-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-zinc-400">
                              {t.startTimeLabel}
                            </label>
                            <input
                              type="time"
                              value={rescheduleTimeHm}
                              onChange={(e) => setRescheduleTimeHm(e.target.value)}
                              className="mt-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplyReschedule(booking.id)}
                            className="cursor-pointer rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-violet-500"
                          >
                            {t.applyRescheduleBtn}
                          </button>
                          <button
                            type="button"
                            onClick={() => setReschedulingId(null)}
                            className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300"
                          >
                            {t.closeRescheduleBtn}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* QR-код броні для чек-іну адміном */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="rounded-xl border border-violet-500/40 bg-white p-2">
                        <svg
                          viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                          className="h-20 w-20"
                          shapeRendering="crispEdges"
                          role="img"
                          aria-label={`Booking QR ${booking.id}`}
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
                      <span className="max-w-[140px] truncate font-mono text-[10px] text-zinc-400">
                        {booking.qrCode}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-sm text-zinc-400">
            {t.noBookingsYet}
          </div>
        )}
      </div>
    </section>
  )
}
