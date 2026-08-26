import type React from 'react';

import { EnglishText } from '@/components/english-text';

export type FeatureCardProps = {
  description: string;
  englishEyebrow: string;
  eyebrow: string;
  title: string;
};

export function FeatureCard({
  description,
  englishEyebrow,
  eyebrow,
  title,
}: FeatureCardProps): React.JSX.Element {
  return (
    <article className="min-h-60 bg-[#fffdf8] p-8">
      <p className="mb-10 text-xs font-semibold tracking-[.14em] text-[#9b5b32]">
        <EnglishText>{englishEyebrow}</EnglishText> / {eyebrow}
      </p>
      <h3 className="font-serif text-2xl leading-tight font-normal">{title}</h3>
      <p className="mt-5 text-sm text-[#7a6d63]">{description}</p>
    </article>
  );
}
