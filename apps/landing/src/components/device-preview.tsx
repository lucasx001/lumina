import type React from 'react';

export type PreviewVariant = 'aurora' | 'bloom' | 'night';

export type DevicePreviewProps = {
  className?: string;
  dateLabel?: string;
  label: string;
  variant: PreviewVariant;
};

const wallpaperClasses: Record<PreviewVariant, string> = {
  aurora:
    'bg-[radial-gradient(ellipse_at_70%_24%,rgba(191,255,225,.8),transparent_18%),radial-gradient(ellipse_at_58%_47%,rgba(102,152,255,.92),transparent_36%),radial-gradient(ellipse_at_20%_65%,rgba(179,89,255,.68),transparent_38%),linear-gradient(155deg,#101528_9%,#1d376c_46%,#6a375f_72%,#12121b)] blur-[4px] saturate-110 rotate-[-7deg] scale-[1.12]',
  bloom:
    'bg-[radial-gradient(circle_at_50%_54%,#ffe8d8_0_7%,transparent_7.5%),repeating-radial-gradient(circle_at_50%_54%,rgba(255,132,167,.66)_0_6%,rgba(109,79,137,.54)_10%,transparent_14%_19%),linear-gradient(160deg,#2a1732,#101631_64%,#0c1018)] blur-[2px] saturate-125 scale-[1.16]',
  night:
    'bg-[radial-gradient(circle_at_72%_22%,rgba(214,226,255,.86)_0_2%,transparent_2.4%),radial-gradient(ellipse_at_35%_74%,rgba(54,95,181,.84),transparent_28%),linear-gradient(168deg,#0c1021_4%,#151e3e_48%,#503553_70%,#0a0c14_88%)] scale-[1.12]',
};

export function DevicePreview({
  className,
  dateLabel = 'Wednesday · July 29',
  label,
  variant,
}: DevicePreviewProps): React.JSX.Element {
  return (
    <figure
      className={`relative z-10 m-0 aspect-[0.49] drop-shadow-[0_32px_40px_rgba(71,43,25,.22)] ${className ?? ''}`}
    >
      <span className="sr-only">{label}</span>
      <div className="absolute inset-0 rounded-[2rem] border border-[#20191473] bg-[linear-gradient(145deg,#57483e,#1e1916_46%,#665448)] p-[7px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.12)]">
        <div className="relative isolate h-full w-full overflow-hidden rounded-[1.65rem] bg-[#1a2440]">
          <div
            aria-hidden="true"
            className={`absolute -inset-[18%] ${wallpaperClasses[variant]}`}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,5,8,.3),transparent_28%,rgba(3,4,8,.42))]"
          />
          <div className="absolute top-[15%] left-1/2 z-20 grid -translate-x-1/2 justify-items-center text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,.35)]">
            <span className="text-[clamp(1.1rem,8vw,2.5rem)] leading-none font-light tracking-[-0.07em]">
              08:24
            </span>
            <span className="mt-2 whitespace-nowrap text-[clamp(.32rem,1.7vw,.57rem)]">
              {dateLabel}
            </span>
          </div>
          <div className="absolute top-[2.7%] right-[6%] z-20 flex gap-1">
            <span className="h-[7px] w-[9px] skew-x-[-18deg] border-b border-l border-white/75" />
            <span className="h-[6px] w-3 rounded-[2px] border border-white/75 shadow-[inset_7px_0_rgba(255,255,255,.76)]" />
          </div>
          <span className="absolute bottom-[1.8%] left-1/2 z-20 h-[3px] w-1/3 -translate-x-1/2 rounded-full bg-white/70" />
        </div>
      </div>
    </figure>
  );
}
