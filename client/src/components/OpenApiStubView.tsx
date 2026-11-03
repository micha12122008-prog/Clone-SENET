import type { OpenApiSkeletonState } from '../types/openapi'

interface OpenApiStubViewProps {
  apiState: OpenApiSkeletonState
  isLoadingApi: boolean
  onRefreshApi: () => void
  onGoToSplash: () => void
  onGoToOnboarding: () => void
}

export function OpenApiStubView({
  apiState,
  isLoadingApi,
  onRefreshApi,
  onGoToSplash,
  onGoToOnboarding,
}: OpenApiStubViewProps) {
  return (
    <section
      aria-label="Скелет OpenAPI та каркас клієнта"
      className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-4 sm:py-8"
    >
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <span className="inline-block rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              Тиждень 1 • Каркас клієнта готовий
            </span>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              Підключення до заглушок скелета OpenAPI
            </h2>
            <p className="mt-2 text-sm text-zinc-300">
              Цього тижня клієнтський фронтенд ходить у заглушки скелета OpenAPI.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshApi}
            disabled={isLoadingApi}
            className="cursor-pointer rounded-xl border border-violet-500/40 bg-violet-500/15 px-4 py-2.5 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/25 disabled:opacity-50"
          >
            {isLoadingApi ? 'Оновлення...' : 'Оновити запити до API'}
          </button>
        </div>

        {/* Статус з’єднання з бекендом */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs text-zinc-400">Джерело даних контракту</div>
            <div className="mt-1 text-sm font-bold text-white">
              {apiState.source === 'live-api'
                ? 'Живий сервер NestJS OpenAPI'
                : 'Локальна заглушка скелета OpenAPI'}
            </div>
            <div className="mt-1 font-mono text-xs text-zinc-400">{apiState.baseUrl}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs text-zinc-400">GET /api/health</div>
            <div className="mt-1 text-sm font-bold text-emerald-400">
              {apiState.health.status.toUpperCase()} • v{apiState.health.version}
            </div>
            <div className="mt-1 text-xs text-zinc-400">Оновлено о {apiState.loadedAt}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs text-zinc-400">GET /api/settings/public</div>
            <div className="mt-1 text-sm font-bold text-white">{apiState.settings.clubName}</div>
            <div className="mt-1 text-xs text-zinc-400">
              Валюта: {apiState.settings.currency} • {apiState.settings.phone}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onGoToSplash}
            className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700"
          >
            Відкрити заставку (Splash)
          </button>
          <button
            type="button"
            onClick={onGoToOnboarding}
            className="cursor-pointer rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Пройти онбординг знову
          </button>
        </div>
      </div>
    </section>
  )
}
