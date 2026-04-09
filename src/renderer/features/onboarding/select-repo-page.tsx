"use client"

import { useState } from "react"
import { useAtom } from "jotai"
import { ChevronLeft } from "lucide-react"

import { IconSpinner, GitHubIcon } from "../../components/ui/icons"
import { Logo } from "../../components/ui/logo"
import { Input } from "../../components/ui/input"
import { trpc } from "../../lib/trpc"
import { selectedProjectAtom } from "../agents/atoms"

export function SelectRepoPage() {
  const [, setSelectedProject] = useAtom(selectedProjectAtom)
  const [showClonePage, setShowClonePage] = useState(false)
  const [githubUrl, setGithubUrl] = useState("")

  const utils = trpc.useUtils()

  const openFolder = trpc.projects.openFolder.useMutation({
    onSuccess: (project) => {
      if (project) {
        utils.projects.list.setData(undefined, (oldData) => {
          if (!oldData) return [project]
          const exists = oldData.some((p) => p.id === project.id)
          if (exists) {
            return oldData.map((p) =>
              p.id === project.id ? { ...p, updatedAt: project.updatedAt } : p,
            )
          }
          return [project, ...oldData]
        })

        setSelectedProject({
          id: project.id,
          name: project.name,
          path: project.path,
          gitRemoteUrl: project.gitRemoteUrl,
          gitProvider: project.gitProvider as
            | "github"
            | "gitlab"
            | "bitbucket"
            | null,
          gitOwner: project.gitOwner,
          gitRepo: project.gitRepo,
        })
      }
    },
  })

  const cloneFromGitHub = trpc.projects.cloneFromGitHub.useMutation({
    onSuccess: (project) => {
      if (project) {
        utils.projects.list.setData(undefined, (oldData) => {
          if (!oldData) return [project]
          const exists = oldData.some((p) => p.id === project.id)
          if (exists) {
            return oldData.map((p) =>
              p.id === project.id ? { ...p, updatedAt: project.updatedAt } : p,
            )
          }
          return [project, ...oldData]
        })

        setSelectedProject({
          id: project.id,
          name: project.name,
          path: project.path,
          gitRemoteUrl: project.gitRemoteUrl,
          gitProvider: project.gitProvider as
            | "github"
            | "gitlab"
            | "bitbucket"
            | null,
          gitOwner: project.gitOwner,
          gitRepo: project.gitRepo,
        })
        setShowClonePage(false)
        setGithubUrl("")
      }
    },
  })

  const handleOpenFolder = async () => {
    await openFolder.mutateAsync()
  }

  const handleCloneFromGitHub = async () => {
    if (!githubUrl.trim()) return
    await cloneFromGitHub.mutateAsync({ repoUrl: githubUrl.trim() })
  }

  const handleBack = () => {
    if (cloneFromGitHub.isPending) return
    setShowClonePage(false)
    setGithubUrl("")
  }

  if (showClonePage) {
    return (
      <div className="onboarding-stage bg-background select-none">
        <div
          className="fixed left-0 right-0 top-0 h-10"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        />

        <button
          onClick={handleBack}
          disabled={cloneFromGitHub.isPending}
          className="onboarding-back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="onboarding-panel w-full max-w-[520px] space-y-6">
          <div className="space-y-2 text-center">
            <p className="onboarding-kicker">Repository Intake</p>
            <h1 className="onboarding-title">Clone from GitHub</h1>
            <p className="onboarding-subtitle">
              Paste a full URL or shorthand like <span className="font-semibold text-foreground">owner/repo</span>.
            </p>
          </div>

          <div className="mx-auto flex w-max items-center gap-2 rounded-full border border-border bg-card/70 p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Logo className="h-5 w-5" fill="currentColor" />
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
              <GitHubIcon className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && githubUrl.trim()) {
                    void handleCloneFromGitHub()
                  }
                }}
                placeholder="owner/repo"
                className="h-10 rounded-xl border-border/80 bg-background/70 text-center"
                autoFocus
                disabled={cloneFromGitHub.isPending}
              />
              {cloneFromGitHub.isPending && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <IconSpinner className="h-4 w-4" />
                </div>
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Example: <span className="font-medium text-foreground">facebook/react</span>
            </p>
          </div>

          <button
            onClick={() => void handleCloneFromGitHub()}
            disabled={!githubUrl.trim() || cloneFromGitHub.isPending}
            className="onboarding-action w-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cloneFromGitHub.isPending ? <IconSpinner className="h-4 w-4" /> : "Clone repository"}
          </button>
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

      <div className="onboarding-panel w-full max-w-[520px] space-y-6">
        <div className="space-y-2 text-center">
          <p className="onboarding-kicker">Workspace Setup</p>
          <h1 className="onboarding-title">Bring in your repository</h1>
          <p className="onboarding-subtitle">
            Open a local project or clone a fresh one to launch your first agent run.
          </p>
        </div>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card/70 text-primary">
          <Logo className="h-7 w-7" fill="currentColor" />
        </div>

        <div className="space-y-3">
          <button
            onClick={() => void handleOpenFolder()}
            disabled={openFolder.isPending}
            className="onboarding-action flex w-full items-center justify-center bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {openFolder.isPending ? <IconSpinner className="h-4 w-4" /> : "Open local folder"}
          </button>
          <button
            onClick={() => setShowClonePage(true)}
            disabled={cloneFromGitHub.isPending}
            className="onboarding-muted-action w-full border border-border bg-card/70 text-foreground transition hover:bg-card disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clone from GitHub
          </button>
        </div>
      </div>
    </div>
  )
}
