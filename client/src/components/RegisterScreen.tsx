import { useState, type FormEvent } from 'react'
import { registerClient } from '../api/authApi'
import { SHELL_LABELS, type ClientTranslations, type ShellLocale } from '../i18n/shellLabels'
import type { AuthUserDto, DevOtpResult } from '../types/auth'
import { SocialAuthButtons } from './SocialAuthButtons'

interface RegisterScreenProps {
  locale?: ShellLocale
  onRegistered: (payload: {
    user: AuthUserDto
    otp: DevOtpResult
    password: string
  }) => void
  onSwitchToLogin: () => void
}

interface RegisterFormValues {
  firstName: string
  username: string
  phone: string
  email: string
  password: string
  confirmPassword: string
  birthDate: string
  agreeToRules: boolean
}

function validateRegisterForm(
  values: RegisterFormValues,
  t: ClientTranslations,
): string | null {
  const rules: Array<{ isInvalid: boolean; message: string }> = [
    { isInvalid: !values.firstName.trim(), message: t.errFirstName },
    { isInvalid: !values.username.trim(), message: t.errUsername },
    { isInvalid: values.phone.trim().length < 10, message: t.errPhone },
    {
      isInvalid: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()),
      message: t.errEmail,
    },
    { isInvalid: values.password.length < 6, message: t.errPasswordLength },
    { isInvalid: values.password !== values.confirmPassword, message: t.errPasswordMismatch },
    { isInvalid: !values.birthDate, message: t.errBirthDate },
    { isInvalid: !values.agreeToRules, message: t.errAgreeRules },
  ]

  return rules.find((rule) => rule.isInvalid)?.message ?? null
}

export function RegisterScreen({
  locale = 'uk',
  onRegistered,
  onSwitchToLogin,
}: RegisterScreenProps) {
  const t = SHELL_LABELS[locale]

  const [firstName, setFirstName] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('+380')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [birthDate, setBirthDate] = useState('')
  const [agreeToRules, setAgreeToRules] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)

    const validationError = validateRegisterForm(
      {
        firstName,
        username,
        phone,
        email,
        password,
        confirmPassword,
        birthDate,
        agreeToRules,
      },
      t,
    )

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSubmitting(true)
    try {
      const result = await registerClient({
        firstName,
        username,
        phone,
        email,
        password,
        birthDate,
      })

      onRegistered({
        user: result.user,
        otp: result.otp,
        password,
      })
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Registration error.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      aria-label={t.registerAria}
      className="mx-auto flex w-full max-w-2xl flex-col py-4 sm:py-8"
    >
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl sm:p-8">
        <div className="border-b border-zinc-800 pb-5">
          <span className="inline-block rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
            {t.registerBadge}
          </span>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{t.registerTitle}</h2>
          <p className="mt-1.5 text-sm text-zinc-400">{t.registerSubtitle}</p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-firstName" className="block text-xs font-medium text-zinc-300">
                {t.registerFirstNameLabel}
              </label>
              <input
                id="reg-firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t.registerFirstNamePlaceholder}
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-username" className="block text-xs font-medium text-zinc-300">
                {t.registerUsernameLabel}
              </label>
              <input
                id="reg-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.registerUsernamePlaceholder}
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-medium text-zinc-300">
                {t.registerPhoneLabel}
              </label>
              <input
                id="reg-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+380991112233"
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium text-zinc-300">
                {t.registerEmailLabel}
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@gmail.com"
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="reg-password" className="block text-xs font-medium text-zinc-300">
                  {t.registerPasswordLabel}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPasswords((prev) => !prev)}
                  className="cursor-pointer text-[11px] font-medium text-violet-400 hover:text-violet-300"
                >
                  {showPasswords ? t.registerHidePassword : t.registerShowPassword}
                </button>
              </div>
              <input
                id="reg-password"
                type={showPasswords ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="reg-confirmPassword"
                  className="block text-xs font-medium text-zinc-300"
                >
                  {t.registerConfirmPasswordLabel}
                </label>
                {confirmPassword.length > 0 && (
                  <span
                    className={`text-[11px] font-medium ${
                      password === confirmPassword ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {password === confirmPassword
                      ? t.registerPasswordMatch
                      : t.registerPasswordMismatch}
                  </span>
                )}
              </div>
              <input
                id="reg-confirmPassword"
                type={showPasswords ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="reg-birthDate" className="block text-xs font-medium text-zinc-300">
                {t.registerBirthDateLabel}
              </label>
              <input
                id="reg-birthDate"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={agreeToRules}
              onChange={(e) => setAgreeToRules(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-700 accent-violet-600"
            />
            <span>
              {t.registerAgreePrefix} <strong>OBSIDIAN PC CLUB</strong> {t.registerAgreeSuffix}
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full cursor-pointer rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 disabled:opacity-50"
          >
            {isSubmitting ? t.registerSubmittingBtn : t.registerSubmitBtn}
          </button>
        </form>

        <SocialAuthButtons locale={locale} />

        <div className="mt-5 flex items-center justify-center gap-2 border-t border-zinc-800 pt-5 text-xs text-zinc-400">
          <span>{t.registerHasAccountPrompt}</span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="cursor-pointer font-semibold text-violet-400 hover:text-violet-300 hover:underline"
          >
            {t.registerSwitchToLoginBtn}
          </button>
        </div>
      </div>
    </section>
  )
}
