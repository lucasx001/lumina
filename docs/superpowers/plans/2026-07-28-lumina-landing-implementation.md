# Lumina Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a bilingual, minimal Next.js landing page for Lumina in `apps/landing`.

**Architecture:** A static App Router home page composes focused server components for product
storytelling and CSS-based phone/wallpaper previews. A small pure URL utility validates the optional
Android download environment variable; every CTA renders an inert button until that HTTPS URL is
configured. Vercel deploys the new Bun workspace as an independent monorepo project rooted at
`apps/landing`.

**Tech Stack:** Bun 1.3.11, Next.js App Router, React, TypeScript, CSS, Vitest, Vite+, Vercel.

## Global Constraints

- Keep all landing-page code in `apps/landing`; do not change the Expo app or Hono server.
- Use semicolons, single quotes, 100-character print width, strict TypeScript, and `import type`.
- Chinese is the primary copy and English is concise supporting copy within the same static page.
- Do not add a CMS, analytics, authentication, API routes, persistence, external images, or a form.
- Use only CSS and semantic HTML for wallpapers and phone mockups; do not fetch remote imagery.
- All Android CTAs must visibly promise Android download while `NEXT_PUBLIC_ANDROID_DOWNLOAD_URL` is
  unset and must then perform no action.
- Only a valid `https:` value for `NEXT_PUBLIC_ANDROID_DOWNLOAD_URL` may turn a CTA into an external
  link; add `target="_blank"` and `rel="noreferrer"` to that link.
- Preserve static rendering: no client components, React state, data fetches, server actions, or
  route handlers are needed.
- Vercel is configured as a separate project with Root Directory `apps/landing`; use Bun and the
  repository's root `bun.lock`.

---

## File Structure

