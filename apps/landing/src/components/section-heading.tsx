import type React from 'react';

import { EnglishText } from '@/components/english-text';

export type SectionHeadingProps = {
  englishEyebrow: string;
  englishSummary: string;
  eyebrow: string;
  summary: string;
  title: string;
};

export function SectionHeading({
  englishEyebrow,
  englishSummary,
  eyebrow,
  summary,
  title,
}: SectionHeadingProps): React.JSX.Element {
  return (
    <div className="max-w-3xl">
      <p className="mb-6 text-xs font-semibold tracking-[.16em] text-[#9b5b32]">
        <EnglishText>{englishEyebrow}</EnglishText> / {eyebrow}
      </p>
      <h2 className="font-serif text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] font-normal tracking-[-.055em]">
        {title}
      </h2>
      <p className="mt-6 max-w-2xl text-[#7a6d63]">
        {summary} <EnglishText>{englishSummary}</EnglishText>
      </p>
    </div>
  );
}
