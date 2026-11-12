import { useCallback, useEffect, useState } from 'react'
import { logoutClient } from './api/authApi'
import {
  OPENAPI_FALLBACK_HEALTH,
  OPENAPI_FALLBACK_SETTINGS,
  OPENAPI_FALLBACK_TARIFFS,
  OPENAPI_FALLBACK_ZONES,
  fetchOpenApiSkeleton,
} from './api/openapiClient'
import { ClientCabinetView } from './components/ClientCabinetView'
import { LoginScreen } from './components/LoginScreen'
import { OnboardingScreen } from './components/OnboardingScreen'
import { OpenApiStubView } from './components/OpenApiStubView'
import { OtpScreen } from './components/OtpScreen'
import { PasswordResetScreen } from './components/PasswordResetScreen'
import { RegisterScreen } from './components/RegisterScreen'
import { SplashScreen } from './components/SplashScreen'
import { SHELL_LABELS, type ShellLocale } from './i18n/shellLabels'
import type { AuthSession, AuthUserDto, DevOtpResult } from './types/auth'
import type { OpenApiSkeletonState } from './types/openapi'

type ClientScreenView =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'register'
  | 'otp'
  | 'password-reset'
  | 'cabinet'
  | 'openapi'

export function App() {
  const [activeView, setActiveView] = useState<ClientScreenView>('login')
  const [shellLocale, setShellLocale] = useState<ShellLocale>('uk')
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(true)
  const [apiState, setApiState] = useState<OpenApiSkeletonState>(() => ({
    source: 'openapi-stub',
    baseUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000/api',
    health: OPENAPI_FALLBACK_HEALTH,
    settings: OPENAPI_FALLBACK_SETTINGS,
    zones: OPENAPI_FALLBACK_ZONES,
    tariffs: OPENAPI_FALLBACK_TARIFFS,
    loadedAt: new Date().toLocaleTimeString('uk-UA'),
  }))

  const [authSession, setAuthSession] = useState<AuthSession | null>(null)
  const [pendingOtp, setPendingOtp] = useState<DevOtpResult | null>(null)
  const [pendingRegisteredUser, setPendingRegisteredUser] = useState<AuthUserDto | undefined>(
    undefined,
  )
  const [pendingPassword, setPendingPassword] = useState<string | undefined>(undefined)
  const [loginIdentifier, setLoginIdentifier] = useState<string>('')
  const [loginNotice, setLoginNotice] = useState<string | null>(null)

  const loadSkeletonData = useCallback(async () => {
    setIsLoadingApi(true)
    const state = await fetchOpenApiSkeleton()
    setApiState(state)
    setIsLoadingApi(false)
  }, [])

  useEffect(() => {
    let mounted = true
    fetchOpenApiSkeleton().then((state) => {
      if (mounted) {
        setApiState(state)
        setIsLoadingApi(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const labels = SHELL_LABELS[shellLocale]

  const handleLogout = async () => {
    await logoutClient()
    setAuthSession(null)
    setLoginNotice(labels.logoutNotice)
    setActiveView('login')
  }

  return (
    <div className="flex min-h-svh flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800/90 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/40 bg-violet-500/15 font-mono text-sm font-extrabold text-violet-300">
              OB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wide text-white">
                  OBSIDIAN PC CLUB
                </span>
                <span className="hidden rounded-md border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-300 sm:inline-block">
                  {labels.appBadge}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">{labels.weekBadge}</div>
            </div>
          </div>

          <nav aria-label="Navigation" className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveView('splash')}
              className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition ${
                activeView === 'splash'
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              {labels.navSplash}
            </button>

            <button
              type="button"
              onClick={() => setActiveView('onboarding')}
              className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition ${
                activeView === 'onboarding'
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              {labels.navOnboarding}
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginNotice(null)
                setActiveView('login')
              }}
              className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition ${
                activeView === 'login' || activeView === 'password-reset'
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              {labels.navLogin}
            </button>

            <button
              type="button"
              onClick={() => setActiveView('register')}
              className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition ${
                activeView === 'register' || activeView === 'otp'
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              {labels.navRegister}
            </button>

            {authSession && (
              <button
                type="button"
                onClick={() => setActiveView('cabinet')}
                className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  activeView === 'cabinet'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                }`}
              >
                {labels.navCabinet}
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveView('openapi')}
              className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition ${
                activeView === 'openapi'
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              {labels.navApiContract}
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs md:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  apiState.source === 'live-api' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className="text-zinc-400">{labels.apiStatusLabel}:</span>
              <span className="font-medium text-zinc-200">
                {apiState.source === 'live-api' ? labels.apiConnected : labels.apiStubFallback}
              </span>
            </div>

            <div
              className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1"
              title={labels.langSwitchHint}
            >
              <span className="hidden px-2 text-[11px] text-zinc-400 lg:inline">
                {labels.langSwitchHint}:
              </span>
              <button
                type="button"
                onClick={() => setShellLocale('uk')}
                aria-pressed={shellLocale === 'uk'}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  shellLocale === 'uk'
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                UA
              </button>
              <button
                type="button"
                onClick={() => setShellLocale('en')}
                aria-pressed={shellLocale === 'en'}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  shellLocale === 'en'
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-4 sm:px-6">
        {activeView === 'splash' && (
          <SplashScreen
            locale={shellLocale}
            apiState={apiState}
            isLoadingApi={isLoadingApi}
            onStartOnboarding={() => setActiveView('onboarding')}
            onOpenApiContract={() => setActiveView('login')}
          />
        )}

        {activeView === 'onboarding' && (
          <OnboardingScreen
            locale={shellLocale}
            apiState={apiState}
            onFinishOnboarding={() => setActiveView('register')}
            onBackToSplash={() => setActiveView('splash')}
          />
        )}

        {activeView === 'login' && (
          <LoginScreen
            locale={shellLocale}
            initialIdentifier={loginIdentifier}
            noticeMessage={loginNotice}
            onLoggedIn={(session) => {
              setAuthSession(session)
              setLoginNotice(null)
              setActiveView('cabinet')
            }}
            onSwitchToRegister={() => {
              setLoginNotice(null)
              setActiveView('register')
            }}
            onForgotPassword={(currentLogin) => {
              setLoginIdentifier(currentLogin)
              setLoginNotice(null)
              setActiveView('password-reset')
            }}
          />
        )}

        {activeView === 'register' && (
          <RegisterScreen
            locale={shellLocale}
            onRegistered={({ user, otp, password }) => {
              setPendingRegisteredUser(user)
              setPendingOtp(otp)
              setPendingPassword(password)
              setActiveView('otp')
            }}
            onSwitchToLogin={() => {
              setLoginNotice(null)
              setActiveView('login')
            }}
          />
        )}

        {activeView === 'otp' && pendingOtp && (
          <OtpScreen
            locale={shellLocale}
            initialOtp={pendingOtp}
            registeredUser={pendingRegisteredUser}
            pendingPassword={pendingPassword}
            onVerified={(session) => {
              setAuthSession(session)
              setActiveView('cabinet')
            }}
            onBackToRegister={() => setActiveView('register')}
          />
        )}

        {activeView === 'password-reset' && (
          <PasswordResetScreen
            locale={shellLocale}
            initialTarget={loginIdentifier}
            onResetCompleted={(target, message) => {
              setLoginIdentifier(target)
              setLoginNotice(message)
              setActiveView('login')
            }}
            onBackToLogin={() => setActiveView('login')}
          />
        )}

        {activeView === 'cabinet' && authSession && (
          <ClientCabinetView
            locale={shellLocale}
            session={authSession}
            onLogout={handleLogout}
          />
        )}

        {activeView === 'openapi' && (
          <OpenApiStubView
            locale={shellLocale}
            apiState={apiState}
            isLoadingApi={isLoadingApi}
            onRefreshApi={loadSkeletonData}
            onGoToSplash={() => setActiveView('splash')}
            onGoToOnboarding={() => setActiveView('onboarding')}
          />
        )}
      </main>

      <footer className="border-t border-zinc-800/80 bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-zinc-400 sm:px-6">
          <div>{labels.footerShellNote}</div>
          <div className="flex flex-wrap items-center gap-4">
            <span>
              {labels.workingHoursLabel}:{' '}
              <strong className="text-zinc-200">{apiState.settings.workingHours}</strong>
            </span>
            <span>
              {labels.freePlacesLabel}:{' '}
              <strong className="text-emerald-400">{apiState.settings.availablePcsCount}</strong>
            </span>
            <a
              href="http://localhost:5000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-violet-400 hover:text-violet-300 hover:underline"
            >
              {labels.swaggerDocsLabel} ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
