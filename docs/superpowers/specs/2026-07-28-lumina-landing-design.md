# Lumina Landing Page Design

## Goal

Create a bilingual (Chinese and English) product landing page for Lumina, an Android-first AI
wallpaper application. The page should communicate the creation-to-application workflow and make
Android download the primary action. It will live in `apps/landing`, use Next.js App Router, and be
deployed as an independent Vercel project.

The selected creative direction is **minimal product**: a dark, restrained layout, expressive
wallpaper imagery, precise typography, and a small number of focused calls to action.

## Scope

### Included

- One responsive, static homepage at `/`.
- Chinese and English copy presented together in a single page. Chinese is primary; English is a
  concise supporting translation.
- A dark visual system that is compatible with Lumina's existing dark app palette.
- CSS-created wallpaper art and phone mockups, so the first deployment has no remote-image,
  licensing, or image-hosting dependency.
- A primary Android download CTA in the header, hero, and final section.
- Product storytelling follows [the product specification](../../SPEC.md): sign in, open Add, choose
  a style, enter a short prompt, select a category, and generate one wallpaper. The account owns all
  categories and wallpapers; Home shows category cards leading to wallpaper previews, Android
  application, save, and share. Image editing is explicitly labeled as coming soon.
- Metadata, favicon, and responsive behavior suitable for social sharing and search previews.
- Vercel configuration and project documentation sufficient to deploy from a monorepo subdirectory.

### Excluded

- Email capture, authentication, analytics, CMS, API routes, or any server-side persistence.
- A live Android distribution integration: no URL is available yet.
- Changes to the Expo app or existing Hono server.
- New raster artwork or use of user data.

## User Experience

### Page structure

1. **Header** — Lumina wordmark, compact bilingual navigation, and
   `下载 Android / Download for Android` CTA.
2. **Hero** — Large bilingual value statement, a short supporting line, Android CTA, and one
   prominent phone mockup that frames an abstract wallpaper. The hero explains the promise: make a
   wallpaper that feels personal.
3. **Workflow** — Three steps: choose a style and describe an idea in Add; select a category and
   generate; open the saved wallpaper from Home, preview, and apply it.
4. **Capability grid** — Account-owned categories, AI generation, home/lock previews, Android
   application, save/share, and an image-editing entry explicitly labeled coming soon.
5. **Closing CTA** — Restates Android availability and the core promise in a high-contrast panel.
6. **Footer** — Product name, short bilingual descriptor, and a lightweight copyright line.

### CTA behavior

The visible label must state that Android is downloadable: `下载 Android` with
`Download for Android` as support text. Until a real distribution URL exists, clicking any download
CTA deliberately does nothing: it must not navigate, submit a form, or display an error. The CTA is
visually a button and has an accessible button role/label. This preserves the desired launch copy
without introducing an invalid external link.

When a URL becomes available, a single public environment variable will provide it. The CTA
component will render a normal external anchor only when that variable is non-empty; otherwise it
will render the intentionally inert button state. No source edit is needed to enable the link.

### Responsive rules

- Desktop: hero copy and device mockup share the first viewport; workflow cards form a row.
- Tablet: hero remains balanced while the mockup reduces in scale.
- Mobile: the hero stacks copy before mockup; all grids become one column; touch targets remain at
  least 44 pixels tall.
- Decoration never obscures readable text or the primary CTA.

## Architecture

`apps/landing` will be a self-contained Bun workspace package using current stable Next.js with the
App Router and TypeScript. The landing page is static and needs no client-side data fetching, React
state, or server actions.

```text
apps/landing/
  src/app/
    layout.tsx       # metadata, font, global shell
    page.tsx         # static page composition
    globals.css      # design tokens, responsive layouts, visual art
  src/components/
    android-cta.tsx  # inert/link CTA chosen from public environment variable
    device-preview.tsx
    feature-card.tsx
    section-heading.tsx
  public/            # favicon and any later local-only assets
  next.config.ts
  package.json
  tsconfig.json
```

The route stays a Server Component. Only `AndroidCta` is conditional UI, and it can also remain a
Server Component because its public build-time environment variable is read during static rendering.
The phone and wallpaper visuals are semantic HTML and CSS, not canvas rendering or external images.

## Deployment

Vercel will be configured as a distinct project whose root directory is `apps/landing`. Its install
command runs from the workspace root via Bun, and its build command runs the landing package's
`build` script. The project requires no secrets. A future `NEXT_PUBLIC_ANDROID_DOWNLOAD_URL`
environment variable enables functional download links in Preview and Production.

The deployment checklist will document Vercel's root directory, Bun version alignment, build
command, and the optional environment variable. The production deploy itself remains a user-owned
Vercel account action unless credentials are already configured locally.

For the precise dashboard, CLI, and future Android-download activation steps, see the
[landing deployment guide](../../../apps/landing/README.md).

## Accessibility And Failure Handling

- Use semantic `header`, `main`, `section`, `footer`, headings in order, and readable contrast.
- Honor `prefers-reduced-motion`; decorative motion, if added, must be disabled or minimized.
- Give CSS art and decorative gradients no misleading alternative text; label meaningful controls.
- The absent download URL is expected, not an error. The inert CTA must remain keyboard-focusable
  without triggering navigation or generating a console error.
- If the public download URL is malformed at build time, rendering still succeeds and the button
  remains inert. Valid `https:` URLs become external links with safe `rel` attributes.

## Verification

1. Run the landing package's lint/type-check and production build.
2. Start the local landing app and visually inspect desktop and narrow mobile layouts.
3. Verify all three CTA locations are inert when `NEXT_PUBLIC_ANDROID_DOWNLOAD_URL` is unset.
4. Verify all three CTA locations become a correctly labeled external link when the variable is a
   valid HTTPS URL.
5. Check keyboard navigation, focus visibility, heading order, and reduced-motion behavior.
6. Deploy a Vercel preview, confirm the page loads, and set the optional environment variable only
   when an actual Android download destination exists.

## Acceptance Criteria

- `apps/landing` is a standalone Next.js App Router workspace that produces a static homepage.
- The page is clearly bilingual, visually follows the selected minimal product direction, and is
  responsive from mobile through desktop.
- The Android download CTA appears in header, hero, and final section, shows downloadable copy, and
  is intentionally inert while no URL is configured.
- Existing Lumina functionality is represented accurately without needing API credentials or edits
  to the mobile/server applications.
- A production build succeeds locally and is deployable through a Vercel project rooted at
  `apps/landing`.
