# 0000 - Vite+ Engineering Toolchain And Monorepo

> Module: vite-plus-engineering | Priority: highest | Milestone: Pre-M0 | Status: completed
>
> Source: [SPEC.md](./SPEC.md) and the Vite+ integration research completed on 2026-07-24.

Completed on 2026-07-25. Local acceptance covers the Bun workspace migration, Vite+ quality gates,
package tests and builds, Git hooks, CI configuration, and parallel Expo/Hono development. A remote
Android EAS build remains a release credential check, not a local Pre-M0 blocker.

## Goal

Move Lumina from a single Expo application into a Bun-workspace monorepo. Use Vite+ as the shared
engineering control plane for formatting, linting, type checks, server/shared-code tests, task
orchestration, caching, staged-file checks, and CI.

This is a release gate: complete and validate this module before beginning any M0 or later
product-feature implementation.

The two independently runnable application workspaces are:

- `apps/mobile`: the existing Expo SDK 56 application.
- `apps/server`: the planned Node.js, TypeScript, and Hono backend.

## Non-Goals And Boundaries

Vite+ is not a replacement for Expo CLI, Metro, or EAS Build.

- Mobile development remains `expo start` because Expo uses Metro for React Native bundling.
- Android release binaries remain EAS Build outputs. Expo/Metro owns their production JavaScript
  bundle optimization and minification.
- `vp build` is a Vite/Rolldown web build command. Do not apply it to the native Expo application.
- The Node server should be compiled with `tsc` (or packaged with tsdown only if deployment requires
  it). Do not minify normal server output merely to satisfy a tooling checklist.
- React Native component tests retain the Expo/Jest runtime. Vite+ provides the root orchestration
  command; it does not need to force every test through Vitest.

This division is intentional: one engineering interface, while each runtime keeps the toolchain it
actually requires.

## Target Structure

```text
lumina/
  apps/
    mobile/                 # Current Expo project: src/, assets/, app.json, tsconfig.json
    apps/server/                 # Hono + Prisma application
  packages/
    contracts/              # Add only when API schemas/types are shared by both applications
  docs/
  package.json              # Workspace manifest and root scripts
  vite.config.ts            # Vite+ fmt/lint/check/test/task/staged configuration
  bun.lock
```

`packages/contracts` is deliberately deferred until there is a genuine shared API contract. It can
contain Zod schemas and inferred TypeScript types, but must not pull Node-only code into the mobile
bundle.

## Package Manager And Workspace Policy

- Continue using Bun; the repository already has `bun.lock` and the local environment has Bun
  `1.3.11`.
- Add a root `workspaces` declaration covering `apps/*` and `packages/*`.
- Pin the intended package manager explicitly in the root manifest so local and CI installs are
  deterministic.
- Run dependency installation from the repository root only.
- Keep each workspace's runtime dependencies in its own `package.json`; do not rely on hoisting.
- Ensure the mobile workspace is the only workspace that depends on `expo`, `react-native`, and
  native Expo modules. Prevent duplicate React, React Native, Expo, and native module versions.

Expo SDK 56 supports Bun workspaces and automatically recognizes monorepos. Do not add legacy Metro
`watchFolders`, `resolver.nodeModulesPaths`, `resolver.extraNodeModules`, or
`resolver.disableHierarchicalLookup` settings unless a verified package-specific issue requires one.

## Vite+ Responsibilities

The root `vite.config.ts` is the single source of truth for cross-workspace engineering defaults:

- `fmt`: Oxfmt rules for TypeScript, JSON, Markdown, YAML, and configuration files.
- `lint`: Oxlint defaults with TypeScript type-aware/type-check support.
- `lint.overrides`: a Node environment override for `apps/server/**`; a React/TypeScript override
  for mobile TSX; and test-specific rules.
- `test`: Vitest discovery restricted to server and shared packages.
- `staged`: `vp check --fix` for staged source/config files.
- `run`: named Vite Task commands for orchestration and cacheable quality/build tasks.

Ignore generated and dependency paths from formatting/linting checks:

```text
**/node_modules/**
**/.expo/**
**/dist/**
**/web-build/**
**/coverage/**
**/.vite/**
```

