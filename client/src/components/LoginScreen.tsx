import { useState, type FormEvent } from 'react'
import { loginClient } from '../api/authApi'
import type { AuthSession } from '../types/auth'
import { SocialAuthButtons } from './SocialAuthButtons'

interface LoginScreenProps {
  initialIdentifier?: string
  noticeMessage?: string | null
  onLoggedIn: (session: AuthSession) => void
  onSwitchToRegister: () => void
  onForgotPassword: (currentLogin: string) => void
}

export function LoginScreen({
  initialIdentifier = '',
  noticeMessage = null,
  onLoggedIn,
  onSwitchToRegister,
  onForgotPassword,
}: LoginScreenProps) {
  const [login, setLogin] = useState(initialIdentifier)
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!login.trim()) {
      setErrorMessage('Введіть email або номер телефону.')
      return
    }
    if (!password) {
      setErrorMessage('Введіть пароль.')
      return
    }

    setIsSubmitting(true)
    try {
      const session = await loginClient({
        login: login.trim(),
        password,
      })
      onLoggedIn(session)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Не вдалося увійти через API.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      aria-label="Вхід клієнта"
      className="mx-auto flex w-full max-w-xl flex-col py-4 sm:py-8"
    >
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl sm:p-8">
        <div className="border-b border-zinc-800 pb-5">
          <span className="inline-block rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
            Тиждень 2 • Вхід клієнта
          </span>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            Вхід до OBSIDIAN PC CLUB
          </h2>
          <p className="mt-1.5 text-sm text-zinc-400">
            Авторизуйтеся за допомогою email або номера телефону та пароля.
          </p>
        </div>

        {noticeMessage && (
          <div className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {noticeMessage}
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="login-identifier" className="block text-xs font-medium text-zinc-300">
              Email або телефон *
            </label>
            <input
              id="login-identifier"
              type="text"
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="player1@gmail.com або +380993334455"
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="block text-xs font-medium text-zinc-300">
                Пароль *
              </label>
              <button
                type="button"
                onClick={() => onForgotPassword(login.trim())}
                className="cursor-pointer text-xs font-semibold text-violet-400 hover:text-violet-300 hover:underline"
              >
                Забули пароль?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full cursor-pointer rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Авторизація...' : 'Увійти в акаунт →'}
          </button>
        </form>

        <SocialAuthButtons />

        <div className="mt-5 flex items-center justify-center gap-2 border-t border-zinc-800 pt-5 text-xs text-zinc-400">
          <span>Ще немає облікового запису?</span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="cursor-pointer font-semibold text-violet-400 hover:text-violet-300 hover:underline"
          >
            Зареєструватися
          </button>
        </div>
      </div>
    </section>
  )
}
