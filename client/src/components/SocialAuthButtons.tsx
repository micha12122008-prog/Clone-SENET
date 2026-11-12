import { SHELL_LABELS, type ShellLocale } from '../i18n/shellLabels'

const SOCIAL_PROVIDERS = [
  { id: 'google', name: 'Google' },
  { id: 'discord', name: 'Discord' },
  { id: 'steam', name: 'Steam' },
] as const

interface SocialAuthButtonsProps {
  locale?: ShellLocale
}

export function SocialAuthButtons({ locale = 'uk' }: SocialAuthButtonsProps) {
  const t = SHELL_LABELS[locale]

  return (
    <div className="mt-6 border-t border-zinc-800 pt-5">
      <div className="mb-3 text-center text-xs font-medium text-zinc-400">{t.socialHeader}</div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {SOCIAL_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            disabled
            aria-disabled="true"
            className="flex cursor-not-allowed items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-2.5 text-xs font-semibold text-zinc-500 opacity-75"
          >
            <span>{provider.name}</span>
            <span className="rounded-md border border-zinc-700/80 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium tracking-wide text-zinc-400 uppercase">
              {t.socialSoonBadge}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