Use package-scoped TypeScript configuration: `apps/mobile/tsconfig.json` continues to extend Expo's
base config, while `apps/server/tsconfig.json` targets Node. Do not merge their compiler options
into one root application tsconfig.

## Command Matrix

| User-facing command    | Owner     | Behavior                                                                  | Caching                                                 |
| ---------------------- | --------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| `vp check`             | Vite+     | Oxfmt + Oxlint + TypeScript checks across the workspace                   | N/A                                                     |
| `vp fmt` / `vp lint`   | Vite+     | Focused formatter or linter run                                           | N/A                                                     |
| `bun run dev`          | Turbo TUI | Runs mobile, server, and landing dev services in switchable panes         | Disabled                                                |
| `vp run test:all`      | Vite Task | Runs server/shared Vitest tests and mobile Jest tests                     | Enabled after stable verification                       |
| `vp run build:all`     | Vite Task | Runs server TypeScript build plus mobile production JS export in parallel | Server build cached; Expo export intentionally uncached |
| `vp run build:android` | Expo/EAS  | Starts Android EAS Build; not a reusable local-cache task                 | Disabled                                                |
| `vp staged`            | Vite+     | Validates/fixes staged source files before commit                         | N/A                                                     |

Package-owned scripts remain the actual runtime commands:

- `@lumina/mobile`: `dev`, `start`, `android`, `ios`, `web`, `test`, `build`, `build:android`.
- `@lumina/server`: `dev`, `build`, `start`, `test`.
- `@lumina/landing`: `dev`, `build`, `start`, `test`, `typecheck`.

The root `bun run dev` script selects the three application packages explicitly and delegates their
long-running `dev` scripts directly to Turborepo. Running Turbo directly is required because Vite
Task captures child-process output, which prevents a nested terminal UI from owning the terminal.
The direct entry point keeps each service's logs in a separate pane; use `Up`/`Down` to change the
selected service and `Enter` to interact with it. Development tasks are always uncached. Cache
deterministic tests and server builds; never cache EAS builds, database migrations, deployments, or
tasks using secret-backed external services. Expo export rewrites its own `dist` input, so Vite+
correctly declines to cache that package build.

The unified test task preserves Vite+'s automatic tracking while excluding `apps/mobile/.expo/**`
and `apps/mobile/dist/**` from cache inputs and outputs. Expo writes development logs and export
artifacts there; those generated files must not invalidate otherwise identical test runs.

## Test Strategy

### Server And Shared Packages

Use Vitest through Vite+: `vp test` for direct test execution, and `vite-plus/test` imports in test
files. Cover Hono routes, environment validation, R2 adapters, Clerk verification adapters, Codex
provider boundaries, and shared contracts.

### Mobile Application

Use Jest with `jest-expo` and React Native Testing Library for Expo/React Native component and hook
tests. Metro-compatible transforms and React Native mocks are the reason this stays on Jest.

The implemented SDK 56-compatible stack is `jest-expo@~56.0.5`, `@react-native/jest-preset@0.85.3`,
and `@testing-library/react-native@13.3.3`. Bun's isolated workspace dependency layout requires
`transformIgnorePatterns: []` so Jest can transform the React Native preset dependencies. Keep this
exception until the installed Expo/Jest toolchain supports Bun's layout without it.

### Unified Entry Point

`vp run test:all` coordinates the package scripts and gives CI one test command. This is the
intended meaning of unified testing for this repository: a consistent developer and CI interface
without compromising React Native compatibility.

## Build And Minification Policy

| Workspace           | Development      | Local production verification            | Release package                    |
| ------------------- | ---------------- | ---------------------------------------- | ---------------------------------- |
| `apps/mobile`       | Expo CLI / Metro | Expo export for the required platform(s) | EAS Build for Android              |
| `apps/server`       | `tsx watch`      | `tsc -p tsconfig.build.json`             | Node deployment artifact/container |
| Future Vite web app | `vp dev`         | `vp build` with Rolldown minification    | Web deployment artifact            |

Do not introduce a Vite config inside `apps/mobile` just to access `vp build`. Vite+ still provides
valuable formatting, lint, type-check, task-runner, cache, and CI capabilities from the workspace
root.

## Implemented Toolchain

