"use client"

import { useSetAtom } from "jotai"
import { ChevronLeft } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { ClaudeCodeIcon, IconSpinner } from "../../components/ui/icons"
import { Input } from "../../components/ui/input"
import { Logo } from "../../components/ui/logo"
import {
  anthropicOnboardingCompletedAtom,
  billingMethodAtom,
} from "../../lib/atoms"
import { trpc } from "../../lib/trpc"

type AuthFlowState =
  | { step: "idle" }
  | { step: "starting" }
  | {
      step: "waiting_url"
      sandboxId: string
      sandboxUrl: string
      sessionId: string
    }
  | {
      step: "has_url"
      sandboxId: string
      oauthUrl: string
      sandboxUrl: string
      sessionId: string
    }
  | { step: "submitting" }
  | { step: "error"; message: string }

export function AnthropicOnboardingPage() {
  const [flowState, setFlowState] = useState<AuthFlowState>({ step: "idle" })
  const [authCode, setAuthCode] = useState("")
  const [userClickedConnect, setUserClickedConnect] = useState(false)
  const [urlOpened, setUrlOpened] = useState(false)
  const [savedOauthUrl, setSavedOauthUrl] = useState<string | null>(null)
  const [ignoredExistingToken, setIgnoredExistingToken] = useState(false)
  const [isUsingExistingToken, setIsUsingExistingToken] = useState(false)
  const [existingTokenError, setExistingTokenError] = useState<string | null>(null)
  const urlOpenedRef = useRef(false)
  const setAnthropicOnboardingCompleted = useSetAtom(
    anthropicOnboardingCompletedAtom
  )
  const setBillingMethod = useSetAtom(billingMethodAtom)

  const handleBack = () => {
    setBillingMethod(null)
  }

  const formatTokenPreview = (token: string) => {
    const trimmed = token.trim()
    if (trimmed.length <= 16) return trimmed
    return `${trimmed.slice(0, 19)}...${trimmed.slice(-6)}`
  }

  // tRPC mutations
  const startAuthMutation = trpc.claudeCode.startAuth.useMutation()
  const submitCodeMutation = trpc.claudeCode.submitCode.useMutation()
  const openOAuthUrlMutation = trpc.claudeCode.openOAuthUrl.useMutation()
  const importSystemTokenMutation = trpc.claudeCode.importSystemToken.useMutation()
  // Disabled: importing CLI token is broken — access tokens expire in ~8 hours
  // and we don't store the refresh token. Always use sandbox OAuth flow instead.
  // const existingTokenQuery = trpc.claudeCode.getSystemToken.useQuery()
  // const existingToken = existingTokenQuery.data?.token ?? null
  const existingToken = null
  const hasExistingToken = false
  const checkedExistingToken = true
  const shouldOfferExistingToken = false

  // Poll for OAuth URL
  const pollStatusQuery = trpc.claudeCode.pollStatus.useQuery(
    {
      sandboxUrl: flowState.step === "waiting_url" ? flowState.sandboxUrl : "",
      sessionId: flowState.step === "waiting_url" ? flowState.sessionId : "",
    },
    {
      enabled: flowState.step === "waiting_url",
      refetchInterval: 1500,
    }
  )

  // Auto-start auth on mount
  useEffect(() => {
    if (!checkedExistingToken || shouldOfferExistingToken) return

    if (flowState.step === "idle") {
      setFlowState({ step: "starting" })
      startAuthMutation.mutate(undefined, {
        onSuccess: (result) => {
          setFlowState({
            step: "waiting_url",
            sandboxId: result.sandboxId,
            sandboxUrl: result.sandboxUrl,
            sessionId: result.sessionId,
          })
        },
        onError: (err) => {
          setFlowState({
            step: "error",
            message: err.message || "Failed to start authentication",
          })
        },
      })
    }
  }, [flowState.step, startAuthMutation, checkedExistingToken, shouldOfferExistingToken])

  // Update flow state when we get the OAuth URL
  useEffect(() => {
    if (flowState.step === "waiting_url" && pollStatusQuery.data?.oauthUrl) {
      setSavedOauthUrl(pollStatusQuery.data.oauthUrl)
      setFlowState({
        step: "has_url",
        sandboxId: flowState.sandboxId,
        oauthUrl: pollStatusQuery.data.oauthUrl,
        sandboxUrl: flowState.sandboxUrl,
        sessionId: flowState.sessionId,
      })
    } else if (
      flowState.step === "waiting_url" &&
      pollStatusQuery.data?.state === "error"
    ) {
      setFlowState({
        step: "error",
        message: pollStatusQuery.data.error || "Failed to get OAuth URL",
      })
    }
  }, [pollStatusQuery.data, flowState])

  // Open URL in browser when ready (after user clicked Connect)
  useEffect(() => {
    if (
      flowState.step === "has_url" &&
      userClickedConnect &&
      !urlOpenedRef.current
    ) {
      urlOpenedRef.current = true
      setUrlOpened(true)
      // Use Electron's shell.openExternal via tRPC
      openOAuthUrlMutation.mutate(flowState.oauthUrl)
    }
  }, [flowState, userClickedConnect, openOAuthUrlMutation])

  // Check if the code looks like a valid Claude auth code (format: XXX#YYY)
  const isValidCodeFormat = (code: string) => {
    const trimmed = code.trim()
    return trimmed.length > 50 && trimmed.includes("#")
  }

  const handleConnectClick = async () => {
    setUserClickedConnect(true)

    if (flowState.step === "has_url") {
      // URL is ready, open it immediately
      urlOpenedRef.current = true
      setUrlOpened(true)
      openOAuthUrlMutation.mutate(flowState.oauthUrl)
    } else if (flowState.step === "error") {
      // Retry on error
      urlOpenedRef.current = false
      setUrlOpened(false)
      setFlowState({ step: "starting" })
      try {
        const result = await startAuthMutation.mutateAsync()
        setFlowState({
          step: "waiting_url",
          sandboxId: result.sandboxId,
          sandboxUrl: result.sandboxUrl,
          sessionId: result.sessionId,
        })
      } catch (err) {
        setFlowState({
          step: "error",
          message:
            err instanceof Error ? err.message : "Failed to start authentication",
        })
      }
    }
    // For idle, starting, waiting_url states - the useEffect will handle opening the URL
    // when it becomes ready (userClickedConnect is now true)
  }

  const handleUseExistingToken = async () => {
    if (!hasExistingToken || isUsingExistingToken) return

    setIsUsingExistingToken(true)
    setExistingTokenError(null)

    try {
      await importSystemTokenMutation.mutateAsync()
      setAnthropicOnboardingCompleted(true)
    } catch (err) {
      setExistingTokenError(
        err instanceof Error ? err.message : "Failed to use existing token"
      )
      setIsUsingExistingToken(false)
    }
  }

  const handleRejectExistingToken = () => {
    setIgnoredExistingToken(true)
    setExistingTokenError(null)
    handleConnectClick()
  }

  // Submit code - reusable for both auto-submit and manual Enter
  const submitCode = async (code: string) => {
    if (!code.trim() || flowState.step !== "has_url") return

    const { sandboxUrl, sessionId } = flowState
    setFlowState({ step: "submitting" })

    try {
      await submitCodeMutation.mutateAsync({
        sandboxUrl,
        sessionId,
        code: code.trim(),
      })
      // Success - mark onboarding as completed
      setAnthropicOnboardingCompleted(true)
    } catch (err) {
      setFlowState({
        step: "error",
        message: err instanceof Error ? err.message : "Failed to submit code",
      })
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAuthCode(value)

    // Auto-submit if the pasted value looks like a valid auth code
    if (isValidCodeFormat(value) && flowState.step === "has_url") {
      // Small delay to let the UI update before submitting
      setTimeout(() => submitCode(value), 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && authCode.trim()) {
      submitCode(authCode)
    }
  }

  const handleOpenFallbackUrl = () => {
    if (savedOauthUrl) {
      openOAuthUrlMutation.mutate(savedOauthUrl)
    }
  }

  const isLoadingAuth =
    flowState.step === "starting" || flowState.step === "waiting_url"
  const isSubmitting = flowState.step === "submitting"

  return (
    <div className="onboarding-stage bg-background select-none">
      {/* Draggable title bar area */}
      <div
        className="fixed left-0 right-0 top-0 h-10"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      />

      {/* Back button - fixed in top left corner below traffic lights */}
      <button onClick={handleBack} className="onboarding-back">
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="onboarding-panel w-full max-w-[520px] space-y-6">
        {/* Header with dual icons */}
        <div className="space-y-2 text-center">
          <p className="onboarding-kicker">Subscription Login</p>
          <h1 className="onboarding-title">Connect Claude Code</h1>
          <p className="onboarding-subtitle">
            Link your subscription and paste the auth code to finish setup.
          </p>
          <div className="mx-auto mt-3 flex w-max items-center gap-2 rounded-full border border-border bg-card/65 p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Logo className="w-5 h-5" fill="white" />
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
              <ClaudeCodeIcon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center space-y-5">
          {/* Existing token prompt */}
          {shouldOfferExistingToken && flowState.step === "idle" && (
            <div className="space-y-4 w-full">
              <div className="rounded-xl border border-border bg-card/60 p-4">
                <p className="text-sm font-medium">
                  Existing Claude Code credentials found
                </p>
                {existingToken && (
                  <pre className="mt-2 whitespace-pre-wrap break-words rounded border border-border/60 bg-background/60 px-2.5 py-2 font-mono text-xs text-foreground">
                    {formatTokenPreview(existingToken)}
                  </pre>
                )}
              </div>
              {existingTokenError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">
                    {existingTokenError}
                  </p>
                </div>
              )}
              <div className="flex w-full gap-2">
                <button
                  onClick={handleRejectExistingToken}
                  disabled={isUsingExistingToken}
                  className="onboarding-muted-action flex flex-1 items-center justify-center border border-border bg-card/70 text-foreground transition hover:bg-card disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Auth with Anthropic
                </button>
                <button
                  onClick={handleUseExistingToken}
                  disabled={isUsingExistingToken}
                  className="onboarding-action flex flex-1 items-center justify-center bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUsingExistingToken ? (
                    <IconSpinner className="h-4 w-4" />
                  ) : (
                    "Use existing token"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Connect Button - shows loader only if user clicked AND loading */}
          {checkedExistingToken &&
            !shouldOfferExistingToken &&
            !urlOpened &&
            flowState.step !== "has_url" &&
            flowState.step !== "error" && (
              <button
                onClick={handleConnectClick}
                disabled={userClickedConnect && isLoadingAuth}
                className="onboarding-action min-w-[100px] bg-primary px-4 text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {userClickedConnect && isLoadingAuth ? (
                  <IconSpinner className="h-4 w-4" />
                ) : (
                  "Connect"
                )}
              </button>
            )}

          {/* Code Input - Show after URL is opened, if has_url (after redirect), or if submitting */}
          {/* No Continue button - auto-submit on valid code paste */}
          {(urlOpened ||
            flowState.step === "has_url" ||
            flowState.step === "submitting") && (
            <div className="w-full space-y-4">
              <div className="relative">
                <Input
                  value={authCode}
                  onChange={handleCodeChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste your authentication code here..."
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
              <p className="text-center text-xs text-muted-foreground">
                A new tab has opened for authentication.
                {savedOauthUrl && (
                  <>
                    {" "}
                    <button
                      onClick={handleOpenFallbackUrl}
                      className="font-semibold text-primary hover:underline"
                    >
                      Didn't open? Click here
                    </button>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Error State */}
          {flowState.step === "error" && (
            <div className="w-full space-y-4">
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{flowState.message}</p>
              </div>
              <button
                onClick={handleConnectClick}
                className="onboarding-muted-action w-full border border-border bg-card/70 text-foreground transition hover:bg-card"
              >
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
