# Lumina landing page

## Local development

From the repository root, install dependencies and start the landing page:

```bash
bun install --frozen-lockfile
bun --filter=@lumina/landing run dev
```

## Local checks

Run the landing type-check and production build, followed by the workspace check:

```bash
bun --filter=@lumina/landing run typecheck
bun --filter=@lumina/landing run build
bun run check
```

## Vercel Dashboard

Import this repository and create a dedicated project for the landing page. Set **Root Directory**
to `apps/landing`, retain Bun auto-detection from the root `bun.lock`, and deploy. The checked-in
`vercel.json` runs installation and the landing build from the workspace root.

## Vercel CLI

From the repository root, run `vercel link --repo`, select the landing project, then run
`vercel --prod` once the project is linked.

## Enable Android download

Set `NEXT_PUBLIC_ANDROID_DOWNLOAD_URL` to a valid `https:` URL in the Vercel Preview and Production
environment settings. Redeploy, then verify every download CTA opens the destination in a new tab.

## Current intentional state

Do not configure `NEXT_PUBLIC_ANDROID_DOWNLOAD_URL` until a real destination exists. By product
decision, the download CTAs remain visible and inert until then.
