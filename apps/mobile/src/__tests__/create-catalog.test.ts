import { setupI18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { messages as englishMessages } from '../../../../packages/i18n/locales/en/mobile';
import { messages as chineseMessages } from '../../../../packages/i18n/locales/zh-CN/mobile';

describe('Create catalog', () => {
  it('loads English and Simplified Chinese translations', () => {
    const english = setupI18n({ locale: 'en', messages: { en: englishMessages } });
    const chinese = setupI18n({
      locale: 'zh-CN',
      messages: { 'zh-CN': chineseMessages },
    });
    const generateWallpaper = msg`Generate wallpaper`;
    const minimal = msg`Minimal`;
    const cooldown = msg`Try again in ${5} seconds.`;

    expect(english._(generateWallpaper)).toBe('Generate wallpaper');
    expect(chinese._(generateWallpaper)).toBe('生成壁纸');
    expect(chinese._(minimal)).toBe('极简');
    expect(chinese._(cooldown)).toBe('请在 5 秒后重试。');
  });
});
