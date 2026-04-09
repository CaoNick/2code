"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { ChevronLeft } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"
import { CodexLoginContent } from "../agents/components/codex-login-content"
import { useCodexLoginFlow } from "../agents/hooks/use-codex-login-flow"
import {
  billingMethodAtom,
  codexOnboardingAuthMethodAtom,
  codexOnboardingCompletedAtom,
} from "../../lib/atoms"

export function CodexOnboardingPage() {
  const billingMethod = useAtomValue(billingMethodAtom)
  const setBillingMethod = useSetAtom(billingMethodAtom)
  const setCodexOnboardingCompleted = useSetAtom(codexOnboardingCompletedAtom)
  const setCodexOnboardingAuthMethod = useSetAtom(codexOnboardingAuthMethodAtom)
  const didAutoStartRef = useRef(false)
  const onboardingMethod = useMemo(() => {
    if (billingMethod === "codex-api-key") return "api_key"
    return "chatgpt"
  }, [billingMethod])

  const {
    state,
    method,
    apiKeyInput,
    url,
    error,
    isRunning,
    isOpeningUrl,
    start,
    saveApiKey,
    setMethod,
    setApiKeyInput,
    cancel,
    openUrl,
  } = useCodexLoginFlow()

  useEffect(() => {
    setMethod(onboardingMethod)
  }, [onboardingMethod, setMethod])

  useEffect(() => {
    if (onboardingMethod !== "chatgpt") {
      return
    }

    if (method !== onboardingMethod) {
      return
    }

    if (didAutoStartRef.current) {
      return
    }

    didAutoStartRef.current = true
    void start()
  }, [method, onboardingMethod, start])

  useEffect(() => {
    if (state === "success") {
      setCodexOnboardingCompleted(true)
      setCodexOnboardingAuthMethod(method)
    }
  }, [method, setCodexOnboardingAuthMethod, setCodexOnboardingCompleted, state])

  const handleBack = async () => {
    if (isRunning) {
      await cancel()
    }
    setBillingMethod(null)
  }

  return (
    <div className="onboarding-stage bg-background select-none">
      <div
        className="fixed left-0 right-0 top-0 h-10"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      />

      <button onClick={() => void handleBack()} className="onboarding-back">
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="onboarding-panel w-full max-w-[560px] space-y-4">
        <div className="space-y-2 text-center">
          <p className="onboarding-kicker">OpenAI Access</p>
          <h1 className="onboarding-title">Connect Codex</h1>
          <p className="onboarding-subtitle">
            Finish authentication below. The selected mode stays in sync with your billing choice.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/70 p-4">
          <CodexLoginContent
            state={state}
            method={method}
            apiKey={apiKeyInput}
            error={error}
            url={url}
            isOpeningUrl={isOpeningUrl}
            isConnecting={isRunning || isOpeningUrl}
            onOpenUrl={() => {
              void openUrl()
            }}
            onRetry={() => {
              void start()
            }}
            onApiKeyChange={setApiKeyInput}
            onSubmitApiKey={() => {
              void saveApiKey()
            }}
          />
        </div>
      </div>
    </div>
  )
}
