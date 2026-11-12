import { useState, type FormEvent } from 'react'
import { changeOtpTarget, sendOtpCode, verifyOtpAndCreateSession } from '../api/authApi'
import { SHELL_LABELS, type ShellLocale } from '../i18n/shellLabels'
import type { AuthSession, AuthUserDto, DevOtpResult } from '../types/auth'

interface OtpScreenProps {
  locale?: ShellLocale
  initialOtp: DevOtpResult
  registeredUser?: AuthUserDto
  pendingPassword?: string
  onVerified: (session: AuthSession) => void
  onBackToRegister: () => void
}

export function OtpScreen({
  locale = 'uk',
  initialOtp,
  registeredUser,
  pendingPassword,
  onVerified,
  onBackToRegister,
}: OtpScreenProps) {
  const t = SHELL_LABELS[locale]

  const [otpState, setOtpState] = useState<DevOtpResult>(initialOtp)
  const [code, setCode] = useState(initialOtp.devOtpCode)
  const [isChangingTarget, setIsChangingTarget] = useState(false)
  const [newTarget, setNewTarget] = useState(initialOtp.target)

  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(initialOtp.message)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)

    if (code.trim().length < 4) {
      setErrorMessage(t.errOtpCode)
      return
    }

    setIsVerifying(true)
    try {
      const updatedUser: AuthUserDto | undefined = registeredUser
        ? {
            ...registeredUser,
            ...(otpState.target.includes('@')
              ? { email: otpState.target }
              : { phone: otpState.target }),
          }
        : undefined

      const session = await verifyOtpAndCreateSession(
        {
          target: otpState.target,
          code: code.trim(),
        },
        {
          password: pendingPassword,
          registeredUser: updatedUser,
        },
      )

      onVerified(session)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t.errOtpCode)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOtp = async () => {
    setErrorMessage(null)
    setIsResending(true)
    try {
      const refreshed = await sendOtpCode({
        target: otpState.target,
        type: 'REGISTRATION',
      })
      setOtpState(refreshed)
      setCode(refreshed.devOtpCode)
      setStatusMessage(t.otpResentStatus(refreshed.target))
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t.errOtpCode)
    } finally {
      setIsResending(false)
    }
  }

  const handleApplyNewTarget = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)

    if (newTarget.trim().length < 5) {
      setErrorMessage(t.errOtpNewTarget)
      return
    }

    setIsResending(true)
    try {
      const refreshed = await changeOtpTarget(otpState.target, newTarget.trim())
      setOtpState(refreshed)
      setCode(refreshed.devOtpCode)
      setIsChangingTarget(false)
      setStatusMessage(t.otpChangedTargetStatus(refreshed.target))
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t.errOtpNewTarget)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <section
      aria-label={t.otpAria}
      className="mx-auto flex w-full max-w-xl flex-col py-4 sm:py-8"
    >
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl sm:p-8">
        <div className="border-b border-zinc-800 pb-5">
          <span className="inline-block rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            {t.otpBadge}
          </span>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{t.otpTitle}</h2>
          <p className="mt-1.5 text-sm text-zinc-400">
            {t.otpSubtitlePrefix} <strong className="text-white">{otpState.target}</strong>
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-violet-500/40 bg-violet-500/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold tracking-wider text-violet-300 uppercase">
                {t.otpDevApiHeader}
              </div>
              <div className="mt-1 text-xs text-zinc-300">{t.otpDevApiDesc}</div>
            </div>
            <button
              type="button"
              onClick={() => setCode(otpState.devOtpCode)}
              className="cursor-pointer rounded-lg border border-violet-400/40 bg-violet-600/30 px-3 py-1.5 font-mono text-sm font-bold text-white transition hover:bg-violet-600/50"
            >
              {t.otpCodeChipPrefix} {otpState.devOtpCode}
            </button>
          </div>
          {statusMessage && (
            <div className="mt-2 border-t border-violet-500/20 pt-2 text-xs text-violet-200">
              {statusMessage}
            </div>
          )}
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div>
            <label htmlFor="otp-code-input" className="block text-xs font-medium text-zinc-300">
              {t.otpInputLabel}
            </label>
            <input
              id="otp-code-input"
              type="text"
              inputMode="numeric"
              maxLength={8}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="482910"
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-center font-mono text-xl font-bold tracking-widest text-white focus:border-violet-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full cursor-pointer rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 disabled:opacity-50"
          >
            {isVerifying ? t.otpVerifyingBtn : t.otpVerifyBtn}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-5 text-xs">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending}
            className="cursor-pointer font-semibold text-violet-400 transition hover:text-violet-300 hover:underline disabled:opacity-50"
          >
            {isResending ? t.otpResendingBtn : t.otpResendBtn}
          </button>

          <button
            type="button"
            onClick={() => setIsChangingTarget((prev) => !prev)}
            className="cursor-pointer font-semibold text-zinc-300 transition hover:text-white hover:underline"
          >
            {isChangingTarget ? t.otpCancelChangeBtn : t.otpChangeTargetBtn}
          </button>
        </div>

        {isChangingTarget && (
          <form
            onSubmit={handleApplyNewTarget}
            className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
          >
            <label htmlFor="otp-new-target" className="block text-xs font-medium text-zinc-300">
              {t.otpNewTargetLabel}
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="otp-new-target"
                type="text"
                required
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder={t.otpNewTargetPlaceholder}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isResending}
                className="cursor-pointer rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
              >
                {t.otpApplyTargetBtn}
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 border-t border-zinc-800 pt-4 text-center">
          <button
            type="button"
            onClick={onBackToRegister}
            className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-200 hover:underline"
          >
            {t.otpBackToRegisterBtn}
          </button>
        </div>
      </div>
    </section>
  )
}
