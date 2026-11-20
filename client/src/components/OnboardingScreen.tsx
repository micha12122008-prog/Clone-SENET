import { useState } from 'react'
import { SHELL_LABELS, type ShellLocale } from '../i18n/shellLabels'
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PLACE_STATUSES,
  TOURNAMENT_STATUSES,
  type OpenApiSkeletonState,
} from '../types/openapi'

interface OnboardingScreenProps {
  locale?: ShellLocale
  apiState: OpenApiSkeletonState
  onFinishOnboarding: () => void
  onBackToSplash: () => void
}

export function OnboardingScreen({
  locale = 'uk',
  apiState,
  onFinishOnboarding,
  onBackToSplash,
}: OnboardingScreenProps) {
  const t = SHELL_LABELS[locale]
  const steps = t.onboardingSteps
  const [stepIndex, setStepIndex] = useState(0)
  const currentStep = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      onFinishOnboarding()
    } else {
      setStepIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (stepIndex === 0) {
      onBackToSplash()
    } else {
      setStepIndex((prev) => prev - 1)
    }
  }

  return (
    <section
      aria-label={t.onboardingAria}
      className="mx-auto flex w-full max-w-4xl flex-col py-4 sm:py-8"
    >
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-2">
            {steps.map((step, idx) => {
              const isActive = idx === stepIndex
              const isCompleted = idx < stepIndex
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setStepIndex(idx)}
                  className={`flex h-9 cursor-pointer items-center gap-2 rounded-xl px-3.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                      : isCompleted
                        ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span>0{step.id}</span>
                  <span className="hidden sm:inline">{step.shortTab}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={onFinishOnboarding}
            className="cursor-pointer text-xs font-medium text-zinc-400 underline-offset-4 transition hover:text-white hover:underline"
          >
            {t.onboardingSkipBtn}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex flex-col justify-between lg:col-span-7">
            <div>
              <span className="inline-block rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
                {currentStep.badge}
              </span>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {currentStep.title}
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                {currentStep.description}
              </p>

              <ul className="mt-6 space-y-3">
                {currentStep.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-zinc-800/90 bg-zinc-950/60 p-3.5 text-sm text-zinc-200"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-5 lg:col-span-5">
            {stepIndex === 0 && (
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    {t.onboardingZonesHeader}
                  </span>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-violet-300">
                    {apiState.zones.length} {t.onboardingZonesCountSuffix}
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {apiState.zones.map((zone) => (
                    <div
                      key={zone.id}
                      className="rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{zone.name}</span>
                        <span className="font-mono text-xs font-bold text-violet-300">
                          {zone.baseHourlyRate} {t.onboardingPerHour}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">{zone.description}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                        <span>
                          {t.onboardingFreeSeats}: {zone.availableComputers}/{zone.totalComputers}
                        </span>
                        <span className="text-emerald-400">{t.onboardingStatusFree}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-zinc-800 pt-3">
                  <div className="text-[11px] text-zinc-400">{t.onboardingPlaceEnumLabel}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {PLACE_STATUSES.map((status) => (
                      <span
                        key={status}
                        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-mono text-xs text-zinc-200"
                      >
                        {status}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {stepIndex === 1 && (
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    {t.onboardingTariffsHeader}
                  </span>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-violet-300">
                    {apiState.tariffs.length} {t.onboardingTariffsCountSuffix}
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {apiState.tariffs.map((tariff) => (
                    <div
                      key={tariff.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">{tariff.name}</div>
                        <div className="text-xs text-zinc-400">
                          {t.onboardingTypePrefix}: {tariff.type}
                          {tariff.durationMinutes
                            ? ` • ${tariff.durationMinutes} ${t.onboardingMinutesSuffix}`
                            : ''}
                        </div>
                      </div>
                      <span className="rounded-lg bg-violet-500/15 px-2.5 py-1 font-mono text-xs font-bold text-violet-300">
                        {tariff.price} UAH
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-zinc-800 pt-3">
                  <div className="text-[11px] text-zinc-400">{t.onboardingPaymentEnumLabel}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {PAYMENT_METHODS.map((method) => (
                      <span
                        key={method}
                        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-mono text-xs text-zinc-200"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {stepIndex === 2 && (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    {t.onboardingContractsHeader}
                  </span>
                  <p className="mt-1 text-xs text-zinc-400">{t.onboardingContractsDesc}</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                  <div className="text-xs font-semibold text-zinc-300">
                    {t.onboardingOrderEnumLabel}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ORDER_STATUSES.map((status) => (
                      <span
                        key={status}
                        className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 font-mono text-xs text-violet-200"
                      >
                        {status}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                  <div className="text-xs font-semibold text-zinc-300">
                    {t.onboardingTournamentEnumLabel}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {TOURNAMENT_STATUSES.map((status) => (
                      <span
                        key={status}
                        className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs text-emerald-200"
                      >
                        {status}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-xs text-zinc-300">
                  <div className="font-semibold text-white">{t.onboardingBarPromoTitle}</div>
                  <p className="mt-1 text-zinc-400">{t.onboardingBarPromoDesc}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse items-center justify-between gap-3 border-t border-zinc-800 pt-6 sm:flex-row">
          <button
            type="button"
            onClick={handlePrev}
            className="w-full cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800/70 px-5 py-3 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 sm:w-auto"
          >
            {stepIndex === 0 ? t.onboardingBackToSplashBtn : t.onboardingPrevStepBtn}
          </button>

          <div className="text-xs font-medium text-zinc-400">
            {t.onboardingStepCounter(stepIndex + 1, steps.length)}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full cursor-pointer rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 sm:w-auto"
          >
            {isLastStep ? t.onboardingFinishBtn : t.onboardingNextStepBtn}
          </button>
        </div>
      </div>
    </section>
  )
}
