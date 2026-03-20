"use client"

import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { useState, useEffect } from "react"
import { ChevronLeft } from "lucide-react"

import { IconSpinner, KeyFilledIcon, SettingsFilledIcon } from "../../components/ui/icons"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import {
  apiKeyOnboardingCompletedAtom,
  billingMethodAtom,
  customClaudeConfigAtom,
  type CustomClaudeConfig,
} from "../../lib/atoms"
import { cn } from "../../lib/utils"

const isValidApiKey = (key: string) => {
  const trimmed = key.trim()
  return trimmed.startsWith("sk-ant-") && trimmed.length > 20
}

export function ApiKeyOnboardingPage() {
  const [storedConfig, setStoredConfig] = useAtom(customClaudeConfigAtom)
  const billingMethod = useAtomValue(billingMethodAtom)
  const setBillingMethod = useSetAtom(billingMethodAtom)
  const setApiKeyOnboardingCompleted = useSetAtom(apiKeyOnboardingCompletedAtom)

  const isCustomModel = billingMethod === "custom-model"

  const defaultModel = "claude-sonnet-4-6"
  const defaultBaseUrl = "https://api.anthropic.com"

  const [apiKey, setApiKey] = useState(storedConfig.token)
  const [model, setModel] = useState(storedConfig.model || "")
  const [token, setToken] = useState(storedConfig.token)
  const [baseUrl, setBaseUrl] = useState(storedConfig.baseUrl || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (storedConfig.token) {
      setApiKey(storedConfig.token)
      setToken(storedConfig.token)
    }
    if (storedConfig.model) setModel(storedConfig.model)
    if (storedConfig.baseUrl) setBaseUrl(storedConfig.baseUrl)
  }, [storedConfig])

  const handleBack = () => {
    setBillingMethod(null)
  }

  const submitApiKey = (key: string) => {
    if (!isValidApiKey(key)) return

    setIsSubmitting(true)

    const config: CustomClaudeConfig = {
      model: defaultModel,
      token: key.trim(),
      baseUrl: defaultBaseUrl,
    }
    setStoredConfig(config)
    setApiKeyOnboardingCompleted(true)

    setIsSubmitting(false)
  }

  const submitCustomModel = () => {
    const trimmedModel = model.trim()
    const trimmedToken = token.trim()
    const trimmedBaseUrl = baseUrl.trim()

    if (!trimmedModel || !trimmedToken || !trimmedBaseUrl) return

    setIsSubmitting(true)

    const config: CustomClaudeConfig = {
      model: trimmedModel,
      token: trimmedToken,
      baseUrl: trimmedBaseUrl,
    }
    setStoredConfig(config)
    setApiKeyOnboardingCompleted(true)

    setIsSubmitting(false)
  }

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setApiKey(value)

    if (isValidApiKey(value)) {
      setTimeout(() => submitApiKey(value), 100)
    }
  }

  const handleApiKeyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && apiKey.trim()) {
      submitApiKey(apiKey)
    }
  }

  const canSubmitCustomModel = Boolean(model.trim() && token.trim() && baseUrl.trim())

  if (!isCustomModel) {
    return (
      <div className="onboarding-stage bg-background select-none">
        <div
          className="fixed left-0 right-0 top-0 h-10"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        />

        <button onClick={handleBack} className="onboarding-back">
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="onboarding-panel w-full max-w-[520px] space-y-6">
          <div className="space-y-2 text-center">
            <p className="onboarding-kicker">Authentication</p>
            <h1 className="onboarding-title">Drop in your API key</h1>
            <p className="onboarding-subtitle">
              Pull your key from{" "}
              <a
                href="https://console.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground underline-offset-4 hover:underline"
              >
                console.anthropic.com
              </a>
              . We auto-submit once the key format is valid.
            </p>
          </div>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card/70 text-primary">
            <KeyFilledIcon className="h-7 w-7" />
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Input
                value={apiKey}
                onChange={handleApiKeyChange}
                onKeyDown={handleApiKeyKeyDown}
                placeholder="sk-ant-..."
                className="h-10 rounded-xl border-border/80 bg-background/70 pr-10 text-center font-mono"
                autoFocus
                disabled={isSubmitting}
              />
              {isSubmitting && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <IconSpinner className="h-4 w-4" />
                </div>
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground">Format: <span className="font-semibold text-foreground">sk-ant-...</span></p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-stage bg-background select-none">
      <div
        className="fixed left-0 right-0 top-0 h-10"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      />

      <button onClick={handleBack} className="onboarding-back">
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="onboarding-panel w-full max-w-[520px] space-y-6">
        <div className="space-y-2 text-center">
          <p className="onboarding-kicker">Advanced Routing</p>
          <h1 className="onboarding-title">Custom model endpoint</h1>
          <p className="onboarding-subtitle">
            Route requests to any compatible API by providing model, token, and base URL.
          </p>
        </div>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card/70 text-primary">
          <SettingsFilledIcon className="h-7 w-7" />
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Model name</Label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="claude-sonnet-4-6"
              className="h-10 rounded-xl border-border/80 bg-background/70"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">API token</Label>
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="sk-ant-..."
              className="h-10 rounded-xl border-border/80 bg-background/70"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Base URL</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.anthropic.com"
              className="h-10 rounded-xl border-border/80 bg-background/70"
            />
          </div>
        </div>

        <button
          onClick={submitCustomModel}
          disabled={!canSubmitCustomModel || isSubmitting}
          className={cn(
            "onboarding-action flex w-full items-center justify-center bg-primary text-primary-foreground transition hover:bg-primary/90",
            (!canSubmitCustomModel || isSubmitting) && "cursor-not-allowed opacity-50",
          )}
        >
          {isSubmitting ? <IconSpinner className="h-4 w-4" /> : "Continue"}
        </button>
      </div>
    </div>
  )
}