- Bun `1.3.11` is the locked workspace package manager.
- Vite+ `0.2.6` supplies Oxfmt, Oxlint, TypeScript checks, Vite Task, staged checks, and the CI
  bootstrap command.
- `vitest@4.1.10` is installed at the root for the server suite and is invoked through `vp test`;
  the server imports test APIs from `vite-plus/test`.
- Expo SDK `56.0.0` remains in `apps/mobile`, with Metro for development and Expo export for local
  production verification.
- `apps/server` uses Hono, `@hono/node-server`, `tsx`, and a NodeNext TypeScript build. It
  deliberately contains only the health-check foundation promised by Pre-M0; Prisma, Clerk, R2, and
  Codex arrive in their later modules.

`vite.config.ts` excludes legacy design material, generated artifacts, and Expo state from automatic
formatting/linting. Source code, configuration, and repository documentation are covered by
`vp check`.

## Implementation Order

1. Before writing any Expo code, re-read the exact
   [Expo SDK 56 documentation](https://docs.expo.dev/versions/v56.0.0/) required by `AGENTS.md`.
2. Create the workspace root manifest and move the existing Expo files into `apps/mobile` without
   changing app behavior.
3. Create `apps/server` with its own manifest, TypeScript config, Hono development/build scripts,
   and ignored environment files.
4. Install local Vite+ dependencies and add the root `vite.config.ts`; do not run automatic
   migration blindly.
5. Implement formatter, lint, and type-check rules, then make `vp check` pass on the moved codebase.
6. Add server Vitest tests and mobile Jest tests; wire them through `test:all`.
7. Add named Vite Task commands. Verify cache hits locally twice before enabling cross-run CI cache.
8. Add Vite+ staged-file hooks and GitHub Actions quality gates.
9. Update `README.md`, `.gitignore`, and `docs/progress.md` only after the corresponding
   implementation and verification land.

All nine steps are complete.

## Validation Checklist

- [x] Root `bun install --frozen-lockfile` succeeds after the workspace migration.
- [x] `bun --filter=@lumina/mobile run dev` starts Expo successfully.
- [x] `bun --filter=@lumina/server run dev` starts Hono successfully.
- [x] `bun run dev` starts Expo Metro on `8081`, Hono on `3000`, and Next.js on `3001` in a
      switchable Turbo TUI with caching disabled.
- [x] `vp check` passes formatter, lint, and type checks.
- [x] `vp run test:all` runs server Vitest and mobile Jest suites.
- [x] `vp run build:all` builds the server and verifies the mobile production export in parallel.
- [x] A second execution of the test task and server build reports a Vite Task cache hit; Expo
      export is intentionally uncached because it modifies `dist`.
- [x] GitHub Actions runs the same root check, test, and build commands using
      `voidzero-dev/setup-vp`.
- [deferred] Android EAS Build requires a configured Expo project and release credentials.
  `vp run build:android` is wired as the independent release command and is excluded from local
  acceptance.

## Risks And Decisions

- Do not run `vp migrate` as the first migration step. It rewrites dependencies, scripts, and
  configuration and assumes a conventional Vite migration; Lumina is an Expo-first app that needs a
  deliberate workspace move first.
- Vite Task caching runs commands in a clean environment. Explicitly track only non-secret
  configuration values that should affect cache keys. Never place Clerk, R2, database, or Codex
  secrets in task cache configuration.
- The root Vite+ package and global `vp` CLI must be version-compatible. Upgrade them through the
  documented Vite+ flow and re-run check/test/build after each upgrade.
- Keep production mobile builds isolated from local build caches, because EAS credentials and remote
  build state make them non-deterministic.

## References

- [Vite+ repository and command overview](https://github.com/voidzero-dev/vite-plus)
- [Vite+ monorepo guide](https://viteplus.dev/guide/monorepo)
- [Vite+ check guide](https://viteplus.dev/guide/check)
- [Vite+ task caching guide](https://viteplus.dev/guide/cache)
- [Vite+ test guide](https://viteplus.dev/guide/test)
- [Vite+ CI guide](https://viteplus.dev/guide/ci)
- [Expo monorepo guide](https://docs.expo.dev/guides/monorepos/)
- [Expo unit testing guide](https://docs.expo.dev/develop/unit-testing/)
