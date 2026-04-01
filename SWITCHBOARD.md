# Switchboard

This repository is operated by Junction Switchboard.

```switchboard
{
  "version": 1,
  "project": {
    "tracker": {
      "provider": "manual"
    }
  },
  "defaults": {
    "agentProvider": "codex",
    "worktreePrefix": "switchboard",
    "maxConcurrentRuns": 1
  },
  "prompt": {
    "system": "Own the issue end-to-end. Make the code changes, run the relevant checks, and leave the branch ready for review.",
    "successDefinition": "The issue is implemented, relevant checks pass, and the branch is ready for a Junction code review.",
    "includeIssueDescription": true,
    "includeIssueIdentifier": true
  },
    "labels": {
    "junction:managed-by": "switchboard"
  },
  "automation": {
    "enabled": true,
    "autoStart": false,
    "pollIntervalSeconds": 300
  }
}
```
