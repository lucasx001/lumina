'use client';

import { useState } from 'react';

import { DevicePreview, type PreviewVariant } from '@/components/device-preview';

type Idea = {
  copy: string;
  name: string;
  variant: PreviewVariant;
};

export function InteractiveIdeaPreview({ locale }: { locale: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const ideas: Idea[] =
    locale === 'zh-CN'
      ? [
          { copy: '雨后的深蓝夜色，远处有一点温暖的灯。', name: '夜色', variant: 'night' },
          { copy: '清晨森林里的薄雾，安静、柔和、有呼吸感。', name: '森林', variant: 'aurora' },
          { copy: '像花瓣一样舒展的霞光，温柔但不甜腻。', name: '晨曦', variant: 'bloom' },
        ]
      : [
          {
            copy: 'A deep blue night after rain, with one warm light in the distance.',
            name: 'Night',
            variant: 'night',
          },
          {
            copy: 'Morning mist in a quiet forest, soft, spacious, and alive.',
            name: 'Forest',
            variant: 'aurora',
          },
          {
            copy: 'Dawn unfolding like petals, gentle without feeling sweet.',
            name: 'Dawn',
            variant: 'bloom',
          },
        ];
  const activeIdea = ideas[activeIndex];

  return (
    <div className="relative mt-16 grid min-h-[590px] place-items-center md:mt-0 md:min-h-[650px]">
      <div
        aria-hidden="true"
        className="absolute aspect-square w-[min(110vw,600px)] rounded-full bg-[radial-gradient(circle,#efd8ba_0,rgba(239,216,186,.4)_44%,transparent_70%)]"
      />
      <DevicePreview
        className="w-[min(68vw,255px)] rotate-5 md:w-[min(27vw,270px)]"
        dateLabel={locale === 'zh-CN' ? '星期三 · 7月29日' : 'Wednesday · July 29'}
        label="Lumina wallpaper preview"
        variant={activeIdea.variant}
      />
      <button
        aria-label={locale === 'zh-CN' ? '切换到下一条壁纸灵感' : 'Show the next wallpaper idea'}
        className="absolute bottom-[4%] left-0 z-20 w-[min(82%,330px)] cursor-pointer rounded-2xl border border-[#ded2c3] bg-[#fffdf8eb] px-5.5 py-5 text-left text-[#201914] shadow-[0_16px_42px_rgba(92,63,39,.1)] backdrop-blur transition duration-200 hover:-translate-y-1 hover:-rotate-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9b5b32]"
        onClick={() => setActiveIndex((activeIndex + 1) % ideas.length)}
        type="button"
      >
        <span className="block text-[.61rem] font-semibold tracking-[.12em] text-[#9b5b32] uppercase">
          {locale === 'zh-CN' ? '今天的灵感' : "TODAY'S IDEA"}
        </span>
        <strong className="my-3 block font-serif text-[1.05rem] leading-[1.45] font-normal">
          “{activeIdea.copy}”
        </strong>
        <small className="block text-[.61rem] font-semibold tracking-[.06em] text-[#7a6d63] uppercase">
          {activeIdea.name} · {locale === 'zh-CN' ? '点击切换' : 'tap to change'}
        </small>
      </button>
    </div>
  );
}
