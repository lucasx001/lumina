# Lumina

Lumina is an Android-first AI wallpaper application. The repository is a Bun workspace:

```text
apps/mobile  Expo SDK 56 application
apps/server  Hono API application
apps/landing Next.js App Router landing page
```

Vite+ provides the shared formatting, linting, type-checking, test orchestration, task cache, and
staged-file workflow. Expo/Metro and EAS continue to own mobile development and Android release
builds. Turborepo provides the interactive terminal UI for the long-running development services.

## Setup

```powershell
irm https://viteplus.dev/install.ps1 | iex
vp install --frozen-lockfile
vp config --no-agent
```

## Commands

```powershell
bun run dev
vp check
vp run test:all
vp run build:all
vp run build:android
bun run mobile:android
vp staged
```

`bun run dev` opens a task-based terminal UI for the mobile, server, and landing services. Use
`Up`/`Down` (or `k`/`j`) to select a service, `Enter` to interact with it, and `Ctrl+Z` to return to
the task list. Press `m` to show all available shortcuts.

`bun run mobile:android` builds and installs the Android debug app on a running emulator or a
connected device. The server health endpoint is available at `http://localhost:3000/health` when the
server runs. The landing page can be run directly with `bun --filter=@lumina/landing run dev` and is
available at `http://localhost:3001` in development.
