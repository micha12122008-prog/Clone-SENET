import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCatalogSnapshot } from '../api/clubClientApi'
import {
  localizeDynamicText,
  localizePlaceStatus,
} from '../i18n/localizeDynamicText'
import type { ShellLocale } from '../i18n/shellLabels'
import type {
  CatalogSnapshotData,
  DeviceCategory,
  ZoneCategoryKind,
} from '../types/catalog'
import { PLACE_STATUSES, type PlaceStatus } from '../types/openapi'

interface CatalogScreenProps {
  locale?: ShellLocale
  onBackToHome: () => void
}

const DEVICE_TYPES: DeviceCategory[] = ['PC', 'PS', 'VR']

const ALL_ZONE_CATEGORIES: Array<{
  kind: ZoneCategoryKind
  device: DeviceCategory
  labelUk: string
  labelEn: string
}> = [
  { kind: 'Standard', device: 'PC', labelUk: 'Standard', labelEn: 'Standard' },
  { kind: 'VIP', device: 'PC', labelUk: 'VIP', labelEn: 'VIP' },
  { kind: 'Bootcamp', device: 'PC', labelUk: 'Bootcamp', labelEn: 'Bootcamp' },
  { kind: 'PS-зона', device: 'PS', labelUk: 'PS-зона', labelEn: 'PS-zone' },
  { kind: 'VR-room', device: 'VR', labelUk: 'VR-room', labelEn: 'VR-room' },
]

const CATALOG_TEXT = {
  uk: {
    aria: 'Каталог ігрових зон та місць OBSIDIAN PC CLUB',
    badge: 'Тиждень 3 • Каталог зон і місць (з API)',
    title: 'Каталог зон та ігрових місць',
    subtitle:
      'Спочатку оберіть тип пристрою (PC / PS / VR), потім ігрову зону. Статуси місць зчитуються з API під час відкриття сторінки.',
    backHomeBtn: '← На головну',
    refreshBtn: 'Оновити статуси з API',
    refreshingBtn: 'Завантаження з API...',
    apiSnapshotAt: 'Зріз з API станом на',
    step1Title: '1. Оберіть тип пристрою',
    step2Title: '2. Оберіть ігрову зону',
    deviceDescriptions: {
      PC: 'Кіберспортивні ПК (Standard, VIP, Bootcamp)',
      PS: 'Консольний лаунж Sony PlayStation 5 (PS-зона)',
      VR: 'Віртуальна реальність вільного руху (VR-room)',
    },
    freeOfTotal: (free: number, total: number) => `Вільно ${free} з ${total} місць`,
    hallPhotoBadge: 'Фото залу (заглушка)',
    hourlyRateLabel: 'Базовий тариф',
    perHourUnit: 'грн / год',
    currencyUnit: 'грн',
    availableTariffsLabel: 'Доступні тарифи:',
    placesHeader: 'Статуси місць у зоні',
    filterAllStatuses: 'Усі статуси',
    specsCpu: 'Процесор / Платформа',
    specsGpu: 'Відеокарта',
    specsRam: 'Пам’ять / Геймпади',
    specsDisplay: 'Екран / Оптика',
    placeNumberPrefix: 'Місце №',
    noPlacesMatch: 'Немає місць із обраним статусом у цій зоні.',
    staticNote:
      'Статус місць зчитано з API в момент відкриття сторінки (без WebSocket — живе оновлення буде на тижні 5).',
  },
  en: {
    aria: 'OBSIDIAN PC CLUB Zones & Seats Catalog',
    badge: 'Week 3 • Zones & Seats Catalog (from API)',
    title: 'Gaming Zones & Seats Catalog',
    subtitle:
      'First select device type (PC / PS / VR), then choose a zone. Seat statuses are fetched from the API when opening the page.',
    backHomeBtn: '← Back to Home',
    refreshBtn: 'Refresh Statuses from API',
    refreshingBtn: 'Loading from API...',
    apiSnapshotAt: 'API snapshot at',
    step1Title: '1. Select Device Type',
    step2Title: '2. Select Gaming Zone',
    deviceDescriptions: {
      PC: 'Esports Gaming PCs (Standard, VIP, Bootcamp)',
      PS: 'Sony PlayStation 5 Console Lounge (PS-zone)',
      VR: 'Room-scale Virtual Reality Arena (VR-room)',
    },
    freeOfTotal: (free: number, total: number) => `${free} of ${total} seats free`,
    hallPhotoBadge: 'Hall Photo (Placeholder)',
    hourlyRateLabel: 'Base Hourly Rate',
    perHourUnit: 'UAH / hr',
    currencyUnit: 'UAH',
    availableTariffsLabel: 'Available Tariffs:',
    placesHeader: 'Seat Statuses in Zone',
    filterAllStatuses: 'All statuses',
    specsCpu: 'CPU / Platform',
    specsGpu: 'Graphics / Output',
    specsRam: 'Memory / Controllers',
    specsDisplay: 'Display / Optics',
    placeNumberPrefix: 'Seat #',
    noPlacesMatch: 'No seats match the selected status filter in this zone.',
    staticNote:
      'Seat statuses are read from the API upon opening the page (no WebSocket in Week 3 — live occupancy arrives in Week 5).',
  },
} as const

