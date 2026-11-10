import { useState, type FormEvent } from 'react'
import { confirmPasswordReset, requestPasswordResetOtp } from '../api/authApi'
import type { DevOtpResult } from '../types/auth'

interface PasswordResetScreenProps {
  initialTarget?: string
  onResetCompleted: (target: string, message: string) => void
  onBackToLogin: () => void
}

export function PasswordResetScreen({
  initialTarget = '',
  onResetCompleted,
  onBackToLogin,
}: PasswordResetScreenProps) {
  const [target, setTarget] = useState(initialTarget)
  const [otpResult, setOtpResult] = useState<DevOtpResult | null>(null)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleRequestCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!target.trim() || target.trim().length < 5) {
      setErrorMessage('Введіть email або номер телефону облікового запису.')
      return
    }

    setIsLoading(true)
    try {
      const otp = await requestPasswordResetOtp(target.trim())
      setOtpResult(otp)
      setCode(otp.devOtpCode)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Не вдалося отримати код скидання з API.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!code.trim() || code.trim().length < 4) {
      setErrorMessage('Введіть код скидання пароля з відповіді API.')
      return
    }
    if (newPassword.length < 6) {
      setErrorMessage('Новий пароль має містити щонайменше 6 символів.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Новий пароль і підтвердження не збігаються.')
      return
    }

    setIsLoading(true)
    try {
      const result = await confirmPasswordReset({
        target: target.trim(),
        code: code.trim(),
        newPassword,
      })
      onResetCompleted(target.trim(), result.message)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Помилка підтвердження скидання пароля.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section
      aria-label="Скидання пароля"
      className="mx-auto flex w-full max-w-xl flex-col py-4 sm:py-8"
    >
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl sm:p-8">
        <div className="border-b border-zinc-800 pb-5">
          <span className="inline-block rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            Відновлення доступу • Без листа і SMS
          </span>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            Скидання пароля клієнта
          </h2>
          <p className="mt-1.5 text-sm text-zinc-400">
            Введіть email або телефон → отримайте код у відповіді dev API → встановіть новий пароль.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            {errorMessage}
          </div>
        )}

        {/* Крок 1: Запит коду скидання за email або телефоном */}
        <form onSubmit={handleRequestCode} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="reset-target" className="block text-xs font-medium text-zinc-300">
              Ідентифікатор (email або телефон) *
            </label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              <input
                id="reset-target"
                type="text"
                required
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="player1@gmail.com або +380993334455"
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer rounded-xl bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
              >
                {otpResult ? 'Надіслати код знову' : 'Отримати код у dev API'}
              </button>
            </div>
          </div>
        </form>

        {/* Крок 2: Код із відповіді dev API та встановлення нового пароля */}
        {otpResult && (
          <form
            onSubmit={handleConfirmReset}
            className="mt-6 space-y-4 border-t border-zinc-800 pt-6"
            noValidate
          >
            <div className="rounded-2xl border border-violet-500/40 bg-violet-500/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold tracking-wider text-violet-300 uppercase">
                    Код скидання з тіла відповіді dev API
                  </div>
                  <div className="mt-1 text-xs text-zinc-300">{otpResult.message}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCode(otpResult.devOtpCode)}
                  className="cursor-pointer rounded-lg border border-violet-400/40 bg-violet-600/30 px-3 py-1.5 font-mono text-sm font-bold text-white transition hover:bg-violet-600/50"
                >
                  Код: {otpResult.devOtpCode}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="reset-otp-code" className="block text-xs font-medium text-zinc-300">
                Код підтвердження з відповіді API *
              </label>
              <input
                id="reset-otp-code"
                type="text"
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="482910"
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 font-mono text-base font-bold tracking-widest text-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="reset-new-password"
                  className="block text-xs font-medium text-zinc-300"
                >
                  Новий пароль (мін. 6 символів) *
                </label>
                <input
                  id="reset-new-password"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="reset-confirm-password"
                  className="block text-xs font-medium text-zinc-300"
                >
                  Підтвердження нового пароля *
                </label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  required
                  minLength={6}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full cursor-pointer rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 disabled:opacity-50"
            >
              {isLoading ? 'Збереження нового пароля...' : 'Підтвердити код і оновити пароль ✓'}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-zinc-800 pt-4 text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-200 hover:underline"
          >
            ← Повернутися на екран входу
          </button>
        </div>
      </div>
    </section>
  )
}
