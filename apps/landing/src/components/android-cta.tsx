import type React from 'react';

import { Trans } from '@lingui/react/macro';
import { getAndroidDownloadUrl } from '@/lib/android-download';

export interface AndroidCtaProps {
  className?: string;
  compact?: boolean;
}

export function AndroidCta({ className, compact = false }: AndroidCtaProps): React.JSX.Element {
  const href = getAndroidDownloadUrl();
  const ctaClassName = [
    'inline-flex w-max cursor-pointer items-center justify-center rounded-full border border-[#201914] bg-[#201914] font-semibold text-[#fffdf8] transition duration-200 hover:-translate-y-0.5 hover:border-[#9b5b32] hover:bg-[#9b5b32] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9b5b32]',
    compact ? 'min-h-10 px-4 py-2 text-xs' : 'min-h-12 px-6 py-2.5',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <a className={ctaClassName} href={href} rel="noreferrer" target="_blank">
        <span>
          <Trans>Download for Android</Trans>
        </span>
      </a>
    );
  }

  return (
    <button className={ctaClassName} type="button">
      <span>
        <Trans>Download for Android</Trans>
      </span>
    </button>
  );
}