| Path                                              | Responsibility                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/landing/package.json`                       | Landing workspace identity and dev/build/start/type-check/test scripts.                         |
| `apps/landing/tsconfig.json`                      | Strict Next.js TypeScript settings and `@/*` alias.                                             |
| `apps/landing/next.config.ts`                     | Typed, intentionally minimal Next configuration.                                                |
| `apps/landing/src/app/layout.tsx`                 | Root document, `lang="zh-CN"`, metadata, font, and body shell.                                  |
| `apps/landing/src/app/page.tsx`                   | Static page sections, bilingual copy, and component composition.                                |
| `apps/landing/src/app/globals.css`                | Tokens, page layout, responsive styles, CSS art, focus, and reduced-motion rules.               |
| `apps/landing/src/components/android-cta.tsx`     | Shared inert-or-link Android CTA.                                                               |
| `apps/landing/src/components/device-preview.tsx`  | Semantic, decorative phone preview with CSS variant classes.                                    |
| `apps/landing/src/components/feature-card.tsx`    | Presentational product-capability card.                                                         |
| `apps/landing/src/components/section-heading.tsx` | Bilingual section heading and supporting copy.                                                  |
| `apps/landing/src/lib/android-download.ts`        | Pure HTTPS URL parsing for the optional public environment variable.                            |
| `apps/landing/src/lib/android-download.test.ts`   | Unit coverage for accepted and rejected download URLs.                                          |
| `apps/landing/README.md`                          | Local commands, Vercel dashboard/CLI setup, and future download-URL activation.                 |
| `apps/landing/vercel.json`                        | Project-local framework, install, and build settings for Vercel.                                |
| `config/oxlint-presets.ts`                        | Reusable browser React lint preset, if the current mobile-only preset cannot be reused cleanly. |
| `vite.config.ts`                                  | Include landing source/tests in workspace lint, test, dev, and build orchestration.             |
| `README.md`                                       | Add `apps/landing` to the repository overview and its local command.                            |
| `.gitignore`                                      | Ignore `apps/landing/.next/` build output.                                                      |

### Task 1: Create The Next.js Workspace And Integrate It With The Monorepo

**Files:**

- Create: `apps/landing/package.json`
- Create: `apps/landing/tsconfig.json`
- Create: `apps/landing/next.config.ts`
- Create: `apps/landing/src/app/layout.tsx`
- Create: `apps/landing/src/app/page.tsx`
- Create: `apps/landing/src/app/globals.css`
- Modify: `vite.config.ts`
- Modify: `config/oxlint-presets.ts`
- Modify: `.gitignore`
- Modify: `README.md`

**Interfaces:**

- Consumes: Bun workspace declaration from root `package.json` (`apps/*`) and workspace commands in
  `vite.config.ts`.
- Produces: `@lumina/landing` with `dev`, `build`, `start`, `typecheck`, and `test` scripts; a
  compilable App Router home route at `/`.

- [ ] **Step 1: Add the landing package and install its direct dependencies exactly**

  Create `apps/landing/package.json` with the workspace name and scripts below. Then run the exact
  Bun commands to resolve and lock current stable framework packages rather than copying a stale
  version number.

  ```json
  {
    "name": "@lumina/landing",
    "version": "0.0.0",
    "private": true,
    "scripts": {
      "build": "next build",
      "dev": "next dev",
      "start": "next start",
      "test": "bun --cwd=../.. x vitest run apps/landing/src",
      "typecheck": "tsc --noEmit -p tsconfig.json"
    }
  }
  ```

  Run:

  ```bash
  bun --cwd apps/landing add next@latest react@latest react-dom@latest --exact
  bun --cwd apps/landing add --dev @types/node@latest @types/react@latest @types/react-dom@latest typescript@latest --exact
  ```

- [ ] **Step 2: Add strict Next TypeScript and a minimal typed configuration**

  Create `apps/landing/tsconfig.json` and `apps/landing/next.config.ts`.

  ```json
  {
    "compilerOptions": {
      "allowJs": false,
      "esModuleInterop": true,
      "incremental": true,
      "jsx": "preserve",
      "module": "esnext",
      "moduleResolution": "bundler",
      "noEmit": true,
      "paths": { "@/*": ["./src/*"] },
      "plugins": [{ "name": "next" }],
      "resolveJsonModule": true,
      "strict": true,
      "target": "ES2022"
    },
    "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
  }
  ```

  ```ts
  import type { NextConfig } from 'next';

  const nextConfig: NextConfig = {};

  export default nextConfig;
  ```

- [ ] **Step 3: Add the minimum App Router files and prove the build fails only before dependencies
      are installed**

  Create the root layout and home page with this minimum valid App Router shape. Import
  `./globals.css` from the layout. The implementation in Task 3 replaces the placeholder page.

  ```tsx
  import type { Metadata } from 'next';
  import type { ReactNode } from 'react';

  import './globals.css';

  export const metadata: Metadata = { title: 'Lumina' };

  export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <html lang="zh-CN">
        <body>{children}</body>
      </html>
    );
  }
  ```

  ```tsx
  export default function HomePage() {
    return <main>Lumina</main>;
  }
  ```

- [ ] **Step 4: Extend workspace quality and task orchestration**

  In `config/oxlint-presets.ts`, export `webReactPreset` as the existing `mobileReactPreset` rule
  set because it contains generic React JSX rules and no native-only rule. In `vite.config.ts`:

  - add an `apps/landing/**/*.{ts,tsx}` lint override using `webReactPreset`;
  - add an `apps/landing/**/*.test.ts` test override using the existing Vitest preset;
  - extend `test.include` with `apps/landing/src/**/*.test.ts`;
  - add `@lumina/landing` to `dev:all` and `build:all` filters; and
  - add `apps/landing/.next/**` to formatter and task-output ignore patterns.

  Add `apps/landing/.next/` to `.gitignore`, and update the root README structure/command examples
  to list the new Next.js landing workspace.

- [ ] **Step 5: Run the first workspace validation**

  Run:

  ```bash
  bun --filter=@lumina/landing run typecheck
  bun --filter=@lumina/landing run build
  bun run check
  ```

  Expected: all commands succeed; the build creates only ignored `.next/` output and the existing
  mobile/server checks remain green.

- [ ] **Step 6: Commit the workspace setup**

  ```bash
  git add apps/landing/package.json apps/landing/tsconfig.json apps/landing/next.config.ts apps/landing/src/app config/oxlint-presets.ts vite.config.ts .gitignore README.md bun.lock
  git commit -m "feat(landing): add Next.js workspace"
  ```

### Task 2: Make Android Download Handling Testable And Safe

**Files:**

- Create: `apps/landing/src/lib/android-download.ts`
- Create: `apps/landing/src/lib/android-download.test.ts`
- Create: `apps/landing/src/components/android-cta.tsx`

**Interfaces:**

- Consumes: `NEXT_PUBLIC_ANDROID_DOWNLOAD_URL` at build time and server-component JSX.
- Produces: `getAndroidDownloadUrl(value?: string): string | undefined` and
  `AndroidCta(props: AndroidCtaProps): React.JSX.Element` for all page CTA positions.

- [ ] **Step 1: Write failing URL utility tests**

  Add `apps/landing/src/lib/android-download.test.ts`.

  ```ts
  import { describe, expect, it } from 'vitest';

  import { getAndroidDownloadUrl } from './android-download';

  describe('getAndroidDownloadUrl', () => {
    it('returns a normalized HTTPS URL', () => {
      expect(
        getAndroidDownloadUrl('https://play.google.com/store/apps/details?id=app.lumina'),
      ).toBe('https://play.google.com/store/apps/details?id=app.lumina');
    });

    it.each([undefined, '', '  ', 'http://example.com', 'javascript:alert(1)', 'not a URL'])(
      'returns undefined for %j',
      (value) => {
        expect(getAndroidDownloadUrl(value)).toBeUndefined();
      },
    );
  });
  ```

- [ ] **Step 2: Run the utility test to verify it fails**

  Run:

  ```bash
  bun --filter=@lumina/landing run test
  ```

  Expected: FAIL because `./android-download` does not exist.

- [ ] **Step 3: Implement the minimal HTTPS-only parser**

  Add `apps/landing/src/lib/android-download.ts`.

  ```ts
  export function getAndroidDownloadUrl(value = process.env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL) {
    if (!value?.trim()) return undefined;

    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.toString() : undefined;
    } catch {
      return undefined;
    }
  }
  ```

  Add an explicit return type of `string | undefined` before committing so strict public interfaces
  are self-documenting.

- [ ] **Step 4: Run the utility test to verify it passes**

  Run:

  ```bash
  bun --filter=@lumina/landing run test
  ```

  Expected: PASS with all accepted and rejected values covered.

- [ ] **Step 5: Add the shared CTA component**

  Create `apps/landing/src/components/android-cta.tsx`. It accepts
  `{ className?: string; compact?: boolean }`; it calls `getAndroidDownloadUrl()` once and renders:

  ```tsx
  <a href={href} rel="noreferrer" target="_blank">
    <span>下载 Android</span>
    <span>Download for Android</span>
  </a>
  ```

  when `href` exists, otherwise:

  ```tsx
  <button aria-label="下载 Android / Download for Android" type="button">
    <span>下载 Android</span>
    <span>Download for Android</span>
  </button>
  ```

  Apply the passed `className` in both branches and use the `compact` flag only to select the
  component's documented compact visual class. Do not add an `onClick` handler to the button.

- [ ] **Step 6: Type-check and commit the CTA behavior**

  Run:

  ```bash
  bun --filter=@lumina/landing run test
  bun --filter=@lumina/landing run typecheck
  ```

  Then commit:

  ```bash
  git add apps/landing/src/lib/android-download.ts apps/landing/src/lib/android-download.test.ts apps/landing/src/components/android-cta.tsx
  git commit -m "feat(landing): add safe Android download CTA"
  ```

### Task 3: Compose The Bilingual Landing Page And Minimal Visual System

**Files:**

- Create: `apps/landing/src/components/device-preview.tsx`
- Create: `apps/landing/src/components/feature-card.tsx`
- Create: `apps/landing/src/components/section-heading.tsx`
- Modify: `apps/landing/src/app/layout.tsx`
- Modify: `apps/landing/src/app/page.tsx`
- Modify: `apps/landing/src/app/globals.css`

**Interfaces:**

- Consumes: `AndroidCta` from Task 2.
- Produces: a responsive, static home page with all required sections and CSS-only visual previews.

- [ ] **Step 1: Build the small presentational components**

  Define these explicit prop interfaces:

  ```ts
  type PreviewVariant = 'aurora' | 'bloom' | 'night';

  type DevicePreviewProps = {
    className?: string;
    label: string;
    variant: PreviewVariant;
  };

  type FeatureCardProps = {
    description: string;
    eyebrow: string;
    title: string;
  };

  type SectionHeadingProps = {
    eyebrow: string;
    summary: string;
    title: string;
  };
  ```

  `DevicePreview` must place `label` in a visually hidden span, use `aria-hidden="true"` for its
  internal decorative status/clock layers, and expose only a decorative `figure` to assistive
  technology. `FeatureCard` and `SectionHeading` must use regular heading and paragraph elements.

- [ ] **Step 2: Replace the placeholder home page with the approved content hierarchy**

  In `page.tsx`, render semantic `header`, `main`, `section`, and `footer` elements in this order:

  1. Header with `Lumina`, links to `#workflow` and `#features`, and compact `AndroidCta`.
  2. Hero headed `把想象留在屏幕上。` with English `Make your screen feel like yours.`, supporting
     bilingual copy, `AndroidCta`, and one `DevicePreview` using `aurora`.
  3. Workflow section at `id="workflow"`, titled `从灵感，到每天看见的世界。`, with three numbered
     cards: `描述灵感 / Describe`, `细致调整 / Refine`, and `预览并应用 / Preview & apply`.
  4. Capability section at `id="features"` follows [SPEC](../../SPEC.md): Add opens style, prompt,
     and category selection; generated wallpapers belong to the account and appear under Home
     category cards; previews offer Android application, save, and share. Image editing is labeled
     coming soon, with a retained entry point.
  5. Closing CTA panel with `让每次解锁，都遇见你喜欢的世界。`, a supporting English translation,
     and `AndroidCta`.
  6. Footer with `Lumina — AI wallpaper, made personal.` and the current year.

  Keep all copy in module-level readonly arrays where repeated card structures are mapped. Do not
  import a client-only dependency or add `'use client'`.

- [ ] **Step 3: Add metadata and document styling**

  Expand `layout.tsx` metadata to include a bilingual title, the description
  `选择风格，生成壁纸，按类型收藏你的灵感。 Create and organize personal AI wallpapers.`, and a
  `robots` object allowing indexing. Omit `metadataBase` until a real canonical production URL
  exists. Use a system font stack rather than `next/font/google` so Latin and Simplified Chinese
  text receive consistent fallback coverage without an external font dependency.

- [ ] **Step 4: Implement the responsive CSS visual system**

  In `globals.css`, implement these tokens and behaviors:

  ```css
  :root {
    --background: #101114;
    --surface: #17181c;
    --card: #1a1b20;
    --text: #f4f5f7;
    --muted: #b6b8c0;
    --accent: #8ab4ff;
    --border: #303238;
  }
  ```

  Build the page around a centered `min(100% - 40px, 1120px)` container; give CTA controls a minimum
  44px block size, visible `:focus-visible` outlines, and no remote background images. Use
  radial/linear gradients, pseudo-elements, and clipping inside `.device-preview` for the `aurora`,
  `bloom`, and `night` variants. Add breakpoints at `768px` and `1024px` so the hero/workflow grids
  collapse appropriately. Within `@media (prefers-reduced-motion: reduce)`, set every decorative
  animation and transition to a near-zero duration.

- [ ] **Step 5: Verify presentation locally**

  Run:

  ```bash
  bun --filter=@lumina/landing run dev
  ```

  Inspect `http://localhost:3000` at 1440px and 390px widths. Confirm that header, hero, and closing
  CTA buttons visibly show download copy but do not navigate while the environment variable is
  absent; verify headings, keyboard focus, and reduced-motion styles in browser devtools.

- [ ] **Step 6: Run static validation and commit the visual page**

  Run:

  ```bash
  bun --filter=@lumina/landing run test
  bun --filter=@lumina/landing run typecheck
  bun --filter=@lumina/landing run build
  bun run check
  ```

  Then commit:

  ```bash
  git add apps/landing/src/app apps/landing/src/components
  git commit -m "feat(landing): build bilingual product page"
  ```

### Task 4: Add Vercel Deployment Instructions And Exercise Both CTA States

**Files:**

- Create: `apps/landing/vercel.json`
- Create: `apps/landing/README.md`
- Modify: `apps/landing/src/lib/android-download.test.ts`
- Modify: `docs/superpowers/specs/2026-07-28-lumina-landing-design.md`

**Interfaces:**

- Consumes: `@lumina/landing` scripts from Task 1 and `getAndroidDownloadUrl` from Task 2.
- Produces: repeatable Vercel setup instructions and verified inert/link Android CTA behavior.

- [ ] **Step 1: Extend the URL test with a trailing-slash normalization assertion**

  Add this test case to `android-download.test.ts`:

  ```ts
  it('normalizes a valid HTTPS origin', () => {
    expect(getAndroidDownloadUrl('https://example.com')).toBe('https://example.com/');
  });
  ```

- [ ] **Step 2: Run the focused test to verify it fails before the parser is corrected, if
      necessary**

  Run:

  ```bash
  bun --filter=@lumina/landing run test
  ```

  Expected: the new assertion passes immediately when Task 2 uses `URL#toString`; otherwise adjust
  only the parser to return `url.toString()` and rerun until it passes.

- [ ] **Step 3: Add Vercel project configuration**

  Create `apps/landing/vercel.json`:

  ```json
  {
    "framework": "nextjs",
    "installCommand": "cd ../.. && bun install --frozen-lockfile",
    "buildCommand": "cd ../.. && bun --filter=@lumina/landing run build"
  }
  ```

  This assumes Vercel Project Settings uses `apps/landing` as Root Directory and has source files
  outside that directory available, which is Vercel's default for current monorepo projects.

- [ ] **Step 4: Write precise deployment and future-activation instructions**

  Create `apps/landing/README.md` with these exact sections:

  - **Local development:** `bun install --frozen-lockfile` then
    `bun --filter=@lumina/landing run dev`.
  - **Local checks:** test, type-check, production build, and workspace `bun run check` commands.
  - **Vercel Dashboard:** import the repository, create a dedicated project, set Root Directory to
    `apps/landing`, retain Bun auto-detection from root `bun.lock`, and deploy.
  - **Vercel CLI:** from repository root run `vercel link --repo`, select the landing project, then
    run `vercel --prod` once the project is linked.
  - **Enable Android download:** set `NEXT_PUBLIC_ANDROID_DOWNLOAD_URL` to a valid `https:` URL in
    Preview and Production settings, redeploy, and verify every CTA opens a new tab.
  - **Current intentional state:** do not configure the variable until a real destination exists;
    download CTAs remain visible and inert by product decision.

  Add a short Vercel deployment note to the accepted design spec that links to this README.

- [ ] **Step 5: Exercise both environment states and perform full checks**

  Run the full static test/check sequence with the variable absent, then build with a valid
  temporary value:

  ```bash
  bun --filter=@lumina/landing run test
  bun --filter=@lumina/landing run typecheck
  bun --filter=@lumina/landing run build
  NEXT_PUBLIC_ANDROID_DOWNLOAD_URL=https://example.com bun --filter=@lumina/landing run build
  bun run check
  ```

  Expected: both builds pass; absent state renders buttons and valid state renders external anchors.

- [ ] **Step 6: Deploy a Vercel preview only when the account is already authenticated and linked**

  First inspect the local Vercel status:

  ```bash
  vercel whoami
  find .vercel -maxdepth 1 -type f -print
  ```

  If these commands show an authenticated account and repository-level linking, run:

  ```bash
  vercel --cwd apps/landing --yes
  ```

  Otherwise, stop after the documented manual steps; do not create or link a Vercel project without
  the account owner's explicit action.

- [ ] **Step 7: Commit deployment readiness**

  ```bash
  git add apps/landing/vercel.json apps/landing/README.md apps/landing/src/lib/android-download.test.ts docs/superpowers/specs/2026-07-28-lumina-landing-design.md
  git commit -m "docs(landing): add Vercel deployment guide"
  ```

## Final Verification Checklist

- [ ] `git status --short` contains only intentional landing-page changes before the final commit.
- [ ] `bun --filter=@lumina/landing run test` passes.
- [ ] `bun --filter=@lumina/landing run typecheck` passes.
- [ ] `bun --filter=@lumina/landing run build` passes with and without the optional HTTPS variable.
- [ ] `bun run check` passes for the full workspace.
- [ ] Local browser inspection confirms responsive layout, visible focus, semantic heading order,
      reduced-motion handling, and three inert download controls when no URL is set.
- [ ] The Vercel project is configured to Root Directory `apps/landing`, or the README gives every
      necessary user-owned step to do so.
