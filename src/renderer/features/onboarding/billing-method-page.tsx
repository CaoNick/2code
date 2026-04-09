"use client"

import { useSetAtom } from "jotai"
import { Check } from "lucide-react"
import { useMemo, useState } from "react"

import {
  ClaudeCodeIcon,
  CodexIcon,
  KeyFilledIcon,
  SettingsFilledIcon,
} from "../../components/ui/icons"
import {
  billingMethodAtom,
  codexOnboardingCompletedAtom,
  type BillingMethod,
} from "../../lib/atoms"
import { cn } from "../../lib/utils"

type BillingOptionGroup = "claude-code" | "codex"

type BillingOption = {
  id: string
  method: Exclude<BillingMethod, null>
  group: BillingOptionGroup
  title: string
  subtitle: string
  recommended?: boolean
  icon: React.ReactNode
}

const billingOptions: BillingOption[] = [
  {
    id: "claude-subscription",
    method: "claude-subscription",
    group: "claude-code",
    title: "Claude Pro/Max",
    subtitle: "Unlimited sessions through your Claude subscription.",
    recommended: true,
    icon: <ClaudeCodeIcon className="h-5 w-5" />,
  },
  {
    id: "api-key",
    method: "api-key",
    group: "claude-code",
    title: "Anthropic API Key",
    subtitle: "Use pay-as-you-go credits from Anthropic Console.",
    icon: <KeyFilledIcon className="h-5 w-5" />,
  },
  {
    id: "custom-model",
    method: "custom-model",
    group: "claude-code",
    title: "Custom Model",
    subtitle: "Bring your own endpoint, token, and model id.",
    icon: <SettingsFilledIcon className="h-5 w-5" />,
  },
  {
    id: "codex-subscription",
    method: "codex-subscription",
    group: "codex",
    title: "Codex Subscription",
    subtitle: "Authenticate with your ChatGPT account.",
    recommended: true,
    icon: <CodexIcon className="h-5 w-5" />,
  },
  {
    id: "codex-api-key",
    method: "codex-api-key",
    group: "codex",
    title: "OpenAI API Key",
    subtitle: "Connect with an API key managed by the app.",
    icon: <KeyFilledIcon className="h-5 w-5" />,
  },
]

export function BillingMethodPage() {
  const setBillingMethod = useSetAtom(billingMethodAtom)
  const setCodexOnboardingCompleted = useSetAtom(codexOnboardingCompletedAtom)
  const [selectedGroup, setSelectedGroup] =
    useState<BillingOptionGroup>("claude-code")
  const [selectedOptionId, setSelectedOptionId] =
    useState<string>("claude-subscription")

  const visibleOptions = useMemo(
    () => billingOptions.filter((option) => option.group === selectedGroup),
    [selectedGroup],
  )

  const selectedOption = useMemo(() => {
    const found = billingOptions.find((option) => option.id === selectedOptionId)
    return found || billingOptions[0]
  }, [selectedOptionId])

  const handleContinue = () => {
    if (
      selectedOption.method === "codex-subscription" ||
      selectedOption.method === "codex-api-key"
    ) {
      setCodexOnboardingCompleted(false)
    }

    setBillingMethod(selectedOption.method)
  }

  return (
    <div className="onboarding-stage bg-background select-none">
      <div
        className="fixed left-0 right-0 top-0 h-10"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      />

      <div className="onboarding-panel w-full max-w-[520px] space-y-6 px-1 py-1">
        <div className="space-y-2 text-center">
          <p className="onboarding-kicker">Agent Control Plane</p>
          <h1 className="onboarding-title">Choose your model gateway</h1>
          <p className="onboarding-subtitle">
            Pick an auth mode now. You can switch providers later from settings.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/80 bg-card/65 p-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedGroup("claude-code")
              setSelectedOptionId("claude-subscription")
            }}
            className={cn(
              "onboarding-muted-action px-3 transition",
              selectedGroup === "claude-code"
                ? "bg-foreground text-background shadow"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Claude Code
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedGroup("codex")
              setSelectedOptionId("codex-subscription")
            }}
            className={cn(
              "onboarding-muted-action px-3 transition",
              selectedGroup === "codex"
                ? "bg-foreground text-background shadow"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Codex
          </button>
        </div>

        <div className="space-y-2">
          {visibleOptions.map((option) => {
            const isSelected = selectedOptionId === option.id

            return (
              <button
                key={option.id}
                onClick={() => setSelectedOptionId(option.id)}
                data-selected={isSelected}
                className="onboarding-option relative w-full p-4 text-left"
              >
                {isSelected && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50",
                      isSelected ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {option.icon}
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tracking-tight">{option.title}</span>
                      {option.recommended && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{option.subtitle}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={handleContinue}
          className="onboarding-action w-full bg-primary text-primary-foreground transition hover:bg-primary/90"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
