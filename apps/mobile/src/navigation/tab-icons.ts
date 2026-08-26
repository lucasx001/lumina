import type { AppIconName } from '@/components/ui/app-icon';

export const tabIcons = {
  add: 'plus',
  home: 'home',
  profile: 'profile',
} as const satisfies Record<'add' | 'home' | 'profile', AppIconName>;
