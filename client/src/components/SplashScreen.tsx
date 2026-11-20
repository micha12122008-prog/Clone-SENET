import { useEffect, useState } from 'react'
import { SHELL_LABELS, type ShellLocale } from '../i18n/shellLabels'
import type { OpenApiSkeletonState } from '../types/openapi'

interface SplashScreenProps {
  locale?: ShellLocale
  apiState: OpenApiSkeletonState
  isLoadingApi: boolean
  onStartOnboarding: () => void
  onOpenApiContract: () => void
}

export function SplashScreen({
  locale = 'uk',
  apiState,
  isLoadingApi,
  onStartOnboarding,
  onOpenApiContract,
}: SplashScreenProps) {
  const t = SHELL_LABELS[locale]
  const [progress, setProgress] = useState(25)

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setProgress(65), 180),
      window.setTimeout(() => setProgress(100), 420),
    ]
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [])

  const totalComputers = apiState.zones.reduce((sum, z) => sum + z.totalComputers, 0)
  const availableComputers = apiState.zones.reduce((sum, z) => sum + z.availableComputers, 0)

  return (
    <section
      aria-label={t.splashAria}
      className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center py-6 sm:py-10"
    >
      <div className="relative w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_60%)]"
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium tracking-wider text-violet-300 uppercase">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            {t.splashBadge}
          </div>

          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-violet-500/50 bg-zinc-950 shadow-inner">
            <div className="flex flex-col items-center">
              <div className="h-7 w-7 rotate-45 rounded-sm border-2 border-violet-400 bg-violet-500/20" />
              <span className="mt-1.5 font-mono text-[10px] font-bold tracking-widest text-zinc-400">
                PC•PS•VR
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            OBSIDIAN <span className="text-violet-400">PC CLUB</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            {t.splashSubtitle}
          </p>

          <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-left">
              <div className="text-xs font-medium text-zinc-400">{t.splashPlatformsTitle}</div>
              <div className="mt-1 text-lg font-bold text-white">PC • PS5 • VR</div>
              <div className="mt-1 text-xs text-zinc-400">
                {t.splashZonesPrefix}: {apiState.zones.map((z) => z.name).join(', ')}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-left">
              <div className="text-xs font-medium text-zinc-400">{t.splashPlacesTitle}</div>
              <div className="mt-1 text-lg font-bold text-emerald-400">
                {t.splashFreePrefix}: {availableComputers || apiState.settings.availablePcsCount}{' '}
                {t.splashOf} {totalComputers || 12}
              </div>
              <div className="mt-1 text-xs text-zinc-400">{t.splashStatusesNote}</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-left">
              <div className="text-xs font-medium text-zinc-400">{t.splashLocationTitle}</div>
              <div className="mt-1 text-lg font-bold text-white">
                {apiState.settings.workingHours}
              </div>
              <div className="mt-1 truncate text-xs text-zinc-400" title={apiState.settings.address}>
                {apiState.settings.address}
              </div>
            </div>
          </div>

          <div className="mt-8 w-full max-w-md">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
              <span>{isLoadingApi ? t.splashLoadingApi : t.splashReadyApi}</span>
              <span className="font-mono font-semibold text-violet-300">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onStartOnboarding}
              className="w-full cursor-pointer rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 sm:w-auto"
            >
              {t.splashStartOnboardingBtn}
            </button>

            <button
              type="button"
              onClick={onOpenApiContract}
              className="w-full cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800/70 px-5 py-3.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 sm:w-auto"
            >
              {t.splashGoToLoginBtn}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
