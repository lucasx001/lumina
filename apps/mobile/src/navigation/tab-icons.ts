import type { AppIconName } from '@/components/ui';

export const tabIcons = {
  add: 'plus',
  home: 'home',
  profile: 'profile',
} as const satisfies Record<'add' | 'home' | 'profile', AppIconName>;