function getStatusBadgeClasses(status: PlaceStatus): string {
  switch (status) {
    case 'вільно':
      return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
    case 'зайнято':
      return 'border-rose-500/40 bg-rose-500/15 text-rose-300'
    case 'бронь':
      return 'border-amber-500/40 bg-amber-500/15 text-amber-300'
    case 'ремонт':
      return 'border-zinc-500/40 bg-zinc-700/40 text-zinc-300'
  }
}

function getStatusDotClasses(status: PlaceStatus): string {
  switch (status) {
    case 'вільно':
      return 'bg-emerald-400'
    case 'зайнято':
      return 'bg-rose-400'
    case 'бронь':
      return 'bg-amber-400'
    case 'ремонт':
      return 'bg-zinc-400'
  }
}

export function CatalogScreen({ locale = 'uk', onBackToHome }: CatalogScreenProps) {
  const t = CATALOG_TEXT[locale]
  const [snapshot, setSnapshot] = useState<CatalogSnapshotData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedDevice, setSelectedDevice] = useState<DeviceCategory>('PC')
  const [selectedCategory, setSelectedCategory] = useState<ZoneCategoryKind>('Standard')
  const [statusFilter, setStatusFilter] = useState<PlaceStatus | 'ALL'>('ALL')

  const loadCatalogFromApi = useCallback(async () => {
    setIsLoading(true)
    const data = await fetchCatalogSnapshot()
    setSnapshot(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true
    fetchCatalogSnapshot().then((data) => {
      if (mounted) {
        setSnapshot(data)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const handleSelectDevice = (device: DeviceCategory) => {
    setSelectedDevice(device)
    setStatusFilter('ALL')
    if (device === 'PC') {
      if (
        selectedCategory !== 'Standard' &&
        selectedCategory !== 'VIP' &&
        selectedCategory !== 'Bootcamp'
      ) {
        setSelectedCategory('Standard')
      }
    } else if (device === 'PS') {
      setSelectedCategory('PS-зона')
    } else if (device === 'VR') {
      setSelectedCategory('VR-room')
    }
  }

  const handleSelectCategory = (kind: ZoneCategoryKind, device: DeviceCategory) => {
    setSelectedDevice(device)
    setSelectedCategory(kind)
    setStatusFilter('ALL')
  }

  const deviceStats = useMemo(() => {
    const places = snapshot?.places ?? []
    return {
      PC: {
        total: places.filter((p) => p.deviceType === 'PC').length,
        free: places.filter((p) => p.deviceType === 'PC' && p.status === 'вільно').length,
      },
      PS: {
        total: places.filter((p) => p.deviceType === 'PS').length,
        free: places.filter((p) => p.deviceType === 'PS' && p.status === 'вільно').length,
      },
      VR: {
        total: places.filter((p) => p.deviceType === 'VR').length,
        free: places.filter((p) => p.deviceType === 'VR' && p.status === 'вільно').length,
      },
    }
  }, [snapshot?.places])

  const activeZone = useMemo(() => {
    if (!snapshot) return null
    return (
      snapshot.zones.find((z) => z.categoryKind === selectedCategory) ??
      snapshot.zones.find((z) => z.deviceType === selectedDevice) ??
      snapshot.zones[0] ??
      null
    )
  }, [selectedCategory, selectedDevice, snapshot])

  const zonePlaces = useMemo(() => {
    if (!snapshot || !activeZone) return []
    const allInZone = snapshot.places.filter(
      (p) => p.zoneId === activeZone.id || p.categoryKind === activeZone.categoryKind,
    )
    if (statusFilter === 'ALL') {
      return allInZone
    }
    return allInZone.filter((p) => p.status === statusFilter)
  }, [activeZone, snapshot, statusFilter])

  const activeCategoryLabel = useMemo(() => {
    if (!activeZone) return ''
    const found = ALL_ZONE_CATEGORIES.find((c) => c.kind === activeZone.categoryKind)
    if (!found) return activeZone.categoryKind
    return locale === 'en' ? found.labelEn : found.labelUk
  }, [activeZone, locale])

  return (
    <section aria-label={t.aria} className="mx-auto flex w-full flex-col gap-6 py-3 sm:py-5">
      {/* Шапка каталогу */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-2xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                {t.badge}
              </span>
              {snapshot && (
                <span className="text-xs text-zinc-400">
                  {t.apiSnapshotAt}: <strong className="text-zinc-200">{snapshot.loadedAt}</strong>
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">{t.title}</h1>
            <p className="mt-1 max-w-3xl text-xs text-zinc-400 sm:text-sm">{t.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToHome}
              className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
            >
              {t.backHomeBtn}
            </button>
            <button
              type="button"
              onClick={loadCatalogFromApi}
              disabled={isLoading}
              className="cursor-pointer rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 disabled:opacity-50"
            >
              {isLoading ? t.refreshingBtn : t.refreshBtn}
            </button>
          </div>
        </div>

        {/* Крок 1: Спочатку тип PC / PS / VR */}
        <div className="mt-6">
          <div className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
            {t.step1Title}
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DEVICE_TYPES.map((device) => {
              const isSelected = selectedDevice === device
              const stats = deviceStats[device]
              return (
                <button
                  key={device}
                  type="button"
                  onClick={() => handleSelectDevice(device)}
                  className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? 'border-violet-500 bg-violet-600/15 shadow-lg shadow-violet-600/10'
                      : 'border-zinc-800 bg-zinc-950/90 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-black text-white">{device}</span>
                    <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                      {t.freeOfTotal(stats.free, stats.total)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-400">
                    {t.deviceDescriptions[device]}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Крок 2: Потім зона Standard, VIP, Bootcamp, PS-зона або VR-room */}
        <div className="mt-6">
          <div className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
            {t.step2Title}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {ALL_ZONE_CATEGORIES.map((item) => {
              const isSelected = selectedCategory === item.kind
              const isSameDevice = item.device === selectedDevice
              const zoneObj = snapshot?.zones.find((z) => z.categoryKind === item.kind)

              return (
                <button
                  key={item.kind}
                  type="button"
                  onClick={() => handleSelectCategory(item.kind, item.device)}
                  className={`cursor-pointer rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                    isSelected
                      ? 'border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : isSameDevice
                        ? 'border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-violet-500/50 hover:text-white'
                        : 'border-zinc-800/80 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span>{locale === 'uk' ? item.labelUk : item.labelEn}</span>
                  <span className="ml-2 rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[10px]">
                    {item.device} • {zoneObj ? `${zoneObj.freePlaces}/${zoneObj.totalPlaces}` : '—'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Фото залу (заглушка) + Паспорт обраної зони */}
      {activeZone && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Заглушка фото залу */}
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-violet-950/40 p-6 shadow-xl lg:col-span-5">
            <div className="flex items-center justify-between">
              <span className="rounded-lg border border-zinc-700 bg-zinc-900/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-300">
                {t.hallPhotoBadge}
              </span>
              <span
                className="rounded-lg px-2.5 py-1 font-mono text-xs font-bold text-white"
                style={{ backgroundColor: `${activeZone.colorHex}33`, border: `1px solid ${activeZone.colorHex}` }}
              >
                {activeZone.deviceType} • {activeCategoryLabel}
              </span>
            </div>

            {/* Ілюстрація-заглушка ігрового залу */}
            <div className="my-5 flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-950/70 p-4 text-center">
              <svg
                viewBox="0 0 120 64"
                className="h-16 w-32 text-violet-400/80"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="8" y="10" width="38" height="26" rx="3" />
                <rect x="74" y="10" width="38" height="26" rx="3" />
                <path d="M20 42h14M86 42h14M27 36v6M93 36v6" />
                <rect x="44" y="22" width="32" height="24" rx="3" stroke="#10b981" />
                <path d="M52 52h16M60 46v6" stroke="#10b981" />
              </svg>
              <div className="mt-2 text-xs font-bold text-zinc-200">
                {localizeDynamicText(activeZone.hallPhotoLabel, locale)}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-400">
                {localizeDynamicText(activeZone.hallPhotoCaption, locale)}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800/80 pt-4">
              <div>
                <div className="text-xs text-zinc-400">{t.hourlyRateLabel}</div>
                <div className="font-mono text-xl font-black text-emerald-400">
                  {activeZone.baseHourlyRate} {t.perHourUnit}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-white">
                  {localizeDynamicText(activeZone.name, locale)}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {t.freeOfTotal(activeZone.freePlaces, activeZone.totalPlaces)}
                </div>
              </div>
            </div>
          </div>

          {/* Інформація про зону, тарифи та підрахунок місць за enum-статусами */}
          <div className="flex flex-col justify-between rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl lg:col-span-7">
            <div>
              <h2 className="text-xl font-extrabold text-white sm:text-2xl">
                {localizeDynamicText(activeZone.name, locale)}
              </h2>
              <p className="mt-1.5 text-sm text-zinc-300">
                {localizeDynamicText(activeZone.description, locale)}
              </p>

              {/* Зведення за 4 фіксованими статусами enum */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                  <div className="text-xs font-semibold text-emerald-300">
                    {localizePlaceStatus('вільно', locale)}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-black text-white">
                    {activeZone.freePlaces}
                  </div>
                </div>
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5">
                  <div className="text-xs font-semibold text-rose-300">
                    {localizePlaceStatus('зайнято', locale)}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-black text-white">
                    {activeZone.busyPlaces}
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5">
                  <div className="text-xs font-semibold text-amber-300">
                    {localizePlaceStatus('бронь', locale)}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-black text-white">
                    {activeZone.bookedPlaces}
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-600/40 bg-zinc-800/50 p-3.5">
                  <div className="text-xs font-semibold text-zinc-300">
                    {localizePlaceStatus('ремонт', locale)}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-black text-white">
                    {activeZone.maintenancePlaces}
                  </div>
                </div>
              </div>

              {/* Тарифи з API */}
              {snapshot && snapshot.tariffs.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs font-semibold text-zinc-400">
                    {t.availableTariffsLabel}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {snapshot.tariffs.map((tariff) => (
                      <div
                        key={tariff.id}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs"
                      >
                        <span className="font-semibold text-zinc-200">
                          {localizeDynamicText(tariff.name, locale)}
                        </span>
                        <span className="ml-2 font-mono font-bold text-emerald-400">
                          {tariff.price} {t.currencyUnit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-zinc-800 pt-3 text-[11px] text-zinc-400">
              {t.staticNote}
            </div>
          </div>
        </div>
      )}

      {/* Сітка місць обраної зони зі статусами з API */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <h3 className="text-lg font-bold text-white sm:text-xl">
            {t.placesHeader}{' '}
            {activeZone ? `— ${localizeDynamicText(activeZone.name, locale)}` : ''}
          </h3>

          {/* Фільтр за enum-статусом: вільно, зайнято, бронь, ремонт */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === 'ALL'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.filterAllStatuses}
            </button>
            {PLACE_STATUSES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {localizePlaceStatus(st, locale)}
              </button>
            ))}
          </div>
        </div>

        {zonePlaces.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zonePlaces.map((place) => (
              <div
                key={place.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4 transition hover:border-zinc-700"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] text-zinc-400">
                        {t.placeNumberPrefix}
                        {place.number} • {place.deviceType}
                      </div>
                      <div className="mt-0.5 font-mono text-lg font-extrabold text-white">
                        {place.name}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold ${getStatusBadgeClasses(
                        place.status,
                      )}`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${getStatusDotClasses(place.status)}`}
                      />
                      {localizePlaceStatus(place.status, locale)}
                    </span>
                  </div>

                  <dl className="mt-3.5 space-y-1.5 border-t border-zinc-800/80 pt-3 text-xs">
                    {place.specs.cpu && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-zinc-400">{t.specsCpu}:</dt>
                        <dd className="font-medium text-zinc-200">{place.specs.cpu}</dd>
                      </div>
                    )}
                    {place.specs.gpu && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-zinc-400">{t.specsGpu}:</dt>
                        <dd className="font-medium text-zinc-200">{place.specs.gpu}</dd>
                      </div>
                    )}
                    {place.specs.ram && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-zinc-400">{t.specsRam}:</dt>
                        <dd className="font-medium text-zinc-200">
                          {localizeDynamicText(place.specs.ram, locale)}
                        </dd>
                      </div>
                    )}
                    {place.specs.display && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-zinc-400">{t.specsDisplay}:</dt>
                        <dd className="font-medium text-zinc-200">{place.specs.display}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3">
                  <span className="font-mono text-sm font-extrabold text-emerald-400">
                    {place.hourlyRate} {t.perHourUnit}
                  </span>
                  {place.note ? (
                    <span className="truncate text-[11px] font-medium text-amber-300">
                      {localizeDynamicText(place.note, locale)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-400">
                      {localizeDynamicText(place.zoneName, locale)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-sm text-zinc-400">
            {t.noPlacesMatch}
          </div>
        )}
      </div>
    </section>
  )
}
