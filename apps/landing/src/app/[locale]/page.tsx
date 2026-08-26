import { Trans } from '@lingui/react/macro';
import { setI18n } from '@lingui/react/server';
import { isSupportedLocale } from '@lumina/i18n';
import { createLandingI18n } from '@lumina/i18n/landing';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AndroidCta } from '@/components/android-cta';
import { DevicePreview, type PreviewVariant } from '@/components/device-preview';
import { InteractiveIdeaPreview } from '@/components/interactive-idea-preview';

type PageProps = { params: Promise<{ locale: string }> };

const workflow: readonly { id: string; number: string; variant: PreviewVariant }[] = [
  { id: 'describe', number: '01', variant: 'night' },
  { id: 'refine', number: '02', variant: 'bloom' },
  { id: 'apply', number: '03', variant: 'aurora' },
];

const containerClass = 'mx-auto w-[min(calc(100%_-_40px),1180px)]';
const eyebrowClass = 'mb-6 text-[.67rem] font-semibold tracking-[.16em] text-[#9b5b32]';
const displayClass =
  "font-[Georgia,'Times_New_Roman',serif] font-normal tracking-[-.055em] text-[#201914]";

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  setI18n(await createLandingI18n(locale));
  const otherLocale = locale === 'zh-CN' ? 'en' : 'zh-CN';
  const currentYear = new Date().getFullYear();

  return (
    <>
      <a
        className="fixed top-3 left-3 z-50 -translate-y-[180%] rounded-full bg-[#201914] px-4 py-2.5 text-[#fffdf8] transition focus:translate-y-0"
        href="#content"
      >
        <Trans>Skip to content</Trans>
      </a>
      <header className="sticky top-0 z-40 border-b border-[#ded2c3c7] bg-[#fbf6eee0] backdrop-blur-lg">
        <div
          className={`${containerClass} grid min-h-19 grid-cols-[1fr_auto] items-center gap-x-5 gap-y-2 py-2.5 md:min-h-20.5 md:grid-cols-[1fr_auto_auto]`}
        >
          <a
            aria-label="Lumina"
            className="font-serif text-2xl font-normal tracking-[-.045em] italic"
            href="#top"
          >
            Lumina
          </a>
          <nav
            aria-label="Main navigation"
            className="col-span-full row-start-2 flex gap-6 overflow-x-auto text-[.72rem] tracking-[.08em] whitespace-nowrap text-[#7a6d63] uppercase md:col-span-1 md:row-start-auto"
          >
            <a
              className="flex min-h-10 items-center transition hover:text-[#9b5b32]"
              href="#workflow"
            >
              <Trans>Workflow</Trans>
            </a>
            <a
              className="flex min-h-10 items-center transition hover:text-[#9b5b32]"
              href="#features"
            >
              <Trans>Features</Trans>
            </a>
            <Link
              className="flex min-h-10 items-center transition hover:text-[#9b5b32]"
              href={`/${otherLocale}`}
            >
              <Trans>中文 / English</Trans>
            </Link>
          </nav>
          <AndroidCta className="justify-self-end" compact />
        </div>
      </header>
      <main id="content">
        <section className="overflow-hidden border-b border-[#ded2c3]" id="top">
          <div
            className={`${containerClass} grid min-h-[calc(100svh-76px)] py-[clamp(76px,11vw,130px)] md:min-h-[calc(100svh-82px)] md:grid-cols-[minmax(0,1.05fr)_minmax(320px,.76fr)] md:items-center md:gap-15 md:py-17.5`}
          >
            <div className="relative z-10 self-center">
              <p className={eyebrowClass}>LUMINA · YOUR WALLPAPER STUDIO</p>
              <h1
                className={`${displayClass} max-w-[690px] text-[clamp(3.5rem,12vw,7rem)] leading-[.98]`}
              >
                <Trans>Turn a feeling into your wallpaper.</Trans>
              </h1>
              <p className="mt-7.5 max-w-[520px] text-[clamp(1rem,2vw,1.15rem)] text-[#7a6d63]">
                <Trans>
                  Describe a mood. Lumina helps you create it, collect it, and make it part of every
                  day.
                </Trans>
              </p>
              <AndroidCta className="mt-8.5" />
              <p className="mt-3 text-[.7rem] tracking-[.05em] text-[#7a6d63]">
                <Trans>Made for Android</Trans>
              </p>
            </div>
            <InteractiveIdeaPreview locale={locale} />
          </div>
        </section>

        <section
          className="border-b border-[#ded2c3] bg-[#fffdf8] py-[clamp(88px,11vw,148px)]"
          id="workflow"
        >
          <div className={containerClass}>
            <div className="max-w-[800px]">
              <p className={eyebrowClass}>
                <Trans>A SMALL, QUIET RITUAL</Trans>
              </p>
              <h2 className={`${displayClass} text-[clamp(2.5rem,7vw,5rem)] leading-[1.05]`}>
                <Trans>Three steps from a passing thought to a place worth returning to.</Trans>
              </h2>
              <p className="mt-6.5 max-w-[640px] text-[#7a6d63]">
                <Trans>
                  Create without friction, organize by feeling, and revisit whenever you want.
                </Trans>
              </p>
            </div>
            <div className="mt-14.5 grid gap-3.5 md:grid-cols-3">
              {workflow.map((step) => (
                <WorkflowCard key={step.id} {...step} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f1e3cf] py-[clamp(88px,11vw,148px)]" id="features">
          <div
            className={`${containerClass} grid gap-16 lg:grid-cols-[.75fr_1fr] lg:items-start lg:gap-22`}
          >
            <div className="max-w-[800px] lg:sticky lg:top-30">
              <p className={eyebrowClass}>
                <Trans>YOUR PERSONAL LIBRARY</Trans>
              </p>
              <h2 className={`${displayClass} text-[clamp(2.5rem,7vw,5rem)] leading-[1.05]`}>
                <Trans>A home for every atmosphere you create.</Trans>
              </h2>
              <p className="mt-6.5 max-w-[640px] text-[#7a6d63]">
                <Trans>
                  Collections keep related wallpapers together, while a fluid masonry view keeps the
                  images themselves in focus.
                </Trans>
              </p>
            </div>
            <div className="grid overflow-hidden rounded-[20px] border border-[#ded2c3] bg-[#ded2c3] md:grid-cols-2 md:gap-px">
              <FeatureCards />
            </div>
          </div>
        </section>

        <section className="border-t border-[#ded2c3] bg-[#fbf6ee] py-[clamp(88px,11vw,148px)]">
          <div
            className={`${containerClass} relative overflow-hidden rounded-[28px] border border-[#cfa77f] bg-[linear-gradient(135deg,#f4dfc5,#fffaf1_68%)] p-[clamp(42px,8vw,94px)] after:absolute after:top-1/2 after:right-[-12%] after:aspect-square after:w-[min(48vw,480px)] after:-translate-y-1/2 after:rounded-full after:border after:border-[#9b5b322e]`}
          >
            <div className="relative z-10">
              <p className={eyebrowClass}>
                <Trans>YOUR SCREEN, YOUR WORLD</Trans>
              </p>
              <h2
                className={`${displayClass} max-w-[780px] text-[clamp(2.5rem,7vw,5rem)] leading-[1.05]`}
              >
                <Trans>Meet a world you love every time you unlock.</Trans>
              </h2>
              <AndroidCta className="mt-9" />
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#ded2c3] bg-[#fffdf8]">
        <div
          className={`${containerClass} flex flex-col gap-1.5 py-8 text-xs text-[#7a6d63] md:flex-row md:justify-between`}
        >
          <p>
            <Trans>Lumina — AI wallpaper, made personal.</Trans>
          </p>
          <p>© {currentYear} Lumina</p>
        </div>
      </footer>
    </>
  );
}

function WorkflowCard({
  id,
  number,
  variant,
}: {
  id: string;
  number: string;
  variant: PreviewVariant;
}) {
  const content = {
    apply: {
      description: <Trans>Preview the result, then save, share, or apply it to Android.</Trans>,
      title: <Trans>Preview and apply</Trans>,
    },
    describe: {
      description: (
        <Trans>Write down color, light, and mood to give an idea a place to start.</Trans>
      ),
      title: <Trans>Describe an idea</Trans>,
    },
    refine: {
      description: (
        <Trans>
          Keep describing changes, or start with an image and make it feel more like you.
        </Trans>
      ),
      title: <Trans>Refine the details</Trans>,
    },
  }[id] as { description: React.ReactNode; title: React.ReactNode };

  return (
    <article className="relative grid min-h-[310px] grid-cols-[minmax(0,1fr)_88px] gap-4.5 overflow-hidden rounded-[20px] border border-[#ded2c3] bg-[#fbf6ee] p-7 md:min-h-[390px]">
      <div className="relative z-10">
        <p className="mb-10.5 text-[.65rem] tracking-[.14em] text-[#9b5b32]">{number}</p>
        <h3 className="font-serif text-[1.4rem] leading-tight font-normal">{content.title}</h3>
        <p className="mt-5 text-sm text-[#7a6d63]">{content.description}</p>
      </div>
      <DevicePreview
        className="mb-[-78px] w-[92px] self-end rotate-4 even:-rotate-4"
        label="Wallpaper workflow preview"
        variant={variant}
      />
    </article>
  );
}

function FeatureCards() {
  const cardClass = 'min-h-[245px] bg-[#fffdf8] p-[clamp(28px,4vw,40px)]';
  const labelClass = 'mb-10.5 text-[.65rem] tracking-[.14em] text-[#9b5b32]';
  const titleClass = 'font-serif text-[1.4rem] leading-tight font-normal';
  const descriptionClass = 'mt-5 text-sm text-[#7a6d63]';

  return (
    <>
      <article className={cardClass}>
        <p className={labelClass}>CREATE</p>
        <h3 className={titleClass}>
          <Trans>Turn a sentence into a wallpaper.</Trans>
        </h3>
        <p className={descriptionClass}>
          <Trans>Create from a text idea and let color, texture, and mood take shape.</Trans>
        </p>
      </article>
      <article className={cardClass}>
        <p className={labelClass}>EDIT</p>
        <h3 className={titleClass}>
          <Trans>Take an existing image further.</Trans>
        </h3>
        <p className={descriptionClass}>
          <Trans>
            Choose an image, describe the change, and give familiar material a new expression.
          </Trans>
        </p>
      </article>
      <article className={cardClass}>
        <p className={labelClass}>PREVIEW</p>
        <h3 className={titleClass}>
          <Trans>See the final effect on a screen first.</Trans>
        </h3>
        <p className={descriptionClass}>
          <Trans>Check the composition in a device-shaped preview before you apply it.</Trans>
        </p>
      </article>
      <article className={cardClass}>
        <p className={labelClass}>KEEP</p>
        <h3 className={titleClass}>
          <Trans>Save it, share it, and come back anytime.</Trans>
        </h3>
        <p className={descriptionClass}>
          <Trans>
            Keep favorite work on your device, share it with friends, or revisit it in your library.
          </Trans>
        </p>
      </article>
    </>
  );
}
