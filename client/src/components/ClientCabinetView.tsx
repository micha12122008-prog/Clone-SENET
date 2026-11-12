import { SHELL_LABELS, type ShellLocale } from '../i18n/shellLabels'
import type { AuthSession } from '../types/auth'

interface ClientCabinetViewProps {
  locale?: ShellLocale
  session: AuthSession
  onLogout: () => void
}

export function ClientCabinetView({
  locale = 'uk',
  session,
  onLogout,
}: ClientCabinetViewProps) {
  const t = SHELL_LABELS[locale]
  const { user, accessToken } = session

  return (
    <section
      aria-label={t.cabinetAria}
      className="mx-auto flex w-full max-w-3xl flex-col py-4 sm:py-8"
    >
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <span className="inline-block rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              {t.cabinetBadgePrefix} {user.role.toLowerCase()}
            </span>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              {t.cabinetWelcomePrefix} {user.username || user.firstName || user.login}!
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400">
              {t.cabinetSubtitlePrefix}{' '}
              <code className="text-violet-300">Authorization: Bearer</code>.
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="cursor-pointer rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
          >
            {t.cabinetLogoutBtn}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs text-zinc-400">{t.cabinetNicknameLabel}</div>
            <div className="mt-1 text-base font-bold text-white">
              {user.username || '—'}
              {user.firstName ? ` (${user.firstName})` : ''}
            </div>
            <div className="mt-1 text-xs text-zinc-400">Lvl {user.level ?? 1}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs text-zinc-400">{t.cabinetContactsLabel}</div>
            <div className="mt-1 truncate text-sm font-semibold text-white">
              {user.email || '—'}
            </div>
            <div className="mt-1 text-xs text-zinc-400">{user.phone || '—'}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs text-zinc-400">{t.cabinetBalanceLabel}</div>
            <div className="mt-1 text-lg font-extrabold text-emerald-400">
              {user.balance ?? 0} UAH
            </div>
            <div className="mt-1 text-xs text-zinc-400">ID: {user.id.slice(0, 12)}...</div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-xs font-semibold text-zinc-400">{t.cabinetTokenLabel}</div>
          <div className="mt-1.5 break-all rounded-lg bg-zinc-900 px-3 py-2 font-mono text-xs text-violet-300">
            {accessToken}
          </div>
        </div>
      </div>
    </section>
  )
}
